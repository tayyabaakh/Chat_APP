// const Conversation = require('../models/Status')
// const response = require('../utils/responseHandler')
// const Message = require('../models/Message');
// const Status = require('../models/Status');

// exports.createStatus = async (req, res) => {
//     try {
//         const { content, contentType } = req.body;
//         const userId = req.user.userId;
//         const file = req.file;

//         let mediaUrl = null;
//         let finalContentType = contentType || 'text';

//         // handle file upload
//         if (file) {
//             const uploadFile = await uploadFileToCloudinary(file);
//             if (!uploadFile?.secure_url) {
//                 return Response(res, 400, "Failed to upload media");
//             }
//             mediaUrl = uploadFile?.secure_url;
//             if (file.mimetype.startwith('image')) {
//                 finalContentType = "image";
//             }
//             else if (file.mimetype.startwith("video")) {
//                 finalContentType = "video";
//             }
//             else {
//                 return response(res, 400, "Unsupported file type");
//             }
//         }
//         else if (content?.trim()) {
//             finalContentType = "text";;
//         }
//         else {
//             return response(res, 400, "Message content is required");
//         }

//         const expiresAt = new Date();
//         expiresAt.setHours(expiresAt.getHours() + 24)

//         const status = new Status({
//             user: userId,
//             content: mediaUrl || content,
//             contentType: finalContentType,
//             expiresAt



//         });
//         await status.save();


//         const populatedStatus = await Status.findOne(status?._id)
//             .populate("user", "username profilePicture")
//             .populate("viewers", "username profilePicture");


//         // emit socket event
//         if (req.io && req.socketUserMap) {
//             // Broadcast to all connecting users except the creator

//             for (const [connectedUserId, socketId] of req.socketUserMap) {
//                 if (connectedUserId !== userId) {
//                     req.io.tp(socketId).emit("new_status", populatedStatus)
//                 }
//             }
//         }

//         return response(res, 201, "Messge send successfully", populatedStatus);
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");

//     }
// };

// exports.getStatuses = async (req, res) => {
//     try {
//         const statuses = await Status.find({
//             expiresAt: { $gt: new Date() },
//         })
//             .populate("user", "username profilePicture")
//             .populate("viewers", "username profilePicture")
//             .sort({ createdAt: -1 });

//         return response(res, 200, "status retrived successfully")
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// }
// exports.viewStatus = async (req, res) => {
//     const { statusId } = req.params;
//     const userId = req.user.userId;

//     try {
//         const status = await Status.findById(statusId);
//         if (!status) {
//             return response(res, 404, "Status not found");
//         }
//         if (!status.viewers.push(userId)) {
//             status.viewers.push(userId);
//             await status.save();

//             const updateStatus = await Status.findById(statusId)
//                 .populate("user", "username profilePicture")
//                 .populate("viewers", "username profilePicture")



//             // emit socket event 
//             if (req.io && req.socketUserMap) {
//                 // Broadcast to all connecting users except the creator

//                 const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
//                 if (statusOwnerSocketId) {
//                     const viewData = {
//                         statusId,
//                         viewerId: userId,
//                         totalViewers: updateStatus.viewers.length,
//                         viewers: updateStatus.viewers
//                     }
//                     res.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
//                 }
//                 else {
//                     console.log(('status owner not connected'));

//                 }
//             }
//         }
//         else {
//             console.log('user already viewed the status');

//         }
//         return response(res, 200, 'status viewed successfully')
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// }

// exports.deleteStatus = async (req, res) => {
//     const { statusId } = req.params;
//     const userId = req.user.userId;
//     try {
//         const status = await Status.findById(statusId);
//         if (!status) {
//             return response(res, 404, 'Status not found');
//         }
//         if (status.user.toString() !== userId) {
//             return response(res, 403, 'Not authorized to delete this status')
//         }
//         await status.deleteOne();


//         // emit socket event 
//         if (req.io && req.socketUserMap) {

//             for (const [connectedUserId, socketId] of req.socketUserMap) {
//                 if (connectedUserId !== userId) {
//                     req.io.tp(socketId).emit("status_deleted", statusId)
//                 }
//             }
//         }
//         return response(res, 200, "Status deleted successfully")
//     } catch (error) {
//         console.log(error);
//         return response(res, 500, "Internal server error");
//     }
// }


const Status = require('../models/Status');
const response = require('../utils/responseHandler');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');

exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text';

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media");
            }
            mediaUrl = uploadFile.secure_url;
            
            // Fixed: startsWith
            if (file.mimetype.startsWith('image')) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            } else {
                return response(res, 400, "Unsupported file type");
            }
        } else if (!content?.trim()) {
            return response(res, 400, "Status content is required");
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt
        });
        await status.save();

        const populatedStatus = await Status.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        // Socket Emit
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    // Fixed: .to() instead of .tp()
                    req.io.to(socketId).emit("new_status", populatedStatus);
                }
            }
        }

        return response(res, 201, "Status created successfully", populatedStatus);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture")
        .sort({ createdAt: -1 });

        return response(res, 200, "Statuses retrieved successfully", statuses);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) return response(res, 404, "Status not found");

        // Fixed logic: Check if user already viewed
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();
        }

        const updateStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        if (req.io && req.socketUserMap) {
            const statusOwnerSocketId = req.socketUserMap.get(status.user.toString());
            if (statusOwnerSocketId) {
                const viewData = {
                    statusId,
                    viewerId: userId,
                    totalViewers: updateStatus.viewers.length,
                    viewers: updateStatus.viewers
                };
                // Fixed: req.io instead of res.io, and .to() instead of .tp()
                req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
            }
        }
        return response(res, 200, 'Status viewed successfully');
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if (!status) return response(res, 404, 'Status not found');

        if (status.user.toString() !== userId) {
            return response(res, 403, 'Not authorized');
        }

        await status.deleteOne();

        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                // Fixed: .to() instead of .tp()
                req.io.to(socketId).emit("status_deleted", statusId);
            }
        }
        return response(res, 200, "Status deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};