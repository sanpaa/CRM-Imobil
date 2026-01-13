/**
 * Netlify Serverless Function for AI Suggestions
 * Generates property suggestions based on input
 */

const { handleOptions, errorResponse, successResponse } = require('./utils');

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    const { title, description, type, bedrooms, bathrooms, area, parking, city, neighborhood } = JSON.parse(event.body);
    
    console.log('✨ AI REQUEST:', { title, description, type, bedrooms, area });
    
    if (!title && !description) {
      return errorResponse(400, 'Digite título ou descrição');
    }
    
    // SMART AI: Extract ALL data from text
    const text = (title || '') + ' ' + (description || '');
    const textLower = text.toLowerCase();
    
    // Extract bedrooms
    const bedroomsMatch = textLower.match(/(\d+)\s*(quarto|quart|qto|bedroom|qt)/i);
    const extractedBedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : (bedrooms || null);
    
    // Extract bathrooms  
    const bathroomsMatch = textLower.match(/(\d+)\s*(banheiro|banh|bathroom|wc|bwc)/i);
    const extractedBathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : (bathrooms || null);
    
    // Extract area
    const areaMatch = textLower.match(/(\d+)\s*(m²|m2|metros|metro)/i);
    const extractedArea = areaMatch ? parseInt(areaMatch[1]) : (area ? parseInt(area) : null);
    
    // Extract parking
    const parkingMatch = textLower.match(/(\d+)\s*(vaga|garagem|parking|garage)/i);
    const extractedParking = parkingMatch ? parseInt(parkingMatch[1]) : (parking || null);
    
    console.log('✅ EXTRACTED:', { bedrooms: extractedBedrooms, bathrooms: extractedBathrooms, area: extractedArea, parking: extractedParking });
    
    // Generate TITLE from description if missing
    let generatedTitle = title;
    if (!title && description) {
      const propertyType = type || 'Imóvel';
      const location = neighborhood || city || '';
      const rooms = extractedBedrooms ? `${extractedBedrooms} Quartos` : '';
      const areaInfo = extractedArea ? `${extractedArea}m²` : '';
      
      generatedTitle = `${propertyType} ${rooms} ${location} ${areaInfo}`.trim().replace(/\s+/g, ' ');
      
      // Add special features mentioned
      if (textLower.includes('piscina')) generatedTitle += ' com Piscina';
      if (textLower.includes('churrasqueira')) generatedTitle += ' e Churrasqueira';
      if (textLower.includes('varanda') || textLower.includes('sacada')) generatedTitle += ' com Varanda';
      
      // Limit to 80 chars
      if (generatedTitle.length > 80) {
        generatedTitle = generatedTitle.substring(0, 77) + '...';
      }
    }
    
    // Generate DESCRIPTION from title if missing
    let generatedDescription = description;
    if (!description && title) {
      const propertyType = type || 'imóvel';
      const features = [];
      
      if (extractedBedrooms) features.push(`${extractedBedrooms} ${extractedBedrooms > 1 ? 'quartos' : 'quarto'}`);
      if (extractedBathrooms) features.push(`${extractedBathrooms} ${extractedBathrooms > 1 ? 'banheiros' : 'banheiro'}`);
      if (extractedArea) features.push(`${extractedArea}m² de área`);
      if (extractedParking) features.push(`${extractedParking} ${extractedParking > 1 ? 'vagas' : 'vaga'} de garagem`);
      
      // Add detected amenities
      if (textLower.includes('piscina')) features.push('piscina');
      if (textLower.includes('churrasqueira')) features.push('churrasqueira');
      if (textLower.includes('varanda') || textLower.includes('sacada')) features.push('varanda gourmet');
      if (textLower.includes('armário') || textLower.includes('armarios')) features.push('armários embutidos');
      if (textLower.includes('suite') || textLower.includes('suíte')) features.push('suíte');
      
      const loc = neighborhood || city || 'excelente localização';
      const featuresText = features.length > 0 ? `com ${features.join(', ')}` : '';
      
      generatedDescription = `Excelente ${propertyType} ${featuresText}. Localizado em ${loc}, oferece conforto e praticidade para você e sua família. ${extractedArea ? `Imóvel de ${extractedArea}m²` : 'Espaço amplo'} em localização privilegiada. Agende sua visita e conheça este imóvel incrível!`;
    }
    
    // SMART PRICE SUGGESTION
    let priceHint = 'Consulte-nos para avaliação';
    const finalArea = extractedArea;
    if (finalArea) {
      const locationLower = ((city || '') + ' ' + (neighborhood || '')).toLowerCase();
      let pricePerM2 = 4000; // Default
      
      // Premium areas
      if (locationLower.includes('jardins') || locationLower.includes('itaim') || locationLower.includes('moema') || locationLower.includes('vila olimpia') || locationLower.includes('leblon') || locationLower.includes('ipanema')) {
        pricePerM2 = 10000;
      } else if (locationLower.includes('são paulo') || locationLower.includes('sp') || locationLower.includes('rio') || locationLower.includes('rj')) {
        pricePerM2 = 7000;
      } else if (locationLower.includes('centro')) {
        pricePerM2 = 5500;
      }
      
      // Adjust for property type
      if (type && type.toLowerCase().includes('apartamento')) {
        pricePerM2 *= 1.1; // Apartments slightly more expensive per m²
      }
      
      const estimatedPrice = Math.round(finalArea * pricePerM2);
      priceHint = `R$ ${estimatedPrice.toLocaleString('pt-BR')}`;
    }
    
    const suggestions = {
      title: generatedTitle || `${type || 'Imóvel'} em ${neighborhood || city || 'Ótima Localização'}`,
      description: generatedDescription || `Excelente ${type || 'imóvel'} em ${neighborhood || city || 'ótima localização'}. Agende sua visita!`,
      bedrooms: extractedBedrooms,
      bathrooms: extractedBathrooms,
      area: extractedArea,
      parking: extractedParking,
      priceHint: priceHint
    };
    
    console.log('✅ AI GENERATED:', suggestions);
    
    return successResponse(suggestions);
    
  } catch (error) {
    console.error('❌ AI ERROR:', error);
    return errorResponse(500, 'Erro ao gerar sugestões', error.message);
  }
};
