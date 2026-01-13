/**
 * Global Response Handler Function
 * @param {Object} res - Express ka response object
 * @param {Number} statusCode - HTTP status code (e.g., 200, 400, 500)
 * @param {String} message - User ke liye message (e.g., "Login successful")
 * @param {Object|Array} data - optional data jo client ko bhejna hai (default: null)
 */
const response = (res, statusCode, message, data = null) => {
    
    // 1. Safety check: Agar 'res' object hi nahi mila toh function yahin ruk jaye
    if (!res) {
        console.log("Error: Response object (res) is missing!");
        return;
    }

    // 2. Response ka ek standard format banana
    const responseObject = {
        // Agar status code 400 se kam hai toh 'success', warna 'error'
        status: statusCode < 400 ? 'success' : 'error',
        message: message,
        data: data
    }

    // 3. Final response bhejna JSON format mein
    return res.status(statusCode).json(responseObject);
}

// Isay export kiya taake har controller mein reuse ho sakay
module.exports = response;