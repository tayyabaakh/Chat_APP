// const Conversation = require('../models/Conversation')
// const response = require('../utils/responseHandler')
// const Message = require('../models/Message')
// exports.sendMessage = async (req, res) => {
//     try {
//         const { senderId, recieverId, content, messageStatus } = req.body;
//         const file = req.file;

//         const participants = [senderId, recieverId].sort();
//         // check if conversation already exists
//         let conversation = await Conversation.findOne({
//             participants: participants
//         });
//         if (!conversation) {
//             conversation = new Conversation({
//                 participants
//             });
//             await conversation.save();

//         }

//         let imageOrVideoUrl = null;
//         let contentType = null;

//         // handle file upload
//         if (file) {
//             const uploadFile = await uploadFileToCloudinary(file);
//             if (!uploadFile?.secure_url) {
//                 return Response(res, 400, "Failed to upload media");
//             }
//             imageOrVideoUrl = uploadFile?.secure_url;
//             if (file.mimetype.startwith('image')) {
//                 contentType = "image";
//             }
//             else if (file.mimetype.startwith("video")) {
//                 contentType = "video";
//             }
//             else {
//                 return response(res, 400, "Unsupported file type");
//             }
//         }
//         else if (content?.trim()) {
//             contentType = "text";;
//         }
//         else {
//             return response(res, 400, "Message content is required");
//         }

//         const message = new Message({
//             conversation: conversation?._id,
//             sender: senderId,
//             receiver: recieverId,
//             content,
//             contentType,
//             imageOrVideoUrl,
//             messageStatus

//         });
//         await message.save();
//         if (message?.content) {
//             conversation.lastMessage = message?.id
//         }
//         conversation.unreadCounts += 1
//         await conversation.save();

//         const populatedMessage = await Message.findOne(message?._id)
//             .populate("sender", "username profilePicture")
//             .populate("receiver", "username profilePicture");

//         // emit ssocket event for real time
//         if (req.io && req.socketUserMap) {

//             const recieverSocketId = req.socketUserMap.get(recieverId);
//             if (recieverSocketId) {
//                 req.io.to(recieverSocketId).emit("receive_message", populatedMessage);
//                 message.messagestatus = "delivered";
//                 await message.save();
//             }

//         }
//         return response(res, 201, "Messge send successfully", populatedMessage);
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");

//     }
// };

// // get all conversations

// exports.getConversation = async (req, res) => {
//     const userId = req.user.userId;
//     try {
//         let conversation = await Conversation.find({
//             participants: userId,
//         }).populate("participants", "username profilePicture isOnline lastSeen")
//             .populate({
//                 path: "lastMessage",
//                 populate: {
//                     path: "sender receiver",
//                     select: "username profilePicture"
//                 }
//             }).sort({ updatedAt: -1 })
//         return response(res, 201, 'Conversation get successfully', conversation)
//     }
//     catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// }

// // get messages of speciific conversation
// exports.getMessages = async (req, res) => {
//     const { conversationId } = req.params;
//     const userId = req.user.userId;
//     try {
//         const conversation = await Conversation.findById(conversationId);
//         if (!conversation) {
//             return response(res, 404, 'Conversation not found')
//         };
//         if (!conversation.participants.includes(userId)) {
//             return response(res, 403, 'Not authorized to view this conversation')
//         }
//         const messages = await Message.find({ conversation: conversationId })
//             .populate("sender", "username profilePicture")
//             .populate("receiver", "username profilePicture")
//             .sort("createdAt");

//         await Message.updateMany({
//             conversation: conversationId,
//             reciever: userId,
//             messsageStatus: { $in: ["send", "delivered"] },
//         },
//             { $set: { messageStatus: "read" } },
//         );

//         conversation.unreadCounts = 0
//         await conversation.save();

//         return response(res, 200, "Message retrived", messages)

//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// }

