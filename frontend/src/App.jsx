import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
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
  Plus, 
  Search, 
  Menu, 
  X 
} from 'lucide-react';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://nexus-admin-api-7dhc.onrender.com/api'
).replace(/\/$/, '');

export default function App() {
  // Authentication & Session Persistence
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'dark');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'courses' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform & Academic Settings
  const [portalName, setPortalName] = useState('EduNexus SMS');
  const [publicRegistrations, setPublicRegistrations] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);

  // Authentication Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Student Data & Directory State
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 4, activeUsers: 3, totalAdmins: 3, systemStatus: 'Academic Term Active' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');

  // Enrollment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    rollNo: '',
    course: 'BCA',
    year: '1st Year',
    status: 'Enrolled'
  });

  // Apply Theme
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

  // Initial Fetch
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, studentsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`).catch(() => null),
        fetch(`${API_BASE_URL}/students`).catch(() => null),
        fetch(`${API_BASE_URL}/settings`).catch(() => null)
      ]);

      if (statsRes && statsRes.ok) setStats(await statsRes.json());
      if (studentsRes && studentsRes.ok) setStudents(await studentsRes.json());
      if (settingsRes && settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.portalName) setPortalName(sData.portalName);
        if (typeof sData.publicRegistrations === 'boolean') setPublicRegistrations(sData.publicRegistrations);
        if (typeof sData.maintenanceMode === 'boolean') setMaintenanceMode(sData.maintenanceMode);
      }
    } catch (err) {
      console.error('Data sync failed:', err);
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

      const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

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

  // Student Actions
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newStudent,
        rollNo: newStudent.rollNo || `CS-2026-${Math.floor(10 + Math.random() * 90)}`
      };

      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStudents([data, ...students]);
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', rollNo: '', course: 'BCA', year: '1st Year', status: 'Enrolled' });
        loadData();
      }
    } catch (err) {
      console.error('Enrollment error:', err);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student record?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter((s) => s.id !== id));
        loadData();
      }
    } catch (err) {
      console.error('Failed to remove student:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalName, publicRegistrations, maintenanceMode, theme })
      });
      if (res.ok) {
        setFeedback('Academic platform settings updated.');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleExportDirectory = () => {
    const blob = new Blob([JSON.stringify({ portalName, date: new Date().toISOString(), stats, students }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${portalName.toLowerCase().replace(/\s+/g, '-')}-roster.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Student roster report downloaded.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePing = async () => {
    setHealthStatus('Pinging...');
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const latency = Date.now() - t0;
      setHealthStatus(res.ok ? `Online (${latency}ms)` : 'Error');
    } catch {
      setHealthStatus('Offline');
    }
    setTimeout(() => setHealthStatus(null), 4000);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all student records to sample initial data?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reset`, { method: 'POST' });
      if (res.ok) {
        alert('Academic database reset.');
        window.location.reload();
      }
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = filterCourse === 'All' || s.course === filterCourse;
      return matchesSearch && matchesCourse;
    });
  }, [students, searchQuery, filterCourse]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: GraduationCap },
    { id: 'students', label: 'Students Roster', icon: Users },
    { id: 'courses', label: 'Departments & Degrees', icon: BookOpen },
    { id: 'settings', label: 'Academic Settings', icon: Settings },
  ];

  // --- Auth View (Dean / Admin Login) ---
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        theme === 'dark' ? 'bg-[#060813] text-white' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl ${
          theme === 'dark' ? 'bg-[#0d1024] border-slate-800' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{portalName}</h1>
              <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">CAMPUS ADMINISTRATION</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dean / Faculty Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akshatnanawati2704@gmail.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  theme === 'dark' ? 'bg-[#070a18] border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Administrative Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  theme === 'dark' ? 'bg-[#070a18] border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? 'Verifying Faculty Access...' : 'Sign In to Campus SMS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Application Dashboard ---
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 relative ${
      theme === 'dark' ? 'bg-[#060813] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'
    }`}>
      {/* Mobile Bar */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-30 ${
        theme === 'dark' ? 'bg-[#090d1f] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2.5 text-left focus:outline-none">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold">{portalName}</div>
            <div className="text-[9px] font-bold text-indigo-400 uppercase">STUDENT PORTAL</div>
          </div>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 rounded-xl border transition ${
            theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-6 flex flex-col justify-between border-r select-none transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}
        md:static md:shrink-0
      `}>
        <div className="space-y-8">
          {/* Logo */}
          <button 
            type="button" 
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 group text-left w-full focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight group-hover:text-indigo-400 transition-colors">
                {portalName}
              </div>
              <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                STUDENT SYSTEM
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
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

        <div className="hidden md:block h-20" />
      </aside>

      {/* Floating Dean / Faculty Profile Card */}
      <div className={`fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40 w-56 md:w-60 p-3 md:p-3.5 rounded-2xl border flex items-center justify-between shadow-2xl backdrop-blur-md transition-all ${
        theme === 'dark'
          ? 'bg-[#0e122b]/95 border-slate-800/90 shadow-black/60'
          : 'bg-white/95 border-slate-200 shadow-slate-300'
      }`}>
        <div className="flex items-center gap-2.5 md:gap-3 overflow-hidden">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
            DA
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold leading-tight truncate">Dean / Faculty</div>
            <div className="text-[10px] text-slate-400">Head Administrator</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Log Out"
          className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/40 shrink-0 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {activeTab === 'overview' && 'Campus Overview & Telemetry'}
            {activeTab === 'students' && 'Student Directory & Admissions'}
            {activeTab === 'courses' && 'Academic Departments & Degree Programs'}
            {activeTab === 'settings' && 'Institutional Settings'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Administrator: <span className="text-slate-300 font-medium">{user?.email || 'akshatnanawati2704@gmail.com'}</span>
          </p>
        </div>

        {feedback && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-2xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 md:space-y-8 max-w-6xl pb-24 md:pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {[
                { label: 'Total Enrolled Students', val: stats.totalUsers },
                { label: 'Active Students', val: stats.activeUsers },
                { label: 'Academic Programs', val: stats.totalAdmins },
                { label: 'Academic Term', val: maintenanceMode ? 'Semester Freeze' : 'Active Semester' }
              ].map((card, i) => (
                <div
                  key={i}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                    theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold mt-2 sm:mt-3 text-indigo-400">{card.val}</div>
                </div>
              ))}
            </div>

            <div className={`p-5 sm:p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold">Recently Enrolled Students</h2>
                  <p className="text-xs text-slate-400">Newly matriculated students registered in the platform</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll Student</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-[11px] uppercase font-bold">
                      <th className="pb-3 px-2">Roll No</th>
                      <th className="pb-3 px-2">Student Name</th>
                      <th className="pb-3 px-2">Course / Degree</th>
                      <th className="pb-3 px-2">Academic Year</th>
                      <th className="pb-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {students.slice(0, 4).map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 px-2 font-mono text-indigo-400">{s.rollNo || `CS-2026-${s.id}`}</td>
                        <td className="py-3 px-2 font-semibold">
                          {s.name}
                          <div className="text-[11px] text-slate-400 font-normal">{s.email}</div>
                        </td>
                        <td className="py-3 px-2 font-medium">{s.course || s.role}</td>
                        <td className="py-3 px-2 text-slate-400">{s.year || '1st Year'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                            s.status === 'Enrolled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {s.status}
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

        {/* --- TAB 2: STUDENT ROSTER (FULL DIRECTORY) --- */}
        {activeTab === 'students' && (
          <div className="space-y-6 max-w-6xl pb-24 md:pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Student Directory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Filter, search, and manage student admissions</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enroll New Student</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, roll no, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">Degree:</span>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="All">All Degrees</option>
                  <option value="BCA">BCA</option>
                  <option value="B.Tech CS">B.Tech CS</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc IT">B.Sc IT</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className={`p-5 sm:p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-[11px] uppercase font-bold">
                      <th className="pb-3 px-2">Roll No</th>
                      <th className="pb-3 px-2">Student</th>
                      <th className="pb-3 px-2">Degree</th>
                      <th className="pb-3 px-2">Year</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 px-2 font-mono text-indigo-400">{s.rollNo || `CS-2026-${s.id}`}</td>
                          <td className="py-3 px-2 font-semibold">
                            {s.name}
                            <div className="text-[11px] text-slate-400 font-normal">{s.email}</div>
                          </td>
                          <td className="py-3 px-2 font-medium">{s.course || s.role}</td>
                          <td className="py-3 px-2 text-slate-400">{s.year || '1st Year'}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                              s.status === 'Enrolled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Drop student record"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: ACADEMIC DEPARTMENTS & DEGREES --- */}
        {activeTab === 'courses' && (
          <div className="max-w-4xl space-y-6 pb-24 md:pb-16">
            <div className={`p-6 sm:p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-lg font-bold mb-1">Academic Programs Offered</h2>
              <p className="text-xs text-slate-400 mb-6">Accredited undergraduate and postgraduate programs</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'BCA (Bachelor of Computer Applications)', sem: '6 Semesters', dept: 'Department of Computing', head: 'Dr. V. Sharma' },
                  { name: 'B.Tech Computer Science & Engineering', sem: '8 Semesters', dept: 'School of Engineering', head: 'Prof. K. Sen' },
                  { name: 'MCA (Master of Computer Applications)', sem: '4 Semesters', dept: 'Postgraduate Studies', head: 'Dr. A. Verma' },
                  { name: 'B.Sc Information Technology', sem: '6 Semesters', dept: 'Applied Sciences', head: 'Prof. N. Patel' }
                ].map((c, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border space-y-2 ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="text-sm font-bold text-indigo-400">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.dept} • {c.sem}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Head of Program: {c.head}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: ACADEMIC SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl pb-24 md:pb-16">
            <div className={`p-5 sm:p-8 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-slate-100'
            }`}>
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-bold">Academic Portal Configuration</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control registration status and semester grade locks</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    INSTITUTION / PORTAL TITLE
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

                <div className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#060813] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="pr-3">
                    <div className="text-xs sm:text-sm font-bold">Student Self-Registration</div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Permit external applicants to register directly online</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicRegistrations}
                    onChange={(e) => setPublicRegistrations(e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-600 cursor-pointer shrink-0"
                  />
                </div>

                <div className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#060813] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="pr-3">
                    <div className="text-xs sm:text-sm font-bold">Semester Grade Freeze (Maintenance Mode)</div>
                    <div className="text-[11px] sm:text-xs text-slate-400">Lock grade updates and display term evaluation notification</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-600 cursor-pointer shrink-0"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Save Academic Settings
                </button>
              </form>
            </div>

            {/* Quick Action Diagnostic & Tools */}
            <div className={`p-5 sm:p-8 rounded-3xl border shadow-xl space-y-5 ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h2 className="text-base font-bold">Administrative Actions & Reports</h2>
                <p className="text-xs text-slate-400 mt-0.5">Session controls, theme customization, and data backups</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  <span>Switch Theme</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loadData();
                    setFeedback('Data synchronized with live database.');
                    setTimeout(() => setFeedback(''), 3000);
                  }}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span>Sync Campus Data</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDirectory}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Student Roster</span>
                </button>

                <button
                  type="button"
                  onClick={handlePing}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#060813] border-slate-800 hover:border-indigo-500/50 text-white'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>{healthStatus || 'Test API Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Reset Sample Records</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- ENROLL STUDENT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-[#090d1f] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-lg font-bold">Enroll New Student</h2>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Aarav Sharma"
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="aarav@campus.edu"
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Roll No / Student ID (Optional)</label>
                <input
                  type="text"
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                  placeholder="CS-2026-05"
                  className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition ${
                    theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Program</label>
                  <select
                    value={newStudent.course}
                    onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition ${
                      theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="BCA">BCA</option>
                    <option value="B.Tech CS">B.Tech CS</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc IT">B.Sc IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <select
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition ${
                      theme === 'dark' ? 'bg-[#060813] border-slate-800' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}