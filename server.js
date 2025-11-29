<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS configuration for allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // For development on different ports
      'http://127.0.0.1:3001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// Custom MapTiler Geocoder
const geocoder = {
    geocode: async (address) => {
        const apiKey = process.env.MAPTILER_API_KEY;
        if (!apiKey) {
            throw new Error('MapTiler API key not configured');
        }

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://api.maptiler.com/geocoding/${encodedAddress}.json?key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`MapTiler API error: ${response.status}`);
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                return [{
                    latitude: feature.center[1],
                    longitude: feature.center[0],
                    formattedAddress: feature.place_name,
                    country: feature.context?.find(c => c.id.startsWith('country'))?.text,
                    city: feature.context?.find(c => c.id.startsWith('place'))?.text || feature.context?.find(c => c.id.startsWith('region'))?.text,
                    state: feature.context?.find(c => c.id.startsWith('region'))?.text,
                    zipcode: feature.context?.find(c => c.id.startsWith('postcode'))?.text
                }];
            }

            return [];
        } catch (error) {
            console.error('MapTiler geocoding error:', error);
            throw error;
        }
    }
};

// Database setup
const db = new sqlite3.Database('./donex.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
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
        }
    });
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, age, bloodType, address, phone, isDonor } = req.body;
        
        // Validate input
        if (!name || !email || !password || !age || !bloodType || !address || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            
            // Geocode address to get coordinates
            let latitude = null;
            let longitude = null;
            
            try {
                const geoResult = await geocoder.geocode(address);
                if (geoResult && geoResult.length > 0) {
                    latitude = geoResult[0].latitude;
                    longitude = geoResult[0].longitude;
                }
            } catch (geoError) {
                console.error('Geocoding error:', geoError);
                // Continue without coordinates
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user
            db.run(
                `INSERT INTO users (name, email, password, age, bloodType, address, phone, isDonor, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, hashedPassword, age, bloodType, address, phone, isDonor ? 1 : 0, latitude, longitude],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error creating user' });
                    }
                    
                    res.status(201).json({ 
                        message: 'User registered successfully',
                        userId: this.lastID
                    });
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            
            // Compare password
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Send response (exclude password)
            const { password: _, ...userWithoutPassword } = user;
            
            res.json({
                message: 'Login successful',
                token,
                user: userWithoutPassword
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search donors route
app.post('/api/donors', authenticateToken, (req, res) => {
    try {
        const { bloodType, latitude, longitude, radius } = req.body;

        let query = 'SELECT id, name, bloodType, address, phone, age, latitude, longitude FROM users WHERE isDonor = 1';
        let params = [];

        if (bloodType) {
            query += ' AND bloodType = ?';
            params.push(bloodType);
        }

        db.all(query, params, (err, donors) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            let filteredDonors = donors.filter(donor => donor.latitude && donor.longitude);

            // If location is provided, filter by radius and calculate distance
            if (latitude && longitude) {
                filteredDonors = filteredDonors
                    .map(donor => {
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            donor.latitude,
                            donor.longitude
                        );
                        return { ...donor, distance };
                    })
                    .filter(donor => !radius || donor.distance <= radius)
                    .sort((a, b) => a.distance - b.distance);
            }

            res.json({ donors: filteredDonors });
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Config route to serve client-side config
app.get('/api/config', (req, res) => {
    res.json({
        mapTilerKey: process.env.MAPTILER_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`DONEX server running on http://localhost:${PORT}`);
    console.log('Make sure to set JWT_SECRET in .env file for production');
});
=======
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS configuration for allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // For development on different ports
      'http://127.0.0.1:3001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// Custom MapTiler Geocoder
const geocoder = {
    geocode: async (address) => {
        const apiKey = process.env.MAPTILER_API_KEY;
        if (!apiKey) {
            throw new Error('MapTiler API key not configured');
        }

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://api.maptiler.com/geocoding/${encodedAddress}.json?key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`MapTiler API error: ${response.status}`);
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                return [{
                    latitude: feature.center[1],
                    longitude: feature.center[0],
                    formattedAddress: feature.place_name,
                    country: feature.context?.find(c => c.id.startsWith('country'))?.text,
                    city: feature.context?.find(c => c.id.startsWith('place'))?.text || feature.context?.find(c => c.id.startsWith('region'))?.text,
                    state: feature.context?.find(c => c.id.startsWith('region'))?.text,
                    zipcode: feature.context?.find(c => c.id.startsWith('postcode'))?.text
                }];
            }

            return [];
        } catch (error) {
            console.error('MapTiler geocoding error:', error);
            throw error;
        }
    }
};

// Database setup
const db = new sqlite3.Database('./donex.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
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
        }
    });
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, age, bloodType, address, phone, isDonor } = req.body;
        
        // Validate input
        if (!name || !email || !password || !age || !bloodType || !address || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            
            // Geocode address to get coordinates
            let latitude = null;
            let longitude = null;
            
            try {
                const geoResult = await geocoder.geocode(address);
                if (geoResult && geoResult.length > 0) {
                    latitude = geoResult[0].latitude;
                    longitude = geoResult[0].longitude;
                }
            } catch (geoError) {
                console.error('Geocoding error:', geoError);
                // Continue without coordinates
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user
            db.run(
                `INSERT INTO users (name, email, password, age, bloodType, address, phone, isDonor, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, hashedPassword, age, bloodType, address, phone, isDonor ? 1 : 0, latitude, longitude],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error creating user' });
                    }
                    
                    res.status(201).json({ 
                        message: 'User registered successfully',
                        userId: this.lastID
                    });
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            
            // Compare password
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Send response (exclude password)
            const { password: _, ...userWithoutPassword } = user;
            
            res.json({
                message: 'Login successful',
                token,
                user: userWithoutPassword
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search donors route
app.post('/api/donors', authenticateToken, (req, res) => {
    try {
        const { bloodType, latitude, longitude, radius } = req.body;

        let query = 'SELECT id, name, bloodType, address, phone, age, latitude, longitude FROM users WHERE isDonor = 1';
        let params = [];

        if (bloodType) {
            query += ' AND bloodType = ?';
            params.push(bloodType);
        }

        db.all(query, params, (err, donors) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            let filteredDonors = donors.filter(donor => donor.latitude && donor.longitude);

            // If location is provided, filter by radius and calculate distance
            if (latitude && longitude) {
                filteredDonors = filteredDonors
                    .map(donor => {
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            donor.latitude,
                            donor.longitude
                        );
                        return { ...donor, distance };
                    })
                    .filter(donor => !radius || donor.distance <= radius)
                    .sort((a, b) => a.distance - b.distance);
            }

            res.json({ donors: filteredDonors });
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Config route to serve client-side config
app.get('/api/config', (req, res) => {
    res.json({
        mapTilerKey: process.env.MAPTILER_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`DONEX server running on http://localhost:${PORT}`);
    console.log('Make sure to set JWT_SECRET in .env file for production');
});
>>>>>>> 02cae10ea05db6cd60c7ac1cdf0c8cba11f69f9c
