/**
 * Netlify Serverless Function for Properties API
 * Handles CRUD operations for properties
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

  try {
    const path = event.path.replace('/.netlify/functions/properties', '');
    const method = event.httpMethod;

    // GET /api/properties - Get all properties
    if (method === 'GET' && (!path || path === '/')) {
      const properties = await propertyService.getAllProperties();
      return successResponse(properties);
    }

    // GET /api/properties/:id - Get single property
    if (method === 'GET' && path) {
      const id = path.replace('/', '');
      const property = await propertyService.getPropertyById(id);
      
      if (!property) {
        return errorResponse(404, 'Property not found');
      }
      
      return successResponse(property);
    }

    // POST /api/properties - Create new property
    if (method === 'POST') {
      const propertyData = JSON.parse(event.body);
      const newProperty = await propertyService.createProperty(propertyData);
      
      return successResponse(newProperty, 201);
    }

    // PUT /api/properties/:id - Update property
    if (method === 'PUT' && path) {
      const id = path.replace('/', '');
      const propertyData = JSON.parse(event.body);
      const updatedProperty = await propertyService.updateProperty(id, propertyData);
      
      if (!updatedProperty) {
        return errorResponse(404, 'Property not found');
      }
      
      return successResponse(updatedProperty);
    }

    // DELETE /api/properties/:id - Delete property
    if (method === 'DELETE' && path) {
      const id = path.replace('/', '');
      await propertyService.deleteProperty(id);
      
      return successResponse({ message: 'Property deleted successfully' });
    }

    // Method not allowed
    return errorResponse(405, 'Method not allowed');

  } catch (error) {
    console.error('Error in properties function:', error);
    return errorResponse(500, 'Internal server error', error.message);
  }
};
