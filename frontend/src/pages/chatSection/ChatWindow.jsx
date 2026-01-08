import React, { useEffect, useRef, useState } from 'react'
import userThemeStore from '../../store/ThemeStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/ChatStore';
import { isToday, isYesterday, format } from 'date-fns'
import { Send, Paperclip, Image, Video, FileText, Smile, ArrowLeft, MoreVertical, X, Check, CheckCheck } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble'; // Assuming you'll create this

const isValidate = (date) => {
    return date instanceof Date && !isNaN(date)
}

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
    const [message, setMessage] = useState('');
    const [showEmoji, setshowEmoji] = useState(false);
    const [showFileMenu, setshowFileMenu] = useState(false);
    const [filePreview, setfilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const { theme } = userThemeStore();
    const { user } = useUserStore();
    const { messages, loading, sendMessage, fetchMessage, fetchConversation, conversations, startTyping, stopTyping, isUserTyping, getUserLastSeen, isUserOnline } = useChatStore();

    const online = isUserOnline(selectedContact?._id)
    const lastSeen = getUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id)

    console.log(lastSeen);
    
    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setshowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedContact?._id && conversations?.data?.length > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some((participant) => participant._id === selectedContact?._id))
            if (conversation?._id) {
                fetchMessage(conversation._id)
            }
        }
    }, [selectedContact, conversations])

    useEffect(() => {
        fetchConversation();
    }, []);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact?._id);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact?._id)
            }, 2000);
        }
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) }
    }, [message, selectedContact]);

    const handleFileChange = (e) => {
        const file = e.target.files[0]; // Fixed typo: e.target.files
        if (file) {
            setSelectedFile(file);
            setshowFileMenu(false);
            if (file.type.startsWith('image/')) {
                setfilePreview(URL.createObjectURL(file))
            } else {
                setfilePreview('document'); // placeholder for non-image files
            }
        }
    }

    const onEmojiClick = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
    };

    const handleSendMessage = async () => {
        if (!selectedContact) return;
        try {
            const formData = new FormData();
            formData.append("senderId", user?._id)
            formData.append("receiverId", selectedContact?._id) // Fixed key to match backend expectations
            const status = online ? "delivered" : "sent";
            formData.append("messageStatus", status)

            if (message.trim()) formData.append("content", message.trim());
            if (selectedFile) formData.append("media", selectedFile);

            if (!message.trim() && !selectedFile) return;
            
            await sendMessage(formData);

            setMessage("")
            setfilePreview(null)
            setSelectedFile(null)
            setshowFileMenu(false)
            setshowEmoji(false)
        } catch (error) {
            console.error("failed to send message", error);
        }
    }

    const renderDateSeperator = (date) => {
        const d = new Date(date);
        if (!isValidate(d)) return null;
        
        let dateString;
        if (isToday(d)) dateString = "Today";
        else if (isYesterday(d)) dateString = "Yesterday";
        else dateString = format(d, "EEEE, MMMM d");

        return (
            <div className='flex justify-center my-6'>
                <span className={`px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"} `}>
                    {dateString}
                </span>
            </div>
        )
    }

    const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, msg) => {
        if (!msg.createdAt) return acc;
        const date = new Date(msg.createdAt);
        if (isValidate(date)) {
            const dateString = format(date, "yyyy-MM-dd");
            if (!acc[dateString]) acc[dateString] = [];
            acc[dateString].push(msg);
        }
        return acc;
    }, {}) : {};

    if (!selectedContact) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
                <div className="text-center">
                    <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <Send size={40} className="text-gray-500" />
                    </div>
                    <h2 className={`text-2xl font-light ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Select a contact to start chatting</h2>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col h-full relative overflow-hidden ${theme === 'dark' ? 'bg-[#0b141a] text-white' : 'bg-[#efeae2] text-black'}`}>
            
            {/* Header */}
            <header className={`flex items-center justify-between p-3 z-10 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                <div className="flex items-center gap-3">
                    {isMobile && <ArrowLeft className="cursor-pointer" onClick={() => setSelectedContact(null)} />}
                    <div className="relative">
                        <img src={selectedContact.profilePicture || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#202c33] rounded-full"></div>}
                    </div>
                    <div>
                        <h3 className="font-medium text-sm lg:text-base leading-none">{selectedContact.username}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {isTyping ? <span className="text-green-500 italic">typing...</span> : (online ? 'Online' : `Last seen ${lastSeen || 'recently'}`)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </header>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar bg-opacity-10`} 
                 style={{ backgroundImage: theme === 'dark' ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" : "none" }}>
                
                {Object.keys(groupedMessages).map((date) => (
                    <React.Fragment key={date}>
                        {renderDateSeperator(date)}
                        {groupedMessages[date].map((msg) => (
                            <MessageBubble key={msg._id} message={msg} isOwn={msg.sender._id === user._id} />
                        ))}
                    </React.Fragment>
                ))}
                
                {isTyping && (
                    <div className="flex items-center gap-2 mb-4 animate-pulse">
                        <div className={`px-4 py-2 rounded-2xl text-xs ${theme === 'dark' ? 'bg-[#202c33] text-gray-300' : 'bg-white text-gray-500'}`}>
                            {selectedContact.username} is typing...
                        </div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>

            {/* File Preview Overlay */}
            {filePreview && (
                <div className={`absolute bottom-20 left-4 right-4 z-20 p-2 rounded-lg shadow-xl ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">File Preview</span>
                        <X size={18} className="cursor-pointer" onClick={() => {setfilePreview(null); setSelectedFile(null)}} />
                    </div>
                    {filePreview === 'document' ? (
                        <div className="flex items-center gap-2 p-4 bg-gray-100 rounded dark:bg-gray-800">
                            <FileText /> <span className="text-sm truncate">{selectedFile?.name}</span>
                        </div>
                    ) : (
                        <img src={filePreview} alt="preview" className="max-h-40 rounded object-contain mx-auto" />
                    )}
                </div>
            )}

            {/* Footer Input Area */}
            <footer className={`p-2 flex items-center gap-2 z-10 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <Paperclip className="text-gray-400 cursor-pointer hover:text-white" onClick={() => setshowFileMenu(!showFileMenu)} />
                        {showFileMenu && (
                            <div className={`absolute bottom-12 left-0 p-2 rounded-lg flex flex-col gap-3 shadow-2xl ${theme === 'dark' ? 'bg-[#2a3942]' : 'bg-white'}`}>
                                <label className="cursor-pointer hover:scale-110 transition-transform"><Image className="text-blue-500" /><input type="file" hidden accept="image/*" onChange={handleFileChange} /></label>
                                <label className="cursor-pointer hover:scale-110 transition-transform"><Video className="text-purple-500" /><input type="file" hidden accept="video/*" onChange={handleFileChange} /></label>
                                <label className="cursor-pointer hover:scale-110 transition-transform"><FileText className="text-orange-500" /><input type="file" hidden onChange={handleFileChange} /></label>
                            </div>
                        )}
                    </div>
                    <Smile className="text-gray-400 cursor-pointer hover:text-white" onClick={() => setshowEmoji(!showEmoji)} />
                    {showEmoji && (
                        <div className="absolute bottom-16 left-2 z-50" ref={emojiPickerRef}>
                            <EmojiPicker theme={theme} onEmojiClick={onEmojiClick} />
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`flex-1 p-2 px-4 rounded-lg outline-none text-sm ${theme === 'dark' ? 'bg-[#2a3942] text-white placeholder-gray-500' : 'bg-white text-black placeholder-gray-400'}`}
                />

                <button 
                    onClick={handleSendMessage}
                    className="p-2 bg-[#00a884] rounded-full text-white hover:bg-[#06cf9c] transition-colors"
                >
                    <Send size={20} />
                </button>
            </footer>
        </div>
    )
}

export default ChatWindow