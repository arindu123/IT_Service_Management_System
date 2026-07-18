import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/roles";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children, roles }) {
  const { user, status, isAuthenticated } = useAuth();

  if (status === "validating") return <div className="session-validation" role="status" aria-live="polite">Validating secure session…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles?.length && !hasRole(user, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
