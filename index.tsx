
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const API_BASE = '/api'; 

const ServerStatusDashboard = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  const safeRequest = async (path: string, options: RequestInit = {}) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE}${cleanPath}`;
    
    try {
      const res = await fetch(url, options);
      const rawText = await res.text();
      const trimmed = rawText.trim();
      
      // Handle the '404 File not found' response specifically from Vercel's proxy
      if (res.status === 404) {
          if (trimmed === "404 File not found") {
              throw new Error(`Critical 404: Vercel routing failed to find the server file for '${url}'. Ensure 'vercel.json' correctly routes to 'server/server.js'.`);
          }
          if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
              throw new Error(`HTML 404: The server (Express) returned an error page for '${url}'. The route might be missing from your app.`);
          }
          try {
            const json = JSON.parse(trimmed);
            throw new Error(`API 404: ${json.error || 'The requested resource was not found'}`);
          } catch (e) {
            throw new Error(`Resource not found (404) at ${url}. Response: ${trimmed.substring(0, 40)}...`);
          }
      }

      // Check for unintended HTML fallbacks (SPA catch-all)
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
          throw new Error(`Unexpected HTML response at ${url}. Request likely fell through to index.html.`);
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        const snippet = rawText.length > 80 ? rawText.substring(0, 80) + '...' : (rawText || '(Empty Body)');
        throw new Error(`Invalid JSON response from ${url}: ${snippet}`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP Server Error: ${res.status}`);
      }
      return data;
    } catch (err: any) {
      console.error(`Request to ${url} failed:`, err);
      throw err;
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await safeRequest('/status');
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'Connection Error: Backend server unreachable.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (path: string) => {
    setLastResponse({ path, status: 'LOADING' });
    try {
      const data = await safeRequest(path, {
        headers: { 'Authorization': 'Bearer emp_1' }
      });
      setLastResponse({ path, data, status: 'SUCCESS' });
    } catch (err: any) {
      setLastResponse({ path, data: { error: err.message }, status: 'FAILED' });
    }
  };

  const runSeed = async () => {
    if (!window.confirm("Restore database to factory state? Existing entries will be wiped.")) return;
    setSeeding(true);
    try {
      await safeRequest('/admin/seed', { method: 'POST' });
      await fetchStatus();
      setLastResponse({ path: '/admin/seed', status: 'SUCCESS', data: { message: "Database reset successfully." } });
    } catch (err: any) {
      setLastResponse({ path: '/admin/seed', status: 'FAILED', data: { error: err.message } });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  const isDbHealthy = status?.dbStatus === 'Connected';

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-[0.3em]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
           <span className="animate-pulse">Handshaking with NEO Infrastructure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/40">N</div>
              <h1 className="text-3xl font-black text-white tracking-tight italic">NEO <span className="text-blue-500 font-light">CONSOLE</span></h1>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase tracking-[0.1em]">Cloud Persistence & Health Dashboard</p>
          </div>
          
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-700 ${!isDbHealthy ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${!isDbHealthy ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isDbHealthy ? 'System Active' : 'Offline / Fault'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/60 p-7 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <h3 className="text-slate-500 text-[10px] font-black mb-6 uppercase tracking-[0.3em]">Cloud Persistence</h3>
              <div className="space-y-4">
                <div className="bg-[#020617]/80 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] text-slate-500 font-mono mb-1 uppercase tracking-widest">Active Cluster URI</p>
                  <p className="text-xs font-mono text-blue-400 break-all leading-relaxed">{status?.dbUri || 'Discovering...'}</p>
                </div>
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isDbHealthy ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                      <span className="text-sm font-bold tracking-tight">{status?.dbStatus || 'Probing...'}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[9px] text-slate-600 font-mono uppercase block">Model State</span>
                      <span className={`text-[10px] font-black ${status?.isSeeded ? 'text-blue-500' : 'text-amber-500'}`}>
                        {status?.isSeeded ? 'PROVISIONED' : 'UNINITIALIZED'}
                      </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/60 p-7 rounded-[32px] shadow-2xl relative overflow-hidden">
               <h3 className="text-slate-500 text-[10px] font-black mb-6 uppercase tracking-[0.3em]">Runtime Footprint</h3>
               <div className="flex items-baseline gap-2 mb-4">
                 <span className="text-6xl font-mono font-bold text-white tracking-tighter tabular-nums">{status?.memoryUsage || '0.0'}</span>
                 <span className="text-xl text-slate-600 font-black uppercase tracking-[0.2em]">MB</span>
               </div>
               <div className="text-xs text-slate-500 font-mono italic">Node.js Process Uptime: <span className="text-slate-200 font-bold not-italic">{status?.uptime || 0}s</span></div>
            </div>
            
            <div className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-[32px] shadow-2xl md:col-span-2 relative overflow-hidden">
               <h3 className="text-slate-500 text-[10px] font-black mb-8 uppercase tracking-[0.3em]">Collection Summaries</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 relative z-10">
                  {[
                    { label: 'Users', val: status?.counts?.users, color: 'text-white' },
                    { label: 'Projects', val: status?.counts?.projects, color: 'text-blue-400' },
                    { label: 'Tasks', val: status?.counts?.tasks, color: 'text-rose-400' },
                    { label: 'Announcements', val: status?.counts?.announcements, color: 'text-indigo-400' },
                    { label: 'Holidays', val: status?.counts?.holidays, color: 'text-emerald-400' },
                    { label: 'Logs', val: status?.counts?.attendance, color: 'text-amber-400' },
                  ].map((item) => (
                    <div key={item.label} className="p-5 bg-[#020617]/40 border border-slate-800/40 rounded-[24px] hover:border-blue-500/20 transition-all transform hover:-translate-y-1">
                      <p className="text-slate-600 text-[10px] uppercase font-black mb-2 tracking-[0.1em]">{item.label}</p>
                      <p className={`${item.color} font-mono text-3xl font-bold tracking-tighter tabular-nums`}>{item.val ?? 0}</p>
                    </div>
                  ))}
                </div>
            </div>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-[32px] shadow-2xl flex flex-col h-full border-l-slate-700">
            <h3 className="text-slate-500 text-[10px] font-black mb-8 uppercase tracking-[0.3em]">Service Interaction</h3>
            <div className="space-y-4 flex-grow">
              <button 
                onClick={runSeed}
                disabled={seeding}
                className="w-full text-left px-6 py-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-2xl transition-all disabled:opacity-50 group flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-black tracking-[0.1em] text-blue-500 block mb-1">RESET_DATABASE</span>
                  <span className="text-[11px] text-slate-400">Apply factory seed sequence</span>
                </div>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
              
              <div className="space-y-2.5 pt-6 border-t border-slate-800/60">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Endpoint Probes</p>
                {['/tasks', '/projects', '/auth/me'].map(path => (
                  <button 
                    key={path}
                    onClick={() => testEndpoint(path)}
                    className="w-full text-left px-4 py-3 bg-[#020617]/40 border border-slate-800/60 hover:border-blue-500/40 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <span className="text-xs font-mono text-slate-400 group-hover:text-blue-400">GET {path}</span>
                    <span className="text-xs font-black text-slate-800 group-hover:text-blue-500 transition-all">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            {lastResponse && (
                <div className="mt-8 bg-[#020617] p-5 rounded-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Probe Result: {lastResponse.path}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lastResponse.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {lastResponse.status}
                        </span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <pre className="text-slate-400 text-[10px] font-mono max-h-48 overflow-auto scrollbar-hide">
                          {JSON.stringify(lastResponse.data, null, 2)}
                      </pre>
                    </div>
                </div>
            )}
          </div>
        </div>

        {(error || status?.dbError) && (
          <div className="mt-12 p-10 bg-red-950/20 border border-red-900/40 rounded-[40px] text-red-400 animate-in fade-in slide-in-from-bottom-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-red-600/40"></div>
             <div className="flex items-center gap-5 mb-6">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-4 ring-red-500/5">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">System Negotiator Fault</h2>
                  <p className="text-xs text-red-400/60 font-medium">Internal Communication Error Detected at Cluster Level.</p>
                </div>
             </div>
             <div className="bg-red-950/40 p-6 rounded-3xl border border-red-900/30 font-mono text-sm leading-relaxed whitespace-pre-wrap mb-8 overflow-auto max-h-80 shadow-inner">
                {error || status?.dbError}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-500">
                <div className="space-y-3">
                  <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-300">Database Investigation:</p>
                  <ul className="space-y-2 list-inside list-disc opacity-80">
                    <li>Check Vercel Environment Variables for MONGODB_URI.</li>
                    <li>Verify MongoDB Atlas Network Access allows connections from 0.0.0.0/0.</li>
                    <li>Check if the cluster has been suspended due to inactivity.</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-300">Vercel Deployment Audit:</p>
                  <p className="opacity-80 leading-relaxed">
                    If 'Critical 404' persists, ensure <code className="bg-slate-800 text-slate-300 px-1 rounded text-[10px]">vercel.json</code> 
                    rewrites exactly point to <code className="text-blue-400 text-[10px]">/server/server.js</code>. 
                    Check Vercel Deployment Output to confirm the server module was successfully bundled as a Lambda.
                  </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ServerStatusDashboard />);
}
