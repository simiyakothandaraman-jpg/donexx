const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = new sqlite3.Database('./donex.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to SQLite database');
});

// Initialize database tables
function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            age INTEGER NOT NULL,
            bloodType TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL,
            isDonor BOOLEAN DEFAULT 0,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');
            populateTestDonors(); // Call population function after table is created
        }
    });
}

// Test donor data with Indian locations
const testDonors = [
    {
        name: "Rajesh Kumar",
        email: "rajesh@gmail.com",
        password: "password123",
        age: 28,
        bloodType: "O+",
        address: "Mumbai, Maharashtra, India",
        phone: "+91-9876543210",
        latitude: 19.0760,
        longitude: 72.8777
    },
    {
        name: "Priya Sharma",
        email: "priya@gmail.com",
        password: "password123",
        age: 25,
        bloodType: "A+",
        address: "Delhi, India",
        phone: "+91-9876543211",
        latitude: 28.7041,
        longitude: 77.1025
    },
    {
        name: "Amit Patel",
        email: "amit@gmail.com",
        password: "password123",
        age: 32,
        bloodType: "B+",
        address: "Ahmedabad, Gujarat, India",
        phone: "+91-9876543212",
        latitude: 23.0225,
        longitude: 72.5714
    },
    {
        name: "Kavita Singh",
        email: "kavita@gmail.com",
        password: "password123",
        age: 29,
        bloodType: "AB+",
        address: "Kolkata, West Bengal, India",
        phone: "+91-9876543213",
        latitude: 22.5726,
        longitude: 88.3639
    },
    {
        name: "Suresh Reddy",
        email: "suresh@gmail.com",
        password: "password123",
        age: 35,
        bloodType: "O-",
        address: "Hyderabad, Telangana, India",
        phone: "+91-9876543214",
        latitude: 17.3850,
        longitude: 78.4867
    },
    {
        name: "Meera Joshi",
        email: "meera@gmail.com",
        password: "password123",
        age: 30,
        bloodType: "A-",
        address: "Pune, Maharashtra, India",
        phone: "+91-9876543215",
        latitude: 18.5204,
        longitude: 73.8567
    }
];

async function populateTestDonors() {
    try {
        for (const donor of testDonors) {
            // Hash password
            const hashedPassword = await bcrypt.hash(donor.password, 10);

            // Insert donor
            db.run(`
                INSERT INTO users (name, email, password, age, bloodType, address, phone, isDonor, latitude, longitude, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
            `, [donor.name, donor.email, hashedPassword, donor.age, donor.bloodType, donor.address, donor.phone, donor.latitude, donor.longitude], function(err) {
                if (err) {
                    console.error('Error inserting donor:', donor.name, err);
                } else {
                    console.log('✅ Added donor:', donor.name, '(', donor.bloodType, ')');
                }
            });
        }

        console.log('\n🎉 All test donors added successfully!');
        console.log('Available blood types in test data: O+, A+, B+, AB+, O-, A-');
        console.log('\nTest login credentials:');
        testDonors.forEach(donor => {
            console.log(`Email: ${donor.email}, Password: ${donor.password}`);
        });

        // Close database after a short delay to allow all inserts to complete
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('\nDatabase connection closed.');
                }
            });
        }, 1000);

    } catch (error) {
        console.error('Error populating test donors:', error);
        db.close();
    }
}

console.log('🚀 Initializing database and populating with test donors...');
initDatabase();
