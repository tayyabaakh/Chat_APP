import { create } from 'zustand';
import { persist } from 'zustand/middleware'

const useUserStore = create(
    persist(
        (set) => (
            {   user:null,
                isAuthenticated:false,
                authLoading: true, 
                setUser: (userData) => set({ user:userData,isAuthenticated:true,authLoading: false, }),
                clearUser: () => set({ user:null , isAuthenticated:false,authLoading: false, }),
            }),
            {
                name:"user-storage",
                getStorage:()=>localStorage
            }
    )
)

export default useUserStore;