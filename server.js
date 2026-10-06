const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Simple JSON file based database compatible with Vercel serverless
const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'database.json') : path.join(__dirname, 'database.json');
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [] };
    try { fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2)); } catch(e){}
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Save DB error:', e);
  }
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'super-admin-secret-key-12345',
  resave: false,
  saveUninitialized: false
}));

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ----------------- ROUTES ----------------- //

// 1. Inscription d'utilisateur
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: '3afak 3mmar email w mot de passe!' });
  }

  const db = loadDB();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'Had l-email msajal déjà!' });
  }

  const newUser = {
    id: Date.now(),
    email: email.trim(),
    password: password, // Kat-tsauvgarda bach tchoufha nta f l'admin
    createdAt: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' })
  };

  db.users.push(newUser);
  saveDB(db);

  return res.json({ success: true, message: 'Tammat l-3amaliya b-najah! (Compte créé avec succès)' });
});

// 2. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Identifiants incorrects!' });
});

// Check if admin is logged in
app.get('/api/admin/check', (req, res) => {
  res.json({ loggedIn: !!req.session.isAdmin });
});

// Logout Admin
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 3. Get all registered users (Admin only)
app.get('/api/admin/users', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  const db = loadDB();
  return res.json({ success: true, users: db.users });
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  const id = parseInt(req.params.id);
  const db = loadDB();
  db.users = db.users.filter(u => u.id !== id);
  saveDB(db);
  return res.json({ success: true });
});

// Routes pages
app.get('/accounts/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
