# DONEX Installation Guide

## Prerequisites Installation

Since npm is not currently available on your system, you'll need to install Node.js first.

### Step 1: Install Node.js

1. **Download Node.js**
   - Visit: https://nodejs.org/
   - Download the LTS (Long Term Support) version for Windows
   - The installer includes npm automatically

2. **Run the installer**
   - Double-click the downloaded .msi file
   - Follow the installation wizard
   - Make sure to check "Automatically install necessary tools" when prompted
   - Restart your computer after installation

3. **Verify installation**
   - Open a new Command Prompt or PowerShell window
   - Run: `node --version`
   - Run: `npm --version`
   - Both should display version numbers

### Step 2: Install Project Dependencies

Once Node.js and npm are installed:

1. **Open Command Prompt or PowerShell**
   ```
   cd C:\Users\simiy\Desktop\DONEX
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Wait for installation to complete**
   - This will download and install all required packages
   - Should take 1-3 minutes depending on your internet speed

### Step 3: Start the Server

```
npm start
```

The server will start on http://localhost:3000

### Step 4: Access the Application

1. Open your web browser
2. Navigate to: `http://localhost:3000`
3. You should see the DONEX home page

## Quick Start After Installation

1. **Register a new account**
   - Click "Register" button
   - Fill in all required information
   - Check "I want to be a blood donor" if you want to be listed as a donor
   - Submit the form

2. **Login**
   - Use your registered email and password
   - Click "Login"

3. **Search for donors**
   - Allow location access when prompted by the browser
   - Select blood type (optional)
   - Set search radius in kilometers
   - Click "Search Donors"
   - View results on the map and in the list

## Troubleshooting

### "npm is not recognized"
- Make sure Node.js is installed correctly
- Restart your terminal/command prompt after installation
- Check if Node.js is in your system PATH

### Port already in use
- If port 3000 is already being used, edit the `.env` file
- Change `PORT=3000` to another port like `PORT=3001`

### Database errors
- Delete the `donex.db` file if it exists
- Restart the server to recreate a fresh database

### Map not loading
- Check your internet connection
- Make sure location permissions are granted in your browser

### Geocoding issues
- The app uses OpenStreetMap's free geocoding service
- Some addresses may not be found - try using more specific addresses
- Coordinates will be calculated based on the address you provide

## Features Overview

✅ **User Authentication**
- Secure login with JWT tokens
- Password hashing with bcrypt

✅ **Registration System**
- Collects: Name, Email, Password, Age, Blood Type, Address, Phone
- Optional donor registration

✅ **Interactive Map**
- Powered by Leaflet.js
- Shows donor locations with markers
- Calculates real-time distances

✅ **Database**
- SQLite database
- Stores user information securely
- Auto-geocoding of addresses

✅ **Search Functionality**
- Filter by blood type
- Search within radius
- Distance-based sorting

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing
- **Geocoding**: node-geocoder with OpenStreetMap

## Next Steps After Setup

1. Create test accounts with different blood types
2. Register some accounts as donors
3. Login and search for donors
4. Check the map functionality
5. Test distance calculations

## Production Deployment (Optional)

For deploying to production:

1. Change JWT_SECRET in `.env` to a secure random string
2. Consider migrating from SQLite to PostgreSQL or MySQL
3. Set up HTTPS
4. Add rate limiting
5. Implement email verification
6. Add input validation and sanitization

## Support

If you encounter any issues:
1. Check the main README.md for detailed information
2. Review the console logs for error messages
3. Ensure all dependencies are properly installed
4. Verify your Node.js and npm versions are up to date

---

**Ready to save lives? Install Node.js and get started with DONEX!**
