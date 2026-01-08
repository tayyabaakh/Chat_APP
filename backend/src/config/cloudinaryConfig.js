// //multer say local mein file ko store kreingay
// //  jesay hi file store hgi file name ko 
// // cloudinary mein deingy cloudinary file kko apni 
// // local storage mein store kry ga aur hmein aik link provide kreyga
// // lekin hm link atay hi file ko local storage say delete krwaeingay
// const multer =require ('multer');   
// const cloudinary =require ('cloudinary').v2
// const fs= require('fs')

// cloudinary.config({
//     cloud_name:process.env.CLOUDINARY_NAME, //cloudinary account ka name
//     api_key:process.env.CLOUDINARY_API_KEY, // API key jo cloudinary provide karta hai
//     api_secret:process.env.CLOUDINARY_API_SECRET // API secret jo cloudinary provide karta hai
// })
// // function to upload file to cloudinary
// const uploadFiletoCloudinary=(file)=>{
//      //  Ye decide karta hai ke file image hai ya video
//     const options={
//         resource_type:file.mimetype.startsWith('video') ? 'video':'image'
//     }
//     return new Promise ((resolve,reject)=>{
//         //  Agar video hai to upload_large use hoga, warna normal upload
//         const uploader = file.mimetype.startsWith('video') ?cloudinary.uploader.upload_large:cloudinary.uploader.upload
//           // File ko cloudinary par upload karna
//         uploader(file.path,options,(error,result)=>{
//             //Upload ke baad local file ko delete kar dena taake space na bhare
//             fs.unlink(file.path,(err)=>{
//                 if (err) console.error("Error deleting local file:", err);
//             })
//             if (error){
//                 return reject(error)  //  Agar error aaya to promise reject kar do

//             }
//             resolve (result);// Upload successful, result return karo (isme URL milega)
//         })
//     })
// }
// //  Multer middleware setup, file ko local "uploads/" folder me save karega
// const multerMiddleware=multer ({dest:'uploads/'}).single('media');
// module.exports={
//     uploadFiletoCloudinary,
//     multerMiddleware
// }


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists to prevent crash
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fix: Changed name to uploadFileToCloudinary (Capital T) to match Controller
const uploadFileToCloudinary = (file) => {
    const options = {
        resource_type: file.mimetype.startsWith('video') ? 'video' : 'image'
    };

    return new Promise((resolve, reject) => {
        const uploader = file.mimetype.startsWith('video') 
            ? cloudinary.uploader.upload_large 
            : cloudinary.uploader.upload;

        uploader(file.path, options, (error, result) => {
            // Delete local file after upload attempt
            fs.unlink(file.path, (err) => {
                if (err) console.error("Error deleting local file:", err);
            });

            if (error) {
                console.error("Cloudinary Upload Error:", error);
                return reject(error);
            }
            resolve(result);
        });
    });
};

// Fix: Only define the middleware here, don't call .single() yet
const multerMiddleware = multer({ dest: uploadDir });

module.exports = {
    uploadFileToCloudinary, // Exported with correct name
    multerMiddleware
};