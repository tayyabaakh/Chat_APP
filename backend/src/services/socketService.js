/**
 * Import Socket.IO Server class
 * This allows us to attach real-time communication on top of our HTTP server
 */
const { Server } = require("socket.io");

/**
 * Import User and Message MongoDB models
 * Used for updating online status, last seen, messages, reactions, etc.
 */
const User = require("../models/User");
const Message = require("../models/Message");

/**
 * Map to track currently online users
 * ------------------------------------------------
 * key   → userId (string)
 * value → socketId (string)
 *
 * Why Map?
 * - Faster lookups than arrays
 * - Ensures unique user entries
 * - Ideal for real-time state management
 */
const onlineUsers = new Map();

/**
 * Map to track typing status of users
 * ------------------------------------------------
 * key   → userId
 * value → {
 *            conversationId: true/false,
 *            conversationId_timeout: setTimeout reference
 *          }
 *
 * This helps:
 * - Show "User is typing..."
 * - Automatically stop typing after inactivity
 */
const typingUsers = new Map();

/**
 * Function to initialize Socket.IO
 * This function is called once when the server starts
 */
const initializeSocket = (server) => {

  /**
   * Create a new Socket.IO server instance
   * It is attached to the existing HTTP server
   */
  const io = new Server(server, {
    cors: {
      /**
       * Allow frontend domain to connect
       * This prevents CORS errors in browsers
       */
      origin: process.env.FRONTEND_URL,
      credentials: true,

      /**
       * Allowed HTTP methods for preflight requests
       */
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },

    /**
     * If the client does not respond within this time,
     * Socket.IO assumes the connection is dead
     */
    pingTimeout: 6000,
  });

  /**
   * Fired automatically when a new client connects
   * Each client gets a unique socket.id
   */
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    /**
     * userId is stored after client authenticates
     * Initially null because socket connects before auth
     */
    let userId = null;

    /**
     * Custom event triggered by frontend after login
     * Purpose:
     * - Associate socket with authenticated user
     * - Mark user as online
     */
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;

        /**
         * Store userId → socketId mapping
         * Used later to send messages directly
         */
        onlineUsers.set(userId, socket.id);

        /**
         * Join a private room named after userId
         * Enables targeted emits using rooms
         */
        socket.join(userId);

        /**
         * Update user online status in database
         */
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        /**
         * Broadcast user online status to all clients
         */
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection", error);
      }
    });

    /**
     * Client requests another user's status
     * Callback pattern avoids extra socket events
     */
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);

      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    /**
     * Handle sending messages in real-time
     * Message is already saved via REST API
     */
    socket.on("send_message", async (message) => {
      try {
        /**
         * Find receiver's socketId
         */
        const receiverSocketId = onlineUsers.get(
          message.receiver?._id?.toString()
        );

        /**
         * Emit message only if receiver is online
         */
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    /**
     * Marks messages as read
     * Triggered when receiver opens the chat
     */
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        /**
         * Update message status in database
         */
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messagestatus: "read" } }
        );

        /**
         * Notify sender about read receipts
         */
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_status_update", {
            messageIds,
            messageStatus: "read",
          });
        }
      } catch (error) {
        console.error("Error updating message read status", error);
      }
    });

    /**
     * Fired when user starts typing
     */
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      /**
       * Initialize typing state if not present
       */
      if (!typingUsers.has(userId)) {
        typingUsers.set(userId, {});
      }

      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;

      /**
       * Clear previous timeout (prevents flickering)
       */
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      /**
       * Auto stop typing after 3 seconds of inactivity
       */
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      /**
       * Notify receiver that user is typing
       */
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    /**
     * Fired when user manually stops typing
     */
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        /**
         * Clear timeout to avoid duplicate events
         */
        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    /**
     * Handle emoji reactions on messages
     */
    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        /**
         * Check if user already reacted
         */
        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId
        );

        /**
         * Toggle or update reaction
         */
        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ user: reactionUserId, emoji });
        }

        await message.save();

        /**
         * Populate users for frontend display
         */
        const populatedMessage = await Message.findById(messageId)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture")
          .populate("reactions.user", "username");

        /**
         * Notify both sender and receiver
         */
        const senderSocket = onlineUsers.get(
          populatedMessage.sender._id.toString()
        );
        const receiverSocket = onlineUsers.get(
          populatedMessage.receiver?._id?.toString()
        );

        const reactionUpdated = {
          messageId,
          reactions: populatedMessage.reactions,
        };

        if (senderSocket)
          io.to(senderSocket).emit("reaction_update", reactionUpdated);
        if (receiverSocket)
          io.to(receiverSocket).emit("reaction_update", reactionUpdated);
      } catch (error) {
        console.error("Error handling reaction", error);
      }
    });

    /**
     * Handle user disconnect
     * Automatically triggered by Socket.IO
     */
    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        /**
         * Clear all typing timeouts to prevent memory leaks
         */
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingUsers.delete(userId);
        }

        /**
         * Update offline status in DB
         */
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`User ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection", error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  /**
   * Expose online users map if needed elsewhere
   */
  io.socketUserMap = onlineUsers;

  return io;
};

module.exports = initializeSocket;