import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--clr-bg-primary, #0f0f13)",
        color: "var(--clr-text-muted, #6b6b80)",
        fontFamily: "Inter, sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  return children;
}

export default PublicRoute;
