import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore";

export const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to={'/'} replace />;
  }
  
  return <Outlet />;
};