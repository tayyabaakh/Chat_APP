// JWT (JSON Web Token) library ko import kiya taake secure tokens banaye ja sakein
const jwt = require('jsonwebtoken');

/**
 * generateToken function:
 * @param {String} userId - User ki database unique ID
 * @returns {String} - Ek encrypted JWT string
 */
const generateToken = (userId) => {
    // 1. jwt.sign() method token banane ke liye use hota hai
    // 2. {userId}: Ye payload hai (data jo token ke andar chupa hota hai)
    // 3. process.env.JWT_SECRET: Ye aapki secret "chabi" hai jo token ko encrypt karti hai
    // 4. {expiresIn: '1y'}: Token ki expiry 1 saal set ki gayi hai
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
    );
};

// Is function ko export kiya taake Auth Controller mein use ho sakay
module.exports = generateToken;