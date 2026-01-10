/**
 * Geocoding Utilities
 * Converts addresses to latitude/longitude coordinates using multiple providers
 */
const axios = require('axios');

// Configuration constants
const GEOCODING_TIMEOUT_MS = 10000; // 10 second timeout for geocoding API calls
const MIN_ADDRESS_PARTS = 2; // Minimum address components needed (typically city and state)
const RETRY_DELAY_MS = 1000; // Delay between retries to respect rate limits
const PROVIDER_SWITCH_DELAY_MS = 500; // Delay between trying different providers
const GOOGLE_MAPS_API_KEY_MIN_LENGTH = 30; // Minimum valid length for Google Maps API key
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

/**
 * Geocode using Nominatim (OpenStreetMap) - Free but rate limited
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function geocodeWithNominatim(address) {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'CRMImobil/1.0 (Real Estate CRM)'
            },
            timeout: GEOCODING_TIMEOUT_MS
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
        
        return null;
    } catch (error) {
        // Don't log as error if it's a timeout or network issue - these are common
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            console.warn('⚠️ Nominatim unavailable (network issue):', error.message);
        } else {
            console.warn('⚠️ Nominatim geocoding failed:', error.message);
        }
        return null;
    }
}

/**
 * Geocode using Google Maps Geocoding API (requires API key)
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function geocodeWithGoogle(address) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Validate API key format and minimum length
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < GOOGLE_MAPS_API_KEY_MIN_LENGTH) {
        return null; // Skip if no valid API key configured
    }
    
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: apiKey,
                region: 'br' // Bias results to Brazil
            },
            timeout: GEOCODING_TIMEOUT_MS
        });

        if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        
        return null;
    } catch (error) {
        console.warn('⚠️ Google Maps geocoding failed:', error.message);
        return null;
    }
}

/**
 * Geocode using Photon (OpenStreetMap-based, often more reliable than Nominatim)
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function geocodeWithPhoton(address) {
    try {
        const response = await axios.get('https://photon.komoot.io/api/', {
            params: {
                q: address,
                limit: 1,
                lang: 'pt'
            },
            timeout: GEOCODING_TIMEOUT_MS
        });

        if (response.data && response.data.features && response.data.features.length > 0) {
            const coords = response.data.features[0].geometry.coordinates;
            // Photon returns [lng, lat] - reverse it
            return { lat: coords[1], lng: coords[0] };
        }
        
        return null;
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            console.warn('⚠️ Photon unavailable (network issue):', error.message);
        } else {
            console.warn('⚠️ Photon geocoding failed:', error.message);
        }
        return null;
    }
}

/**
 * Geocode an address to get latitude and longitude coordinates
 * Tries multiple geocoding providers for maximum reliability
 * @param {string} address - The full address to geocode
 * @returns {Promise<{lat: number, lng: number}|null>} - Coordinates or null if geocoding fails
 */
async function geocodeAddress(address) {
    if (!address || typeof address !== 'string' || address.trim() === '') {
        return null;
    }

    // Try multiple geocoding providers in order of preference
    const providers = [
        { name: 'Photon', fn: geocodeWithPhoton },
        { name: 'Nominatim', fn: geocodeWithNominatim },
        { name: 'Google Maps', fn: geocodeWithGoogle }
    ];
    
    for (const provider of providers) {
        try {
            const coords = await provider.fn(address);
            
            if (coords && isValidCoordinateRange(coords.lat, coords.lng)) {
                console.log(`✅ Geocoding successful with ${provider.name}:`, address, '→', coords);
                return coords;
            }
        } catch (error) {
            console.warn(`⚠️ ${provider.name} geocoding error:`, error.message);
        }
        
        // Small delay between provider attempts
        await new Promise(resolve => setTimeout(resolve, PROVIDER_SWITCH_DELAY_MS));
    }
    
    console.warn('⚠️ All geocoding providers failed for address:', address);
    return null;
}

/**
 * Build a full address from property data components
 * @param {Object} propertyData - Property data containing address fields
 * @returns {string|null} - Full address string or null if insufficient data
 */
function buildAddressFromPropertyData(propertyData) {
    const addressParts = [
        propertyData.street,
        propertyData.neighborhood,
        propertyData.city,
        propertyData.state,
        'Brasil'
    ].filter(part => part && typeof part === 'string' && part.trim() !== '');

    // Need at least city and state to geocode (MIN_ADDRESS_PARTS components)
    if (addressParts.length < MIN_ADDRESS_PARTS) {
        return null;
    }

    return addressParts.join(', ');
}

/**
 * Check if coordinates are valid (not null, not undefined, not NaN)
 * @param {number|null|undefined} lat - Latitude value
 * @param {number|null|undefined} lng - Longitude value
 * @returns {boolean} - True if coordinates are valid
 */
