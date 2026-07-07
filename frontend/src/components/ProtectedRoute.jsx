import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/roles";

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (roles?.length && !hasRole(user, roles)) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

export default ProtectedRoute;
