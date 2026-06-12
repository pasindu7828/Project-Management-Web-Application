import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  if (!allowedRoles.includes(userRole)) {
    if (userRole === 3) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 2) {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (userRole === 1) {
      return <Navigate to="/user/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
