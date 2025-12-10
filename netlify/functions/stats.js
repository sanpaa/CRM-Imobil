/**
 * Netlify Serverless Function for Statistics API
 */

const { SupabasePropertyRepository } = require('../../src/infrastructure/repositories');
const { PropertyService } = require('../../src/application/services');

// Initialize services
const propertyRepository = new SupabasePropertyRepository();
const propertyService = new PropertyService(propertyRepository);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const stats = await propertyService.getStats();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats)
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch statistics' })
    };
  }
};
