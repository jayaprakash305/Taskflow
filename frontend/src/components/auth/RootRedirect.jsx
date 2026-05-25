import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  // Currently all roles share the same dashboard route
  return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
}

export default RootRedirect;
