// //multer say local mein file ko store kreingay
// //  jesay hi file store hgi file name ko 
// // cloudinary mein deingy cloudinary file kko apni 
// // local storage mein store kry ga aur hmein aik link provide kreyga
// // lekin hm link atay hi file ko local storage say delete krwaeingay


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// 1. Local storage folder create krna (agar pehlay se nahi hai)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Cloudinary configuration (Credentials setup)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 3. Function: Local file ko Cloudinary par bhejna
 * @param {Object} file - Multer se receive hui file object
 */
const uploadFileToCloudinary = (file) => {
    // Check krna ke file image hai ya video taake sahi resource type set ho
    const options = {
        resource_type: file.mimetype.startsWith('video') ? 'video' : 'image'
    };

    return new Promise((resolve, reject) => {
        // Agar video bari hai toh 'upload_large' use hoga, warna normal 'upload'
        const uploader = file.mimetype.startsWith('video') 
            ? cloudinary.uploader.upload_large 
            : cloudinary.uploader.upload;

        // Cloudinary par file upload krna (local path provide krke)
        uploader(file.path, options, (error, result) => {
            
            // 4. Sab se important step: File upload honay ke baad local server se delete krna
            // Chahe upload success ho ya fail, local storage clean krna zaroori hai
            fs.unlink(file.path, (err) => {
                if (err) console.error("Local file delete krne mein error:", err);
                else console.log("Local file successfully deleted.");
            });

            // Error handling agar Cloudinary upload fail ho jaye
            if (error) {
                console.error("Cloudinary Upload Error:", error);
                return reject(error);
            }

            // Success: Cloudinary ka response (jisme URL hota hai) return krna
            resolve(result);
        });
    });
};

// 5. Multer configuration: Files ko temporary 'uploads/' folder mein rakhna
const multerMiddleware = multer({ dest: uploadDir });

module.exports = {
    uploadFileToCloudinary, 
    multerMiddleware
};