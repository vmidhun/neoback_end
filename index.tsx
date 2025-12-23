
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const API_BASE = '/api'; 

const ServerStatusDashboard = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Server error');
      }
      setStatus(data);
      setError(null);
    } catch (err: any) {
      // Don't overwrite status if we have previous data, just show the error
      setError(err.message === 'Failed to fetch' ? 'Backend unreachable' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (path: string, method = 'GET') => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { 
        method,
        headers: { 'Authorization': 'Bearer emp_1' }
      });
      const data = await res.json();
      setLastResponse({ path, data, status: res.status });
    } catch (err: any) {
      setLastResponse({ path, data: { error: err.message }, status: 'FAILED' });
    }
  };

  const runSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/admin/seed`, { method: 'POST' });
      const data = await res.json();
      setLastResponse({ path: '/admin/seed', data, status: res.status });
      await fetchStatus();
    } catch (err: any) {
      setError(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">N</div>
              <h1 className="text-2xl font-bold text-white tracking-tight">NEO Backend <span className="text-blue-500 font-light">Monitor</span></h1>
            </div>
            <p className="text-slate-400 text-sm italic">Env: <span className="text-blue-400 font-mono font-normal uppercase">{status?.env || 'detecting...'}</span></p>
          </div>
          
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-500 ${error || !isDbHealthy ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
            <div className={`w-3 h-3 rounded-full ${error || !isDbHealthy ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-sm font-semibold uppercase tracking-wider">{error || !isDbHealthy ? 'Disconnected' : 'Database Online'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Database Diagnostics</h3>
              <div className="text-sm font-mono text-slate-300 break-all mb-4 bg-slate-950/50 p-2 rounded border border-slate-800">
                URI: <span className="text-blue-400">{status?.dbUri || '...'}</span>
              </div>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDbHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                State: <span className={isDbHealthy ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{status?.dbStatus || 'Searching...'}</span>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Memory & Performance</h3>
              <div className="text-3xl font-mono font-bold text-white mb-2">{status?.memoryUsage || '0.00'}<span className="text-lg text-slate-500 ml-1">mb</span></div>
              <div className="text-sm text-slate-400 flex justify-between">
                <span>Node Heap</span>
                <span className="text-slate-500 font-mono">Uptime: {status?.uptime || 0}s</span>
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl md:col-span-2">
              <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Live Collections</h3>
              {isDbHealthy && status?.counts ? (
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
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                   <p className="text-sm italic">Connecting to Cluster...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
            <h3 className="text-slate-500 text-xs font-bold mb-6 uppercase tracking-widest">Interface Tester</h3>
            <div className="space-y-3 flex-grow">
              <button 
                onClick={runSeed}
                disabled={seeding}
                className={`w-full text-left px-4 py-3 border rounded-xl transition-all flex items-center justify-between group ${seeding ? 'bg-blue-500/20 border-blue-500/50 cursor-wait' : 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/50'}`}
              >
                <span className={`text-xs font-bold ${seeding ? 'text-blue-300' : 'text-blue-400'}`}>{seeding ? 'SEEDING...' : 'FORCE RE-SEED DB'}</span>
                <svg className={`w-4 h-4 text-blue-500 ${seeding ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
              <div className="h-px bg-slate-800 my-2"></div>
              {['/tasks', '/projects', '/auth/me'].map(endpoint => (
                <button 
                  key={endpoint}
                  onClick={() => testEndpoint(endpoint)}
                  className="w-full text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-mono text-slate-400 group-hover:text-blue-300">GET {endpoint}</span>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-500 uppercase tracking-tighter">RUN &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {(error || status?.dbError) && (
          <div className="mt-8 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-2 bg-red-500/10 rounded-lg mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <p className="font-bold mb-1 uppercase tracking-tight">System Notification</p>
              <div className="text-red-400/70 leading-relaxed font-mono whitespace-pre-wrap mb-4">
                {error || status?.dbError}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-white font-bold mb-2 uppercase text-[10px]">Step 1: Whitelist Vercel</p>
                  <p className="text-slate-400 mb-2 leading-tight">Must allow access from everywhere in Atlas Console.</p>
                  <code className="bg-slate-950 px-2 py-1 rounded text-blue-400">0.0.0.0/0</code>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-white font-bold mb-2 uppercase text-[10px]">Step 2: Atlas Permissions</p>
                  <p className="text-slate-400 mb-2 leading-tight">Ensure your user has 'Atlas Admin' or 'Read and Write' role.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          NEO SYSTEMS &bull; CLOUD ENGINE &bull; 2024
        </footer>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<ServerStatusDashboard />);
