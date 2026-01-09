// import { create } from "zustand";
// import { getSocket } from "../services/chat_services";
// import axiosInstance from "../services/url_services";
// // import { sendMessage } from "../../../backend/src/controllers/chatController";

// export const useChatStore = create((get, set) => ({
//     conversations: [],
//     currentConversation: null,
//     messages: [],
//     loading: false,
//     error: null,
//     onlineUsers: new Map(),
//     typingUsers: new Map(),

//     // socket event Listners setup
//     initsocketListners: () => {
//         const socket = getSocket();
//         if (!socket) return;
//         // remove existing listeners to prevent duplicate handlers

//         socket.off("recieve_message")
//         socket.off("user_typing")
//         socket.off("user_status");
//         socket.off("message_send");

//         socket.off("message_error");
//         socket.off("message deleted");

//         // listen for incoming message
//         socket.on("recieve_message", (message) => {

//         })
//         // confirm message delivery 
//         socket.on("message_send", (message) => {
//             set((state) => ({
//                 messages: state.messages.map((msg) => {
//                     msg._id === message._id ? { ...msg } : msg
//                 })

//             }))
//         });
//         // update message status
//         socket.on("message_status_update", ({ messageId, messageStatus }) => {
//             set((state) => ({
//                 messages: state.messages.map((msg) => {
//                     msg._id === messageId ? { ...msg, messageStatus } : msg
//                 })
//             }))
//         });
//         // handle reactin on message
//         socket.on("reaction_update", ({ messageId, reaction }) => {
//             set((state) => ({
//                 messages: state.messages.map((msg) => {
//                     msg._id === messageId ? { ...msg, reaction } : msg
//                 })
//             }))
//         });

//         // handle remove message from local state

//         socket.on("message_deleted", ({ deletedMessageId }) => {
//             set((state) => ({
//                 messages: state.messages.filter((msg) => msg._id !== deletedMessageId)

//             }))
//         });


//         // handle any message sending error
//         socket.on("message_error", (error) => {
//             console.error("message error", error);

//         });

//         // listner for typing users
//         socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
//             set((state) => {
//                 const newTypingUsers = new Map(state.typingUsers);
//                 if (!newTypingUsers.has(conversationId)) {
//                     newTypingUsers.set(conversationId, new Set())
//                 }
//                 const typingSet = newTypingUsers.get(conversationId);
//                 if (isTyping) {
//                     typingSet.add(userId)
//                 } else {
//                     typingSet.delete(userId)
//                 }
//                 return { typingUsers: newTypingUsers }
//             })
//         })
//         // track user's online/offline status
//         socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
//             set((state) => {
//                 const newOnlineUsers = new Map(state.onlineUsers);
//                 newOnlineUsers.set(userId, { isOnline, lastSeen });
//                 return { onlineUsers: newOnlineUsers }
//             })
//         })
//         // emit status check for all users in conversation list
//         const { conversations } = get();
//         if (conversations?.data?.length > 0) {
//             conversations.data?.forEach((conv) => {
//                 const otherUser = conv.participants.find(
//                     (p) => p._id !== get().currentUser._id
//                 );
//                 if (otherUser._id) {
//                     socket.emit("get_user_status", otherUser._id, (status) => {
//                         set((state) => {
//                             const newOnlineUsers = new Map(state.onlineUsers);
//                             newOnlineUsers.set(state.userId, {
//                                 isOnline: state.isOnline,
//                                 lastSeen: state.lastSeen
//                             });
//                             return { onlineUsers: newOnlineUsers }
//                         })
//                     })
//                 }
//             })
//         }
//     },
//     setCurrentUser: (user) => set({ currentUser: user }),

//     fetchConversation: async () => {
//         set({ loading: true, error: null });

//         try {
//             const { data } = await axiosInstance.get("/chats/conversations")
//             set({ conversations: data, loading: false });
//                 get().initsocketListners();
//             return data;
//         } catch (error) {
//             set({
//                 error: error?.response?.data?.message || error?.message,
//                 loading: false
//             });
//             return null;

//         }
//     },
//     // fetch message for a conversation
//     fetchMessage: async (conversationId) => {
//         if (!conversationId) return;

//         set({ loading: true, error: null })
//         try {
//             const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`)
//             const messageArray = data.data || data || [];

//             set({
//                 messages: messageArray,
//                 currentConversation: conversationId,
//                 loading: false

//             })
//             const {markMessageAsRead}= get();
//             markMessageAsRead();


//             return messageArray
//         } catch (error) {
//             set({
//                 error: error?.response?.data?.message || error?.message,
//                 loading: false
//             });
//             return [];

//         }

//     },

