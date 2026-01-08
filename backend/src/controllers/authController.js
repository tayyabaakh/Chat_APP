//1. send otp to email
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const otpGenerate = require('../utils/otpGenerator');
const sendOptEmail = require('../services/emailService');
const response = require('../utils/responseHandler');
const { uploadFiletoCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation')


const sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return response(res, 400, "Email is required");
    }

    const otp = otpGenerate();
    const expirytime = new Date(Date.now() + 5 * 60 * 1000);

    try {
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email });
        }

        user.emailOtp = otp;
        user.emailOtpExpiry = expirytime;
        await user.save();

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




// 2.verify otp
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
            // Ye IF condition check karti hai ke OTP valid hai ya nahi.
            // Agar koi bhi condition true ho jaaye → OTP invalid maan liya jata hai.
            //  !user.emailOtp=> Kya user ke paas OTP exist hi nahi karta?
            // String(user.emailOtp) !== String(otp) =>Database ka OTP aur user ka dala hua OTP same hai ya nahi hai
            // currentTime > user.emailOtpExpiry => Kya OTP expire ho chuka hai?

            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || currentTime > user.emailOtpExpiry) {
                return response(res, 400, 'Invalid or expired OTP');
            };
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();

        }
        const token = generateToken(user?._id);
        // authentication token ko cookie mein set karna
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: false,        // MUST be false on localhost
            sameSite: "lax",      // works for most cases on localhost
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });
        return response(res, 200, 'OTP verified successfully', { token, user })
    }
    catch (error) {
        console.log(error);
        return response(res, 500, 'Internal server error');
    }

};
// const verifyotp = async (req, res) => {
//     const { email, otp } = req.body;

//     // ✅ 1. Validate input
//     if (!email || !otp) {
//         return response(res, 400, "Email and OTP are required");
//     }

//     try {
//         // ✅ 2. Find user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return response(res, 400, "User not found with this email");
//         }

//         // (Optional but recommended)
//         if (user.isVerified) {
//             return response(res, 400, "User already verified");
//         }

//         const currentTime = new Date();

//         // ✅ 3. Validate OTP
//         if (
//             !user.emailOtp ||
//             String(user.emailOtp) !== String(otp) ||
//             currentTime > user.emailOtpExpiry
//         ) {
//             return response(res, 400, "Invalid or expired OTP");
//         }

//         // ✅ 4. Mark user verified
//         user.isVerified = true;
//         user.emailOtp = null;
//         user.emailOtpExpiry = null;
//         await user.save();

//         // ✅ 5. Generate token ONLY after verification
//         const token = generateToken(user._id);

//         // ✅ 6. Set cookie correctly
//         res.cookie("auth_token", token, {
//             httpOnly: true,
//             secure: false,       // localhost
//             sameSite: "lax",
//             maxAge: 1000 * 60 * 60 * 24 * 365,
//         });

//         return response(res, 200, "OTP verified successfully", { user });

//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// };

// 3 update user profile after verification
const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body;
    // userId from auth middleware
    const userId = req.user.userId;
    try {
        // user ko DB mein find karne by userId
        const user = await User.findById(userId);
        // userID milnay kay baad agr woh koi file upload krta ha eg:profile picture
        const file = req.file;
        if (file) {
            //  File ko Cloudinary par upload karna
            const uploadResult = await uploadFiletoCloudinary(file)
            console.log(uploadResult);
            // Upload ke baad Cloudinary ka secure URL user ke profilePicture field me store
            user.profilePicture = uploadResult?.secure_url;
        }
        //  Agar frontend se direct profilePicture URL aata hai like avatar
        else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }
        //  Agar username provided hai to update kar do
        if (username) user.username = username;
        //  Agar agreed provided hai to update kar do
        if (agreed) user.agreed = agreed;
        //  Agar about provided hai to update kar do
        if (about) user.about = about;
        //  Updated user ko DB me save karna
        await user.save();
        console.log(user);

        // Success response bhejna
        return response(res, 200, 'user profie updated successfully', user)

    } catch (error) {
        console.log(error);
        return response(res, 500,error.message,"Internal server error")

    }
}
// Function jo check karta hai ke user authenticated (login) hai ya nahi
const checkAuthenticated = async (req, res) => {
    try {
        // Auth middleware se decoded token me se userId nikaal rahe hain
        const userId = req.user.userId;
        // Agar userId hi nahi mili to matlab user login nahi hai
        if (!userId) {
            return response(res, 404, "unauthorized:please login before accessing app ")
        }
        // Database me user ko userId ki madad se find kar rahe hain
        const user = await User.findById(userId);
        // Agar database me user exist nahi karta
        if (!user) {
            return response(res, 404, 'user not found');

        }
        // Agar sab theek hai to user ko allow kar dete hain app use karne ke liye
        return response(res, 200, 'user retrived and allowed to use watsapp', user);
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error")
    }
}


// Logout function jo user ko system se logout karta hai
const logout = (req, res) => {
    try {
        // auth_token cookie ko empty kar rahe hain
        // aur expiry past date set kar dete hain
        // jis se browser cookie delete ho jati hai
        res.cookie("auth_token", "", { expires: new Date(0) });
        // Logout successful response bhej rahe hain
        return response(res, 200, 'user logout successfuly')
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error")
    }
}

const getAllUsers = async (req, res) => {
    // Auth middleware se login user ki ID nikal rahe hain
    const loggedInUser = req.user.userId;

    try {
        // DB se tamam users la rahe hain
        // Lekin logged-in user ko list se exclude kar rahe hain
        const users = await User.find({
            _id: { $ne: loggedInUser }
        })
            // Sirf required fields hi bhej rahe hain (security + performance)
            .select("username profilePicture lastSeen isOnline about")
            .lean(); // mongoose document ko plain JS object bana deta hai


        // Har user ke sath uski conversation attach kar rahe hain
        const userWithConversation = await Promise.all(
            users.map(async (user) => {

                // Logged-in user aur current user ki conversation find kar rahe hain
                const conversation = await Conversation.findOne({
                    participants: {
                        $all: [loggedInUser, user._id]
                    }
                })
                    // Last message ka data populate kar rahe hain
                    .populate({
                        path: "lastMessage",
                        select: "content createdAt sender receiver"
                    })
                    .lean();

                // User object ke sath conversation attach kar ke return
                return {
                    ...user,
                    conversation: conversation || null
                };
            })
        );

        // Final response client ko bhejna
        return response(
            res,
            200,
            'Users retrieved successfully',
            userWithConversation
        );

    } catch (error) {
        // Agar koi error aaye to console me log
        console.log(error);
        return response(res, 500, "Internal server error");
    }
};

module.exports = { sendOtp, verifyotp, updateProfile, logout, checkAuthenticated, getAllUsers };