import { Navigate, Outlet, useLocation } from "react-router";
import { getAccessToken } from "../utils/authToken";

const ProtectedRoute = () => {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
