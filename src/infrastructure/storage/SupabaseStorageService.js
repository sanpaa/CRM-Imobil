/**
 * Supabase Storage Service
 * Infrastructure layer - Handles file uploads to Supabase Storage
 */
const supabase = require('../database/supabase');

const BUCKET_NAME = 'property-images';

class SupabaseStorageService {
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
     * Get extension from mime type
     * @param {string} mimeType - The MIME type
     * @returns {string} - File extension
     */
    _getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        };
        return mimeToExt[mimeType] || 'bin';
    }

    /**
     * Upload a file to Supabase Storage
     * @param {Buffer} fileBuffer - The file buffer
     * @param {string} fileName - The original filename
     * @param {string} mimeType - The file mime type
     * @returns {Promise<{url: string|null, error: string|null}>} - Result with URL or error message
     */
    async uploadFile(fileBuffer, fileName, mimeType) {
        try {
            // Generate unique filename with extension from mime type or original filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const originalExt = fileName.includes('.') ? fileName.split('.').pop() : null;
            const extension = originalExt || this._getExtensionFromMimeType(mimeType);
            const uniqueFileName = `${uniqueSuffix}.${extension}`;

            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(uniqueFileName, fileBuffer, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                const errorMsg = `Upload failed for ${fileName}: ${error.message || 'Unknown error'}`;
                console.error('Supabase Storage upload error:', error);
                // Include error code if available for better error detection
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
     * Upload multiple files to Supabase Storage
     * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} files - Array of file objects
     * @returns {Promise<{urls: string[], errors: string[], errorCodes: string[]}>} - Object with successful URLs, error messages, and error codes
     */
    async uploadFiles(files) {
        const uploadPromises = files.map(file => 
            this.uploadFile(file.buffer, file.originalname, file.mimetype)
        );

        const results = await Promise.all(uploadPromises);
        
        const urls = results.filter(r => r.url !== null).map(r => r.url);
        const errors = results.filter(r => r.error !== null).map(r => r.error);
        const errorCodes = results.filter(r => r.errorCode).map(r => r.errorCode);
        
        return { urls, errors, errorCodes };
    }

    /**
     * Delete a file from Supabase Storage
     * @param {string} fileUrl - The public URL of the file to delete
     * @returns {Promise<boolean>} - True if deleted successfully
     */
    async deleteFile(fileUrl) {
        try {
            // Extract filename from URL, handling query parameters
            const url = new URL(fileUrl);
            const fileName = url.pathname.split('/').pop();

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
}

module.exports = SupabaseStorageService;
