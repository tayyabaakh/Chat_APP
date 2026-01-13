// Models aur Utilities ko import karna
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const otpGenerate = require('../utils/otpGenerator');
const sendOptEmail = require('../services/emailService');
const response = require('../utils/responseHandler');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation');

// ---------------------------------------------------------
// 1. OTP BHEJNA (Login/Signup ka pehla step)
// ---------------------------------------------------------
const sendOtp = async (req, res) => {
    const { email } = req.body;

    // Email check karna ke empty toh nahi
    if (!email) {
        return response(res, 400, "Email is required");
    }

    // Naya OTP generate karna aur 5 minute ki expiry set karna
    const otp = otpGenerate();
    const expirytime = new Date(Date.now() + 5 * 60 * 1000);

    try {
        // User ko find karna, agar naya hai toh database mein create karna
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email });
        }

        // Database mein OTP aur uski expiry save karna
        user.emailOtp = otp;
        user.emailOtpExpiry = expirytime;
        await user.save();

        // Email service ke zariye user ko OTP mail karna
        try {
            await sendOptEmail(email, otp);
        } catch (err) {
            console.log(err);
            return response(res, 500, "OTP email failed");
        }

        return response(res, 200, "OTP sent to email successfully", { email });

    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 2. OTP VERIFY KARNA (User ki authenticity check karna)
// ---------------------------------------------------------
const verifyotp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        let user;
        if (email && otp) {
            user = await User.findOne({ email });
            if (!user) {
                return response(res, 400, 'User not found with this email');
            }

            const currentTime = new Date();
            
            // Logic: Agar OTP nahi hai, mismatch hai, ya expire ho gaya hai toh error dena
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || currentTime > user.emailOtpExpiry) {
                return response(res, 400, 'Invalid or expired OTP');
            };

            // OTP sahi hone par user ko verified mark karna aur OTP fields clear karna
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        }

        // Login session ke liye JWT token generate karna
        const token = generateToken(user?._id);

        // Security ke liye token ko HttpOnly cookie mein save karna
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: false,        // Localhost par false hota hai
            sameSite: "lax",
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 saal ki expiry
        });

        return response(res, 200, 'OTP verified successfully', { token, user });
    }
    catch (error) {
        console.log(error);
        return response(res, 500, 'Internal server error');
    }
};

// ---------------------------------------------------------
// 3. PROFILE UPDATE (User ki details save karna)
// ---------------------------------------------------------
const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body;
    
    // Auth middleware se milne wali user ID ko access karna
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    try {
        const user = await User.findById(userId);
        if (!user) return response(res, 404, "User not found");

        // Profile picture handle karna (Multer + Cloudinary)
        const file = req.file;
        if (file) {
            // Local file ko Cloudinary par upload kar ke URL hasil karna
            const uploadResult = await uploadFileToCloudinary(file);
            user.profilePicture = uploadResult?.secure_url;
        } 
        else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        // Sirf wahi fields update karna jo request mein ayi hain
        if (username) user.username = username;
        if (about !== undefined) user.about = about;
        if (agreed !== undefined) user.agreed = agreed;

        await user.save();
        return response(res, 200, 'Profile updated successfully', { user });

    } catch (error) {
        console.error("Backend Error:", error);
        return response(res, 500, error.message);
    }
}

// ---------------------------------------------------------
// 4. AUTH STATUS CHECK (Page refresh par login check karna)
// ---------------------------------------------------------
const checkAuthenticated = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return response(res, 401, "Unauthorized: Please login first");
        }

        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, 'User not found');
        }

        return response(res, 200, 'User retrieved successfully', user);
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error");
    }
}

// ---------------------------------------------------------
// 5. LOGOUT (Session khatam karna)
// ---------------------------------------------------------
const logout = (req, res) => {
    try {
        // Browser se auth_token cookie ko delete/expire karna
        res.cookie("auth_token", "", { expires: new Date(0) });
        return response(res, 200, 'User logged out successfully');
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error");
    }
}

// ---------------------------------------------------------
// 6. GET ALL USERS (Contacts list ke liye)
// ---------------------------------------------------------
const getAllUsers = async (req, res) => {
    const loggedInUser = req.user.userId;

    try {
        // Apne ilawa baaki sab users ko DB se nikalna
        const users = await User.find({
            _id: { $ne: loggedInUser }
        })
        .select("username profilePicture lastSeen isOnline about")
        .lean(); 

        // Har user ke sath unki aakhri baat-cheet (conversation) attach karna
        const userWithConversation = await Promise.all(
            users.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedInUser, user._id] }
                })
                .populate({
                    path: "lastMessage",
                    select: "content createdAt sender receiver"
                })
                .lean();

                return {
                    ...user,
                    conversation: conversation || null
                };
            })
        );

        return response(res, 200, 'Users retrieved successfully', userWithConversation);

    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error");
    }
};

module.exports = { sendOtp, verifyotp, updateProfile, logout, checkAuthenticated, getAllUsers };