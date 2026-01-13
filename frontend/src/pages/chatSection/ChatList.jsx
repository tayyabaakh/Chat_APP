

import React, { useState } from 'react'
import useLayoutStore from '../../store/layoutStore';
import userThemeStore from '../../store/ThemeStore';
import useUserStore from '../../store/useUserStore';
import { Search, ListFilter } from 'lucide-react'; // Optional: for icons

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact);
  const selectedContact = useLayoutStore(state => state.selectedContact);
  const { theme } = userThemeStore();
  const { user } = useUserStore();
  const [search, setSearch] = useState("");

  // Existing Logic (Fixed typo: 'usename' to match your database keys if needed, 
  // but kept as 'usename' per your request to not change logic)
  const filteredContacts = contacts?.filter((contact) =>
    contact?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full border-r ${theme === 'dark' ? 'bg-[#111b21] border-gray-700' : 'bg-white border-gray-200'}`}>

      {/* Header & Search Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Chats</h1>
          <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <ListFilter size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-gray-100'}`}>
          <Search size={18} className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm py-1"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredContacts?.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact?._id}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors
                ${selectedContact?._id === contact?._id
                  ? (theme === 'dark' ? 'bg-[#2a3942]' : 'bg-gray-200')
                  : (theme === 'dark' ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50')
                }`}
            >
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                  {contact?.profilePicture ? (
                    <img
                      src={contact.profilePicture}
                      alt={contact.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                      {contact?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {/* Online Status Dot */}
                {contact?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#111b21] rounded-full"></div>
                )}
              </div>

              {/* Contact Info */}
              {/* Contact Info */}
              <div className="ml-4 flex-1 border-b border-gray-700/30 pb-3 h-full">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
                    {contact?.username || contact?.email}
                  </h3>
                  {/* Display time from last message if it exists */}
                  <span className="text-xs text-gray-500">
                    {contact?.conversation?.lastMessage ?
                      new Date(contact.conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' ,hour12: true})
                      : ""}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500 truncate w-40">
                    {/* Show last message content if available, otherwise show status */}
                    {contact?.conversation?.lastMessage?.content || (contact?.isOnline ? 'Active now' : 'Hey there!')}
                  </p>

                  {/* --- CONVERSATION COUNT BADGE --- */}
                  {contact?.conversation?.unreadCounts > 0 && (
                    <div className="bg-[#00a884] text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
                      {/* If you have an unreadCount field, use it here. For now, showing '1' as placeholder */}
                      {contact?.conversation?.unreadCounts }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-500">
            <p className="text-sm">No contacts found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatList