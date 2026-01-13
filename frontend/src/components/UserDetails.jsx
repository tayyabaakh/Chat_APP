import React, { useEffect, useState } from 'react';
import useUserStore from '../store/useUserStore';
import userThemeStore from '../store/ThemeStore';
import { updateUserProfile } from '../services/user_services';
import { toast } from 'react-toastify';
import Layout from './Layout';
import { FaCamera, FaCheck, FaPencilAlt, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const UserDetails = () => {
  const [name, setName] = useState('');
  const [about, setabout] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEdtingAbout, setisEdtingAbout] = useState(false);
  const [showNameEmoji, setshowNameEmoji] = useState(false);
  const [showAboutEmoji, setshowAboutEmoji] = useState(false);
  
  const { user, setUser } = useUserStore();
  const { theme } = userThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setabout(user.about || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // const handleSave = async (field) => {
  //   try {
  //     // FIX: Initialize FormData
  //     const formData = new FormData();

  //     if (field === 'name') {
  //       formData.append("username", name);
  //       setIsEditingName(false);
  //       setshowNameEmoji(false);
  //     } else if (field === 'about') {
  //       formData.append("about", about);
  //       setisEdtingAbout(false);
  //       setshowAboutEmoji(false);
  //     }
      
  //     if (profilePic && field === "profile") {
  //       formData.append("media", profilePic); // Adjusted key to match profile usage
  //     }

  //     const updated = await updateUserProfile(formData);
  //     setUser(updated?.data);
  //     setProfilePic(null);
  //     setPreview(null);
  //     toast.success("Profile Updated");
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to update profile");
  //   }
  // };


  const handleSave = async (field) => {
  try {
    const formData = new FormData();

    // Logic for updating Name
    if (field === 'name') {
      if (!name.trim()) return toast.error("Name cannot be empty");
      formData.append("username", name);
    } 
    // Logic for updating About
    else if (field === 'about') {
      formData.append("about", about);
    } 
    // Logic for updating Profile Picture
    else if (field === "profile") {
      if (!profilePic) return toast.error("Please select an image");
      // Key 'media' matches your authRoute.js multerMiddleware.single('media')
      formData.append("media", profilePic); 
    }

    const response = await updateUserProfile(formData);
    
    // Sync User Store: Extract user correctly from your response handler
    const updatedUser = response.data?.user || response.data;
    setUser(updatedUser);

    // Reset UI states
    setProfilePic(null);
    setPreview(null);
    setIsEditingName(false);
    setisEdtingAbout(false);
    setshowNameEmoji(false);
    setshowAboutEmoji(false);
    
    toast.success("Profile Updated");
  } catch (error) {
    // Log actual server error to console
    console.error("Server Error:", error.response?.data);
    toast.error(error.response?.data?.message || "Failed to update profile");
  }
};
  const handleEmojiSelect = (emoji, field) => {
    if (field === 'name') {
      setName((prev) => prev + emoji.emoji);
      setshowNameEmoji(false);
    } else {
      setabout((prev) => prev + emoji.emoji);
      setshowAboutEmoji(false);
    }
  };

  const isDarkMode = theme === 'dark';

  return (
    <Layout>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-[#f0f2f5] text-black'}`}>
        
        {/* Header */}
        <div className={`p-5 flex items-center gap-10 ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#008069] text-white'}`}>
          <h1 className="text-xl font-medium">Profile</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Profile Picture Section */}
          <div className="flex justify-center my-8">
            <div className="relative group">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-transparent group-hover:border-gray-300 transition-all">
                <img 
                  src={preview || user?.profilePicture || "https://via.placeholder.com/150"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                <FaCamera size={24} />
                <span className="text-xs uppercase mt-2 text-center px-4">Change Profile Photo</span>
                <input type="file" hidden onChange={handleImageChange} accept="image/*" />
              </label>

              {profilePic && (
                <button 
                  onClick={() => handleSave('profile')}
                  className="absolute bottom-2 right-2 bg-[#00a884] p-3 rounded-full text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <FaCheck />
                </button>
              )}
            </div>
          </div>

          {/* Name Section */}
          <div className={`mb-8 p-4 rounded-lg ${isDarkMode ? 'bg-[#202c33]' : 'bg-white shadow-sm'}`}>
            <label className="text-[#00a884] text-sm block mb-4">Your Name</label>
            <div className="flex items-center justify-between gap-2 border-b border-transparent hover:border-gray-500 pb-1">
              {isEditingName ? (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      className={`flex-1 bg-transparent border-b-2 border-[#00a884] outline-none py-1`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                    <FaSmile className="cursor-pointer text-gray-400" onClick={() => setshowNameEmoji(!showNameEmoji)} />
                    <FaCheck className="cursor-pointer text-[#00a884]" onClick={() => handleSave('name')} />
                  </div>
                  {showNameEmoji && (
                    <div className="absolute z-50 mt-10">
                      <EmojiPicker onEmojiClick={(emoji) => handleEmojiSelect(emoji, 'name')} theme={isDarkMode ? 'dark' : 'light'} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-lg">{name || "Set your username"}</span>
                  <FaPencilAlt className="cursor-pointer text-gray-400 hover:text-[#00a884]" onClick={() => setIsEditingName(true)} />
                </>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              This is not your username or pin. This name will be visible to your WhatsApp contacts.
            </p>
          </div>

          {/* About Section */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#202c33]' : 'bg-white shadow-sm'}`}>
            <label className="text-[#00a884] text-sm block mb-4">About</label>
            <div className="flex items-center justify-between gap-2">
              {isEdtingAbout ? (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      className={`flex-1 bg-transparent border-b-2 border-[#00a884] outline-none py-1`}
                      value={about}
                      onChange={(e) => setabout(e.target.value)}
                      autoFocus
                    />
                    <FaSmile className="cursor-pointer text-gray-400" onClick={() => setshowAboutEmoji(!showAboutEmoji)} />
                    <FaCheck className="cursor-pointer text-[#00a884]" onClick={() => handleSave('about')} />
                  </div>
                  {showAboutEmoji && (
                    <div className="absolute z-50 mt-10">
                      <EmojiPicker onEmojiClick={(emoji) => handleEmojiSelect(emoji, 'about')} theme={isDarkMode ? 'dark' : 'light'} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-lg">{about || "Hey there! I am using WhatsApp."}</span>
                  <FaPencilAlt className="cursor-pointer text-gray-400 hover:text-[#00a884]" onClick={() => setisEdtingAbout(true)} />
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;