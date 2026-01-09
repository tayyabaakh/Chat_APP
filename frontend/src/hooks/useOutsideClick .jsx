import { useEffect } from "react";

const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleOutsideClick = (event) => {
            // Fix: Corrected the spelling of 'current'
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        // Fix: Add the listener when the effect runs
        document.addEventListener("mousedown", handleOutsideClick);

        // Fix: Return a cleanup function to remove it
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [ref, callback]);
};

export default useOutsideClick;