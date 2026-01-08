import React, { useState } from 'react'
import userLoginStore from '../../store/useloginStore'
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup"
import { avatars } from '../../utils/content';
import { useNavigate } from 'react-router-dom'
import useUserStore from '../../store/useUserStore';
import { useForm, Watch } from 'react-hook-form';
import userThemeStore from '../../store/ThemeStore';
import { motion, AnimatePresence } from 'framer-motion'

import { FaSpinner, FaWhatsapp } from 'react-icons/fa';
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user_services';
import { toast } from 'react-toastify';
const loginValidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email")
    .required("Email is required"),
});

const otpValidationSchema = yup.object().shape({
  otp: yup.string().length(6, "Otp must be exactly 6 digits").required("Otp is required")
})

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms")
})

const Login = () => {

  const { step, setStep, userPhoneData, setUsePhoneData, resetLoginState } = userLoginStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedavatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePicFile, setprofilePicFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = userThemeStore();
  const [loading, setloading] = useState(false)
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm({
    resolver: yupResolver(loginValidationSchema)
  })


  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  })


  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  })

  {/* login submit */ }
  const LoginSubmit = async (formData) => {
    try {
      setloading(true);
      if (formData.email) {
        const response = await sendOtp(formData.email);
        if (response.status === "success") {
          toast.info("OTP is send to your email");
          setEmail(formData.email)
          setUsePhoneData({ email: formData.email });
          setStep(2)
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to send OTP")

    }
    finally {
      setloading(false)
    }
  }

  const onOtpSubmit = async () => {
    try {
      setloading(true);
      if (!userPhoneData) {
        throw new Error("email data is missing")
      };

      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(otpString, userPhoneData.email)
      }
      if (response.status === 'success') {
        toast.success("OTP verify successfully")
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to Whatsapp");
          navigate('/');
          resetLoginState();
        }
        else {
          setStep(3);
        }

      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to verify OTP")

    }
    finally {
      setloading(false);
    }

  }




  // handle change

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setprofilePicFile(file);
      setProfilePicture(URL.createObjectURL(file))
    }
  }

  const onProfileSubmit = async (data) => {
    try {
      setloading(true);
      setError("");

      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);

      if (profilePicFile) {
        // Matches: .single('media') in your Cloudinary config
        formData.append("media", profilePicFile);
      } else {
        // Matches: else if (req.body.profilePicture) in your controller
        formData.append("profilePicture", selectedavatar);
      }

      const response = await updateUserProfile(formData);

      // Check for success status
      if (response?.status === "success" || response?.success === true) {

        toast.success("Welcome back to WhatsApp");

        /**
         * CRITICAL FIX: 
         * Your backend returns the updated 'user' object. 
         * Ensure you are grabbing the correct object from your service response.
         */
        const updatedUser = response.data?.user || response.data;
        setUser(updatedUser);

        navigate('/');
        resetLoginState();
      }
    } catch (error) {
      console.error("Profile Submit Error:", error);
      // Extracting deep error message if it exists
      const errorMsg = error.response?.data?.message || error.message || "Update failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setloading(false);
    }
  };


  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  }

  const handleBack = () => {
    setStep(1);
    setUsePhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("")
  }
  // Progress Bar Component
  const ProgressBar = ({ currentStep }) => {
    return (
      <div className="flex items-center justify-between mb-8 w-full px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center flex-1 relative">
            {/* The Line */}
            {s !== 1 && (
              <div
                className={`absolute right-1/2 top-4 w-full h-[2px] -z-10 transition-colors duration-500 ${currentStep >= s ? "bg-green-500" : "bg-gray-300"
                  }`}
              />
            )}
            {/* The Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${currentStep >= s
                ? "bg-green-500 text-white shadow-lg shadow-green-900/20"
                : "bg-gray-200 text-gray-500"
                }`}
            >
              {s}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${currentStep >= s ? "text-green-500" : "text-gray-400"}`}>
              {s === 1 ? "Email" : s === 2 ? "Verify" : "Profile"}
            </span>
          </div>
        ))}
      </div>
    );
  };


  return (
    <>
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${theme === "dark" ? "bg-gray-950" : "bg-gray-100"
        }`}>

        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
          <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 border ${theme === "dark"
            ? "bg-gray-900 border-gray-800 text-white"
            : "bg-white border-gray-100 text-gray-800"
            }`}
        >
          {/* 1. Brand Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-green-500 p-3 rounded-2xl shadow-lg mb-4">
              <FaWhatsapp className="text-white text-4xl" />
            </div>

            {/* 2. Heading */}
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 1 && "Welcome Back"}
              {step === 2 && "Verification"}
              {step === 3 && "Setup Profile"}
            </h1>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Please enter your details to continue
            </p>
          </div>



          {/* 3. Progress Bar */}
          <ProgressBar currentStep={step} />

          {/* Form Content Area */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  onSubmit={handleLoginSubmit(LoginSubmit)}
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  // onSubmit={handleLoginSubmit((data) => {
                  //   console.log("Email Data:", data);
                  //   setStep(2); // Move to OTP step on success
                  // })}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Email Address
                    </label>
                    <input
                      {...loginRegister("email")}
                      type="email"
                      placeholder="name@example.com"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                        } ${loginErrors.email ? "border-red-500 focus:ring-red-500/50" : "focus:border-green-500"}`}
                    />

                    {/* Error Message */}
                    {loginErrors.email && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {loginErrors.email.message}
                      </p>
                    )}
                  </div>


                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <FaSpinner /> : "Send OTP"}

                  </button>

                  <p className={`text-center text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    By continuing, you agree to our Terms of Service.
                  </p>
                </motion.form>
              )}
              {/* Add Step 2 and 3 similarly */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                  onSubmit={handleOtpSubmit(onOtpSubmit)}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      We've sent a 6-digit code to <br />
                      <span className="font-semibold text-green-500">{email || "your email"}</span>
                    </p>
                  </div>

                  {/* OTP Input Group */}
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) { // Only allow numbers
                            const newOtp = [...otp];
                            newOtp[index] = value;
                            setOtp(newOtp);
                            setOtpValue("otp", newOtp.join("")); // Sync with React Hook Form

                            // Auto-focus next input
                            if (value && index < 5) {
                              document.getElementById(`otp-${index + 1}`).focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Move back on backspace
                          if (e.key === "Backspace" && !otp[index] && index > 0) {
                            document.getElementById(`otp-${index - 1}`).focus();
                          }
                        }}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          } ${otpErrors.otp ? "border-red-500" : ""}`}
                      />
                    ))}
                  </div>

                  {otpErrors.otp && (
                    <p className="text-red-500 text-xs text-center -mt-4">{otpErrors.otp.message}</p>
                  )}

                  <div className="space-y-4">
                    <button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-green-900/20"
                    >
                      {loading ? <FaSpinner /> : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={handleBack}
                      className={`w-full text-sm font-medium transition-colors ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      Change Email
                    </button>
                  </div>
                </motion.form>
              )}


              {/* Step 3: Setup Profile */}
              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                  onSubmit={handleProfileSubmit(onProfileSubmit)}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center space-y-4">
                    {/* Profile Image Preview */}
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500/30">
                        <img
                          src={profilePicture || selectedavatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer hover:bg-green-500 transition-colors shadow-lg">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    </div>

                    {/* Avatar Selection */}
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {avatars.map((av, index) => (
                        <img
                          key={index}
                          src={av}
                          onClick={() => {
                            setSelectedAvatar(av);
                            setProfilePicture(null); // Clear custom upload if avatar is picked
                            setprofilePicFile(null);
                          }}
                          className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-all ${selectedavatar === av && !profilePicture ? "border-green-500 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your Name
                    </label>
                    <input
                      {...profileRegister("username")}
                      type="text"
                      placeholder="How should we call you?"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-green-500/50 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"
                        } ${profileErrors.username ? "border-red-500" : "focus:border-green-500"}`}
                    />
                    {profileErrors.username && (
                      <p className="text-red-500 text-xs mt-1">{profileErrors.username.message}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      {...profileRegister("agreed")}
                      type="checkbox"
                      id="agreed"
                      className="mt-1 w-4 h-4 accent-green-600"
                    />
                    <label htmlFor="agreed" className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      I agree to the Terms of Service and Privacy Policy.
                    </label>
                  </div>
                  {profileErrors.agreed && (
                    <p className="text-red-500 text-xs -mt-2">{profileErrors.agreed.message}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : "Finish Setup"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default Login

