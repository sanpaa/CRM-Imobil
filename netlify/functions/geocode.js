/**
 * Netlify Serverless Function for Geocoding API
 * Converts addresses to coordinates
 */

const { geocodeAddress } = require('../../src/utils/geocodingUtils');
const { handleOptions, errorResponse, successResponse } = require('./utils');

const GEOCODING_RETRY_DELAY_MS = 1000;

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    const { address } = JSON.parse(event.body);
    
    if (!address) {
      return errorResponse(400, 'Endereço é obrigatório');
    }
    
    console.log('🗺️ Geocoding request for:', address);
    
    // Try geocoding with the full address first
    let coords = await geocodeAddress(address);
    
    // If that fails, try parsing and using fallback strategies
    if (!coords) {
      // Parse the address to extract components
      const parts = address.split(',').map(p => p.trim());
      
      // Try different combinations
      const strategies = [];
      
      // Try without the first part (street)
      if (parts.length > 2) {
        strategies.push(parts.slice(1).join(', '));
      }
      
      // Try just city, state, Brasil
      if (parts.length >= 3) {
        const cityPart = parts[parts.length - 3];
        const statePart = parts[parts.length - 2];
        strategies.push(`${cityPart}, ${statePart}, Brasil`);
      }
      
      // Try each strategy
      for (const strategyAddress of strategies) {
        console.log('🗺️ Trying fallback geocoding:', strategyAddress);
        coords = await geocodeAddress(strategyAddress);
        if (coords) {
          console.log('✅ Fallback geocoding succeeded');
          break;
        }
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, GEOCODING_RETRY_DELAY_MS));
      }
    }
    
    if (coords) {
      console.log('✅ Geocoding successful:', coords);
      return successResponse(coords);
    } else {
      console.warn('⚠️ Geocoding failed for address:', address);
      return errorResponse(404, 'Endereço não encontrado');
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return errorResponse(500, 'Erro ao geocodificar endereço', error.message);
  }
};
