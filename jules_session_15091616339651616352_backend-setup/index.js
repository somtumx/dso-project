require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('DSO Backend API is running');
});

// Import routes
const userRoutes = require('./routes/users');
const doRoutes = require('./routes/dos');
const notificationRoutes = require('./routes/notifications');

app.use('/api/users', userRoutes);
app.use('/api/dos', doRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
