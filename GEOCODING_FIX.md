# Geocoding Fix - Latitude/Longitude Resolution

## Problem Fixed

Properties were not getting latitude/longitude coordinates when created. The `/api/geocode` endpoint was returning 404 "Endereço não encontrado" (Address not found), causing all properties to have `latitude: null` and `longitude: null`.

## Root Cause

The original implementation used only **Nominatim** (OpenStreetMap) for geocoding, which had several limitations:

1. **Network accessibility**: Nominatim may be blocked or unreachable from some hosting providers (like Render)
2. **Rate limiting**: Strict rate limits (1 request/second) caused failures under load
3. **Address coverage**: May not find specific street addresses in Brazil, especially in smaller neighborhoods
4. **Single point of failure**: If Nominatim was down, geocoding completely failed

## Solution Implemented

### 1. Multiple Geocoding Providers with Automatic Failover

The system now uses **three geocoding providers** in order of preference:

#### **Primary: Photon** (photon.komoot.io)
- OpenStreetMap-based geocoding service
- Often more reliable than Nominatim
- Better availability and performance
- Free and open-source
- Portuguese language support

#### **Secondary: Nominatim** (nominatim.openstreetmap.org)
- Original OpenStreetMap geocoding
- Comprehensive global coverage
- Free but rate-limited
- Fallback if Photon fails

#### **Optional: Google Maps Geocoding API**
- Most reliable and accurate
- Requires API key (see configuration below)
- Paid service (free tier available)
- Excellent coverage for Brazil

### 2. Smart Fallback Strategies

When geocoding a property, the system tries **four address formats** in order:

1. **Full address**: "Rua Waldomiro Lyra, Jardim Aeroporto I, Itu, SP, Brasil"
2. **Postal code**: "13304-655, Itu, SP, Brasil" (often more reliable in Brazil)
3. **Without street**: "Jardim Aeroporto I, Itu, SP, Brasil"
4. **City only**: "Itu, SP, Brasil" (falls back to city center)

### 3. Enhanced Error Handling

- Network errors are handled gracefully
- Each provider failure is logged but doesn't block the process
- Properties can still be created even if geocoding fails
- Detailed logging for debugging

### 4. Performance Improvements

- Increased timeout from 5s to 10s
- Configurable retry delays
- Respects rate limits of each service

## Configuration

### Basic Setup (No Configuration Required)

The system works out-of-the-box using free providers (Photon and Nominatim). No configuration needed!

### Optional: Google Maps API (Recommended for Production)

For the highest reliability and accuracy, configure Google Maps:

1. **Get an API Key:**
   - Go to https://console.cloud.google.com/
   - Create a project or select an existing one
   - Enable "Geocoding API"
   - Create credentials (API Key)
   - Restrict the API key to "Geocoding API" only (recommended)

2. **Configure the API Key:**
   
   Add to your `.env` file:
   ```bash
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   ```

3. **Deploy to Render:**
   
   Add the environment variable in Render dashboard:
   - Go to your service settings
   - Navigate to "Environment" tab
   - Add: `GOOGLE_MAPS_API_KEY` = `your-api-key`
   - Save and redeploy

### Google Maps Pricing

- **Free tier**: 40,000 requests/month
- **Typical usage**: ~100-500 properties/month = well within free tier
- **Cost**: $0.005 per request after free tier

## How It Works

### When Creating a Property

```javascript
// PropertyService.createProperty() flow:
1. Check if property already has coordinates → Skip geocoding
2. Try geocoding with multiple strategies:
   - Strategy 1: Full address
   - Strategy 2: Postal code + city
   - Strategy 3: Without street
   - Strategy 4: City only
3. For each strategy, try providers:
   - Try Photon
   - Try Nominatim
   - Try Google Maps (if API key configured)
4. Return first successful result
5. If all fail, save property without coordinates (allows creation to proceed)
```

### API Endpoint `/api/geocode`

```javascript
// Used by frontend for manual geocoding
POST /api/geocode
Body: { "address": "Rua Waldomiro Lyra, Jardim Aeroporto I, Itu, SP, Brasil" }

Response (success): 
{ "lat": -23.2567, "lng": -47.2995 }

Response (failure):
{ "error": "Endereço não encontrado" }
```

## Testing

### Test Geocoding in Production

You can test if geocoding is working by checking the server logs:

1. Create a new property with address information
2. Check the logs for geocoding attempts:
   ```
   🗺️ Starting auto-geocoding for property...
   🗺️ Trying geocoding strategy: Full address - ...
   ✅ Geocoding successful with Photon: ... → { lat: -23.xxx, lng: -47.xxx }
   ```

### Expected Log Messages

**Success:**
```
✅ Geocoding successful with Photon: Itu, SP, Brasil → { lat: -23.xxx, lng: -47.xxx }
✅ Auto-geocoding successful: { lat: -23.xxx, lng: -47.xxx }
```

**Failure (graceful):**
```
⚠️ Photon unavailable (network issue): getaddrinfo ENOTFOUND
⚠️ Nominatim unavailable (network issue): timeout of 10000ms exceeded
❌ All geocoding strategies failed for property
⚠️ Auto-geocoding failed - property will be saved without coordinates
```

## Troubleshooting

### Properties still have null coordinates

**Possible causes:**

1. **Network/firewall issues** - Check server logs for network errors
2. **All providers blocked** - Consider configuring Google Maps API
3. **Insufficient address data** - Ensure properties have at least city and state

**Solutions:**

1. Configure Google Maps API key (most reliable)
2. Check Render logs for specific error messages
3. Ensure properties have complete address information
4. Wait a few seconds between creating properties (rate limiting)

### Geocoding works locally but not in production

**Cause:** Nominatim/Photon might be blocked on your hosting provider

**Solution:** Configure Google Maps API key

### How to update existing properties with coordinates

You can manually trigger geocoding for existing properties by:

1. Edit each property in the admin panel
2. The system will auto-geocode on save
3. Or use a bulk update script (see below)

## Bulk Update Script (Optional)

To update all existing properties with coordinates, you can create a script:

```javascript
// update-coordinates.js
const { PropertyService } = require('./src/application/services');
const { SupabasePropertyRepository } = require('./src/infrastructure/repositories');

async function updateAllCoordinates() {
    const repository = new SupabasePropertyRepository();
    const service = new PropertyService(repository);
    
    const properties = await service.getAllProperties();
    
    for (const property of properties) {
        if (!property.latitude || !property.longitude) {
            console.log(`Updating coordinates for: ${property.title}`);
            try {
                await service.updateProperty(property.id, property);
                console.log('✅ Updated');
            } catch (error) {
                console.error('❌ Failed:', error.message);
            }
            // Wait to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

updateAllCoordinates();
```

Run with:
```bash
node update-coordinates.js
```

## Summary

✅ **Multiple providers** for reliability  
✅ **Smart fallback strategies** for better coverage  
✅ **Graceful error handling** - doesn't block property creation  
✅ **Optional Google Maps** for guaranteed results  
✅ **Detailed logging** for easy debugging  
✅ **Production-ready** - works on hosting providers  

## Next Steps

1. Deploy the changes to production
2. Create a test property to verify geocoding works
3. (Optional) Configure Google Maps API for best results
4. (Optional) Run bulk update script for existing properties
