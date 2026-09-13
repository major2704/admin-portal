import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Sparkles, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  CheckCircle2, 
  TrendingUp, 
  Mail, 
  Calendar, 
  Layers, 
  LogOut, 
  Lock, 
  KeyRound, 
  Database, 
  Globe, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Active View Tab: 'overview' | 'users' | 'permissions' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Data State
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalAdmins: 0, systemStatus: 'Optimal' });
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Viewer', status: 'Active' });

  // System Settings State
  const [settingsForm, setSettingsForm] = useState(() => {
    const savedSettings = localStorage.getItem('nexus_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      systemName: 'NexusAdmin',
      allowSignups: false,
      maintenanceMode: false,
      rateLimit: '1000'
    };
  });
  const [saveAlert, setSaveAlert] = useState(false);

  // Fetch Stats & Users
  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/users`)
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to connect to API:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
        setIsSubmittingAuth(false);
        return;
      }
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setLoginPass('');
    } catch (err) {
      setAuthError('Backend server unreachable. Make sure backend is running on port 5000.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
    setActiveTab('overview');
    setLoginEmail('');
    setLoginPass('');
    setAuthError('');
  };

  // CRUD handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetch(`${API_BASE}/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'Viewer', status: 'Active' });
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Editor':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default:
        return 'bg-slate-700/40 text-slate-300 border border-slate-700';
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
  };

  // ==========================================
  // VIEW: LOGIN SCREEN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="relative w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Sign In to {settingsForm.systemName}</h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise Central Management Suite</p>
          </div>

          {authError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username / Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Enter your registered login ID"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmittingAuth ? 'Verifying Credentials...' : 'Authenticate Session'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500">
            Protected zone. Authorized personnel only.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATED PORTAL
  // ==========================================
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {settingsForm.systemName}
              </span>
              <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Enterprise</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users size={18} />
              <span>Team & Users</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers size={18} />
              <span>Permissions</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-400 truncate">{currentUser.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800/80 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white capitalize">
              {activeTab === 'overview' && 'System Overview'}
              {activeTab === 'users' && 'Team & User Directory'}
              {activeTab === 'permissions' && 'Role Access Controls'}
              {activeTab === 'settings' && 'Platform Settings'}
            </h1>
            <p className="text-xs text-slate-400">Signed in as {currentUser.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'settings' && activeTab !== 'permissions' && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setFormData({ name: '', email: '', role: 'Viewer', status: 'Active' });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
              >
                <Plus size={16} />
                <span>Add Member</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="md:hidden flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs text-rose-400 font-semibold"
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Users size={20} />
                    </div>
                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <TrendingUp size={12} className="mr-1" /> +12%
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-400">Total Directory</div>
                    <div className="text-3xl font-extrabold text-white mt-1">{stats.totalUsers}</div>
                  </div>
                </div>

                <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <UserCheck size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400">Verified</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-400">Active Accounts</div>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.activeUsers}</div>
                  </div>
                </div>

                <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400">Privileged</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-400">System Admins</div>
                    <div className="text-3xl font-extrabold text-purple-400 mt-1">{stats.totalAdmins}</div>
                  </div>
                </div>

                <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                      <Activity size={20} />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-cyan-400">
                      <CheckCircle2 size={12} /> Live
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-400">System Health</div>
                    <div className="text-2xl font-bold text-cyan-300 mt-1">{stats.systemStatus}</div>
                  </div>
                </div>
              </div>

              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Database size={18} className="text-indigo-400" /> Database Telemetry
                  </h3>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span>Database Engine</span>
                      <span className="text-slate-200 font-mono">In-Memory Store (Express REST)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span>Server Latency</span>
                      <span className="text-emerald-400 font-mono">14ms</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Active Sessions</span>
                      <span className="text-slate-200 font-mono">1 Authenticated</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe size={18} className="text-indigo-400" /> Network Endpoint Status
                  </h3>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span>Base API URL</span>
                      <span className="text-slate-200 font-mono">{API_BASE}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span>CORS Filter</span>
                      <span className="text-emerald-400 font-mono">Enabled (*)</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>API Protocol</span>
                      <span className="text-slate-200 font-mono">HTTP/1.1 REST</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: USERS & TEAM */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'users') && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Filter by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="text-xs text-slate-400">Role:</span>
                  {['All', 'Admin', 'Editor', 'Viewer'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        roleFilter === role 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/30">
                      <th className="py-4 px-6 font-bold">Identity</th>
                      <th className="py-4 px-6 font-bold">Assigned Role</th>
                      <th className="py-4 px-6 font-bold">Status</th>
                      <th className="py-4 px-6 font-bold">Joined</th>
                      <th className="py-4 px-6 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center">
                                {getInitials(user.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-white group-hover:text-indigo-300 transition">{user.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Mail size={12} /> {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg ${getRoleBadgeStyle(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              user.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'Active' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                              }`} />
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                            <div className="flex items-center gap-1">
                              <Calendar size={13} className="text-slate-500" />
                              {user.joinedAt}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          No team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PERMISSIONS */}
          {/* ========================================================= */}
          {activeTab === 'permissions' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Access Control Matrix</h2>
                <p className="text-xs text-slate-400">Configure role privilege thresholds across the application</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold">
                    <KeyRound size={20} /> Admin Role
                  </div>
                  <ul className="text-xs text-slate-300 space-y-3">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Full CRUD User Access</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Modify Platform Settings</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View Analytics & Audits</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Deploy to Production</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/60 border border-sky-500/20">
                  <div className="flex items-center gap-2 mb-4 text-sky-400 font-bold">
                    <Layers size={20} /> Editor Role
                  </div>
                  <ul className="text-xs text-slate-300 space-y-3">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Update User Details</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View User Directory</li>
                    <li className="flex items-center gap-2 text-slate-500"><X size={14} className="text-rose-500" /> Cannot Delete Users</li>
                    <li className="flex items-center gap-2 text-slate-500"><X size={14} className="text-rose-500" /> Cannot Edit Settings</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold">
                    <Users size={20} /> Viewer Role
                  </div>
                  <ul className="text-xs text-slate-300 space-y-3">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View Public Metrics</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> View Roster List</li>
                    <li className="flex items-center gap-2 text-slate-500"><X size={14} className="text-rose-500" /> Cannot Modify Records</li>
                    <li className="flex items-center gap-2 text-slate-500"><X size={14} className="text-rose-500" /> No Access to Secrets</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SETTINGS */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl max-w-3xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Platform Settings</h2>
                <p className="text-xs text-slate-400">Configure global portal behavior and restrictions</p>
              </div>

              {saveAlert && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} /> Preferences successfully saved locally.
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('nexus_settings', JSON.stringify(settingsForm));
                  setSaveAlert(true);
                  setTimeout(() => setSaveAlert(false), 3000);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal Name</label>
                  <input
                    type="text"
                    value={settingsForm.systemName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, systemName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Public Registrations</div>
                    <div className="text-xs text-slate-400">Permit external visitors to sign up as Viewers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.allowSignups}
                    onChange={(e) => setSettingsForm({ ...settingsForm, allowSignups: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Maintenance Mode</div>
                    <div className="text-xs text-slate-400">Redirect non-admin visitors to an update screen</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Save Platform Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-1">
              {editingUser ? 'Edit User Credentials' : 'Provision New User'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Assign directory privileges and account states</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  {editingUser ? 'Save Updates' : 'Confirm User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}