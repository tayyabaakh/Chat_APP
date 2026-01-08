
import axios from 'axios'

console.log("VITE_API_URL check:", import.meta.env.VITE_API_URL);
const apiUrl = `${import.meta.env.VITE_API_URL}/api`;


const axiosInstance =axios.create({
    baseURL: apiUrl,
    withCredentials:true
})


export default axiosInstance;