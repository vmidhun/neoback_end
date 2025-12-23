
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Use relative path so it works regardless of the port or domain of the preview
const API_BASE = '/api'; 

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
      const res = await fetch(`${API_BASE}${path}`, { 
        method,
        headers: { 'Authorization': 'Bearer emp_1' } // Auto-inject test token
      });
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

  const isDbHealthy = status?.dbStatus === 'Connected';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">N</div>
              <h1 className="text-2xl font-bold text-white tracking-tight">NEO Backend <span className="text-blue-500 font-light">Monitor</span></h1>
            </div>
            <p className="text-slate-400 text-sm">Real-time Node.js + MongoDB Lifecycle Management</p>
          </div>
          
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-500 ${error || !isDbHealthy ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
            <div className={`w-3 h-3 rounded-full ${error || !isDbHealthy ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-sm font-semibold uppercase tracking-wider">{error || !isDbHealthy ? 'Issue Detected' : 'Systems Optimal'}</span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uptime */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Server Performance</h3>
              <div className="text-3xl font-mono font-bold text-white mb-2">{status?.uptime || '0'}<span className="text-lg text-slate-500 ml-1">sec</span></div>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDbHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                DB Node: <span className={isDbHealthy ? 'text-emerald-400' : 'text-red-400'}>{status?.dbStatus || 'Checking...'}</span>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Resources</h3>
              <div className="text-3xl font-mono font-bold text-white mb-2">{status?.memoryUsage || '0.00'}<span className="text-lg text-slate-500 ml-1">mb</span></div>
              <div className="text-sm text-slate-400">Memory footprint (Heap)</div>
            </div>
            
            {/* Counts */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl md:col-span-2">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Database Infrastructure</h3>
              {isDbHealthy ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Users', val: status?.counts?.users, color: 'text-white' },
                    { label: 'Announcements', val: status?.counts?.announcements, color: 'text-blue-400' },
                    { label: 'Holidays', val: status?.counts?.holidays, color: 'text-emerald-400' },
                    { label: 'Attendance', val: status?.counts?.attendance, color: 'text-amber-400' },
                    { label: 'Projects', val: status?.counts?.projects, color: 'text-indigo-400' },
                    { label: 'Tasks', val: status?.counts?.tasks, color: 'text-rose-400' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl hover:border-slate-700 transition-colors">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">{item.label}</p>
                      <p className={`${item.color} font-mono text-xl font-bold`}>{item.val ?? 0}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                   <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"></path></svg>
                   <p className="text-sm italic">Waiting for database connection...</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
            <h3 className="text-slate-500 text-xs font-bold mb-6 uppercase tracking-widest">Interface Tester</h3>
            <div className="space-y-3 flex-grow">
              {['/tasks', '/projects', '/auth/me', '/timelogs'].map(endpoint => (
                <button 
                  key={endpoint}
                  onClick={() => testEndpoint(endpoint)}
                  className="w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-mono text-slate-400 group-hover:text-blue-300">{endpoint}</span>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-500 uppercase tracking-tighter">Invoke &rarr;</span>
                </button>
              ))}
            </div>
            <div className="mt-6 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
              <p className="text-[10px] text-blue-400 leading-relaxed">
                <span className="font-bold">NOTE:</span> API tests use a pre-authenticated <b>emp_1</b> token for convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Console / Response Viewer */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
              System Logs / Raw JSON
            </h2>
            {lastResponse && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${lastResponse.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                HTTP {lastResponse.status}
              </span>
            )}
          </div>
          <div className="p-6 bg-slate-950 font-mono text-xs overflow-auto h-[300px] scrollbar-hide">
            {lastResponse ? (
              <pre className="text-blue-400 whitespace-pre-wrap">
                {JSON.stringify(lastResponse.data, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-3 opacity-50">
                <div className="p-3 bg-slate-900 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <p className="text-xs uppercase tracking-widest font-bold">Awaiting signal...</p>
              </div>
            )}
          </div>
        </div>

        {(error || status?.dbError) && (
          <div className="mt-8 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-2 bg-red-500/10 rounded-lg mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <p className="font-bold mb-1 uppercase tracking-tight">Connectivity Breakdown</p>
              <p className="text-red-400/70 leading-relaxed font-mono">
                {error || status?.dbError}
              </p>
              <p className="mt-2 text-slate-500 italic">
                {status?.dbError?.includes('whitelist') ? 'Hint: Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.' : 'Hint: Check if the MONGODB_URI in server/config.js is valid.'}
              </p>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-4">
          <span>NEO Systems</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
          <span>Node.js v18.x</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
          <span>{new Date().toLocaleDateString()}</span>
        </footer>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<ServerStatusDashboard />);
