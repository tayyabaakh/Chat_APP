import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginSection/Login";
import Home from "./components/Home";
import { ToastContainer } from "react-toastify";
import { ProtectedRoute, PublicRoute } from "./Protectedpublic"; 
import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user_services";
import Loader from "./utils/Loader";
import UserDetails from "./components/UserDetails";
import { Status } from "./pages/StatusSection/Status";
import { Setting } from "./pages/SettingSection/Setting";
import { disconnectSocket, initializeSocket } from "./services/chat_services";

const App = () => {
const {user}= useUserStore();

useEffect(()=>{
  if(user?._id){
    const socket =initializeSocket();
  }
  return ()=>{
    disconnectSocket();
  }
},[user])

  const { setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await checkUserAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} /> 
            <Route path="/setting" element={<Setting />} /> 




          </Route>

          <Route path="*" element={<div>404</div>} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
