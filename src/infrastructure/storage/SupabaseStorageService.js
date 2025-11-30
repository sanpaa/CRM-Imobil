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
     * @returns {Promise<string|null>} - Public URL of the uploaded file or null on error
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
                console.error('Supabase Storage upload error:', error);
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(uniqueFileName);

            return urlData.publicUrl;
        } catch (err) {
            console.error('Storage upload error:', err.message);
            return null;
        }
    }

    /**
     * Upload multiple files to Supabase Storage
     * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} files - Array of file objects
     * @returns {Promise<string[]>} - Array of public URLs
     */
    async uploadFiles(files) {
        const uploadPromises = files.map(file => 
            this.uploadFile(file.buffer, file.originalname, file.mimetype)
        );

        const results = await Promise.all(uploadPromises);
        return results.filter(url => url !== null);
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