//     // send message in real time
//     sendMessage:async (formData)=>{
//         const senderId = formData.get("senderId");
//         const receiverId = formData.get("receiverId");
//         const media = formData.get("media")
//         const content= formData.get("content")
//         const messageStatus = formData.get("messageStatus");

//         const socket = getSocket();
//         const {conversations}=get();
//         let conversationId =null;
//         if(conversations?.data?.length > 0){
//             const conversation =conversations.data.find((conv)=>
//             conv.participants.some((p)=> p._id === senderId) && 
//         conv.participants.some((p)=> p._id === receiverId));
//         if(conversation){
//             conversationId = conversation._id;
//             set({currentConversation:conversationId})
//         }
//         }
//         // temp message before actual response

//         const tempId =`temp-${Date.now()}`;
//         const optimisticMessage ={
//             _id:tempId,
//             sender:{_id:receiverId},
//             conversation:conversationId,
//             imageorVideoUrl : media && typeof media !=='string'? URL.createObjectURL(media):null,
//             content:content,
//             contentType:media ? media.type.startsWith("image") ? "image":"video":"text",
//             createdAt: new Date().toISOString(),
//             messageStatus,
//         };
//         set((state)=>({
//             messages:[...state.message,optimisticMessage]
//         }));
//         try {
//             const {data} = await axiosInstance.post("/chats/send-message",formData,
//                 {headers:{"Content-Type":"multipart/form-data"}}
//             );
//             const messageData = data.data || data;
//             // replace optimistic message woth real one
//             set((state)=>({
//                 messages:state.messages.map((msg)=>
//                 msg._id === tempId ? messageData : msg )
//             }));
//             return messageData;
//         } catch (error) {
//             console.error("Error sending message",error);
//             set((state)=>({
//                 messages:state.messages.map((msg)=>
//                 msg._id === tempId ? {...msg,messageStatusL:"failed"}:msg),
//                 error:error?.response?.data?.message || error?.message,

//             }))
//             throw error;

//         }
//     },

//     receiveMessage:(message)=>{
//         if(!message) return;
//     const {currentConversation,currentUser,messages}=get();
//     const messageExists = message.some((msg)=>msg._id === message._id)
//     if(messageExists) return;

//     if(message.conversation ===currentConversation){
//         set((state)=>({
//             messages:[...state.messages,message]
//         }));
//     }


//     // automatically markm as read
//     if(message.receiver?._id === currentUser?._id){
//         get().markMessageAsRead();
//     }
//     // update conversation preview and unread count
//     set((state)=>{
//         const updateConversations  = state.conversations?.data?.map((conv)=>{
//             if(conv._id === message.conversation){
//                 return{
//                     ...conv,
//                     lastMessage:message,
//                     unreadCount:message?.receiver?._id ===currentUser?._id
//                     ?(conv.unreadCount || 0) + 1
//                     : conv.unreadCount || 0
//                 }
//             }
//             return conv;

//         });
//         return {
//             conversations:{
//                 ...state.conversations,
//                 data:updateConversations,

//             }
//         }
//     })
//     },

//     // mark  as read
//     markMessageAsRead :async ()=>{
//         const {messages,currentUser} =get();
//         if(!messages.length || !currentUser) return;
//         const unreadIds  = messages.filter((msg)=> msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id).map((msg)=>msg._id).filter(Boolean);
//         if(unreadIds.length === 0) return;
//         try {
//             const {data} =await axiosInstance.put("/chats/messages/read",{
//                 messageIds:unreadIds
//             });
//             console.log("message mark as read ", data);

//             set((state)=>({
//                 messages:state.messages.map((msg)=>
//                 unreadIds.include(msg._id)?{...msg,messageStatus:"read"}:msg)
//             }));
//             const socket = getSocket();
//             if(socket){
//                 socket.emit("message_read",{
//                     messageIds:unreadIds,
//                     senderIds:messages[0]?.sender?.id
//                 })
//             }
//         } catch (error) {
//             console.error("failed to mark message as read",error);

//         }
//     },
//     deleteMessage : async (messageId)=>{
//         try {
//             await axiosInstance.delete(`/chats/messages/${messageId}`);
//             set((state)=>({
//                 messages:state.messages?.filter((msg)=>msg?.id == messageId)
//             }))
//         } catch (error) {
//             console.log("error deleting message", error);
//             set({error:error.response?.data?.message || error.message})
//             return false;

