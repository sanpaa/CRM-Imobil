/**
 * Error Utilities
 * Helper functions for handling database errors gracefully
 */

/**
 * Check if an error should be silent (expected offline mode)
 * @param {object} error - The error object
 * @returns {boolean} - True if the error should not be logged
 */
function isSilentError(error) {
    if (!error) return false;
    
    // Check if error is marked as silent
    if (error.silent === true) return true;
    
    // Check for known offline mode error messages
    const silentMessages = [
        'Database not configured',
        'Storage not configured',
        'fetch failed',
        'ENOTFOUND'
    ];
    
    const message = error.message || '';
    return silentMessages.some(pattern => message.includes(pattern));
}

/**
 * Check if an error code indicates "not found"
 * @param {object} error - The error object
 * @returns {boolean} - True if the error is a not found error
 */
function isNotFoundError(error) {
    return error && error.code === 'PGRST116';
}

module.exports = {
    isSilentError,
    isNotFoundError
};