function hasValidCoordinates(lat, lng) {
    return lat !== null && 
           lat !== undefined && 
           lng !== null && 
           lng !== undefined && 
           typeof lat === 'number' && 
           typeof lng === 'number' &&
           !isNaN(lat) && 
           !isNaN(lng);
}

/**
 * Try multiple geocoding strategies with fallback
 * This improves geocoding success rate by trying progressively less specific addresses
 * @param {Object} propertyData - Property data containing address fields
 * @returns {Promise<{lat: number, lng: number}|null>} - Coordinates or null if all strategies fail
 */
async function geocodeWithFallback(propertyData) {
    const strategies = [];
    
    // Strategy 1: Full address (street, neighborhood, city, state, Brasil)
    if (propertyData.street || propertyData.neighborhood || propertyData.city) {
        const fullAddress = [
            propertyData.street,
            propertyData.neighborhood,
            propertyData.city,
            propertyData.state,
            'Brasil'
        ].filter(part => part && typeof part === 'string' && part.trim() !== '').join(', ');
        
        if (fullAddress) {
            strategies.push({ name: 'Full address', address: fullAddress });
        }
    }
    
    // Strategy 2: Postal Code only (CEP is precise in Brazil and shouldn't be mixed with city/state)
    if (propertyData.zipCode) {
        const zipAddress = `${propertyData.zipCode}, Brasil`;
        strategies.push({ name: 'Postal code', address: zipAddress });
    }
    
    // Strategy 3: Without street (neighborhood, city, state, Brasil) 
    if (propertyData.neighborhood && propertyData.city) {
        const noStreetAddress = [
            propertyData.neighborhood,
            propertyData.city,
            propertyData.state,
            'Brasil'
        ].filter(part => part && typeof part === 'string' && part.trim() !== '').join(', ');
        
        if (noStreetAddress) {
            strategies.push({ name: 'Without street', address: noStreetAddress });
        }
    }
    
    // Strategy 4: City + State only (fallback to city center)
    if (propertyData.city && propertyData.state) {
        const cityAddress = `${propertyData.city}, ${propertyData.state}, Brasil`;
        strategies.push({ name: 'City only', address: cityAddress });
    }
    
    // Try each strategy in order until one succeeds
    for (const strategy of strategies) {
        console.log(`🗺️ Trying geocoding strategy: ${strategy.name} - ${strategy.address}`);
        
        const coords = await geocodeAddress(strategy.address);
        
        if (coords) {
            console.log(`✅ Geocoding succeeded with strategy: ${strategy.name}`);
            return coords;
        }
        
        // Add a small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
    
    console.warn('❌ All geocoding strategies failed for property');
    return null;
}

/**
 * Validate that coordinates are within valid geographic bounds
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} - True if coordinates are within valid bounds
 */
function isValidCoordinateRange(lat, lng) {
    // First check that values are numbers and not NaN
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        return false;
    }
    // Then check bounds
    return lat >= MIN_LATITUDE && lat <= MAX_LATITUDE && lng >= MIN_LONGITUDE && lng <= MAX_LONGITUDE;
}

/**
 * Automatically geocode property data if it doesn't have valid coordinates
 * @param {Object} propertyData - Property data to geocode
 * @returns {Promise<Object>} - Property data with coordinates (if geocoding succeeded)
 */
async function autoGeocodePropertyData(propertyData) {
    // Check if property already has valid coordinates
    if (hasValidCoordinates(propertyData.latitude, propertyData.longitude)) {
        console.log('Property already has valid coordinates, skipping geocoding');
        return propertyData;
    }

    console.log('🗺️ Starting auto-geocoding for property...');
    
    // Try geocoding with fallback strategies
    const coords = await geocodeWithFallback(propertyData);
    
    if (coords) {
        // Validate coordinate bounds
        if (!isValidCoordinateRange(coords.lat, coords.lng)) {
            console.warn('⚠️ Geocoding returned invalid coordinates (out of bounds):', coords);
            return propertyData;
        }
        
        console.log('✅ Auto-geocoding successful:', coords);
        return {
            ...propertyData,
            latitude: coords.lat,
            longitude: coords.lng
        };
    } else {
        console.warn('⚠️ Auto-geocoding failed - property will be saved without coordinates');
        return propertyData;
    }
}

module.exports = {
    geocodeAddress,
    geocodeWithNominatim,
    geocodeWithGoogle,
    geocodeWithPhoton,
    geocodeWithFallback,
    buildAddressFromPropertyData,
    hasValidCoordinates,
    isValidCoordinateRange,
    autoGeocodePropertyData
};
