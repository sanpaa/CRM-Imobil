/**
 * Netlify Serverless Function for Statistics API
 */

const { SupabasePropertyRepository } = require('../../src/infrastructure/repositories');
const { PropertyService } = require('../../src/application/services');
const { handleOptions, errorResponse, successResponse } = require('./utils');

// Initialize services
const propertyRepository = new SupabasePropertyRepository();
const propertyService = new PropertyService(propertyRepository);

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    const stats = await propertyService.getStats();
    return successResponse(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse(500, 'Failed to fetch statistics', error.message);
  }
};
