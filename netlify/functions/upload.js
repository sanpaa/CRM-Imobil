/**
 * Netlify Serverless Function for Image Upload
 * Uploads images to Supabase Storage
 */

const { SupabaseStorageService } = require('../../src/infrastructure/storage');
const multipart = require('parse-multipart-data');

// Initialize storage service
const storageService = new SupabaseStorageService();

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
    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
      };
    }

    const boundary = multipart.getBoundary(contentType);
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = multipart.parse(bodyBuffer, boundary);

    if (!parts || parts.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nenhuma imagem foi enviada' })
      };
    }

    // Filter only image files
    const imageFiles = parts.filter(part => {
      const contentType = part.type || '';
      return contentType.startsWith('image/');
    });

    if (imageFiles.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nenhuma imagem foi enviada' })
      };
    }

    // Limit to 10 images
    const filesToUpload = imageFiles.slice(0, 10);

    // Check if storage is available
    const storageAvailable = await storageService.isAvailable();
    if (!storageAvailable) {
      const bucketName = storageService.getBucketName();
      console.error('Supabase Storage is not available. Check bucket configuration.');
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: `❌ Bucket "${bucketName}" não encontrado no Supabase Storage`,
          details: `O bucket de armazenamento não existe ou não está acessível. Execute "npm run storage:setup" para criar o bucket.`,
          documentation: 'Veja STORAGE_SETUP.md para instruções detalhadas de como criar o bucket.',
          helpCommands: [
            'npm run storage:setup - Verificar e criar bucket',
            'npm run verify - Verificar configuração completa'
          ]
        })
      };
    }

    // Convert parts to multer-like file objects
    const files = filesToUpload.map(part => ({
      originalname: part.filename || 'upload.jpg',
      mimetype: part.type || 'image/jpeg',
      buffer: part.data,
      size: part.data.length
    }));

    // Validate file sizes (5MB limit)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Algumas imagens excedem o tamanho máximo de 5MB',
          details: oversizedFiles.map(f => f.originalname).join(', ')
        })
      };
    }

    // Upload files to Supabase Storage
    const uploadResult = await storageService.uploadFiles(files);
    const { urls, errors, errorCodes } = uploadResult;

    if (urls.length === 0) {
      // All uploads failed - return detailed error message
      const errorDetails = errors.length > 0 ? errors.join('; ') : 'Motivo desconhecido';
      const bucketName = storageService.getBucketName();
      console.error('All image uploads failed:', errorDetails);

      // Check if error is about bucket not found using error codes or message
      const isBucketError = errorCodes.some(code => code === '404' || code === 'BUCKET_NOT_FOUND') ||
                            errorDetails.toLowerCase().includes('bucket') || 
                            errorDetails.toLowerCase().includes('not found');

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: isBucketError 
            ? `❌ Bucket "${bucketName}" não encontrado` 
            : 'Erro ao fazer upload das imagens',
          details: errorDetails,
          documentation: isBucketError 
            ? `Execute "npm run storage:setup" para criar o bucket "${bucketName}". Veja STORAGE_SETUP.md para mais detalhes.`
            : `Verifique se o bucket "${bucketName}" existe e está público no Supabase Storage.`,
          helpCommands: isBucketError 
            ? ['npm run storage:setup', 'npm run verify']
            : undefined
        })
      };
    }

    // Some or all uploads succeeded
    if (errors.length > 0) {
      console.warn(`${errors.length} of ${files.length} image uploads failed:`, errors.join('; '));
      // Return success with warning about partial failures
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          imageUrls: urls,
          warning: `${urls.length} de ${files.length} imagens foram enviadas com sucesso. ${errors.length} falharam.`
        })
      };
    }

    // All uploads succeeded
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ imageUrls: urls })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro ao fazer upload das imagens',
        details: error.message
      })
    };
  }
};
