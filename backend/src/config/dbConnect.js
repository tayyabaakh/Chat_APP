// Database connection setup ke liye mongoose library ko import kiya
const mongoose = require('mongoose');

/**
 * 1. Database se connect hone ke liye ek asynchronous function banaya.
 * 'async' isliye use kiya kyunki DB connection mein thora time lag sakta hai.
 */
const connectDb = async () => {
    try {
        // 2. Mongoose ke zariye MongoDB se connection establish karne ki koshish
        // process.env.MONGO_URI environment variable se connection string uthata hai
        await mongoose.connect(process.env.MONGO_URI, {
           // Naye Mongoose versions mein purani options likhna zaroori nahi hoti
        })

        // Agar connection kamyab ho jaye toh console par success message show karna
        console.log("Db connected successfully");
    }
    catch (error) {
        // 3. Agar connection mein koi error aaye toh usay catch karke console pe dikhana
        console.log("error connecting Db", error.message);

        // 4. Agar DB connect nahi hua toh server ko yahin rok (exit) dena
        // '1' ka matlab hai ke application error ki wajah se band hui
        process.exit(1);
    }
}

// 5. Is function ko export kiya taake main file (server.js) mein call kiya ja sakay
module.exports = connectDb;