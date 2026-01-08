// import React, { useEffect, useState } from 'react'
// import userThemeStore from '../store/ThemeStore';
// import { useLocation } from 'react-router-dom';
// import useUserStore from '../store/useUserStore';
// import useLayoutStore from '../store/layoutStore';

// const Sidebar = () => {
//    const location = useLocation();
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
//   const { theme, setTheme } = userThemeStore();
//   const {user} = useUserStore();
//   const {activeTab,setACtiveTab,selectedContact}= useLayoutStore();
  
//   useEffect(() => {

//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768)
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener('resize', handleResize)
//   }, [])

// useEffect(()=>{
//   if(location.pathname === '/'){
//     setACtiveTab ("chats")
//   }else if (location.pathname ==='status'){
//     setACtiveTab("status")
//   }else if (location.pathname === 'user-profile'){
//     setACtiveTab('profile')
//   }else if (location.pathname === 'setting'){
//     setACtiveTab("setting")
//   }
// },[location,setACtiveTab])

// if(isMobile && setACtiveTab){
//   return null;
// }
// const SidebarContent =()

//   return (
//     <div>Sidebar</div>
//   )
// }

// export default Sidebar

import React, { useEffect, useState } from 'react'
import userThemeStore from '../store/ThemeStore';
import { useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useLayoutStore from '../store/layoutStore';
import { FaWhatsapp } from "react-icons/fa";
// Icons (Assuming you are using lucide-react or similar, or use SVGs)
import { MessageSquare, CircleDashed, UserCircle, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { theme, setTheme } = userThemeStore();
  const { user } = useUserStore();
  const { activeTab, setACtiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (location.pathname === '/') {
      setACtiveTab("chats")
    } else if (location.pathname === '/status') {
      setACtiveTab("status")
    } else if (location.pathname === '/user-profile') {
      setACtiveTab('profile')
    } else if (location.pathname === '/setting') {
      setACtiveTab("setting")
    }
  }, [location, setACtiveTab])

  // Hide sidebar on mobile if a contact is selected (WhatsApp behavior)
  if (isMobile && selectedContact) {
    return null;
  }

  const navItems = [
    { id: 'Whatsapp', icon: <FaWhatsapp  size={24} />, path: '/' },
    { id: 'chats', icon: <MessageSquare size={24} />, path: '/' },
    { id: 'status', icon: <CircleDashed size={24} />, path: '/status' },
    { id: 'profile', icon: <UserCircle size={24} />, path: '/user-profile' },
    { id: 'setting', icon: <Settings size={24} />, path: '/setting' },
  ];

  const NavIcon = ({ item }) => (
    <div
      onClick={() => navigate(item.path)}
      className={`relative p-3 cursor-pointer rounded-xl transition-all duration-200 
        ${activeTab === item.id 
          ? (theme === 'dark' ? 'bg-[#2a3942] text-[#00a884]' : 'bg-gray-200 text-[#00a884]') 
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a3942]'}`}
    >
      {item.icon}
      {activeTab === item.id && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00a884] rounded-r-full hidden md:block" />
      )}
    </div>
  );

  return (
    <nav className={`
      ${isMobile 
        ? 'fixed bottom-0 left-0 right-0 h-16 border-t flex-row justify-around items-center' 
        : 'w-16 flex-col justify-between items-center py-4 border-r'} 
      flex ${theme === 'dark' ? 'bg-[#202c33] border-gray-700' : 'bg-white border-gray-400'} z-40`}
    >
      {/* Top Icons (Desktop) / Main Icons (Mobile) */}
      <div className={`flex ${isMobile ? 'flex-row w-full justify-around' : 'flex-col space-y-4'}`}>
        {navItems.map((item) => (
          <NavIcon key={item.id} item={item} />
        ))}
      </div>

      {/* Bottom Icons (Only Desktop) */}
      {!isMobile && (
        <div className="flex flex-col items-center space-y-4">
          <button className="text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={24} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-400 overflow-hidden border border-gray-600">
            {user?.profilePicture ? <img src={user.profilePicture} alt="profile" /> : <div className="w-full h-full bg-blue-500" />}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Sidebar;