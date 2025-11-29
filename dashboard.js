const API_URL = 'http://localhost:3000/api';
let map;
let markers = [];
let userLocation = null;
let userMarker = null;
let mapTilerKey = null;

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }

    // Display user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${user.name}`;
    }

    // Fetch config
    try {
        const configResponse = await fetch(`${API_URL}/config`);
        const config = await configResponse.json();
        mapTilerKey = config.mapTilerKey;
    } catch (error) {
        console.error('Failed to fetch config:', error);
        // Fallback to OSM if config fails
    }

    // Initialize map
    initMap();

    // Get user's location
    getUserLocation();

    // Load all donors initially
    loadAllDonors();

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchDonors);
    }
});

// Initialize Leaflet Map with MapTiler or OpenStreetMap fallback
function initMap() {
    // Default center on India
    const defaultCenter = [20.5937, 78.9629];

    map = L.map('map').setView(defaultCenter, 5);

    // Use MapTiler if key available, else OpenStreetMap
    if (mapTilerKey) {
        L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${mapTilerKey}`, {
            attribution: '© <a href="https://www.maptiler.com/copyright">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);
    } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);
    }

    // Add zoom control (enabled by default)
    // Add fullscreen control
    map.addControl(L.control.fullscreen());
}

// Update location status indicator
function updateLocationStatus(icon, text, show = true) {
    const statusDiv = document.getElementById('locationStatus');
    const iconSpan = document.getElementById('locationIcon');
    const textSpan = document.getElementById('locationText');

    if (iconSpan && textSpan) {
        iconSpan.textContent = icon;
        textSpan.textContent = text;
    }

    if (statusDiv) {
        statusDiv.style.display = show ? 'block' : 'none';
    }
}

// Get user's current location
function getUserLocation() {
    updateLocationStatus('⏳', 'Getting your location...', true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Center map on user location
                map.setView([userLocation.lat, userLocation.lng], 13);

                // Remove existing user marker
                if (userMarker) {
                    map.removeLayer(userMarker);
                }

                // Add user marker
                userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map).bindPopup('Your Location').openPopup();

                // Update status
                updateLocationStatus('✅', 'Location found! You can now search for donors.', true);

                // Hide location warning if it exists
                hideLocationWarning();

                // Hide status after 3 seconds
                setTimeout(() => {
                    updateLocationStatus('', '', false);
                }, 3000);
            },
            (error) => {
                console.error('Error getting location:', error);
                updateLocationStatus('❌', 'Location access denied or unavailable', true);
                handleLocationError(error);
            }
        );
    } else {
        updateLocationStatus('❌', 'Geolocation is not supported by this browser', true);
        showLocationWarning('Geolocation is not supported by this browser');
    }
}

// Handle different types of location errors
function handleLocationError(error) {
    let message = 'Unable to access your location. ';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Location access denied. Please allow location access in your browser and refresh the page.';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
        default:
            message += 'An unknown error occurred.';
    }
    showLocationWarning(message);
}

// Show location warning to user
function showLocationWarning(message) {
    let warningDiv = document.getElementById('locationWarning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'locationWarning';
        warningDiv.className = 'location-warning';

        // Insert at the top of the dashboard
        const searchSection = document.querySelector('.search-section');
        searchSection.insertBefore(warningDiv, searchSection.firstChild);
    }
    warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-message">${message}</span>
            <button class="warning-button" onclick="tryLocationAgain()">Try Again</button>
            <button class="warning-button" onclick="useDefaultLocation()">Use Default Location</button>
        </div>
    `;
    warningDiv.style.display = 'block';
}

// Hide location warning
function hideLocationWarning() {
    const warningDiv = document.getElementById('locationWarning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

// Try to get location again
function tryLocationAgain() {
    hideLocationWarning();
    getUserLocation();
}

// Use default location (Mumbai, India as center)
function useDefaultLocation() {
    userLocation = {
        lat: 19.0760, // Mumbai coordinates
        lng: 72.8777
    };

    // Center map on default location
    map.setView([userLocation.lat, userLocation.lng], 10);

    // Remove existing user marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    // Add default location marker
    userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup('Default Location (Mumbai)').openPopup();

    showLocationWarning('Using default location (Mumbai, India). You can still search for donors, but results may not be tailored to your actual location.');
}

// Enhanced search function with better error handling
async function searchDonors() {
    const bloodType = document.getElementById('searchBloodType').value;
    const radius = document.getElementById('searchRadius').value;
    const token = localStorage.getItem('token');

    // Check if we have location (either from GPS or default)
    if (!userLocation) {
        showLocationWarning('Please allow location access or use the default location to search for donors.');
        return;
    }

    // Show loading state
    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.textContent;
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/donors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bloodType: bloodType || undefined,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                radius: parseFloat(radius) || 10
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayDonors(data.donors);
        } else {
            alert(data.message || 'Failed to fetch donors');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Error connecting to server. Please check your internet connection.');
    } finally {
        // Reset button state
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    }
}

// Load all donors initially (without location filter)
async function loadAllDonors() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/donors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                // No location or bloodType filter for initial load
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayDonors(data.donors, false); // false = don't calculate distance
        } else {
            console.error('Failed to load donors:', data.message);
        }
    } catch (error) {
        console.error('Error loading donors:', error);
    }
}

// Calculate distance between two coordinates using Haversine formula
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

// Display donors on map and list
function displayDonors(donors, calculateDistanceFlag = true) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const donorsList = document.getElementById('donorsList');
    donorsList.innerHTML = '';

    if (donors.length === 0) {
        donorsList.innerHTML = '<p style="color: #666; text-align: center;">No donors found</p>';
        return;
    }

    const bounds = L.latLngBounds();

    donors.forEach(donor => {
        let distance = 'N/A';
        let distanceText = '';

        // Calculate distance only if user location is available and flag is true
        if (calculateDistanceFlag && userLocation) {
            distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                donor.latitude,
                donor.longitude
            ).toFixed(1);
            distanceText = `${distance} km away`;
        }

        const donorPosition = [donor.latitude, donor.longitude];

        // Add marker to map
        const marker = L.marker(donorPosition, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);

        // Create popup content
        const popupContent = `
            <div style="max-width: 200px;">
                <strong>${donor.name}</strong><br>
                Blood Type: ${donor.bloodType}<br>
                ${distance !== 'N/A' ? `Distance: ${distance} km<br>` : ''}
                Phone: ${donor.phone}
            </div>
        `;

        marker.bindPopup(popupContent);

        markers.push(marker);
        bounds.extend(donorPosition);

        // Add to list
        const donorCard = document.createElement('div');
        donorCard.className = 'donor-card';
        donorCard.innerHTML = `
            <h4>${donor.name}</h4>
            <div class="donor-info">📞 ${donor.phone}</div>
            <div class="donor-info">📍 ${donor.address}</div>
            <div class="donor-info">🎂 Age: ${donor.age}</div>
            <div>
                <span class="blood-type-badge">${donor.bloodType}</span>
                ${distanceText ? `<span class="distance-badge">${distanceText}</span>` : ''}
            </div>
        `;

        // Click card to show on map
        donorCard.addEventListener('click', () => {
            map.setView(donorPosition, 15);
            marker.openPopup();
        });

        donorsList.appendChild(donorCard);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });

        // Don't zoom in too much if there's only one marker or too many markers
        const currentZoom = map.getZoom();
        if (currentZoom > 15) {
            map.setZoom(15);
        }
    }
}
