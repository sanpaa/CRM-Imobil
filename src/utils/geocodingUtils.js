/**
 * Geocoding Utilities
 * Converts addresses to latitude/longitude coordinates using Nominatim (OpenStreetMap)
 */
const axios = require('axios');

// Configuration constants
const GEOCODING_TIMEOUT_MS = 5000; // 5 second timeout for geocoding API calls
const MIN_ADDRESS_PARTS = 2; // Minimum address components needed (typically city and state)

/**
 * Geocode an address to get latitude and longitude coordinates
 * @param {string} address - The full address to geocode
 * @returns {Promise<{lat: number, lng: number}|null>} - Coordinates or null if geocoding fails
 */
async function geocodeAddress(address) {
    if (!address || typeof address !== 'string' || address.trim() === '') {
        return null;
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'CRMImobil/1.0'
            },
            timeout: GEOCODING_TIMEOUT_MS
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            // Validate that we got valid numbers
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
        
        return null;
    } catch (error) {
        console.warn('Geocoding failed for address:', address, '- Error:', error.message);
        return null;
    }
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
 * Automatically geocode property data if it doesn't have valid coordinates
 * @param {Object} propertyData - Property data to geocode
 * @returns {Promise<Object>} - Property data with coordinates (if geocoding succeeded)
 */
async function autoGeocodePropertyData(propertyData) {
    // Check if property already has valid coordinates
    if (hasValidCoordinates(propertyData.latitude, propertyData.longitude)) {
        return propertyData;
    }

    // Build address from property data
    const address = buildAddressFromPropertyData(propertyData);
    if (!address) {
        console.log('Insufficient address data for geocoding property');
        return propertyData;
    }

    console.log('Auto-geocoding address:', address);
    
    // Attempt to geocode
    const coords = await geocodeAddress(address);
    
    if (coords) {
        console.log('Auto-geocoding successful:', coords);
        return {
            ...propertyData,
            latitude: coords.lat,
            longitude: coords.lng
        };
    } else {
        console.log('Auto-geocoding failed for address:', address);
        return propertyData;
    }
}

module.exports = {
    geocodeAddress,
    buildAddressFromPropertyData,
    hasValidCoordinates,
    autoGeocodePropertyData
};
