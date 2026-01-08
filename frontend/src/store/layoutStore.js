import {persist} from 'zustand/middleware'
import {create} from 'zustand'
const useLayoutStore =create (
    persist(
        (set)=>({
            activeTab:'chats',
            selectedContact:null,
            setSelectedContact:(contact)=>set({selectedContact:contact}),
            setACtiveTab:(tab)=>set({activeTab:tab}),
        }),
        {
        name:"layout-storage",
        getStoage:()=>localStorage,
    })
)
export default useLayoutStore;