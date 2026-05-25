import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogin } from "../../controllers/authController";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../constants/routes";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await handleLogin(formData);
      if (!data?.token || !data?.user) throw new Error("Invalid login response");
      login({ token: data.token, user: data.user });
      navigate(APP_ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="login-logo-icon">T</div>
          <span className="login-logo-text">TaskFlow</span>
        </div>
        <p className="login-subtitle">Sign in to your workspace</p>

        <form onSubmit={onSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required autoComplete="email" />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required autoComplete="current-password" />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button id="login-submit" type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;