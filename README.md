# DONEX - Blood Donor Network

DONEX is a comprehensive web application that connects blood donors with those in need. The platform features an interactive map to show the distance between donors and receivers, user authentication, and a database to manage blood donor information.

## Features

- **User Authentication**: Secure login and registration system
- **Blood Type Management**: Collect and store blood type, age, and address information
- **Interactive Map**: Leaflet-powered map showing donor locations and distances
- **Distance Calculation**: Real-time distance calculation between donors and receivers
- **Search Functionality**: Find donors by blood type and location radius
- **Responsive Design**: Works on desktop and mobile devices
- **SQLite Database**: Lightweight database for storing user and donor information

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript
- **Leaflet.js with OpenStreetMap** for interactive maps (no Google Maps API required)
- Responsive design with modern CSS

### Backend
- Node.js with Express.js
- SQLite3 database
- JWT for authentication
- bcryptjs for password hashing
- MapTiler geocoding API for address to coordinates conversion

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Navigate to the project directory**
   ```bash
   cd DONEX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - The `.env` file is already created with default values
   - For production, change the JWT_SECRET in `.env` file

4. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to: `http://localhost:3000`

## Usage

### For Blood Recipients

1. **Register an account**
   - Click "Register" on the home page
   - Fill in your details (name, email, password, age, blood type, address, phone)
   - You can optionally check "I want to be a blood donor" if you also want to donate

2. **Login**
   - Use your email and password to login

3. **Find Donors**
   - After logging in, you'll be redirected to the dashboard
   - Allow location access when prompted
   - Select the blood type needed (or leave blank for all types)
   - Set the search radius in kilometers
   - Click "Search Donors"
   - View donors on the map and in the list with distances

### For Blood Donors

1. **Register as a donor**
   - During registration, check the "I want to be a blood donor" checkbox
   - Your location will be calculated from your address

2. **Your profile will be searchable**
   - Other users can find you when searching for donors
   - Your contact information (phone) will be visible to help recipients reach you

## Database Schema

### Users Table
- `id`: Unique identifier
- `name`: User's full name
- `email`: User's email (unique)
- `password`: Hashed password
- `age`: User's age
- `bloodType`: Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `address`: Full address
- `phone`: Contact phone number
- `isDonor`: Boolean indicating if user is a donor
- `latitude`: Geographic latitude (auto-calculated from address)
- `longitude`: Geographic longitude (auto-calculated from address)
- `created_at`: Account creation timestamp

## API Endpoints

### POST /api/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "age": 25,
  "bloodType": "O+",
  "address": "123 Main St, City, State",
  "phone": "1234567890",
  "isDonor": true
}
```

### POST /api/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/donors
Search for donors (requires authentication)
```json
{
  "bloodType": "O+",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 10
}
```

## Security Features

- Passwords are hashed using bcryptjs before storage
- JWT tokens for secure authentication
- Protected API routes requiring valid tokens
- CORS configured for specific allowed origins
- Environment variables for sensitive configuration

## CORS Configuration

The application has CORS (Cross-Origin Resource Sharing) configured to allow requests from specific origins:

**Allowed Origins:**
- `http://localhost:3000` (main application)
- `http://127.0.0.1:3000` (alternative localhost)
- `http://localhost:3001` (development on different ports)
- `http://127.0.0.1:3001` (alternative localhost)

**For Production:** Update the `allowedOrigins` array in `server.js` with your production domain(s).

**For Development:** If you run the app on a different port, add it to the `allowedOrigins` array.

## Project Structure

```
DONEX/
├── index.html          # Home page
├── login.html          # Login page
├── register.html       # Registration page
├── dashboard.html      # Donor search page with map
├── styles.css          # Main stylesheet
├── script.js           # Home page scripts
├── auth.js            # Authentication scripts
├── dashboard.js       # Dashboard and map functionality
├── server.js          # Express.js backend server
├── package.json       # Node.js dependencies
├── .env              # Environment configuration
├── donex.db          # SQLite database (created automatically)
└── README.md         # This file
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Notes

- The application uses MapTiler Cloud for geocoding addresses and map tiles
- Location permissions must be granted in the browser for the map to center on your location
- The database file `donex.db` is created automatically on first run
- For production deployment, make sure to:
  - Change the JWT_SECRET in the `.env` file
  - Use a proper database system (PostgreSQL, MySQL, etc.) instead of SQLite
  - Implement HTTPS
  - Add rate limiting and other security measures

## Troubleshooting

**Issue**: Cannot connect to server
- **Solution**: Make sure the server is running with `npm start`

**Issue**: Database error
- **Solution**: Delete `donex.db` file and restart the server to recreate the database

**Issue**: Geocoding not working
- **Solution**: Check your internet connection and MapTiler API key configuration. The app uses MapTiler's geocoding service

**Issue**: Map not loading
- **Solution**: Check browser console for errors and ensure you have an internet connection

**Issue**: MapTiler API errors
- **Solution**: Verify your MAPTILER_API_KEY in the `.env` file is correct and has geocoding permissions

## License

ISC

## Support
