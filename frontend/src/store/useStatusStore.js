import { create } from "zustand";
import { getSocket } from "../services/chat_services";
import axiosInstance from "../services/url_services";

const useStatusStore = create((set, get) => ({
    // state
    statuses: [],
    loading: false,
    error: null,

    setStatuses: (statuses) => set({ statuses }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    initializeSocket: () => {
        const socket = getSocket();
        if (!socket) return;

        socket.on("new_status", (newStatus) => {
            set((state) => ({
                statuses: state.statuses.some((s) => s._id === newStatus._id)
                    ? state.statuses : [newStatus, ...state.statuses]
            }));
        });

        socket.on("status_deleted", (statusId) => {
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId)
            }));
        });

        socket.on("status_viewed", (statusId, viewers) => {
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status._id === statusId ? { ...status, viewers } : status),
            }));
        });
    },

    cleanupSocket: () => {
        const socket = getSocket();
        if (socket) {
            socket.off("new_status");
            socket.off("status_deleted");
            socket.off("status_viewed");
        }
    },

    fetchStatuses: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get("/status"); // Added slash
            set({ statuses: data.data || [], loading: false });
        } catch (error) {
            set({ error: error.message, loading: false }); // Fixed spelling
        }
    },

    createStatus: async (statusData) => {
        set({ loading: true, error: null });
        try {
            const formData = new FormData();
            if (statusData.file) {
                formData.append("media", statusData.file); // Fixed period to comma
            }
            if (statusData.content?.trim()) {
                formData.append("content", statusData.content);
            }

            const { data } = await axiosInstance.post('/status', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (data.data) {
                set((state) => ({
                    statuses: state.statuses.some((s) => s._id === data.data._id)
                        ? state.statuses : [data.data, ...state.statuses]
                }));
            }
            set({ loading: false });
            return data.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    viewStatus: async (statusId) => {
        try {
            await axiosInstance.put(`/status/${statusId}/view`); // Added slash
            // Local update of viewers isn't strictly necessary if socket handles it, 
            // but keeping logic for safety
        } catch (error) {
            set({ error: error.message });
        }
    },

    deleteStatus: async (statusId) => {
        try {
            await axiosInstance.delete(`/status/${statusId}`);
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId),
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    getGroupedStatus: () => {
        const { statuses } = get();
        return statuses.reduce((acc, status) => {
            const statusUserId = status.user?._id;
            if (!statusUserId) return acc;

            if (!acc[statusUserId]) {
                acc[statusUserId] = {
                    id: statusUserId, // Unified as 'id'
                    name: status?.user?.username,
                    avatar: status?.user?.profilePicture,
                    statuses: []
                };
            }
            acc[statusUserId].statuses.push({
                id: status._id,
                media: status.mediaUrl || status.content, // Ensure you use the right field
                contentType: status.contentType,
                timestamp: status.createdAt,
                viewers: status.viewers,
            });
            return acc;
        }, {});
    },

    getOtherStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return Object.values(groupedStatus).filter(
            (contact) => contact.id !== userId // Changed from _id to id to match reduce
        );
    },

    reset: () => set({ statuses: [], loading: false, error: null }),
}));

export default useStatusStore;