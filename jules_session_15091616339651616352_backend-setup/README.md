# DSO Project Backend (Node.js + Express + SQLite)

## Overview
This backend replaces the original Google Apps Script backend for the DSO Project. It provides RESTful API endpoints for user management, Delivery Order (DO) management, and notifications.

**Note:** This project has been modified to use SQLite instead of MySQL for easier local development and testing.

## Setup
1. Copy `.env.example` to `.env`. You can leave the database credentials as they are not used with SQLite.
2. Install dependencies:
   ```
   npm install
   ```
3. Initialize the database:
   ```
   npm run init-db
   ```
4. Start the server:
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```

## Folder Structure
- `index.js` - Main entry point
- `db.js` - SQLite connection wrapper (mimics MySQL interface)
- `routes/` - Express route definitions
- `controllers/` - Route handler logic
- `init_db.js` - Script to initialize the SQLite database

## API Endpoints
- `/api/users` - User management
- `/api/dos` - Delivery Order management
- `/api/notifications` - Notification endpoints

## Database
The database is stored in `/tmp/dso.sqlite` to avoid permission issues in some environments. The schema is initialized by `init_db.js`.
