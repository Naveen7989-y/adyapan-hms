import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CHANNELS = [
  { id: '', label: 'All Channels' },
  { id: 'SMS', label: 'SMS Gateway', icon: Smartphone },
  { id: 'EMAIL', label: 'Email', icon: Mail },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
];

export const NotificationsList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, sent: 0, failed: 0, pending: 0, deliveryRate: 100 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testData, setTestData] = useState({
    recipient: '+91 9876543210',
    channel: 'SMS',
    title: 'Adyapan Hospital Alert',
    message: 'Your token number has been called for Doctor Consultation.',
  });

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/notifications/stats');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch notification metrics:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotifications();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [channelFilter, statusFilter, search]);

  const handleSendTest = async (e) => {
    e.preventDefault();
    setSubmittingTest(true);
    try {
      await api.post('/notifications/test', testData);
      setShowTestModal(false);
      fetchNotifications();
      fetchMetrics();
    } catch (err) {
      alert(err.message || 'Failed to dispatch test notification');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      await api.post(`/notifications/${id}/retry`);
      fetchNotifications();
      fetchMetrics();
    } catch (err) {
      alert(err.message || 'Retry failed');
    }
  };

  const getChannelBadge = (channel) => {
    switch (channel) {
      case 'SMS':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            <Smartphone className="w-3 h-3" />
            <span>SMS</span>
          </span>
        );
      case 'EMAIL':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <MessageSquare className="w-3 h-3" />
            <span>WhatsApp</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-sky-600" />
            <span>Notification & Message Outbox</span>
          </h2>
          <p className="text-sm text-slate-500">
            Automated SMS, Email, and WhatsApp appointment confirmations, reminders, and alerts.
          </p>
        </div>

        <button
          onClick={() => setShowTestModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>Send Test Message</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Dispatched
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{metrics.total}</span>
          <span className="text-[11px] text-slate-400">All channels combined</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Delivered / Sent
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{metrics.sent}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully processed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Delivery Rate
          </span>
          <span className="text-2xl font-bold text-sky-600 mt-1 block">{metrics.deliveryRate}%</span>
          <span className="text-[11px] text-sky-600 font-medium">Provider SLA success</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Failed / Errors
          </span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{metrics.failed}</span>
          <span className="text-[11px] text-slate-400">Require retry</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by recipient phone, email, or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              onClick={() => {
                fetchNotifications();
                fetchMetrics();
              }}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChannelFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                channelFilter === c.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
            <span className="text-sm font-medium">Loading outbox dispatch logs...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No notification records logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Dispatched At</th>
                  <th className="px-6 py-3.5">Event Type</th>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Message Snippet</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {n.eventType}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                      {n.recipient}
                    </td>

                    <td className="px-6 py-4">{getChannelBadge(n.channel)}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold ${
                          n.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : n.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {n.status === 'SENT' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : n.status === 'FAILED' ? (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{n.status}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[240px] truncate">
                      {n.message}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedMessage(n)}
                          className="text-xs font-semibold text-sky-600 hover:underline"
                        >
                          View
                        </button>
                        {n.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(n.id)}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:underline"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-800">{selectedMessage.title}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase block">Recipient</span>
                <span className="text-slate-800 font-mono font-semibold">{selectedMessage.recipient}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block">Channel & Event</span>
                <span className="text-slate-700">
                  {selectedMessage.channel} • {selectedMessage.eventType}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block mb-1">Message Payload</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed font-sans">
                  {selectedMessage.message}
                </div>
              </div>
              {selectedMessage.errorLog && (
                <div>
                  <span className="font-bold text-rose-600 uppercase block mb-1">Error Details</span>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 font-mono">
                    {selectedMessage.errorLog}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Send Test Notification</h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch a test message through the selected provider adapter.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Delivery Channel *
                </label>
                <select
                  value={testData.channel}
                  onChange={(e) => setTestData({ ...testData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="SMS">SMS Gateway (Mock / Twilio / AWS SNS)</option>
                  <option value="EMAIL">Email (Mock / SMTP / SendGrid)</option>
                  <option value="WHATSAPP">WhatsApp (Mock / Cloud API)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Recipient (Mobile or Email) *
                </label>
                <input
                  type="text"
                  required
                  value={testData.recipient}
                  onChange={(e) => setTestData({ ...testData, recipient: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={testData.title}
                  onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={3}
                  required
                  value={testData.message}
                  onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
                >
                  {submittingTest ? 'Dispatching...' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
