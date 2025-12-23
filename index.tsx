
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const API_BASE = 'http://localhost:3000/api'; // Standard backend port

const ServerStatusDashboard = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error('Backend unreachable');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (path: string, method = 'GET') => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { method });
      const data = await res.json();
      setLastResponse({ path, data, status: res.status });
    } catch (err: any) {
      setLastResponse({ path, data: { error: err.message }, status: 'FAILED' });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">N</div>
              <h1 className="text-2xl font-bold text-white tracking-tight">NEO Backend <span className="text-blue-500">Monitor</span></h1>
            </div>
            <p className="text-slate-400">Environment: <span className="text-blue-400 font-mono">Development</span></p>
          </div>
          
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all ${error ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'}`}>
            <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-sm font-semibold uppercase tracking-wider">{error ? 'System Offline' : 'Systems Operational'}</span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Metrics Card */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wider">Uptime & Connectivity</h3>
              <div className="text-3xl font-bold text-white mb-2">{status?.uptime || '0'}s</div>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status?.dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                Database: {status?.dbStatus || 'Unknown'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wider">Resources</h3>
              <div className="text-3xl font-bold text-white mb-2">{status?.memoryUsage || '0.00'} MB</div>
              <div className="text-sm text-slate-400">Heap usage from Node.js runtime</div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl md:col-span-2">
              <h3 className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wider">Database Clusters (Collection Counts)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Users</p>
                  <p className="text-white font-bold text-lg">{status?.counts?.users ?? '---'}</p>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Announcements</p>
                  <p className="text-blue-400 font-bold text-lg">{status?.counts?.announcements ?? '---'}</p>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Holidays</p>
                  <p className="text-emerald-400 font-bold text-lg">{status?.counts?.holidays ?? '---'}</p>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Attendance</p>
                  <p className="text-amber-400 font-bold text-lg">{status?.counts?.attendance ?? '---'}</p>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Projects</p>
                  <p className="text-white font-bold text-lg">{status?.counts?.projects ?? '---'}</p>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-500 text-xs">Tasks</p>
                  <p className="text-white font-bold text-lg">{status?.counts?.tasks ?? '---'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full">
            <h3 className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-wider">Quick API Tests</h3>
            <div className="space-y-3">
              <button 
                onClick={() => testEndpoint('/tasks')}
                className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group"
              >
                <span className="text-sm font-mono text-slate-300">GET /api/tasks</span>
                <span className="text-xs text-slate-500 group-hover:text-blue-400">Run &rarr;</span>
              </button>
              <button 
                onClick={() => testEndpoint('/projects')}
                className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group"
              >
                <span className="text-sm font-mono text-slate-300">GET /api/projects</span>
                <span className="text-xs text-slate-500 group-hover:text-blue-400">Run &rarr;</span>
              </button>
              <button 
                onClick={() => testEndpoint('/auth/me')}
                className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-between group"
              >
                <span className="text-sm font-mono text-slate-300">GET /api/auth/me</span>
                <span className="text-xs text-slate-500 group-hover:text-blue-400">Run &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Console / Response Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Response Console
            </h2>
            {lastResponse && (
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${lastResponse.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                Status: {lastResponse.status}
              </span>
            )}
          </div>
          <div className="p-6 bg-slate-950 min-h-[200px] font-mono text-sm overflow-auto max-h-[400px]">
            {lastResponse ? (
              <pre className="text-emerald-500 whitespace-pre-wrap">
                {JSON.stringify(lastResponse.data, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <p>Run an API test to see output here</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p><strong>System Warning:</strong> {error}. Ensure the backend is running and MongoDB Atlas is reachable from this environment.</p>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-500 text-xs">
          NEO Backend v1.0.6 &bull; Built with Express, Mongoose & React &bull; {new Date().toLocaleTimeString()}
        </footer>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<ServerStatusDashboard />);
