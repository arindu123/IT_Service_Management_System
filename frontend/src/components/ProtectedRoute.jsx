import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/roles";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/LanguageContext";

function ProtectedRoute({ children, roles }) {
  const { user, status, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (status === "validating") return <div className="session-validation" role="status" aria-live="polite">{t('ui.validateSession')}</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles?.length && !hasRole(user, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
