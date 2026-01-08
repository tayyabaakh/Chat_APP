const jwt = require('jsonwebtoken') // JWT library import kar rahe hain, jo tokens generate aur verify karne ke liye use hoti hai
const response= require('../utils/responseHandler');
const authMiddleware = (req, res, next) => {
    
    
    // Request se cookies check kar rahe hain aur auth_token extract kar rahe hain
    const authToken = req.cookies?.auth_token; 
    console.log("COOKIES RECEIVED:", req.cookies);

    // Agar token nahi mila to user ko unauthorized response bhejna
    if (!authToken) {
        return response(res, 401, 'Authorization token missing. Please provide token'); 
    }

    try { 
        // Token ko verify karna using secret key jo .env file me hai
        const decode = jwt.verify(authToken, process.env.JWT_SECRET); 

        // Agar token valid hai to decoded user info ko request object me attach karenge
        // Taake agle middleware ya route handler me is info ko access kar saken
        req.user = decode; 

        // Debugging ke liye decoded user info console me print karna
        console.log(req.user); 

        // Next middleware ya route handler ko call karna
        next(); 
    } catch (error) {
        // Agar token invalid ho ya expire ho chuka ho to error ko console me print karna
        console.log(error); 

        // Unauthorized error response bhejna
        return response(res, 401, 'Invalid or expired token'); 
    }
}


// Middleware ko export karna taake app ke routes me use kar saken
module.exports = authMiddleware; 
