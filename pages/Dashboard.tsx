import React, { useEffect, useState } from 'react';
import { User, Project, TimesheetEntry } from '../types';
import { getProjects, getTimesheets } from '../services/mockBackend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  user: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalHours: 0,
    pendingApprovals: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projects, timesheets] = await Promise.all([
          getProjects(),
          getTimesheets()
        ]);

        // Process data for charts
        const hoursByProject: Record<string, number> = {};
        timesheets.forEach(t => {
          const projName = projects.find(p => p.id === t.projectId)?.name || 'Unknown';
          hoursByProject[projName] = (hoursByProject[projName] || 0) + t.hours;
        });

        const barData = Object.keys(hoursByProject).map(key => ({
          name: key,
          hours: hoursByProject[key]
        }));

        const statusCounts = projects.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const pieData = Object.keys(statusCounts).map(key => ({
          name: key.replace('_', ' '),
          value: statusCounts[key]
        }));

        setStats({
          activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
          totalHours: timesheets.reduce((sum, t) => sum + t.hours, 0),
          pendingApprovals: timesheets.filter(t => t.status === 'PENDING').length
        });
        
        setChartData(barData);
        setProjectStatusData(pieData);

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Projects</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.activeProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Hours Logged</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalHours}h</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Approvals</h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">{stats.pendingApprovals}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours by Project</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;