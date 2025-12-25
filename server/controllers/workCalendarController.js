
const { WorkCalendar } = require('../models');

exports.getCalendars = async (req, res) => {
    try {
        const calendars = await WorkCalendar.find();
        res.json(calendars);
    } catch (err) {
        res.status(500).json({ message: "Error fetching calendars" });
    }
};

exports.createCalendar = async (req, res) => {
    try {
        const { name, workingDays, holidayIds, timezone, linkedEntity } = req.body;
        const newCalendar = new WorkCalendar({
            _id: `cal_${Date.now()}`,
            name,
            workingDays, // [1,2,3,4,5]
            holidayIds,
            timezone,
            linkedEntity
        });
        await newCalendar.save();
        res.status(201).json(newCalendar);
    } catch (err) {
        res.status(500).json({ message: "Error creating calendar" });
    }
};

exports.updateCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const calendar = await WorkCalendar.findByIdAndUpdate(id, updates, { new: true });
        res.json(calendar);
    } catch (err) {
        res.status(500).json({ message: "Error updating calendar" });
    }
};

exports.deleteCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        await WorkCalendar.findByIdAndDelete(id);
        res.json({ message: "Calendar deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting calendar" });
    }
};
