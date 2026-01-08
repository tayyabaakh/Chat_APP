const express=require('express');
const authController=require ('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');
const router=express.Router();


// route1: send otp to email
// route2: verify otp
router.post('/send-otp',authController.sendOtp);
router.post('/verify-otp',authController.verifyotp);
router.get('/logout',authController.logout);

// protected route
router.put('/update-profile',authMiddleware,multerMiddleware.single('profilePicture'),authController.updateProfile)
router.get('/check-auth',authMiddleware,authController.checkAuthenticated);
router.get('/users',authMiddleware,authController.getAllUsers);

module.exports=router;