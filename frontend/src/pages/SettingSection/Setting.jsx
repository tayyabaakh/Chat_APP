import React, { useState } from 'react';
import userThemeStore from '../../store/ThemeStore';
import { logoutUser } from '../../services/user_services';
import useUserStore from '../../store/useUserStore';
import Layout from '../../components/Layout';
import { FaComment, FaMoon, FaQuestionCircle, FaSearch, FaSignInAlt, FaSun, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export const Setting = () => {
  const [isThemeDialogueOpen, setIsDialogOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // New state for logout popup

  const { theme } = userThemeStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const toggleThemeDialog = () => {
    setIsDialogOpen(!isThemeDialogueOpen);
  };

  // 1. Function to trigger the popup
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // 2. Function that actually performs the logout
  const confirmLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      setShowLogoutConfirm(false);
      navigate("/login"); // Redirect user after logout
    } catch (error) {
      console.log("failed to logout", error);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogueOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div className={`flex h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} `}>
        <div className={`w-[400px] border-r ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className='p-4'>
            <h1 className='text-xl font-semibold mb-4'>Settings</h1>
            
            <div className='relative mb-4'>
              <FaSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <input 
                type="text" 
                placeholder='Search Settings' 
                className={`w-full ${theme === 'dark' ? "bg-[#202c33] text-white" : "bg-gray-100 text-black "} border-none pl-10 placeholder-gray-400 rounded p-2`} 
              />
            </div>

            <div className={`flex items-center gap-4 p-3 ${theme === 'dark' ? "hover:bg-[#202c33]" : "hover:bg-gray-100"} rounded-lg cursor-pointer mb-4`}>
              <img src={user?.profilePicture} alt="profile" className='w-14 h-14 rounded-full' />
              <div>
                <h2 className='font-semibold'>{user?.username}</h2>
                <p className='text-sm text-gray-400'>{user?.about}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className='h-[calc(100vh-280px)] overflow-y-auto'>
              <div className='space-y-1'>
                {[
                  { icon: FaUser, label: "Account", href: "/user-profile" },
                  { icon: FaComment, label: "Chats", href: "/" },
                  { icon: FaQuestionCircle, label: "Help", href: "/help" },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.label}
                    className={`w-full flex items-center gap-3 p-2 rounded ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"}`}
                  >
                    <item.icon className='h-5 w-5' />
                    <div className={`border-b ${theme === 'dark' ? "border-gray-700" : "border-gray-200"} w-full p-4`}>
                      {item.label}
                    </div>
                  </Link>
                ))}

                {/* Theme Button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`w-full flex items-center gap-3 p-2 rounded ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"}`}
                >
                  {theme === "dark" ? <FaMoon className='h-5 w-5' /> : <FaSun className='h-5 w-5' />}
                  <div className={`flex flex-col text-start border-b mt-5 ${theme === 'dark' ? "border-gray-700" : "border-gray-200"} w-full p-2`}>
                    Theme
                    <span className='ml-auto text-sm text-gray-400 '>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <button 
                className={`w-full flex items-center gap-3 p-2 rounded mt-10 md:mt-20 transition-colors ${theme === 'dark' ? 'hover:bg-[#202c33] text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                onClick={handleLogoutClick}
              >
                <FaSignInAlt className='h-5 w-5' />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${theme === 'dark' ? 'bg-[#2b3943] text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-2xl w-full max-w-xs mx-4`}>
            <h3 className="text-lg font-bold mb-2">Logout?</h3>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to log out of your account?
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className={`px-4 py-2 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-md"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};