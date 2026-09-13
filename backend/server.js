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
  res.json({ status: 'API is healthy and online' });
});

// Initial seed data
const initialUsers = [
  { id: '1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Admin', status: 'Active', joinedAt: '2025-01-12' },
  { id: '2', name: 'Pooja Verma', email: 'pooja@example.com', role: 'Editor', status: 'Active', joinedAt: '2025-02-04' },
  { id: '3', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'Viewer', status: 'Inactive', joinedAt: '2025-03-18' },
  { id: '4', name: 'Sneha Patel', email: 'sneha@example.com', role: 'Editor', status: 'Active', joinedAt: '2025-04-10' }
];

// In-Memory Data Store
let users = [...initialUsers];

// In-Memory Platform Settings Store
let platformSettings = {
  portalName: 'NexusAdmin',
  publicRegistrations: false,
  maintenanceMode: false,
  theme: 'dark'
};

// Handlers
const handleLogin = (req, res) => {
  const { email, password } = req.body;
  if (email === CUSTOM_ADMIN_EMAIL && password === CUSTOM_ADMIN_PASSWORD) {
    return res.json({
      token: 'nexus_secure_token_' + Date.now(),
      user: {
        id: '0',
        name: 'Master Admin',
        email: CUSTOM_ADMIN_EMAIL,
        role: 'Admin'
      }
    });
  }
  return res.status(401).json({ error: 'Invalid email or password.' });
};

const handleGetStats = (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const totalAdmins = users.filter(u => u.role === 'Admin').length;

  res.json({
    totalUsers,
    activeUsers,
    totalAdmins,
    systemStatus: platformSettings.maintenanceMode ? 'Maintenance' : 'Optimal'
  });
};

const handleGetUsers = (req, res) => {
  res.json(users);
};

const handleCreateUser = (req, res) => {
  const { name, email, role, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    role: role || 'Viewer',
    status: status || 'Active',
    joinedAt: new Date().toISOString().split('T')[0]
  };

  users.unshift(newUser);
  res.status(201).json(newUser);
};

const handleUpdateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users[index] = {
    ...users[index],
    name: name ?? users[index].name,
    email: email ?? users[index].email,
    role: role ?? users[index].role,
    status: status ?? users[index].status
  };

  res.json(users[index]);
};

const handleDeleteUser = (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  res.json({ message: 'User deleted successfully.' });
};

// Platform Settings Handlers
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
    message: 'Settings updated successfully',
    settings: platformSettings
  });
};

// Reset In-Memory Data Handler (Danger Zone utility)
const handleResetData = (req, res) => {
  users = [...initialUsers];
  platformSettings = {
    portalName: 'NexusAdmin',
    publicRegistrations: false,
    maintenanceMode: false,
    theme: 'dark'
  };
  res.json({ message: 'Database and settings reset to defaults.' });
};

// --- Routes (Registered for both with and without '/api') ---

// Auth
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/auth/login', handleLogin);

// Stats
app.get('/api/stats', handleGetStats);
app.get('/stats', handleGetStats);

// Users
app.get('/api/users', handleGetUsers);
app.get('/users', handleGetUsers);

app.post('/api/users', handleCreateUser);
app.post('/users', handleCreateUser);

app.put('/api/users/:id', handleUpdateUser);
app.put('/users/:id', handleUpdateUser);

app.delete('/api/users/:id', handleDeleteUser);
app.delete('/users/:id', handleDeleteUser);

// Platform Settings Routes
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
  console.log(`Backend server running on port ${PORT}`);
});