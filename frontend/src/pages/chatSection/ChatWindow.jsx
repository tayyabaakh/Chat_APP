import React, { useEffect, useRef, useState } from 'react';
import { isToday, isYesterday, format } from 'date-fns';
import { 
    Send, Paperclip, Image, Video, FileText, 
    Smile, ArrowLeft, MoreVertical, X 
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

// Stores
import userThemeStore from '../../store/ThemeStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/ChatStore';

// Components
import MessageBubble from './MessageBubble';

const isValidate = (date) => {
    return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
    const [message, setMessage] = useState('');
    const [showEmoji, setshowEmoji] = useState(false);
    const [showFileMenu, setshowFileMenu] = useState(false);
    const [filePreview, setfilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    
    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const { theme } = userThemeStore();
    const { user } = useUserStore();
    const { 
        messages, fetchMessage, fetchConversation, conversations, 
        sendMessage, startTyping, stopTyping, isUserTyping, 
        getUserLastSeen, isUserOnline ,addReaction, deleteMessage
    } = useChatStore();

    const online = isUserOnline(selectedContact?._id);
    const lastSeen = getUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id);

    // Initial Data Fetch
    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    // Fetch messages when contact changes
    useEffect(() => {
        if (selectedContact?._id && conversations?.data?.length > 0) {
            const conversation = conversations.data.find((conv) =>
                conv.participants.some((p) => p._id === selectedContact._id)
            );
            if (conversation?._id) {
                fetchMessage(conversation._id);
            }
        }
    }, [selectedContact, conversations, fetchMessage]);

    // Auto Scroll to Bottom
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Typing Logic
    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact._id);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact._id);
            }, 2000);
        }
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
    }, [message, selectedContact, startTyping, stopTyping]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setshowFileMenu(false);
            if (file.type.startsWith('image/')) {
                setfilePreview(URL.createObjectURL(file));
            } else {
                setfilePreview('document');
            }
        }
    };

    const handleSendMessage = async () => {
        if (!selectedContact || (!message.trim() && !selectedFile)) return;
        
        try {
            const formData = new FormData();
            formData.append("senderId", user?._id);
            formData.append("receiverId", selectedContact?._id);
            formData.append("messageStatus", online ? "delivered" : "sent");

            if (message.trim()) formData.append("content", message.trim());
            if (selectedFile) formData.append("media", selectedFile);

            await sendMessage(formData);

            setMessage("");
            setfilePreview(null);
            setSelectedFile(null);
            setshowEmoji(false);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const renderDateSeperator = (dateString) => {
        const d = new Date(dateString);
        if (!isValidate(d)) return null;
        
        let label;
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";
        else label = format(d, "EEEE, MMMM d");

        return (
            <div className='flex justify-center my-6 sticky top-0 z-10'>
                <span className={`px-4 py-1 rounded-md text-[11px] font-medium shadow-sm uppercase ${
                    theme === 'dark' ? "bg-[#182229] text-[#8696a0]" : "bg-white text-gray-500"
                }`}>
                    {label}
                </span>
            </div>
        );
    };

    const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, msg) => {
        if (!msg.createdAt) return acc;
        const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(msg);
        return acc;
    }, {}) : {};

    if (!selectedContact) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
                <div className="text-center opacity-50">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-dashed border-gray-500 flex items-center justify-center">
                        <Send size={40} />
                    </div>
                    <h2 className="text-xl font-light">Select a contact to start chatting</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full relative overflow-hidden ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]'}`}>
            
            {/* Header */}
            <header className={`flex items-center justify-between p-3 z-20 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                <div className="flex items-center gap-3">
                    {isMobile && <ArrowLeft className="cursor-pointer" onClick={() => setSelectedContact(null)} />}
                    <div className="relative">
                        <img src={selectedContact.profilePicture || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        {online && <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[#00a884] border-2 border-[#202c33] rounded-full"></div>}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-medium text-sm leading-tight">{selectedContact.username}</h3>
                        <p className="text-[11px] text-gray-400">
                            {isTyping ? <span className="text-[#00a884]">typing...</span> : (online ? 'online' : `last seen ${lastSeen || 'recently'}`)}
                        </p>
                    </div>
                </div>
                <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
            </header>

            {/* Chat Area */}
            <div 
                className="flex-1 overflow-y-auto px-4 custom-scrollbar relative"
                style={{ 
                    backgroundImage: theme === 'dark' ? "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" : "none",
                    backgroundBlendMode: 'overlay'
                }}
            >
                {Object.keys(groupedMessages).map((date) => (
                    <React.Fragment key={date}>
                        {renderDateSeperator(date)}
                        {groupedMessages[date].map((msg) => (
                            <MessageBubble 
                                key={msg._id} 
                                message={msg} 
                                theme={theme}
                                isOwn={String(msg.sender._id) === String(user?._id)}
                                onReact={(msgId, emoji) =>addReaction(msgId, emoji)}
                                deleteMessage={(msgId) => deleteMessage(msgId)}
                            />
                        ))}
                    </React.Fragment>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start mb-4">
                        <div className={`px-4 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-[#202c33] text-gray-300' : 'bg-white text-gray-500'}`}>
                            {selectedContact.username} is typing...
                        </div>
                    </div>
                )}
                <div ref={messageEndRef} />
            </div>

            {/* File Preview Overlay */}
            {filePreview && (
                <div className={`absolute bottom-20 left-4 right-4 z-30 p-3 rounded-lg shadow-2xl ${theme === 'dark' ? 'bg-[#2a3942]' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-[#00a884]">Preview</span>
                        <X size={18} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => {setfilePreview(null); setSelectedFile(null)}} />
                    </div>
                    {filePreview === 'document' ? (
                        <div className="flex items-center gap-3 p-4 bg-black/10 rounded">
                            <FileText className="text-orange-500" /> 
                            <span className="text-sm truncate max-w-[200px]">{selectedFile?.name}</span>
                        </div>
                    ) : (
                        <img src={filePreview} alt="preview" className="max-h-48 rounded object-contain mx-auto" />
                    )}
                </div>
            )}

            {/* Footer */}
            <footer className={`p-2 flex items-center gap-2 z-20 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Paperclip 
                            className={`cursor-pointer hover:scale-110 transition-transform ${showFileMenu ? 'text-[#00a884]' : 'text-gray-400'}`} 
                            onClick={() => setshowFileMenu(!showFileMenu)} 
                        />
                        {showFileMenu && (
                            <div className={`absolute bottom-12 left-0 p-3 rounded-xl flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 ${theme === 'dark' ? 'bg-[#233138]' : 'bg-white'}`}>
                                <label className="cursor-pointer hover:text-blue-500"><Image size={20}/><input type="file" hidden accept="image/*" onChange={handleFileChange} /></label>
                                <label className="cursor-pointer hover:text-purple-500"><Video size={20}/><input type="file" hidden accept="video/*" onChange={handleFileChange} /></label>
                                <label className="cursor-pointer hover:text-orange-500"><FileText size={20}/><input type="file" hidden onChange={handleFileChange} /></label>
                            </div>
                        )}
                    </div>
                    <Smile 
                        className={`cursor-pointer hover:scale-110 transition-transform ${showEmoji ? 'text-[#00a884]' : 'text-gray-400'}`} 
                        onClick={() => setshowEmoji(!showEmoji)} 
                    />
                    {showEmoji && (
                        <div className="absolute bottom-16 left-2 z-50 shadow-2xl" ref={emojiPickerRef}>
                            <EmojiPicker theme={theme === 'dark' ? 'dark' : 'light'} onEmojiClick={(emoji) => setMessage(prev => prev + emoji.emoji)} />
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`flex-1 p-2.5 px-4 rounded-lg outline-none text-sm ${
                        theme === 'dark' ? 'bg-[#2a3942] text-white' : 'bg-white text-black'
                    }`}
                />

                <button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() && !selectedFile}
                    className="p-2.5 bg-[#00a884] rounded-full text-white hover:bg-[#06cf9c] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    <Send size={20} />
                </button>
            </footer>
        </div>
    );
};

export default ChatWindow;