// // mark as read
// exports.markAsRead = async (req, res) => {
//     const { messageIds } = req.body;
//     const userId = req.user.userId;
//     try {
//         let messages = await Message.find({
//             _id: { $in: messageIds },
//             reciever: userId,
//         })

//         await Message.updateMany(
//             { _id: { $in: messageIds }, reciever: userId },
//             { $set: { messagestatus: "read" } }
//         );
//         // notify to  orignal user 
//         // emit ssocket event for real time
//         if (req.io && req.socketUserMap) {
//             for(const message of messages){
//                 const senderSocketId =req.socketUserMap.get(message.sender.toString());
//                 if(senderSocketId){
//                     const updateMessage ={
//                         _id:message._id,
//                         messageStatus:"read",
//                     };
//                     req.io.to(senderSocketId).emit("message_read",updateMessage);
//                     await message.save();
//                 }
//             }
           
//         }
//         return response(res, 200, "Messages marked as read", messages)
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");

//     }
// }

// // delete Messages 

// exports.deleteMessage = async (req, res) => {
//     const { messageId } = req.params;
//     const userId = req.user.userId;
//     try {
//         const message = await Message.findById(messageId);
//         if (!message) {
//             return response(res, 404, 'Message not found')
//         };
//         if (message.sender.toString() !== userId) {
//             return response(res, 403, "Not authorized to delete this message")
//         }
//         await message.deleteOne();

//             if (req.io && req.socketUserMap) {
//                 const receiverSocketId=req.socketUserMap.get(message.receiver.toString())
//                 if(receiverSocketId){
//                     req.io.to(receiverSocketId).emit("message_deleted",messageId)
//                 }
            
//         }
//         return response(res, 200, "Message deleted successfully")
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");

//     }
// }

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const response = require('../utils/responseHandler');
// IMPORTANT: Ensure this import exists
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');

exports.sendMessage = async (req, res) => {
    try {
        // Fix 1: Consistent naming (using receiverId instead of recieverId)
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;

        if (!senderId || !receiverId) {
            return response(res, 400, "Sender and Receiver IDs are required");
        }

        const participants = [senderId, receiverId].sort();

        // Check if conversation exists
        let conversation = await Conversation.findOne({ participants });
        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = "text";

        // Handle file upload
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                // Fix 2: Changed 'Response' to 'response' (case sensitive)
                return response(res, 400, "Failed to upload media");
            }
            imageOrVideoUrl = uploadFile.secure_url;

            // Fix 3: Changed 'startwith' to 'startsWith' (W must be capital)
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

        // Update conversation metadata
        conversation.lastMessage = message._id;
        conversation.unreadCounts = (conversation.unreadCounts || 0) + 1;
        await conversation.save();

        // Fix 4: Use findById for single document lookup
        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // Real-time socket logic
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
                // Fix 5: Ensure casing matches your Schema (messageStatus)
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

exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        let conversations = await Conversation.find({
            participants: userId,
        })
        .populate("participants", "username profilePicture isOnline lastSeen")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender receiver",
                select: "username profilePicture"
            }
        })
        .sort({ updatedAt: -1 });

        return response(res, 200, 'Conversations retrieved successfully', conversations);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return response(res, 404, 'Conversation not found');
        
        if (!conversation.participants.includes(userId)) {
            return response(res, 403, 'Not authorized');
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        // Mark messages as read when retrieving
        await Message.updateMany(
            { 
                conversation: conversationId, 
                receiver: userId, 
                messageStatus: { $in: ["sent", "delivered"] } 
            },
            { $set: { messageStatus: "read" } }
        );

        conversation.unreadCounts = 0;
        await conversation.save();

        return response(res, 200, "Messages retrieved", messages);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        const userId = req.user.userId;

        let messages = await Message.find({
            _id: { $in: messageIds },
            receiver: userId,
        });

        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

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

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) return response(res, 404, 'Message not found');

        if (message.sender.toString() !== userId) {
            return response(res, 403, "Not authorized");
        }

        await message.deleteOne();

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