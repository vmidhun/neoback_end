import React, { useState, useEffect } from 'react';
import { User, TimesheetEntry, Project } from '../types';
import { getTimesheets, getProjects, createTimesheetEntry } from '../services/mockBackend';
import { Icons } from '../constants';

interface TimesheetsProps {
  user: User;
}

const Timesheets: React.FC<TimesheetsProps> = ({ user }) => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Entry State
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<number>(0);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [tData, pData] = await Promise.all([
          getTimesheets(user.role === 'ADMIN' ? undefined : user.id),
          getProjects()
        ]);
        setEntries(tData);
        setProjects(pData);
        if (pData.length > 0) setProjectId(pData[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || hours <= 0) return;

    try {
      const newEntry = await createTimesheetEntry({
        userId: user.id,
        projectId,
        date,
        hours,
        description: desc
      });
      setEntries([newEntry, ...entries]);
      setDesc('');
      setHours(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Timesheets</h2>

      {/* Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Log Time</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
             <input 
               type="date" 
               required
               value={date} 
               onChange={e => setDate(e.target.value)}
               className="w-full border border-gray-300 rounded-md p-2"
             />
          </div>
          <div className="md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
             <select 
               value={projectId} 
               onChange={e => setProjectId(e.target.value)}
               className="w-full border border-gray-300 rounded-md p-2"
             >
               {projects.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
          </div>
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
             <input 
               type="text" 
               placeholder="What did you work on?"
               value={desc} 
               onChange={e => setDesc(e.target.value)}
               className="w-full border border-gray-300 rounded-md p-2"
             />
          </div>
          <div className="md:col-span-1 flex gap-2">
             <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={hours} 
                  onChange={e => setHours(parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
             </div>
             <button 
                type="submit"
                className="self-end bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 h-[42px] w-[42px] flex items-center justify-center"
             >
               <Icons.Plus />
             </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No entries found</td>
              </tr>
            )}
            {entries.map((entry) => {
              const project = projects.find(p => p.id === entry.projectId);
              return (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{project?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.hours}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timesheets;