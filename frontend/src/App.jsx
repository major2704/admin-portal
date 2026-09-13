// Dynamic Base URL: Strips trailing slashes to avoid double-slash bugs
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://nexus-admin-api-7dhc.onrender.com/api'
).replace(/\/$/, '');

// Replace your login form submit handler with this:
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
    }

    // Store token and activate user session
    localStorage.setItem('nexus_token', data.token);
    setUser(data.user);
  } catch (err) {
    console.error('Login request failed:', err);
    setError(err.message || 'Unable to connect to the server. Please check your connection.');
  } finally {
    setLoading(false);
  }
};