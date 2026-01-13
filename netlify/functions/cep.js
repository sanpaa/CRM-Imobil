/**
 * Netlify Serverless Function for CEP Lookup API
 * Looks up Brazilian postal codes
 */

const axios = require('axios');
const { handleOptions, errorResponse, successResponse } = require('./utils');

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    // Extract CEP from path
    const path = event.path.replace('/.netlify/functions/cep', '');
    const cep = path.replace(/\D/g, '').replace('/', '');
    
    if (cep.length !== 8) {
      return errorResponse(400, 'CEP inválido');
    }
    
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (response.data.erro) {
      return errorResponse(404, 'CEP não encontrado');
    }
    
    return successResponse({
      cep: response.data.cep,
      street: response.data.logradouro,
      neighborhood: response.data.bairro,
      city: response.data.localidade,
      state: response.data.uf,
      // Nominatim uses a simpler geocoding format
      address: `${response.data.logradouro}, ${response.data.bairro}, ${response.data.localidade}, ${response.data.uf}, Brasil`
    });
  } catch (error) {
    console.error('CEP lookup error:', error);
    return errorResponse(500, 'Erro ao buscar CEP', error.message);
  }
};
