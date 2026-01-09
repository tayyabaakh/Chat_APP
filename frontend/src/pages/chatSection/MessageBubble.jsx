import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { FaCheck, FaCheckDouble, FaSmile, FaPlus, FaCopy, FaTrash } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import useOutsideClick from '../../hooks/useOutsideClick ';

const MessageBubble = ({ message, theme, onReact, isOwn, deleteMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const optionsRef = useRef(null);

  const isDark = theme === 'dark';

  // Quick reaction list
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
    setShowEmojiPicker(false);
  };

  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));
  useOutsideClick(reactionsMenuRef, () => setShowReactions(false));
  useOutsideClick(optionsRef, () => setShowOptions(false));

  return (
    <div className={`flex w-full mb-3 px-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="relative group max-w-[85%] md:max-w-[70%]">

        {/* --- REACTION SELECTION MENU --- */}
        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`absolute -top-12 z-[50] flex items-center gap-2 p-1.5 rounded-full shadow-xl border animate-in zoom-in duration-200 ${isOwn ? 'right-0' : 'left-0'
              } ${isDark ? "bg-[#233138] border-[#374045]" : "bg-white border-gray-200"
              }`}
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-transform text-xl px-0.5"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="p-1 rounded-full hover:bg-black/10 text-gray-400"
            >
              <FaPlus size={12} />
            </button>
          </div>
        )}

        {/* --- FULL EMOJI PICKER --- */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute z-[60] bottom-full mb-2 right-0 shadow-2xl">
            <EmojiPicker
              theme={isDark ? "dark" : "light"}
              onEmojiClick={(val) => handleReact(val.emoji)}
              width={300}
              height={400}
            />
          </div>
        )}

        {/* --- MESSAGE BUBBLE --- */}
        <div className={`relative px-4 py-2 rounded-xl shadow-sm ${isDark
          ? (isOwn ? "bg-[#005c4b] text-[#e9edef]" : "bg-[#202c33] text-[#e9edef]")
          : (isOwn ? "bg-[#d9fdd3] text-[#111b21]" : "bg-[#ffffff] text-[#111b21]")
          }`}>

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Media content */}
              {(message.contentType === 'image' || message.contentType === 'video') && (
                <div className="mb-2 -mx-1 -mt-0.5 rounded overflow-hidden">
                  {message.contentType === 'video' ? (
                    <video controls className="w-full max-h-72 bg-black">
                      <source src={message.imageOrVideoUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={message.imageOrVideoUrl} alt="attachment" className="w-full max-h-72 object-cover" />
                  )}
                </div>
              )}

              {message.content && (
                <p className="text-[14.5px] leading-tight break-words pr-2 mt-1">
                  {message.content}
                </p>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setShowOptions(!showOptions)} className="p-1 hover:bg-black/10 rounded-full">
                <HiDotsVertical size={14} className="opacity-60" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 mt-0.5 select-none h-4">
            <span className="text-[10px] opacity-60 font-medium">
              {/* Adding a check to ensure we have a valid date object */}
              {message.createdAt ? format(new Date(message.createdAt), "hh:mm aa") : '--:--'}
            </span>
            {isOwn && (
              <div className="flex ml-0.5">
                {message.messageStatus === "sent" && <FaCheck size={9} className="opacity-60" />}
                {message.messageStatus === "delivered" && <FaCheckDouble size={9} className="opacity-60" />}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={9} className="text-[#53bdeb]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- DISPLAYED REACTIONS (Badges) --- */}
        {message.reaction && message.reaction.length > 0 && (
          <div className={`absolute -bottom-3 flex gap-0.5 items-center bg-[#202c33] border border-[#313d45] rounded-full px-2 py-0.5 shadow-lg z-10 ${isOwn ? "right-0" : "left-0"
            }`}>
            {message.reaction.map((r, i) => (
              <span key={i} className="text-[12px]">
                {/* r.emoji matches your schema field name */}
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* --- OPTIONS MENU --- */}
        {showOptions && (
          <div ref={optionsRef} className={`absolute z-20 top-8 ${isOwn ? "right-0" : "left-0"} w-32 shadow-2xl rounded-md py-1 border border-black/10 ${isDark ? "bg-[#233138] text-white" : "bg-white text-black"}`}>
            <button onClick={() => navigator.clipboard.writeText(message.content)} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10">
              <FaCopy size={12} /> Copy
            </button>
            <button onClick={() => deleteMessage(message._id)} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 text-red-500">
              <FaTrash size={12} /> Delete
            </button>
          </div>
        )}

        {/* --- SMILE TRIGGER --- */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-200 transition-opacity z-10 ${isOwn ? "-left-10" : "-right-10"
            } ${showReactions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <FaSmile size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageBubble;