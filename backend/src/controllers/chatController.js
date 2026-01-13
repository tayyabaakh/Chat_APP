const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const response = require('../utils/responseHandler');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');

// ---------------------------------------------------------
// 1. SEND MESSAGE: Naya message bhejna (Text ya Media)
// ---------------------------------------------------------
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file; // Multer middleware se file pakarna

        if (!senderId || !receiverId) {
            return response(res, 400, "Sender and Receiver IDs are required");
        }

        // Participants ko sort karna taake A->B aur B->A ki conversation ek hi ID par milay
        const participants = [senderId, receiverId].sort();

        // Check karna ke kya pehlay se in do users ki koi conversation exist karti hai?
        let conversation = await Conversation.findOne({ participants });
        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = "text";

        // Agar user ne file bheji hai (Image/Video)
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media");
            }
            imageOrVideoUrl = uploadFile.secure_url;

            // File type check karke content type set karna
            if (file.mimetype.startsWith('image')) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            } else {
                return response(res, 400, "Unsupported file type");
            }
        } else if (content?.trim()) {
            contentType = "text";
        } else {
            return response(res, 400, "Message content is required");
        }

        // Message object create aur save karna
        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus: messageStatus || "sent"
        });

        await message.save();

        // Conversation metadata update karna (Last message aur unread count)
        conversation.lastMessage = message._id;
        conversation.unreadCounts = (conversation.unreadCounts || 0) + 1;
        await conversation.save();

        // Message ke sath sender aur receiver ki basic info (username, pic) populate karna
        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // --- REAL-TIME SOCKET LOGIC ---
        // Agar receiver online hai, toh usay foran message emit karna
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
                // Status "delivered" mark karna kyunki receiver ne receive kar liya
                populatedMessage.messageStatus = "delivered";
                await populatedMessage.save();
            }
        }

        return response(res, 201, "Message sent successfully", populatedMessage);
    } catch (error) {
        console.error("ChatController Error:", error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 2. GET CONVERSATIONS: User ki saari chat list hasil karna
// ---------------------------------------------------------
exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        let conversations = await Conversation.find({
            participants: userId, // Wo chats jahan user khud participant hai
        })
        .populate("participants", "username profilePicture isOnline lastSeen")
        .populate({
            path: "lastMessage",
            populate: { path: "sender receiver", select: "username profilePicture" }
        })
        .sort({ updatedAt: -1 }); // Taake latest chat upar aaye

        return response(res, 200, 'Conversations retrieved successfully', conversations);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 3. GET MESSAGES: Kisi ek chat ke saare messages load karna
// ---------------------------------------------------------
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return response(res, 404, 'Conversation not found');
        
        // Security check: Kya user is chat ka hissa hai?
        if (!conversation.participants.includes(userId)) {
            return response(res, 403, 'Not authorized');
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        // Messages load hote hi unhein "read" mark kar dena
        await Message.updateMany(
            { 
                conversation: conversationId, 
                receiver: userId, 
                messageStatus: { $in: ["sent", "delivered"] } 
            },
            { $set: { messageStatus: "read" } }
        );

        // Jab chat khul gayi, toh unread count 0 kar dena
        conversation.unreadCounts = 0;
        await conversation.save();

        return response(res, 200, "Messages retrieved", messages);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 4. MARK AS READ: Manually message ko parha hua mark karna
// ---------------------------------------------------------
exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        const userId = req.user.userId;

        let messages = await Message.find({ _id: { $in: messageIds }, receiver: userId });

        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        // Sender ko real-time notify karna ke unka message parh liya gaya hai
        if (req.io && req.socketUserMap) {
            for (const msg of messages) {
                const senderSocketId = req.socketUserMap.get(msg.sender.toString());
                if (senderSocketId) {
                    req.io.to(senderSocketId).emit("message_read", {
                        _id: msg._id,
                        messageStatus: "read"
                    });
                }
            }
        }
        return response(res, 200, "Messages marked as read", messages);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 5. DELETE MESSAGE: Apna bheja hua message delete karna
// ---------------------------------------------------------
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) return response(res, 404, 'Message not found');

        // Check: Sirf sender hi apna message delete kar sakta hai
        if (message.sender.toString() !== userId) {
            return response(res, 403, "Not authorized");
        }

        await message.deleteOne();

        // Receiver ke screen se bhi foran message gayab (delete) karna
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_deleted", messageId);
            }
        }
        return response(res, 200, "Message deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};