const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getAllUsers = async (req, res) => {
  // Helper to match frontend expectations
  try {
    const [rows] = await db.query('SELECT id, email, display_name, role FROM users');
    const users = rows.map(r => ({
        email: r.email,
        displayName: r.display_name,
        role: r.role
    }));
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { email, password, displayName, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
  }
  try {
    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)', [email, hash, displayName || '', role]);
    res.status(201).json({ success: true, message: `Successfully created user ${email}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, display_name: user.display_name }, process.env.JWT_SECRET || 'dso_secret', { expiresIn: '1d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
    // Already authenticated by middleware
    res.json({
        success: true,
        loggedIn: true,
        user: {
            email: req.user.email,
            displayName: req.user.display_name,
            role: req.user.role
        }
    });
};

exports.updateUserProfile = async (req, res) => {
    const { displayName } = req.body;
    if (!displayName) return res.status(400).json({ success: false, message: "Display name required" });

    try {
        await db.query('UPDATE users SET display_name = ? WHERE id = ?', [displayName, req.user.id]);
        res.json({ success: true, message: "Display name updated successfully.", newDisplayName: displayName });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: "User not found" });

        const match = await bcrypt.compare(oldPassword, users[0].password_hash);
        if (!match) return res.status(401).json({ success: false, message: "Incorrect old password." });

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);

        res.json({ success: true, message: "Password changed successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.adminUpdateUser = async (req, res) => {
    const { email } = req.params;
    const { displayName, role, newPassword } = req.body;

    try {
        let updateFields = [];
        let params = [];
        if (displayName) { updateFields.push('display_name = ?'); params.push(displayName); }
        if (role) { updateFields.push('role = ?'); params.push(role); }
        if (newPassword) {
             const hash = await bcrypt.hash(newPassword, 10);
             updateFields.push('password_hash = ?');
             params.push(hash);
        }

        if (updateFields.length === 0) return res.json({ success: true, message: "No changes made." });

        params.push(email);
        await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE email = ?`, params);

        res.json({ success: true, message: `User ${email} updated successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
