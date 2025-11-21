const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, display_name, role FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { email, password, display_name, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }
  try {
    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)', [email, hash, display_name || '', role]);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dso_secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { display_name, role, password } = req.body;
  try {
    let updateFields = [];
    let params = [];
    if (display_name) {
      updateFields.push('display_name = ?');
      params.push(display_name);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      params.push(hash);
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }
    params.push(id);
    await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'User updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
