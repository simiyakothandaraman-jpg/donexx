const geocoder = {
    geocode: async (address) => {
        const apiKey = 'UHesglEoml2Ez853kX6w';

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://api.maptiler.com/geocoding/${encodedAddress}.json?key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`MapTiler API error: ${response.status} - ${response.statusText}`);
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                return [{
                    latitude: feature.center[1],
                    longitude: feature.center[0],
                    formattedAddress: feature.place_name
                }];
            }

            return [];
        } catch (error) {
            console.error('MapTiler geocoding error:', error);
            throw error;
        }
    }
};

// Test geocoding
(async () => {
    try {
        console.log('Testing MapTiler geocoding with new API key...');
        const result = await geocoder.geocode('Mumbai, India');
        console.log('✅ Geocoding result:', result);
        console.log('✅ MapTiler geocoding is working!');
    } catch (error) {
        console.error('❌ Geocoding test failed:', error.message);
    }
})();
