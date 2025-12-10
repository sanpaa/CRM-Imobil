/**
 * Netlify Serverless Function for Geocoding API
 * Converts addresses to coordinates
 */

const { geocodeAddress } = require('../../src/utils/geocodingUtils');

const GEOCODING_RETRY_DELAY_MS = 1000;

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { address } = JSON.parse(event.body);
    
    if (!address) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Endereço é obrigatório' })
      };
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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(coords)
      };
    } else {
      console.warn('⚠️ Geocoding failed for address:', address);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endereço não encontrado' })
      };
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao geocodificar endereço' })
    };
  }
};
