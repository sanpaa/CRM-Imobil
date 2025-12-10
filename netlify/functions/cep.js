/**
 * Netlify Serverless Function for CEP Lookup API
 * Looks up Brazilian postal codes
 */

const axios = require('axios');

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
    // Extract CEP from path
    const path = event.path.replace('/.netlify/functions/cep', '');
    const cep = path.replace(/\D/g, '').replace('/', '');
    
    if (cep.length !== 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'CEP inválido' })
      };
    }
    
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (response.data.erro) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'CEP não encontrado' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        cep: response.data.cep,
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
        // Nominatim uses a simpler geocoding format
        address: `${response.data.logradouro}, ${response.data.bairro}, ${response.data.localidade}, ${response.data.uf}, Brasil`
      })
    };
  } catch (error) {
    console.error('CEP lookup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao buscar CEP' })
    };
  }
};
