const db = require('./db');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    console.log('Initializing database...');
    
    // Drop tables if they exist
    await db.query('DROP TABLE IF EXISTS notifications');
    await db.query('DROP TABLE IF EXISTS dos');
    await db.query('DROP TABLE IF EXISTS users');

    // Create users table
    await db.query(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created users table');

    // Create dos table
    await db.query(`
      CREATE TABLE dos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sap_do_number VARCHAR(100),
        branch VARCHAR(100),
        delivery_date DATE,
        sales_admin_remarks TEXT,
        overall_status VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created dos table');

    // Create notifications table
    await db.query(`
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INT,
        message TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Created notifications table');

    // Seed Users
    console.log('Seeding users...');
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);

    const users = [
      ['thiraporn1793@gmail.com', 'Thiraporn W.', 'Admin'],
      ['nea.neey2528@gmail.com', 'Saowanee M.', 'Sales Admin'],
      ['j.orwichaya@gmail.com', 'Korawan J.', 'Admin'],
      ['tanchalongchai@gmail.com', 'Chalongchai M.', 'Admin'],
      ['gentlejay.x@gmail.com', 'Chanon S.', 'Admin'],
      ['somtumx@gmail.com', 'น้องทิคคนหล่อ', 'Sales Admin'],
      ['nattaya.aoffish@gmail.com', 'Nattaya D.', 'Admin'],
      ['thiraporn.wut@haadthip.com', 'dispatcher test', 'Dispatcher'],
      ['korawan.jong29@gmail.com', 'korawan.jong', 'Sales Admin'],
      ['1234@haadthip.com', 'sale admin LS', 'Sales Admin'],
      ['saowanee.mon@haadthip.com', 'Saowanee M.', 'Sales Admin']
    ];

    for (const user of users) {
        await db.query('INSERT INTO users (email, display_name, role, password_hash) VALUES (?, ?, ?, ?)', 
            [user[0], user[1], user[2], hash]);
    }
    console.log(`Seeded ${users.length} users.`);

    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    db.end();
  }
}

initDb();