//         }
//     },
//     //  add/change reactions
//     addReaction: async (messageId,emoji) => {
//         const socket = getSocket();
//         const {currentUser} = get();
//         if(socket && currentUser){
//             socket.emit ("add_reaction",{
//                 messageId,
//                 emoji,
//                 userId:currentUser?._id
//             })
//         }
//     },
//     startTyping : (receiverId)=>{
//         const {currentConversation} = get();
//         const socket =getSocket();
//         if(socket && currentConversation && receiverId){
//             socket.emit("typing_start",{
//                 conversationId:currentConversation,
//                 receiverId
//             })
//         } 
//     },
//      stopTyping : (receiverId)=>{
//         const {currentConversation} = get();
//         const socket =getSocket();
//         if(socket && currentConversation && receiverId){
//             socket.emit("typing_stop",{
//                 conversationId:currentConversation,
//                 receiverId
//             })
//         } 
//     },

// isUserTyping :(userId)=>{
//     const {typingUsers,currentConversation}= get();
//     if(!currentConversation || !typingUsers.has(currentConversation) || !userId){
//         return false;
//     }
//     return false;
// },
// isUserOnline :(userId)=>{
//     if(!userId) return null;
//     const {onlineUsers}= get();
//     return onlineUsers.get(userId)?.isOnline || false;
// },
// getUserLastSeen :(userId)=>{
//     if(!userId) return null;
//     const {onlineUsers}= get();
//     return onlineUsers.get(userId)?.lastSeen || null;

// },
// cleanup:()=>{
//     set({
//         conversations:[],
//         currentConversation:null,
//         messags:[],
//         onlineUsers:new Map(),
//         typingUsers: new Map(),

//     })
// }

// }))

import { create } from "zustand";
import { getSocket } from "../services/chat_services";
import axiosInstance from "../services/url_services";

