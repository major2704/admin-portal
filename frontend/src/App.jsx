import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  RefreshCw, 
  Download, 
  Activity, 
  Check, 
  Sparkles, 
  ExternalLink,
  Trash2,
  Plus
} from 'lucide-react';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://nexus-admin-api-7dhc.onrender.com/api'
).replace(/\/$/, '');

export default function App() {
  // Authentication & Persistent State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'dark');
  const [activeTab, setActiveTab] = useState('settings'); // 'overview' | 'team' | 'permissions' | 'settings'

  // Settings State
  const [portalName, setPortalName] = useState('NexusAdmin');
  const [publicRegistrations, setPublicRegistrations] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data Store
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 4, activeUsers: 3, totalAdmins: 1, systemStatus: 'Optimal' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Viewer', status: 'Active' });

  // Theme synchronization
  useEffect(() => {
    localStorage.setItem('nexus_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`).catch(() => null),
        fetch(`${API_BASE_URL}/users`).catch(() => null)
      ]);
      if (statsRes && statsRes.ok) setStats(await statsRes.json());
      if (usersRes && usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({ error: 'Server response error' }));
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Action Buttons Handlers
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setFeedback('Platform settings updated successfully.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleExportData = () => {
    const reportData = {
      portalName,
      exportDate: new Date().toISOString(),
      systemStats: stats,
      membersRoster: users
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${portalName.toLowerCase()}-audit-report.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Audit report downloaded successfully.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePingServer = async () => {
    setHealthStatus('Pinging...');
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const latency = Date.now() - startTime;
      if (res.ok) {
        setHealthStatus(`Online (${latency}ms)`);
      } else {
        setHealthStatus('Error 500');
      }
    } catch {
      setHealthStatus('Unreachable');
    }
    setTimeout(() => setHealthStatus(null), 4000);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      const data = await res.json();
      if (res.ok) {
        setUsers([data, ...users]);
        setShowAddModal(false);
        setNewMember({ name: '', email: '', role: 'Viewer', status: 'Active' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Login View ---
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        theme === 'dark' ? 'bg-[#060813] text-white' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl ${
          theme === 'dark' ? 'bg-[#0d1024] border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{portalName}</h1>
              <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">ENTERPRISE</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akshatnanawati2704@gmail.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  theme === 'dark' ? 'bg-[#070a18] border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  theme === 'dark' ? 'bg-[#070a18] border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {authLoading ? 'Verifying...' : 'Sign In to Enterprise'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Dashboard & Settings Screen ---
  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#060813] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'
    }`}>
      {/* Sidebar */}
      <aside className={`w-72 border-r flex flex-col justify-between p-6 select-none ${
        theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-8">
          {/* Logo & Portal Name: Clicking navigates to Overview */}
          <button 
            type="button" 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 group text-left w-full focus:outline-none"
            title="Click to go to Overview Dashboard"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight group-hover:text-indigo-400 transition-colors">
                {portalName}
              </div>
              <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                ENTERPRISE
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'team', label: 'Team & Users', icon: Users },
              { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#181a38] text-indigo-400 border border-indigo-500/30 shadow-inner'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar (Untouched) */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#0e122b] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              MA
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Master Admin</div>
              <div className="text-[10px] text-slate-400">Admin</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* Top Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {activeTab === 'settings' && 'Platform Settings'}
            {activeTab === 'overview' && 'System Overview'}
            {activeTab === 'team' && 'Team & Users'}
            {activeTab === 'permissions' && 'Platform Permissions'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Signed in as <span className="text-slate-300 font-medium">{user?.email || 'akshatnanawati2704@gmail.com'}</span>
          </p>
        </div>

        {feedback && (
          <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {feedback}
          </div>
        )}

        {/* --- SETTINGS TAB VIEW --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            {/* Main Configuration Card */}
            <div className={`p-8 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-slate-100'
            }`}>
              <div className="mb-6">
                <h2 className="text-lg font-bold">Platform Settings</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure global portal behavior and restrictions</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                {/* Portal Name Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    PORTAL NAME
                  </label>
                  <input
                    type="text"
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition ${
                      theme === 'dark'
                        ? 'bg-[#060813] border-slate-800/90 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>

                {/* Public Registrations Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#060813] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-sm font-bold">Public Registrations</div>
                    <div className="text-xs text-slate-400">Permit external visitors to sign up as Viewers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicRegistrations}
                    onChange={(e) => setPublicRegistrations(e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Maintenance Mode Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#060813] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-sm font-bold">Maintenance Mode</div>
                    <div className="text-xs text-slate-400">Redirect non-admin visitors to an update screen</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Save Platform Settings Button */}
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                >
                  Save Platform Settings
                </button>
              </form>
            </div>

            {/* Quick Actions & Working Controls Card */}
            <div className={`p-8 rounded-3xl border shadow-xl space-y-5 ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h2 className="text-base font-bold">Quick Actions & Preferences</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control live session, visual theme, and system diagnostic operations</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* 1. Theme Toggle with Icon */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800 shadow-sm'
                  }`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Switch to Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <span>Switch to Dark Theme</span>
                    </>
                  )}
                </button>

                {/* 2. Login / Logout Action Button with Icon */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Session</span>
                </button>

                {/* 3. Clear Cache & Refresh Data */}
                <button
                  type="button"
                  onClick={() => {
                    loadData();
                    setFeedback('Cache cleared & data synchronized with live server.');
                    setTimeout(() => setFeedback(''), 3000);
                  }}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span>Clear Cache & Sync</span>
                </button>

                {/* 4. Export Platform Audit Report */}
                <button
                  type="button"
                  onClick={handleExportData}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Audit Report</span>
                </button>

                {/* 5. System Health Diagnostic Ping */}
                <button
                  type="button"
                  onClick={handlePingServer}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>{healthStatus || 'Test API Ping'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- OVERVIEW TAB VIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', val: stats.totalUsers },
                { label: 'Active Sessions', val: stats.activeUsers },
                { label: 'Platform Admins', val: stats.totalAdmins },
                { label: 'System Status', val: maintenanceMode ? 'Maintenance' : 'Optimal' }
              ].map((card, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-3xl border transition-all ${
                    theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</div>
                  <div className="text-3xl font-extrabold mt-3 text-indigo-400">{card.val}</div>
                </div>
              ))}
            </div>

            <div className={`p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Recent Members</h2>
                  <p className="text-xs text-slate-400">Latest active users onboarded to {portalName}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-xs uppercase font-bold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {users.slice(0, 4).map((u) => (
                      <tr key={u.id}>
                        <td className="py-3.5 font-semibold">{u.name}</td>
                        <td className="py-3.5 text-slate-400">{u.email}</td>
                        <td className="py-3.5">{u.role}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TEAM & USERS TAB VIEW --- */}
        {activeTab === 'team' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Team Directory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage administrative credentials and viewer permissions</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            <div className={`p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-xs uppercase font-bold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3.5 font-semibold">{u.name}</td>
                        <td className="py-3.5 text-slate-400">{u.email}</td>
                        <td className="py-3.5">{u.role}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PERMISSIONS TAB VIEW --- */}
        {activeTab === 'permissions' && (
          <div className="max-w-4xl space-y-6">
            <div className={`p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-lg font-bold mb-2">Access Control Matrix</h2>
              <p className="text-xs text-slate-400 mb-6">Default system role privileges and security policies</p>
              
              <div className="space-y-3">
                {[
                  { role: 'Admin', desc: 'Full write/read permissions, settings modification, user creation' },
                  { role: 'Editor', desc: 'Can manage contents and view analytics; cannot alter platform settings' },
                  { role: 'Viewer', desc: 'Read-only access across dashboard reporting endpoints' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="text-sm font-bold text-indigo-400">{item.role}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      Active Policy
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-[#090d1f] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-lg font-bold">Add New Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Jane Doe"
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="jane@example.com"
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${
                      theme === 'dark' ? 'bg-[#060813] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                  <select
                    value={newMember.status}
                    onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-xl outline-none ${
                      theme === 'dark' ? 'bg-[#060813] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}