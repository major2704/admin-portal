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

// Initial Student Seed Data
const initialStudents = [
  { id: '1', rollNo: 'CS-2026-01', name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', course: 'BCA', year: '3rd Year', status: 'Enrolled', joinedAt: '2025-01-12' },
  { id: '2', rollNo: 'CS-2026-02', name: 'Pooja Verma', email: 'pooja.verma@campus.edu', course: 'BCA', year: '2nd Year', status: 'Enrolled', joinedAt: '2025-02-04' },
  { id: '3', rollNo: 'CS-2026-03', name: 'Rohan Mehta', email: 'rohan.mehta@campus.edu', course: 'B.Tech CS', year: '1st Year', status: 'On Leave', joinedAt: '2025-03-18' },
  { id: '4', rollNo: 'CS-2026-04', name: 'Sneha Patel', email: 'sneha.patel@campus.edu', course: 'MCA', year: '1st Year', status: 'Enrolled', joinedAt: '2025-04-10' }
];

// In-Memory Data Stores
let students = [...initialStudents];

let platformSettings = {
  portalName: 'EduNexus SMS',
  publicRegistrations: true, // Student self-enrollment toggle
  maintenanceMode: false,     // Semester grade freeze toggle
  theme: 'dark'
};

// --- Handlers ---

// Admin Authentication
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

// Academic System Statistics
const handleGetStats = (req, res) => {
  const totalStudents = students.length;
  const activeUsers = students.filter(s => s.status === 'Enrolled').length;
  const totalCourses = new Set(students.map(s => s.course)).size;

  res.json({
    totalUsers: totalStudents,
    activeUsers: activeUsers,
    totalAdmins: totalCourses, // Reflects distinct academic departments/courses
    systemStatus: platformSettings.maintenanceMode ? 'Semester Freeze' : 'Academic Term Active'
  });
};

// Fetch Student Directory
const handleGetStudents = (req, res) => {
  res.json(students);
};

// Enroll / Add New Student
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
    role: course || role || 'BCA', // Kept for backward compatibility with frontend tables
    status: status || 'Enrolled',
    joinedAt: new Date().toISOString().split('T')[0]
  };

  students.unshift(newStudent);
  res.status(201).json(newStudent);
};

// Update Student Record
const handleUpdateStudent = (req, res) => {
  const { id } = req.params;
  const { name, email, rollNo, course, year, role, status } = req.body;

  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  students[index] = {
    ...students[index],
    name: name ?? students[index].name,
    email: email ?? students[index].email,
    rollNo: rollNo ?? students[index].rollNo,
    course: course ?? role ?? students[index].course,
    year: year ?? students[index].year,
    role: course ?? role ?? students[index].role,
    status: status ?? students[index].status
  };

  res.json(students[index]);
};

// Remove / Drop Student
const handleDeleteStudent = (req, res) => {
  const { id } = req.params;
  students = students.filter(s => s.id !== id);
  res.json({ message: 'Student record removed successfully.' });
};

// Platform & Academic Settings Handlers
const handleGetSettings = (req, res) => {
  res.json(platformSettings);
};

const handleUpdateSettings = (req, res) => {
  const { portalName, publicRegistrations, maintenanceMode, theme } = req.body;

  platformSettings = {
    portalName: portalName ?? platformSettings.portalName,
    publicRegistrations: typeof publicRegistrations === 'boolean' ? publicRegistrations : platformSettings.publicRegistrations,
    maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : platformSettings.maintenanceMode,
    theme: theme ?? platformSettings.theme
  };

  res.json({
    message: 'Academic platform settings updated successfully.',
    settings: platformSettings
  });
};

// Reset In-Memory Records to Defaults
const handleResetData = (req, res) => {
  students = [...initialStudents];
  platformSettings = {
    portalName: 'EduNexus SMS',
    publicRegistrations: true,
    maintenanceMode: false,
    theme: 'dark'
  };
  res.json({ message: 'Student database and academic settings reset to factory defaults.' });
};

// --- Route Registrations (Both /api and root paths) ---

// Auth
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/auth/login', handleLogin);

// Academic Telemetry & Statistics
app.get('/api/stats', handleGetStats);
app.get('/stats', handleGetStats);

// Student Endpoints (Mapped to both /students and /users for seamless compatibility)
app.get('/api/students', handleGetStudents);
app.get('/students', handleGetStudents);
app.get('/api/users', handleGetStudents);
app.get('/users', handleGetStudents);

app.post('/api/students', handleCreateStudent);
app.post('/students', handleCreateStudent);
app.post('/api/users', handleCreateStudent);
app.post('/users', handleCreateStudent);

app.put('/api/students/:id', handleUpdateStudent);
app.put('/students/:id', handleUpdateStudent);
app.put('/api/users/:id', handleUpdateStudent);
app.put('/users/:id', handleUpdateStudent);

app.delete('/api/students/:id', handleDeleteStudent);
app.delete('/students/:id', handleDeleteStudent);
app.delete('/api/users/:id', handleDeleteStudent);
app.delete('/users/:id', handleDeleteStudent);

// System Settings
app.get('/api/settings', handleGetSettings);
app.get('/settings', handleGetSettings);

app.post('/api/settings', handleUpdateSettings);
app.post('/settings', handleUpdateSettings);
app.put('/api/settings', handleUpdateSettings);
app.put('/settings', handleUpdateSettings);

// Reset Route
app.post('/api/reset', handleResetData);
app.post('/reset', handleResetData);

// Start Server
app.listen(PORT, () => {
  console.log(`EduNexus SMS backend running on port ${PORT}`);
});