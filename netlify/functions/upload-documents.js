/**
 * Netlify Serverless Function for Document Upload
 * Uploads documents (PDF, DOC, DOCX, XLS, XLSX, TXT) to Supabase Storage
 */

const { SupabaseDocumentStorageService } = require('../../src/infrastructure/storage');
const multipart = require('parse-multipart-data');
const { getContentType, handleOptions, errorResponse, successResponse } = require('./utils');

// Initialize storage service
const documentStorageService = new SupabaseDocumentStorageService();

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  try {
    // Parse multipart form data
    const contentType = getContentType(event);
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return errorResponse(400, 'Content-Type must be multipart/form-data');
    }

    const boundary = multipart.getBoundary(contentType);
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = multipart.parse(bodyBuffer, boundary);

    if (!parts || parts.length === 0) {
      return errorResponse(400, 'Nenhum documento foi enviado');
    }

    // Extract company_id and property_id from form data or query params
    let companyId = 'default';
    let propertyId = 'temp';

    // Try to get from query params first
    if (event.queryStringParameters) {
      companyId = event.queryStringParameters.company_id || companyId;
      propertyId = event.queryStringParameters.property_id || propertyId;
    }

    // Try to get from form data
    const companyIdPart = parts.find(p => p.name === 'company_id');
    const propertyIdPart = parts.find(p => p.name === 'property_id');
    
    if (companyIdPart && companyIdPart.data) {
      companyId = companyIdPart.data.toString('utf8');
    }
    if (propertyIdPart && propertyIdPart.data) {
      propertyId = propertyIdPart.data.toString('utf8');
    }

    // Filter only document files (exclude metadata fields)
    const documentFiles = parts.filter(part => {
      // Skip if it's a form field (company_id, property_id)
      if (part.name === 'company_id' || part.name === 'property_id') {
        return false;
      }
      // Must have a filename to be a file
      return part.filename && part.filename.trim() !== '';
    });

    if (documentFiles.length === 0) {
      return errorResponse(400, 'Nenhum documento foi enviado');
    }

    // Check maximum documents limit
    const maxDocuments = documentStorageService.getMaxDocuments();
    if (documentFiles.length > maxDocuments) {
      return errorResponse(400, `Limite de ${maxDocuments} documentos excedido`);
    }

    // Check if storage is available
    const storageAvailable = await documentStorageService.isAvailable();
    if (!storageAvailable) {
      const bucketName = documentStorageService.getBucketName();
      console.error('Supabase Document Storage is not available. Check bucket configuration.');
      return errorResponse(503, `❌ Bucket "${bucketName}" não encontrado no Supabase Storage`, {
        details: `O bucket de armazenamento não existe ou não está acessível. Crie o bucket "${bucketName}" no Supabase Storage.`,
        documentation: 'Veja storage-policies-property-documents.sql para instruções de configuração.',
        helpCommands: [
          'Crie o bucket "property-documents" no Supabase Storage',
          'Configure o bucket como público ou aplique as políticas RLS'
        ]
      });
    }

    // Convert parts to file objects
    const files = documentFiles.map(part => ({
      originalname: part.filename || 'document',
      buffer: part.data,
      size: part.data.length
    }));

    // Validate file sizes
    const maxSize = documentStorageService.getMaxFileSize();
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return errorResponse(400, `Alguns documentos excedem o tamanho máximo de ${maxSize / (1024 * 1024)}MB`, {
        oversizedFiles: oversizedFiles.map(f => f.originalname)
      });
    }

    // Upload files to Supabase Storage
    const uploadResult = await documentStorageService.uploadDocuments(files, companyId, propertyId);
    const { urls, errors, errorCodes } = uploadResult;

    if (urls.length === 0) {
      // All uploads failed - return detailed error message
      const errorDetails = errors.length > 0 ? errors.join('; ') : 'Motivo desconhecido';
      const bucketName = documentStorageService.getBucketName();
      console.error('All document uploads failed:', errorDetails);

      // Check if error is about bucket not found
      const isBucketError = errorCodes.some(code => code === '404' || code === 'BUCKET_NOT_FOUND') ||
                            errorDetails.toLowerCase().includes('bucket') ||
                            errorDetails.toLowerCase().includes('not found');

      return errorResponse(500,
        isBucketError ? `❌ Bucket "${bucketName}" não encontrado` : 'Erro ao fazer upload dos documentos',
        {
          details: errorDetails,
          documentation: isBucketError
            ? `Crie o bucket "${bucketName}" no Supabase Storage e configure como público. Veja storage-policies-property-documents.sql.`
            : `Verifique se o bucket "${bucketName}" existe e está público no Supabase Storage.`,
          helpCommands: isBucketError ? [
            'Crie o bucket "property-documents" no Supabase Storage',
            'Configure como público ou aplique políticas RLS'
          ] : undefined
        }
      );
    }

    // Some or all uploads succeeded
    if (errors.length > 0) {
      console.warn(`${errors.length} of ${files.length} document uploads failed:`, errors.join('; '));
      // Return success with warning about partial failures
      return successResponse({
        documentUrls: urls,
        warning: `${urls.length} de ${files.length} documentos foram enviados com sucesso. ${errors.length} falharam.`,
        allowedExtensions: documentStorageService.getAllowedExtensions()
      });
    }

    // All uploads succeeded
    return successResponse({
      documentUrls: urls,
      allowedExtensions: documentStorageService.getAllowedExtensions()
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return errorResponse(500, 'Erro ao fazer upload dos documentos', error.message);
  }
};
