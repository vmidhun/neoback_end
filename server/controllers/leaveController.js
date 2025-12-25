const { LeaveRequest, LeaveBalance, User } = require('../models');

// Helper to count week days excluding weekends (Sat/Sun)
// In a real app, this should also check against the Holiday collection
const calculateDays = (start, end) => {
    let count = 0;
    let curDate = new Date(start);
    const stopDate = new Date(end);
    
    while (curDate <= stopDate) {
        const dayOfWeek = curDate.getDay();
        if(dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
             count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count; // fallback if loop doesn't run? 0.
};

exports.applyLeave = async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            reason,
            isEmergency,
            emergencyReportedVia,
            emergencyReportedAt,
            attachments
        } = req.body;
        const userId = req.user.id;
        
        // 1. Calculate duration
        // Simple diff for now, ideally exclude weekends/holidays
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Validation
        if(end < start) return res.status(400).json({ message: "End date cannot be before start date" });

        // Calculate business days
        const daysCount = calculateDays(start, end);
        if(daysCount <= 0) return res.status(400).json({ message: "Leave duration is zero (weekends selected?)" });

        // 2. Check Balance
        const year = new Date().getFullYear();
        const balance = await LeaveBalance.findOne({ _id: userId, year });
        
        if(!balance) {
            return res.status(404).json({ message: "Leave balance record not found for this year" });
        }

        let isLossOfPay = false;
        
        // Simple logic: if balance insufficient, mark as LOP
        const typeKey = leaveType.toLowerCase(); // annual, sick, casual
        // If type is not in balance keys (e.g. maternity), handle accordingly or default to allowed
        
        if(['annual', 'sick', 'casual'].includes(typeKey)) {
             if (balance[typeKey] < daysCount) {
                 isLossOfPay = true;
             }
        } else if (typeKey === 'lossofpay') {
            isLossOfPay = true;
        }

        // 3. Create Request
        const newRequest = new LeaveRequest({
            _id: `leave_${Date.now()}_${userId}`,
            userId,
            leaveType,
            startDate: start,
            endDate: end,
            daysCount,
            reason,
            status: 'Pending', 
            isLossOfPay,
            isEmergency,
            emergencyReportedVia,
            emergencyReportedAt,
            attachments
        });

        await newRequest.save();

        res.status(201).json({ message: "Leave requested successfully", request: newRequest });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error proposing leave" });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: "Error fetching leaves" });
    }
};

exports.getMyBalance = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const balance = await LeaveBalance.findOne({ _id: req.user.id, year });
        res.json(balance || {});
    } catch (err) {
        res.status(500).json({ message: "Error fetching balance" });
    }
};

exports.getPendingApprovals = async (req, res) => {
    try {
        // Manager sees requests from their direct reports
        // Admin/HR sees all? Or specific flow?
        // Let's implement: If Admin/HR -> All, Else -> Direct Reports
        
        let query = { status: 'Pending' };
        
        if(req.user.role !== 'Admin' && req.user.role !== 'HR') {
             // Find users who report to this user
             const reporters = await User.find({ reportingManagerId: req.user.id }).select('_id');
             const reporterIds = reporters.map(u => u._id);
             query.userId = { $in: reporterIds };
        }

        const requests = await LeaveRequest.find(query).populate('userId', 'name avatarUrl designation');
        res.json(requests);

    } catch (err) {
        res.status(500).json({ message: "Error fetching approvals" });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body; // Approved, Rejected
        const approverId = req.user.id;

        const request = await LeaveRequest.findById(id);
        if(!request) return res.status(404).json({ message: "Request not found" });

        if(request.status !== 'Pending') {
            return res.status(400).json({ message: "Request is already processed" });
        }

        request.status = status;
        request.approverId = approverId;
        if(status === 'Rejected') request.rejectionReason = rejectionReason;

        // If Approved, deduct balance
        if(status === 'Approved') {
            const year = request.startDate.getFullYear();
            const balance = await LeaveBalance.findOne({ _id: request.userId, year });
            
            if(balance) {
                if(request.isLossOfPay || request.leaveType === 'LossOfPay') {
                    balance.lossOfPay += request.daysCount;
                } else {
                     const typeKey = request.leaveType.toLowerCase();
                     if(balance[typeKey] !== undefined) {
                         // Check again if balance sufficient? 
                         // If we allowed "applying" even with low balance (flagged as LOP), then here we decide.
                         // Simple logic: Deduct as much as possible, rest LOP? 
                         // OR: Just deduct. If it goes negative, that's fine for some systems, but here let's stick to LOP logic.
                         // If request was NOT marked LOP during application (balance was there), but now balance is gone? (Race condition)
                         // Let's just deduct.
                         balance[typeKey] -= request.daysCount;
                         if(balance[typeKey] < 0) {
                             // Revert and move to LOP? Or allow negative?
                             // Let's handle negative as LOP implicitly for payroll calculation.
                         }
                     }
                }
                await balance.save();
            }
        }

        await request.save();
        res.json({ message: `Leave ${status}`, request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating status" });
    }
};

exports.getTeamCalendar = async (req, res) => {
    try {
        // Return all APPROVED leaves for everyone? 
        // Or scoped to team? 
        // "The employee dashboard should show the leaves of their tema members"
        
        // Let's return all approved leaves for the current month/future
        // Filter by user's team if not Admin/HR? User request implies visibility for "their team members".
        
        let queryByUser = {};
        if(req.user.role !== 'Admin' && req.user.role !== 'HR') {
             // Get my team members
             const me = await User.findById(req.user.id);
             if(me && me.teamId) {
                 const teamMates = await User.find({ teamId: me.teamId }).select('_id');
                 queryByUser = { userId: { $in: teamMates.map(u => u._id) } };
             }
        }

        const leaves = await LeaveRequest.find({ 
            status: 'Approved', 
            ...queryByUser 
        }).populate('userId', 'name role avatarUrl');
        
        // Ideally filter by date range (req.query.start, req.query.end)
        
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: "Error fetching calendar" });
    }
};
