import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const CUSTOM_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'akshatnanawati2704@gmail.com';
const CUSTOM_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2704';

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'EduNexus SMS API is online and healthy' });
});

// Initial Courses Seed Data
const initialCourses = [
  { id: '1', code: 'BCA', name: 'Bachelor of Computer Applications', duration: '6 Semesters', dept: 'Department of Computing', head: 'Dr. V. Sharma' },
  { id: '2', code: 'B.Tech CS', name: 'B.Tech Computer Science & Engineering', duration: '8 Semesters', dept: 'School of Engineering', head: 'Prof. K. Sen' },
  { id: '3', code: 'MCA', name: 'Master of Computer Applications', duration: '4 Semesters', dept: 'Postgraduate Studies', head: 'Dr. A. Verma' },
  { id: '4', code: 'B.Sc IT', name: 'B.Sc Information Technology', duration: '6 Semesters', dept: 'Applied Sciences', head: 'Prof. N. Patel' }
];

// Initial Student Seed Data
const initialStudents = [
  { id: '1', rollNo: 'CS-2026-01', name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', course: 'BCA', year: '3rd Year', role: 'BCA', status: 'Active', joinedAt: '2025-01-12' },
  { id: '2', rollNo: 'CS-2026-02', name: 'Pooja Verma', email: 'pooja.verma@campus.edu', course: 'BCA', year: '2nd Year', role: 'BCA', status: 'Active', joinedAt: '2025-02-04' },
  { id: '3', rollNo: 'CS-2026-03', name: 'Rohan Mehta', email: 'rohan.mehta@campus.edu', course: 'B.Tech CS', year: '1st Year', role: 'B.Tech CS', status: 'Inactive', joinedAt: '2025-03-18' },
  { id: '4', rollNo: 'CS-2026-04', name: 'Sneha Patel', email: 'sneha.patel@campus.edu', course: 'MCA', year: '1st Year', role: 'MCA', status: 'Admin', joinedAt: '2025-04-10' }
];

// In-Memory Stores
let students = [...initialStudents];
let courses = [...initialCourses];
let platformSettings = {
  portalName: 'EduNexus SMS',
  publicRegistrations: true,
  maintenanceMode: false,
  theme: 'dark'
};

// Handlers
const handleLogin = (req, res) => {
  const { email, password } = req.body;
  if (email === CUSTOM_ADMIN_EMAIL && password === CUSTOM_ADMIN_PASSWORD) {
    return res.json({
      token: 'edunexus_auth_token_' + Date.now(),
      user: {
        id: '0',
        name: 'Dean / Master Admin',
        email: CUSTOM_ADMIN_EMAIL,
        role: 'Admin'
      }
    });
  }
  return res.status(401).json({ error: 'Invalid admin email or password.' });
};

const handleGetStats = (req, res) => {
  res.json({
    totalUsers: students.length,
    activeUsers: students.filter(s => s.status === 'Active' || s.status === 'Enrolled').length,
    totalAdmins: courses.length,
    systemStatus: platformSettings.maintenanceMode ? 'Semester Freeze' : 'Academic Term Active'
  });
};

// Courses Handlers
const handleGetCourses = (req, res) => res.json(courses);

const handleCreateCourse = (req, res) => {
  const { code, name, duration, dept, head } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Course code and name are required.' });
  }
  const newCourse = {
    id: Date.now().toString(),
    code: code.trim().toUpperCase(),
    name: name.trim(),
    duration: duration || '6 Semesters',
    dept: dept || 'Department of Computing',
    head: head || 'Faculty Admin'
  };
  courses.push(newCourse);
  res.status(201).json(newCourse);
};

const handleDeleteCourse = (req, res) => {
  const { id } = req.params;
  courses = courses.filter(c => c.id !== id && c.code !== id);
  res.json({ message: 'Course removed successfully.' });
};

// Students Handlers
const handleGetStudents = (req, res) => res.json(students);

const handleCreateStudent = (req, res) => {
  const { name, email, rollNo, course, year, role, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Student name and email are required.' });
  }

  const newStudent = {
    id: Date.now().toString(),
    rollNo: rollNo || `CS-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    name,
    email,
    course: course || role || 'BCA',
    year: year || '1st Year',
    role: role || course || 'Viewer',
    status: status || 'Active',
    joinedAt: new Date().toISOString().split('T')[0]
  };

  students.unshift(newStudent);
  res.status(201).json(newStudent);
};

const handleDeleteStudent = (req, res) => {
  const { id } = req.params;
  students = students.filter(s => s.id !== id);
  res.json({ message: 'Record deleted successfully.' });
};

// Platform Settings
const handleGetSettings = (req, res) => res.json(platformSettings);

const handleUpdateSettings = (req, res) => {
  const { portalName, publicRegistrations, maintenanceMode, theme } = req.body;
  platformSettings = {
    portalName: portalName ?? platformSettings.portalName,
    publicRegistrations: typeof publicRegistrations === 'boolean' ? publicRegistrations : platformSettings.publicRegistrations,
    maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : platformSettings.maintenanceMode,
    theme: theme ?? platformSettings.theme
  };
  res.json({ message: 'Settings updated successfully.', settings: platformSettings });
};

const handleResetData = (req, res) => {
  students = [...initialStudents];
  courses = [...initialCourses];
  platformSettings = {
    portalName: 'EduNexus SMS',
    publicRegistrations: true,
    maintenanceMode: false,
    theme: 'dark'
  };
  res.json({ message: 'Platform data restored to default seed state.' });
};

// --- Routes ---
app.post('/api/auth/login', handleLogin);
app.post('/auth/login', handleLogin);

app.get('/api/stats', handleGetStats);
app.get('/stats', handleGetStats);

// Courses Routes
app.get('/api/courses', handleGetCourses);
app.get('/courses', handleGetCourses);
app.post('/api/courses', handleCreateCourse);
app.post('/courses', handleCreateCourse);
app.delete('/api/courses/:id', handleDeleteCourse);
app.delete('/courses/:id', handleDeleteCourse);

// Students / Users Routes
app.get('/api/students', handleGetStudents);
app.get('/students', handleGetStudents);
app.get('/api/users', handleGetStudents);
app.get('/users', handleGetStudents);

app.post('/api/students', handleCreateStudent);
app.post('/students', handleCreateStudent);
app.post('/api/users', handleCreateStudent);
app.post('/users', handleCreateStudent);

app.delete('/api/students/:id', handleDeleteStudent);
app.delete('/students/:id', handleDeleteStudent);
app.delete('/api/users/:id', handleDeleteStudent);
app.delete('/users/:id', handleDeleteStudent);

// Settings & Reset
app.get('/api/settings', handleGetSettings);
app.get('/settings', handleGetSettings);
app.post('/api/settings', handleUpdateSettings);
app.post('/settings', handleUpdateSettings);

app.post('/api/reset', handleResetData);
app.post('/reset', handleResetData);

app.listen(PORT, () => {
  console.log(`EduNexus SMS server live on port ${PORT}`);
});