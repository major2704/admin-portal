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
  const [activeTab, setActiveTab] = useState('students'); // 'overview' | 'students' | 'courses' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform & Academic Settings
  const [portalName, setPortalName] = useState('EduNexus SMS');
  const [publicRegistrations, setPublicRegistrations] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Stores
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([
    { id: '1', code: 'BCA', name: 'Bachelor of Computer Applications', duration: '6 Semesters', dept: 'Department of Computing', head: 'Dr. V. Sharma' },
    { id: '2', code: 'B.Tech CS', name: 'B.Tech Computer Science & Engineering', duration: '8 Semesters', dept: 'School of Engineering', head: 'Prof. K. Sen' },
    { id: '3', code: 'MCA', name: 'Master of Computer Applications', duration: '4 Semesters', dept: 'Postgraduate Studies', head: 'Dr. A. Verma' },
    { id: '4', code: 'B.Sc IT', name: 'B.Sc Information Technology', duration: '6 Semesters', dept: 'Applied Sciences', head: 'Prof. N. Patel' }
  ]);
  const [stats, setStats] = useState({ totalUsers: 4, activeUsers: 3, totalAdmins: 4, systemStatus: 'Academic Term Active' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Updated Active Filter Pill State
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    role: 'Teacher',
    status: 'Enrolled'
  });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    duration: '6 Semesters',
    dept: 'Department of Computing',
    head: ''
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

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, studentsRes, coursesRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`).catch(() => null),
        fetch(`${API_BASE_URL}/students`).catch(() => null),
        fetch(`${API_BASE_URL}/courses`).catch(() => null),
        fetch(`${API_BASE_URL}/settings`).catch(() => null)
      ]);

      if (statsRes && statsRes.ok) setStats(await statsRes.json());
      if (studentsRes && studentsRes.ok) setStudents(await studentsRes.json());
      if (coursesRes && coursesRes.ok) {
        const cData = await coursesRes.json();
        if (Array.isArray(cData) && cData.length > 0) setCourses(cData);
      }
      if (settingsRes && settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.portalName) setPortalName(sData.portalName);
        if (typeof sData.publicRegistrations === 'boolean') setPublicRegistrations(sData.publicRegistrations);
        if (typeof sData.maintenanceMode === 'boolean') setMaintenanceMode(sData.maintenanceMode);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  // Auth
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

  // Course Actions
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });

      const data = await res.json();
      if (res.ok) {
        setCourses([...courses, data]);
        setShowCourseModal(false);
        setNewCourse({ code: '', name: '', duration: '6 Semesters', dept: 'Department of Computing', head: '' });
        setFeedback(`Program "${data.code}" added successfully.`);
        setTimeout(() => setFeedback(''), 3000);
        loadData();
      } else {
        alert(data.error || 'Failed to add course');
      }
    } catch (err) {
      console.error('Course add error:', err);
    }
  };

  const handleDeleteCourse = async (id, code) => {
    if (!window.confirm(`Are you sure you want to remove ${code}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(courses.filter((c) => c.id !== id));
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  // Student / User Actions
  const handleProvisionUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newStudent.name,
        email: newStudent.email,
        role: newStudent.role,
        course: newStudent.role,
        status: newStudent.status,
        rollNo: `CS-2026-${Math.floor(10 + Math.random() * 90)}`
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
        setNewStudent({ name: '', email: '', role: 'Teacher', status: 'Enrolled' });
        loadData();
      }
    } catch (err) {
      console.error('Student add error:', err);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter((s) => s.id !== id));
        loadData();
      }
    } catch (err) {
      console.error('Delete error:', err);
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
        setFeedback('Settings updated successfully.');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      console.error('Settings save error:', err);
    }
  };

  const handleExportDirectory = () => {
    const blob = new Blob([JSON.stringify({ portalName, date: new Date().toISOString(), stats, courses, students }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${portalName.toLowerCase().replace(/\s+/g, '-')}-roster.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Data export generated.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePing = async () => {
    setHealthStatus('Pinging...');
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      setHealthStatus(res.ok ? `Online (${Date.now() - t0}ms)` : 'Error');
    } catch {
      setHealthStatus('Offline');
    }
    setTimeout(() => setHealthStatus(null), 4000);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all courses, records, and settings to factory defaults?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reset`, { method: 'POST' });
      if (res.ok) {
        alert('Database restored.');
        window.location.reload();
      }
    } catch (err) {
      alert('Reset error: ' + err.message);
    }
  };

  // Filter List (Matches ALL, ADMIN, TEACHER, ENROLLED, ON LEAVE)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.rollNo?.toLowerCase().includes(query);
      
      let matchesFilter = true;
      if (selectedFilter !== 'All') {
        const roleMatch = s.role?.toLowerCase() === selectedFilter.toLowerCase();
        const statusMatch = s.status?.toLowerCase() === selectedFilter.toLowerCase();
        matchesFilter = roleMatch || statusMatch;
      }

      return matchesSearch && matchesFilter;
    });
  }, [students, searchQuery, selectedFilter]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: GraduationCap },
    { id: 'students', label: 'Students Roster', icon: Users },
    { id: 'courses', label: 'Departments & Degrees', icon: BookOpen },
    { id: 'settings', label: 'Academic Settings', icon: Settings },
  ];

  // --- Auth Screen ---
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

  // --- Main Dashboard Screen ---
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 relative ${
      theme === 'dark' ? 'bg-[#060813] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'
    }`}>
      {/* Mobile Top Bar */}
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

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-6 flex flex-col justify-between border-r select-none transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}
        md:static md:shrink-0
      `}>
        <div className="space-y-8">
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

      {/* Floating Dean Profile Card */}
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

      {/* Main Viewport */}
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
                { label: 'Academic Programs', val: courses.length },
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
                  <span>Provision New User</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-[11px] uppercase font-bold">
                      <th className="pb-3 px-2">Roll No</th>
                      <th className="pb-3 px-2">Student Name</th>
                      <th className="pb-3 px-2">Role / Program</th>
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
                        <td className="py-3 px-2 font-medium">{s.role || s.course}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                            s.status === 'Enrolled' || s.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : s.status === 'On Leave' || s.status === 'Inactive' 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-indigo-500/10 text-indigo-400'
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

        {/* --- TAB 2: STUDENT ROSTER (UPDATED FILTER BAR) --- */}
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
                <span>Provision New User</span>
              </button>
            </div>

            {/* Filter Bar: ALL | ADMIN | TEACHER | ENROLLED | ON LEAVE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or email..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition ${
                    theme === 'dark'
                      ? 'bg-[#090d1f] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-sm'
                  }`}
                />
              </div>

              {/* Exact Pill Options */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 mr-1.5">Role:</span>
                {['All', 'Admin', 'Teacher', 'Enrolled', 'On Leave'].map((pill) => {
                  const isSelected = selectedFilter.toLowerCase() === pill.toLowerCase();
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setSelectedFilter(pill)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                          : theme === 'dark'
                          ? 'bg-[#0e132b] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm'
                      }`}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className={`p-5 sm:p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#090d1f] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 text-[11px] uppercase font-bold">
                      <th className="pb-3 px-2">Roll No</th>
                      <th className="pb-3 px-2">User / Student</th>
                      <th className="pb-3 px-2">Role</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400 text-xs">
                          No records found matching "{selectedFilter}".
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
                          <td className="py-3 px-2 font-medium">{s.role || s.course}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                              s.status === 'Enrolled' || s.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : s.status === 'On Leave' || s.status === 'Inactive' 
                                ? 'bg-amber-500/10 text-amber-400' 
                                : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete record"
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
          <div className="max-w-5xl space-y-6 pb-24 md:pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Academic Degrees & Programs</h2>
                <p className="text-xs text-slate-400 mt-0.5">Define and curate authorized courses offered by the institution</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Degree Program</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between transition ${
                    theme === 'dark' ? 'bg-[#090d1f] border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-400">{c.duration}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(c.id, c.code)}
                        className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
                        title="Remove Degree Program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm font-bold mt-1">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{c.dept}</div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Program Head:</span>
                    <span className="font-semibold text-slate-300">{c.head || 'Assigned Dean'}</span>
                  </div>
                </div>
              ))}
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

      {/* --- ADD NEW DEGREE MODAL --- */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[460px] bg-[#0c1021] border border-slate-800/90 text-white rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowCourseModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Add Degree Program</h2>
              <p className="text-xs text-slate-400 mt-0.5">Register a new academic degree or department program</p>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  PROGRAM CODE / SHORT IDENTIFIER
                </label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="e.g. BCA, MCA, B.Tech AI"
                  className="w-full px-4 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  FULL DEGREE TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. Bachelor of Computer Applications"
                  className="w-full px-4 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    DURATION
                  </label>
                  <select
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="2 Semesters">2 Semesters (1 Yr)</option>
                    <option value="4 Semesters">4 Semesters (2 Yrs)</option>
                    <option value="6 Semesters">6 Semesters (3 Yrs)</option>
                    <option value="8 Semesters">8 Semesters (4 Yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    PROGRAM HEAD
                  </label>
                  <input
                    type="text"
                    value={newCourse.head}
                    onChange={(e) => setNewCourse({ ...newCourse, head: e.target.value })}
                    placeholder="Prof. / Dr. Name"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  FACULTY / DEPARTMENT
                </label>
                <input
                  type="text"
                  value={newCourse.dept}
                  onChange={(e) => setNewCourse({ ...newCourse, dept: e.target.value })}
                  placeholder="e.g. Department of Computing"
                  className="w-full px-4 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Register Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PROVISION NEW USER / STUDENT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[440px] bg-[#0c1021] border border-slate-800/90 text-white rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white">Provision New User</h2>
              <p className="text-xs text-slate-400 mt-1">Assign directory privileges and account states</p>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Role / Type Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    ROLE
                  </label>
                  <select
                    value={newStudent.role}
                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#060813] border border-indigo-500/80 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1em'
                    }}
                  >
                    <option value="Admin" className="bg-[#0c1021]">Admin</option>
                    <option value="Teacher" className="bg-[#0c1021]">Teacher</option>
                    <option value="Student" className="bg-[#0c1021]">Student</option>
                  </select>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    STATUS
                  </label>
                  <select
                    value={newStudent.status}
                    onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#060813] border border-slate-800 text-sm text-slate-100 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1em'
                    }}
                  >
                    <option value="Enrolled" className="bg-[#0c1021]">Enrolled</option>
                    <option value="On Leave" className="bg-[#0c1021]">On Leave</option>
                    <option value="Active" className="bg-[#0c1021]">Active</option>
                    <option value="Inactive" className="bg-[#0c1021]">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Confirm User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}