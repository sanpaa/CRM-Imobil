/**
 * Supabase Document Storage Service
 * Infrastructure layer - Handles document uploads to Supabase Storage
 */
const supabase = require('../database/supabase');

const BUCKET_NAME = 'property-documents';

// Allowed document file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum number of documents per property
const MAX_DOCUMENTS = 10;

class SupabaseDocumentStorageService {
    constructor() {
        this.bucketName = BUCKET_NAME;
    }

    /**
     * Get the bucket name
     * @returns {string} - The bucket name
     */
    getBucketName() {
        return this.bucketName;
    }

    /**
     * Validate file extension
     * @param {string} fileName - The filename
     * @returns {boolean} - True if extension is allowed
     */
    _isValidExtension(fileName) {
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return ALLOWED_EXTENSIONS.includes(ext);
    }

    /**
     * Get extension from filename
     * @param {string} fileName - The filename
     * @returns {string} - File extension
     */
    _getExtension(fileName) {
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    /**
     * Get mime type from extension
     * @param {string} extension - File extension
     * @returns {string} - MIME type
     */
    _getMimeType(extension) {
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Upload a document to Supabase Storage
     * @param {Buffer} fileBuffer - The file buffer
     * @param {string} fileName - The original filename
     * @param {string} companyId - Company ID for organization
     * @param {string} propertyId - Property ID for organization
     * @returns {Promise<{url: string|null, error: string|null}>} - Result with URL or error message
     */
    async uploadDocument(fileBuffer, fileName, companyId = 'default', propertyId = 'temp') {
        try {
            // Validate file extension
            if (!this._isValidExtension(fileName)) {
                return {
                    url: null,
                    error: `Tipo de arquivo não permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`,
                    errorCode: 'INVALID_EXTENSION'
                };
            }

            // Validate file size
            if (fileBuffer.length > MAX_FILE_SIZE) {
                return {
                    url: null,
                    error: `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                    errorCode: 'FILE_TOO_LARGE'
                };
            }

            // Generate unique filename with company/property organization
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = this._getExtension(fileName);
            const uniqueFileName = `${companyId}/${propertyId}/${uniqueSuffix}${extension}`;

            const mimeType = this._getMimeType(extension);

            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(uniqueFileName, fileBuffer, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                const errorMsg = `Upload failed for ${fileName}: ${error.message || 'Unknown error'}`;
                console.error('Supabase Storage document upload error:', error);
                return {
                    url: null,
                    error: errorMsg,
                    errorCode: error.statusCode || error.code || 'UPLOAD_ERROR'
                };
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(uniqueFileName);

            return { url: urlData.publicUrl, error: null };
        } catch (err) {
            const errorMsg = `Storage upload error for ${fileName}: ${err.message}`;
            console.error(errorMsg);
            return {
                url: null,
                error: errorMsg,
                errorCode: err.code || 'STORAGE_ERROR'
            };
        }
    }

    /**
     * Upload multiple documents to Supabase Storage
     * @param {Array<{buffer: Buffer, originalname: string}>} files - Array of file objects
     * @param {string} companyId - Company ID for organization
     * @param {string} propertyId - Property ID for organization
     * @returns {Promise<{urls: string[], errors: string[], errorCodes: string[]}>} - Object with successful URLs, error messages, and error codes
     */
    async uploadDocuments(files, companyId = 'default', propertyId = 'temp') {
        // Limit to maximum number of documents
        if (files.length > MAX_DOCUMENTS) {
            return {
                urls: [],
                errors: [`Limite de ${MAX_DOCUMENTS} documentos por imóvel excedido`],
                errorCodes: ['MAX_DOCUMENTS_EXCEEDED']
            };
        }

        const uploadPromises = files.map(file =>
            this.uploadDocument(file.buffer, file.originalname, companyId, propertyId)
        );

        const results = await Promise.all(uploadPromises);

        const urls = results.filter(r => r.url !== null).map(r => r.url);
        const errors = results.filter(r => r.error !== null).map(r => r.error);
        const errorCodes = results.filter(r => r.errorCode).map(r => r.errorCode);

        return { urls, errors, errorCodes };
    }

    /**
     * Delete a document from Supabase Storage
     * @param {string} fileUrl - The public URL of the file to delete
     * @returns {Promise<boolean>} - True if deleted successfully
     */
    async deleteDocument(fileUrl) {
        try {
            // Extract filename from URL, handling query parameters
            const url = new URL(fileUrl);
            const pathParts = url.pathname.split('/');
            // Get the path after /storage/v1/object/public/property-documents/
            const bucketIndex = pathParts.indexOf(this.bucketName);
            if (bucketIndex === -1) {
                console.error('Could not extract filename from URL:', fileUrl);
                return false;
            }
            const fileName = pathParts.slice(bucketIndex + 1).join('/');

            if (!fileName) {
                console.error('Could not extract filename from URL:', fileUrl);
                return false;
            }

            const { error } = await supabase.storage
                .from(this.bucketName)
                .remove([fileName]);

            if (error) {
                console.error('Supabase Storage delete error:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('Storage delete error:', err.message);
            return false;
        }
    }

    /**
     * Check if storage is configured and available
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            // Try to list files to check if bucket exists
            const { error } = await supabase.storage
                .from(this.bucketName)
                .list('', { limit: 1 });

            return !error;
        } catch {
            return false;
        }
    }

    /**
     * Get allowed file extensions
     * @returns {string[]} - Array of allowed extensions
     */
    getAllowedExtensions() {
        return ALLOWED_EXTENSIONS;
    }

    /**
     * Get maximum file size
     * @returns {number} - Maximum file size in bytes
     */
    getMaxFileSize() {
        return MAX_FILE_SIZE;
    }

    /**
     * Get maximum documents per property
     * @returns {number} - Maximum number of documents
     */
    getMaxDocuments() {
        return MAX_DOCUMENTS;
    }
}

module.exports = SupabaseDocumentStorageService;
