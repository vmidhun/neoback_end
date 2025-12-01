import React, { useState, useEffect } from 'react';
import { User, Project } from '../types';
import { getProjects, createProject } from '../services/mockBackend';
import { generateProjectPlan } from '../services/geminiService';
import { Icons } from '../constants';

interface ProjectsProps {
  user: User;
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!newProjectName || !newProjectGoal) {
      alert("Please enter a project name and goal first.");
      return;
    }
    setAiGenerating(true);
    try {
      const result = await generateProjectPlan(newProjectName, newProjectGoal);
      setNewProjectDesc(result.description);
      setSuggestedTasks(result.suggestedTasks);
    } catch (error) {
      alert("Failed to generate plan. Ensure API Key is set.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject({
        name: newProjectName,
        description: newProjectDesc || newProjectGoal,
        dueDate: newProjectDueDate,
        status: 'PLANNING',
        teamSize: 0
      });
      setShowModal(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setNewProjectName('');
    setNewProjectGoal('');
    setNewProjectDesc('');
    setNewProjectDueDate('');
    setSuggestedTasks([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Project Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          <span className="mr-2"><Icons.Plus /></span>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                  project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 flex-grow">{project.description}</p>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                 <span>Due: {project.dueDate}</span>
                 <span>Team: {project.teamSize}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input 
                  required
                  type="text" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Goal (for AI)</label>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    value={newProjectGoal} 
                    onChange={e => setNewProjectGoal(e.target.value)}
                    placeholder="e.g., Redesign company website to improve conversion"
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <button 
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiGenerating || !process.env.API_KEY}
                    className="flex-shrink-0 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {aiGenerating ? 'Thinking...' : (
                      <>
                        <Icons.Sparkles />
                        Auto-Plan
                      </>
                    )}
                  </button>
                </div>
                {!process.env.API_KEY && <p className="text-xs text-red-500 mt-1">API Key missing in env for AI features</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newProjectDesc} 
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              {suggestedTasks.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2">AI Suggested Tasks:</h4>
                  <ul className="list-disc list-inside text-sm text-purple-700">
                    {suggestedTasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input 
                  required
                  type="date" 
                  value={newProjectDueDate} 
                  onChange={e => setNewProjectDueDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;