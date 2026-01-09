import React, { useEffect, useState } from 'react'
import userThemeStore from '../store/ThemeStore';
import { useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import { logoutUser } from '../services/user_services'; // Import your service
import useLayoutStore from '../store/layoutStore';
import { FaWhatsapp } from "react-icons/fa";
import { MessageSquare, CircleDashed, UserCircle, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for modal

  const { theme } = userThemeStore();
  const { user, clearUser } = useUserStore();
  const { activeTab, setACtiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const paths = {
      '/': 'chats',
      '/status': 'status',
      '/user-profile': 'profile',
      '/setting': 'setting'
    };
    setACtiveTab(paths[location.pathname] || 'chats');
  }, [location.pathname, setACtiveTab]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Logic: Only show the main nav icons (ignore the logo for the loop)
  const navItems = [
    { id: 'chats', icon: <MessageSquare size={24} />, path: '/' },
    { id: 'status', icon: <CircleDashed size={24} />, path: '/status' },
    { id: 'profile', icon: <UserCircle size={24} />, path: '/user-profile' },
    { id: 'setting', icon: <Settings size={24} />, path: '/setting' },
  ];

  if (isMobile && selectedContact) return null;

  return (
    <>
      <nav className={`
        ${isMobile 
          ? 'fixed bottom-0 left-0 right-0 h-16 border-t flex-row justify-around items-center' 
          : 'w-16 flex-col justify-between items-center py-4 border-r'} 
        flex ${theme === 'dark' ? 'bg-[#202c33] border-gray-700' : 'bg-[#f0f2f5] border-gray-300'} z-40`}
      >
        {/* TOP SECTION */}
        <div className={`flex ${isMobile ? 'flex-row w-full justify-around' : 'flex-col items-center space-y-4'}`}>
          {!isMobile && (
            <div className="mb-4 text-[#00a884]">
              <FaWhatsapp size={32} />
            </div>
          )}

          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative p-3 cursor-pointer rounded-xl transition-all duration-200 
                ${activeTab === item.id 
                  ? (theme === 'dark' ? 'bg-[#374248] text-[#00a884]' : 'bg-white text-[#00a884] shadow-sm') 
                  : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-[#2a3942]'}`}
            >
              {item.icon}
              {activeTab === item.id && !isMobile && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00a884] rounded-r-full" />
              )}
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION (Desktop only) */}
        {!isMobile && (
          <div className="flex flex-col items-center space-y-6">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={24} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-400 overflow-hidden border border-gray-600 cursor-pointer" onClick={() => navigate('/user-profile')}>
              {user?.profilePicture ? <img src={user.profilePicture} alt="profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-500" />}
            </div>
          </div>
        )}
      </nav>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${theme === 'dark' ? 'bg-[#3b4a54] text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-xl w-80`}>
            <h3 className="text-lg font-bold mb-2">Logout?</h3>
            <p className="text-sm opacity-80 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 hover:bg-black/10 rounded">Cancel</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;