const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Use a temp directory for database to avoid permission issues if any
const dbPath = path.join(os.tmpdir(), 'dso.sqlite');
const db = new sqlite3.Database(dbPath);

// Wrap to mimic mysql2 promise pool
const pool = {
  query: async (sql, params) => {
    const trimmedSql = sql.trim().toUpperCase();
    
    if (trimmedSql.startsWith('SELECT')) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows, []]);
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else {
             const result = {
                affectedRows: this.changes,
                insertId: this.lastID,
                warningStatus: 0
             };
             resolve([result, undefined]);
          }
        });
      });
    }
  },
  end: () => {
    db.close();
  }
};

module.exports = pool;
