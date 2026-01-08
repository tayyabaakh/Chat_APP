import { io } from 'socket.io-client';
import useUserStore from '../store/useUserStore';

let socket = null;

export const initializeSocket = () => {
    if (socket) return socket;

    const user = useUserStore.getState().user;
    
    // Fix: Accessing Vite environment variables correctly
    const BACKEND_URL = import.meta.env.VITE_API_URL;

    if (!BACKEND_URL) {
        console.error("VITE_API_URL is not defined in your .env file");
        return null;
    }

    socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelayMax: 1000,
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        // Ensure user exists before emitting
        if (user?._id) {
            socket.emit("user_connected", user._id);
        }
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    return socket;
};

export const getSocket = () => {
    return socket || initializeSocket();
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};