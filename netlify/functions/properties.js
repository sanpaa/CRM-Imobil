/**
 * Netlify Serverless Function for Properties API
 * Handles CRUD operations for properties
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  try {
    const path = event.path.replace('/.netlify/functions/properties', '');
    const method = event.httpMethod;

    // GET /api/properties - Get all properties
    if (method === 'GET' && (!path || path === '/')) {
      const properties = await propertyService.getAllProperties();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(properties)
      };
    }

    // GET /api/properties/:id - Get single property
    if (method === 'GET' && path) {
      const id = path.replace('/', '');
      const property = await propertyService.getPropertyById(id);
      
      if (!property) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Property not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(property)
      };
    }

    // POST /api/properties - Create new property
    if (method === 'POST') {
      const propertyData = JSON.parse(event.body);
      const newProperty = await propertyService.createProperty(propertyData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newProperty)
      };
    }

    // PUT /api/properties/:id - Update property
    if (method === 'PUT' && path) {
      const id = path.replace('/', '');
      const propertyData = JSON.parse(event.body);
      const updatedProperty = await propertyService.updateProperty(id, propertyData);
      
      if (!updatedProperty) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Property not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedProperty)
      };
    }

    // DELETE /api/properties/:id - Delete property
    if (method === 'DELETE' && path) {
      const id = path.replace('/', '');
      await propertyService.deleteProperty(id);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Property deleted successfully' })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error in properties function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
