const Status = require('../models/Status');
const response = require('../utils/responseHandler');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');

// ---------------------------------------------------------
// 1. CREATE STATUS: Naya status lagana (Text, Image, ya Video)
// ---------------------------------------------------------
exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text';

        // Agar user ne file upload ki hai
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media");
            }
            mediaUrl = uploadFile.secure_url;
            
            // File type check karna (image hai ya video)
            if (file.mimetype.startsWith('image')) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            } else {
                return response(res, 400, "Unsupported file type");
            }
        } else if (!content?.trim()) {
            // Agar na file hai na text content
            return response(res, 400, "Status content is required");
        }

        // Expiry Logic: Status ko current time se 24 ghante baad expire karna
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt
        });
        await status.save();

        // Data populate karna taake UI par user ki info dikh sakay
        const populatedStatus = await Status.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        // --- REAL-TIME BROADCAST ---
        // Saare online users ko naye status ka notification bhejna
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
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

// ---------------------------------------------------------
// 2. GET STATUSES: Sirf wahi status laana jo expire nahi huye
// ---------------------------------------------------------
exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            // Expiry time current time se bara hona chahiye ($gt: Greater Than)
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

// ---------------------------------------------------------
// 3. VIEW STATUS: Status dekhna aur viewer list mein naam add karna
// ---------------------------------------------------------
exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) return response(res, 404, "Status not found");

        // Check karna ke user ne pehlay toh nahi dekha (Duplicate views se bachna)
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();
        }

        const updateStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        // --- REAL-TIME NOTIFICATION TO OWNER ---
        // Status lagane walay ko batana ke falana bande ne aapka status dekh liya
        if (req.io && req.socketUserMap) {
            const statusOwnerSocketId = req.socketUserMap.get(status.user.toString());
            if (statusOwnerSocketId) {
                const viewData = {
                    statusId,
                    viewerId: userId,
                    totalViewers: updateStatus.viewers.length,
                    viewers: updateStatus.viewers
                };
                req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
            }
        }
        return response(res, 200, 'Status viewed successfully');
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// ---------------------------------------------------------
// 4. DELETE STATUS: Status ko khatam karna
// ---------------------------------------------------------
exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if (!status) return response(res, 404, 'Status not found');

        // Security check: Sirf status ka owner hi delete kar sakay
        if (status.user.toString() !== userId) {
            return response(res, 403, 'Not authorized');
        }

        await status.deleteOne();

        // Real-time notification: Sab ke screen se status remove karna
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                req.io.to(socketId).emit("status_deleted", statusId);
            }
        }
        return response(res, 200, "Status deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};