// Corrected parameter order: set is first, get is second
export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    currentUser: null, // Added to ensure get().currentUser works
    onlineUsers: new Map(),
    typingUsers: new Map(),

    // socket event Listeners setup
    initsocketListners: () => {
        const socket = getSocket();
        if (!socket) return;

        // remove existing listeners to prevent duplicate handlers
        socket.off("recieve_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");

        // listen for incoming message
        socket.on("recieve_message", (message) => {
            get().receiveMessage(message);
        });

        // confirm message delivery 
        socket.on("message_send", (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id ? { ...msg } : msg
                )
            }));
        });

        // update message status
        socket.on("message_status_update", ({ messageId, messageStatus }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, messageStatus } : msg
                )
            }));
        });

        // handle reaction on message
        // socket.on("reaction_update", ({ messageId, reaction }) => {
        //     set((state) => ({
        //         messages: state.messages.map((msg) => 
        //             msg._id === messageId ? { ...msg, reaction } : msg
        //         )
        //     }));
        // });

        // Inside initsocketListners...
        socket.on("reaction_update", ({ messageId, reaction }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    // Check if this is the message that was reacted to
                    msg._id === messageId
                        ? { ...msg, reactions: reaction } // Ensure your backend returns the updated reaction object/array
                        : msg
                )
            }));
        });

        // handle remove message from local state
        socket.on("message_deleted", ({ deletedMessageId }) => {
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== deletedMessageId)
            }));
        });

        // handle any message sending error
        socket.on("message_error", (error) => {
            console.error("message error", error);
        });

        // listener for typing users
        socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers);
                if (!newTypingUsers.has(conversationId)) {
                    newTypingUsers.set(conversationId, new Set());
                }
                const typingSet = newTypingUsers.get(conversationId);
                if (isTyping) {
                    typingSet.add(userId);
                } else {
                    typingSet.delete(userId);
                }
                return { typingUsers: newTypingUsers };
            });
        });

        // track user's online/offline status
        socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(userId, { isOnline, lastSeen });
                return { onlineUsers: newOnlineUsers };
            });
        });

        // emit status check for all users in conversation list
        const { conversations } = get();
        if (conversations?.data?.length > 0) {
            conversations.data?.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p) => p._id !== get().currentUser?._id
                );
                if (otherUser?._id) {
                    socket.emit("get_user_status", otherUser._id, (status) => {
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers);
                            newOnlineUsers.set(otherUser._id, {
                                isOnline: status.isOnline,
                                lastSeen: status.lastSeen
                            });
                            return { onlineUsers: newOnlineUsers };
                        });
                    });
                }
            });
        }
    },

    setCurrentUser: (user) => set({ currentUser: user }),

    fetchConversation: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get("/chats/conversations");
            set({ conversations: data, loading: false });
            get().initsocketListners();
            return data;
        } catch (error) {
            set({
                error: error?.response?.data?.message || error?.message,
                loading: false
            });
            return null;
        }
    },

    fetchMessage: async (conversationId) => {
        if (!conversationId) return;
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);
            const messageArray = data.data || data || [];
            set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false
            });
            get().markMessageAsRead();
            return messageArray;
        } catch (error) {
            set({
                error: error?.response?.data?.message || error?.message,
                loading: false
            });
            return [];
        }
    },

    sendMessage: async (formData) => {
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");

        const { conversations } = get();
        let conversationId = null;
        if (conversations?.data?.length > 0) {
            const conversation = conversations.data.find((conv) =>
                conv.participants.some((p) => p._id === senderId) &&
                conv.participants.some((p) => p._id === receiverId));
            if (conversation) {
                conversationId = conversation._id;
                set({ currentConversation: conversationId });
            }
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: senderId }, // Logic: sender is the one sending
            conversation: conversationId,
            imageorVideoUrl: media && typeof media !== 'string' ? URL.createObjectURL(media) : null,
            content: content,
            contentType: media ? (media.type.startsWith("image") ? "image" : "video") : "text",
            createdAt: new Date().toISOString(),
            messageStatus,
        };

        set((state) => ({
            messages: [...state.messages, optimisticMessage]
        }));

        try {
            const { data } = await axiosInstance.post("/chats/send-message", formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            const messageData = data.data || data;
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? messageData : msg)
            }));
            return messageData;
        } catch (error) {
            console.error("Error sending message", error);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg),
                error: error?.response?.data?.message || error?.message,
            }));
            throw error;
        }
    },

    receiveMessage: (message) => {
        if (!message) return;
        const { currentConversation, currentUser, messages } = get();
        const messageExists = messages.some((msg) => msg._id === message._id);
        if (messageExists) return;

        if (message.conversation === currentConversation) {
            set((state) => ({
                messages: [...state.messages, message]
            }));
        }

        if (message.receiver?._id === currentUser?._id) {
            get().markMessageAsRead();
        }

        set((state) => {
            const updateConversations = state.conversations?.data?.map((conv) => {
                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount: message?.receiver?._id === currentUser?._id
                            ? (conv.unreadCount || 0) + 1
                            : conv.unreadCount || 0
                    };
                }
                return conv;
            });
            return {
                conversations: {
                    ...state.conversations,
                    data: updateConversations,
                }
            };
        });
    },

    markMessageAsRead: async () => {
        const { messages, currentUser } = get();
        if (!messages.length || !currentUser) return;
        const unreadIds = messages
            .filter((msg) => msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id)
            .map((msg) => msg._id)
            .filter(Boolean);

        if (unreadIds.length === 0) return;
        try {
            const { data } = await axiosInstance.put("/chats/messages/read", {
                messageIds: unreadIds
            });

            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg)
            }));

            const socket = getSocket();
            if (socket) {
                socket.emit("message_read", {
                    messageIds: unreadIds,
                    senderIds: messages[0]?.sender?._id // Fixed .id to ._id
                });
            }
        } catch (error) {
            console.error("failed to mark message as read", error);
        }
    },

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`);
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId)
            }));
        } catch (error) {
            set({ error: error.response?.data?.message || error.message });
            return false;
        }
    },

    // addReaction: async (messageId, emoji) => {
    //     const socket = getSocket();
    //     const { currentUser } = get();
    //     if (socket && currentUser) {
    //         socket.emit("add_reaction", {
    //             messageId,
    //             emoji,
    //             userId: currentUser?._id
    //         });
    //     }
    // },

    addReaction: async (messageId, emoji) => {
        const socket = getSocket();
        const { currentUser, messages } = get();
        if (!socket || !currentUser) return;

        // 1. Emit to backend
        socket.emit("add_reaction", {
            messageId,
            emoji,
            userId: currentUser._id
        });

        // 2. Optimistic Update (Optional but recommended)
        // This makes the UI feel fast by updating before the server responds
        set((state) => ({
            messages: state.messages.map((msg) => {
                if (msg._id === messageId) {
                    // Logic depends on if 'reactions' is an array or a single object
                    return { ...msg, lastReaction: emoji };
                }
                return msg;
            })
        }));
    },
    startTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_start", {
                conversationId: currentConversation,
                receiverId
            });
        }
    },

    stopTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_stop", {
                conversationId: currentConversation,
                receiverId
            });
        }
    },

    isUserTyping: (userId) => {
        const { typingUsers, currentConversation } = get();
        if (!currentConversation || !typingUsers.has(currentConversation) || !userId) {
            return false;
        }
        return typingUsers.get(currentConversation).has(userId);
    },

    isUserOnline: (userId) => {
        if (!userId) return false;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },

    getUserLastSeen: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.lastSeen || null;
    },

    cleanup: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map(),
        });
    }
}));