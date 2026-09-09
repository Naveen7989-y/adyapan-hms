import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, Cpu, Clock, Shield } from 'lucide-react';
import api from '../services/api';

export const HealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health');
      setHealth(response);
    } catch (err) {
      setError(err.message || 'Failed to reach API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">System & API Health Check</h2>
          <p className="text-sm text-slate-500">
            Real-time status verification of the Node.js Express backend and frontend integration.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Check</span>
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600 mb-3" />
          <p className="text-sm font-medium">Connecting to Backend API...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">API Connection Offline</h3>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <p className="text-xs text-slate-600 mt-2">
                Make sure the backend server is running on port 5000 (`npm run dev` inside `backend`).
              </p>
            </div>
          </div>
        </div>
      )}

      {health && !loading && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-900">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Backend API is Healthy and Responding</h3>
                <p className="text-xs text-emerald-700">{health.message}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Server className="w-4 h-4 text-sky-600" />
              <span>Diagnostic Payload</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Status</span>
                <span className="font-bold text-emerald-600 capitalize">
                  {health.data?.status || 'Active'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">System</span>
                <span className="font-semibold text-slate-700">
                  {health.data?.system || 'Adyapan HMS API'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Environment</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {health.data?.environment || 'development'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Uptime</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {Math.floor(health.data?.uptime || 0)}s
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Server Timestamp</span>
                <span className="font-mono text-xs text-slate-600">
                  {health.data?.timestamp || new Date().toISOString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCheck;
