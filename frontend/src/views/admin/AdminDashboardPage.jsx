import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../constants/routes";

function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate(APP_ROUTES.LOGIN, { replace: true });
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}</p>
      <p>Role: {user?.role}</p>
      <p>Department: {user?.department}</p>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
        <button onClick={() => navigate(APP_ROUTES.WORKSPACE)}>
          Go to Workspace
        </button>

        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default AdminDashboardPage;