import React, { useState, useEffect } from 'react';

// --- Dynamic Base URL: Normalizes URL and falls back to production Render backend ---
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://nexus-admin-api-7dhc.onrender.com/api'
).replace(/\/$/, '');

export default function App() {
  // --- Persistent State Variables ---
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexus_theme') || 'dark';
  });

  const [settings, setSettings] = useState({
    portalName: 'NexusAdmin',
    publicRegistrations: false,
    maintenanceMode: false
  });

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App navigation and management state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users' | 'settings'
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalAdmins: 0, systemStatus: 'Optimal' });
  const [loadingData, setLoadingData] = useState(false);

  // New Member Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Viewer', status: 'Active' });
  const [addingMember, setAddingMember] = useState(false);

  // Settings feedback
  const [settingsFeedback, setSettingsFeedback] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // --- Effect: Apply & Synchronize Theme Class ---
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

  // --- Effect: Load Initial Data & Settings when Authenticated ---
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({
          ...prev,
          portalName: data.portalName || prev.portalName,
          publicRegistrations: data.publicRegistrations ?? prev.publicRegistrations,
          maintenanceMode: data.maintenanceMode ?? prev.maintenanceMode
        }));
        if (data.theme) setTheme(data.theme);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/users`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error('Error loading portal data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- Handlers ---
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      setSettings((prev) => ({ ...prev, theme: newTheme }));
      return newTheme;
    });
  };

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

      const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      console.error('Login request failed:', err);
      setAuthError(err.message || 'Unable to connect to the server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setUser(null);
    setEmail('');
    setPassword('');
    setAuthError('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create member');
      }

      setUsers((prev) => [data, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        activeUsers: data.status === 'Active' ? prev.activeUsers + 1 : prev.activeUsers,
        totalAdmins: data.role === 'Admin' ? prev.totalAdmins + 1 : prev.totalAdmins
      }));
      setShowAddModal(false);
      setNewMember({ name: '', email: '', role: 'Viewer', status: 'Active' });
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback('');

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, theme })
      });

      const data = await res.json().catch(() => ({ error: 'Failed to update settings' }));

      if (!res.ok) throw new Error(data.error || 'Failed to update platform settings');

      setSettingsFeedback('Settings saved successfully!');
      setTimeout(() => setSettingsFeedback(''), 3000);
    } catch (err) {
      setSettingsFeedback(`Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all members and portal configuration back to defaults?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reset`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Platform restored to initial defaults.');
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  // --- Auth View (Login Screen) ---
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#060a12] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${
          theme === 'dark' ? 'bg-[#0b101b] border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{settings.portalName}</h1>
              <p className="text-xs text-slate-400 mt-1">Management Portal Authentication</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 text-xs font-semibold rounded-lg border transition ${
                theme === 'dark' ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akshatnanawati2704@gmail.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  theme === 'dark'
                    ? 'bg-[#060a12] border-slate-800 text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  theme === 'dark'
                    ? 'bg-[#060a12] border-slate-800 text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {authLoading ? 'Verifying Session...' : 'Authenticate Session'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Application Dashboard ---
  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#060a12] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r flex flex-col justify-between p-6 transition-colors ${
        theme === 'dark' ? 'bg-[#0b101b] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-6">
          <div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {settings.portalName}
            </span>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
              Admin Platform
            </span>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'users', label: 'Members' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer / Account Info */}
        <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="text-xs font-medium truncate text-slate-400 mb-2">
            {user.email}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                theme === 'dark' ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
              <p className="text-sm text-slate-400 mt-1">Real-time platform metrics and live telemetry</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', val: stats.totalUsers },
                { label: 'Active Sessions', val: stats.activeUsers },
                { label: 'Platform Admins', val: stats.totalAdmins },
                { label: 'Health Status', val: stats.systemStatus }
              ].map((card, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all ${
                    theme === 'dark' ? 'bg-[#0b101b] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">{card.label}</div>
                  <div className="text-2xl font-bold mt-2 text-indigo-500">{card.val}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h2 className="text-lg font-bold">Recent Members</h2>
                <p className="text-xs text-slate-400">Quick view of recent accounts</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                + Add Member
              </button>
            </div>

            {/* Quick table preview */}
            <div className={`border rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'border-slate-800 bg-[#0b101b]' : 'border-slate-200 bg-white shadow-sm'
            }`}>
              <table className="w-full text-left text-sm">
                <thead className={`border-b text-xs uppercase font-semibold text-slate-400 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                }`}>
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {users.slice(0, 4).map((u) => (
                    <tr key={u.id} className="hover:bg-indigo-500/5 transition">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4">{u.role}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
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
        )}

        {/* --- TAB 2: MEMBERS MANAGEMENT --- */}
        {activeTab === 'users' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Member Roster</h1>
                <p className="text-sm text-slate-400 mt-1">Manage portal accounts, roles, and administrative statuses</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                + Add Member
              </button>
            </div>

            <div className={`border rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'border-slate-800 bg-[#0b101b]' : 'border-slate-200 bg-white shadow-sm'
            }`}>
              <table className="w-full text-left text-sm">
                <thead className={`border-b text-xs uppercase font-semibold text-slate-400 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                }`}>
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-indigo-500/5 transition">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4 font-medium">{u.role}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: PLATFORM SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
              <p className="text-sm text-slate-400 mt-1">
                Signed in as <span className="text-indigo-400 font-medium">{user.email}</span>
              </p>
            </div>

            {settingsFeedback && (
              <div className="p-3 text-sm rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                {settingsFeedback}
              </div>
            )}

            {/* General Configurations */}
            <div className={`p-6 rounded-2xl border space-y-6 ${
              theme === 'dark' ? 'bg-[#0b101b] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h2 className="text-lg font-bold">Portal Configuration</h2>
                <p className="text-xs text-slate-400">Configure global portal behavior and restrictions</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Portal Name
                  </label>
                  <input
                    type="text"
                    value={settings.portalName}
                    onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                      theme === 'dark'
                        ? 'bg-[#060a12] border-slate-800 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                    }`}
                    placeholder="NexusAdmin"
                    required
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#060a12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-sm font-semibold">Public Registrations</div>
                    <div className="text-xs text-slate-400">Permit external visitors to sign up as Viewers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.publicRegistrations}
                    onChange={(e) => setSettings({ ...settings, publicRegistrations: e.target.checked })}
                    className="h-5 w-5 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#060a12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-sm font-semibold">Maintenance Mode</div>
                    <div className="text-xs text-slate-400">Redirect non-admin visitors to an update screen</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="h-5 w-5 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Platform Settings'}
                </button>
              </form>
            </div>

            {/* Appearance Mode */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-[#0b101b] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h2 className="text-base font-bold">Display Mode</h2>
                <p className="text-xs text-slate-400 mt-0.5">Toggle between Dark and Light palette</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>

            {/* Danger Zone */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              theme === 'dark' ? 'bg-[#0b101b] border-red-950/40' : 'bg-white border-red-200 shadow-sm'
            }`}>
              <div>
                <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-400 mt-0.5">Destructive actions and administrative session control</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition"
                >
                  Reset Seed Data
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition"
                >
                  Log Out of Session
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- ADD MEMBER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-[#0b101b] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
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
                    theme === 'dark' ? 'bg-[#060a12] border-slate-800' : 'bg-slate-50 border-slate-300'
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
                    theme === 'dark' ? 'bg-[#060a12] border-slate-800' : 'bg-slate-50 border-slate-300'
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
                      theme === 'dark' ? 'bg-[#060a12] border-slate-800' : 'bg-slate-50 border-slate-300'
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
                      theme === 'dark' ? 'bg-[#060a12] border-slate-800' : 'bg-slate-50 border-slate-300'
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
                  disabled={addingMember}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {addingMember ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}