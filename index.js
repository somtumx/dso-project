require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const userRoutes = require('./routes/users');
const doRoutes = require('./routes/dos');
const notificationRoutes = require('./routes/notifications');
const utilRoutes = require('./routes/utils');

app.use('/api/users', userRoutes);
app.use('/api/dos', doRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/utils', utilRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
