import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Admin credentials from .env or production fallbacks
const CUSTOM_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'akshatnanawati2704@gmail.com';
const CUSTOM_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2704';

// Enable CORS for all incoming requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Healthcheck route (visiting URL in browser confirms server is awake)
app.get('/', (req, res) => {
  res.json({ status: 'API is healthy and online' });
});

// In-Memory Data Store
let users = [
  { id: '1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Admin', status: 'Active', joinedAt: '2025-01-12' },
  { id: '2', name: 'Pooja Verma', email: 'pooja@example.com', role: 'Editor', status: 'Active', joinedAt: '2025-02-04' },
  { id: '3', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'Viewer', status: 'Inactive', joinedAt: '2025-03-18' },
  { id: '4', name: 'Sneha Patel', email: 'sneha@example.com', role: 'Editor', status: 'Active', joinedAt: '2025-04-10' }
];

// Unified Login Handler
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

// Accept login on all common path variations to prevent 404s
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/auth/login', handleLogin);

// Dashboard Statistics
app.get('/api/stats', (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const totalAdmins = users.filter(u => u.role === 'Admin').length;

  res.json({
    totalUsers,
    activeUsers,
    totalAdmins,
    systemStatus: 'Optimal'
  });
});

// User Management Routes
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
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
});

app.put('/api/users/:id', (req, res) => {
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
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  res.json({ message: 'User deleted successfully.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});