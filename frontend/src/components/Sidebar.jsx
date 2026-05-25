import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { APP_ROUTES } from "../constants/routes";
import { useEffect, useRef, useState } from "react";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IcDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IcTicketOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V8z" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);
const IcTicketIn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V8z" />
    <path d="M9 12h6M15 9l-3 3-3-3" />
  </svg>
);
const IcPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcFolder = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);
const IcFolderOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" /><path d="M3 14l3-3h13l-3 7H5l-2-4z" />
  </svg>
);
const IcFolderPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <path d="M12 11v6M9 14h6" />
  </svg>
);
const IcMessage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);
const IcShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IcSun = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IcMoon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IcLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IcMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IcX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcProfile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);


function Sidebar({ onMobileToggle, mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);

  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "ADMIN";
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const roleMap = {
    ADMIN: { label: "Admin", color: "#ef4444" },
    MANAGER: { label: "Manager", color: "#8b5cf6" },
    LEAD: { label: "Lead", color: "#3b82f6" },
    EMPLOYEE: { label: "Employee", color: "#22c55e" },
  };
  const roleInfo = roleMap[user?.role] || roleMap.EMPLOYEE;

  const handleLogout = () => { logout(); navigate(APP_ROUTES.LOGIN, { replace: true }); };

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) onClose(); // close drawer on mobile after navigation
  };

  const NavItem = ({ path, label, Icon }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => handleNavClick(path)}
        className={`sidebar-nav-item ${active ? "active" : ""}`}
      >
        <span className="nav-icon"><Icon /></span>
        <span className="nav-label">{label}</span>
        {active && <span className="nav-pip" />}
      </button>
    );
  };

  return (
    <>
      <style>{`
        /* ── CSS Variables ── */
        [data-theme="dark"] {
          --s-divider: rgba(255,255,255,0.06);
          --s-nav-text: #7878a0;
          --s-nav-hover-bg: rgba(255,255,255,0.04);
          --s-nav-hover-text: #d4d4e8;
          --s-active-bg: rgba(99,102,241,0.13);
          --s-active-text: #818cf8;
          --s-active-pip: #6366f1;
          --s-section: #35354a;
          --s-brand: #f0f0f5;
          --s-sub: #3d3d55;
          --s-toggle-bg: rgba(255,255,255,0.05);
          --s-user-hover: rgba(239,68,68,0.07);
          --s-user-text: #d4d4e8;
          --s-user-sub: #4a4a65;
          --s-bg: rgba(13, 13, 17, 0.15);
          --s-border: rgba(255,255,255,0.055);
        }
        [data-theme="light"] {
          --s-divider: #f0f0f5;
          --s-nav-text: #6b7280;
          --s-nav-hover-bg: #f9fafb;
          --s-nav-hover-text: #111827;
          --s-active-bg: #eef2ff;
          --s-active-text: #4338ca;
          --s-active-pip: #6366f1;
          --s-section: #d1d5db;
          --s-brand: #111827;
          --s-sub: #9ca3af;
          --s-toggle-bg: #f3f4f6;
          --s-user-hover: #fff5f5;
          --s-user-text: #111827;
          --s-user-sub: #9ca3af;
          --s-bg: rgba(255, 255, 255, 0.25);
          --s-border: rgba(229, 231, 235, 0.4);
        }

        /* ── Sidebar Root: desktop always visible ── */
        .sidebar-root {
          width: 252px;
          min-width: 252px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
          background: var(--s-bg);
          border-right: 1px solid var(--s-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background 0.2s, border-color 0.2s;
          height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
        }

        /* ── Mobile / Tablet: drawer overlay pattern ── */
        @media (max-width: 1023px) {
          .sidebar-root {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            z-index: 200;
            width: 280px;
            min-width: 280px;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.2s, border-color 0.2s;
            box-shadow: none;
          }
          .sidebar-root.drawer-open {
            transform: translateX(0);
            box-shadow: 6px 0 40px rgba(0,0,0,0.35);
          }
        }

        /* ── Backdrop ── */
        .sidebar-backdrop {
          display: none;
        }
        @media (max-width: 1023px) {
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 199;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(2px);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }
          .sidebar-backdrop.visible {
            opacity: 1;
            pointer-events: auto;
          }
        }

        /* ── Brand ── */
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 16px 18px;
          border-bottom: 1px solid var(--s-divider);
          flex-shrink: 0;
        }

        /* ── Close button (mobile only) ── */
        .sidebar-close-btn {
          display: none;
        }
        @media (max-width: 1023px) {
          .sidebar-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            border: 1px solid var(--s-divider);
            background: var(--s-toggle-bg);
            color: var(--s-nav-text);
            cursor: pointer;
            margin-left: auto;
            flex-shrink: 0;
            transition: all 0.15s;
          }
          .sidebar-close-btn:hover {
            color: var(--s-nav-hover-text);
          }
        }

        /* ── Nav Items ── */
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 450;
          font-family: inherit;
          text-align: left;
          background: transparent;
          color: var(--s-nav-text);
          transition: all 0.13s ease;
          position: relative;
          margin-bottom: 1px;
          min-height: 40px; /* Larger tap targets on mobile */
        }
        @media (max-width: 1023px) {
          .sidebar-nav-item {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
        .sidebar-nav-item:hover { background: var(--s-nav-hover-bg); color: var(--s-nav-hover-text); }
        .sidebar-nav-item.active { background: var(--s-active-bg); color: var(--s-active-text); font-weight: 600; }
        .nav-icon { display: flex; align-items: center; opacity: 0.7; flex-shrink: 0; }
        .sidebar-nav-item.active .nav-icon { opacity: 1; }
        .nav-label { flex: 1; }
        .nav-pip {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--s-active-pip);
        }
        .sidebar-section-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--s-section);
          padding: 14px 12px 5px;
        }

        /* ── Mobile Hamburger Toggle (rendered outside sidebar) ── */
        .sidebar-hamburger {
          display: none;
        }
        @media (max-width: 1023px) {
          .sidebar-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 1px solid var(--s-border);
            background: var(--s-toggle-bg);
            color: var(--s-nav-text);
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.15s;
          }
          .sidebar-hamburger:hover {
            color: var(--s-nav-hover-text);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar-root ${mobileOpen ? "drawer-open" : ""}`} role="navigation" aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13, color: "#fff",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)", flexShrink: 0,
          }}>TF</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--s-brand)", letterSpacing: "-0.01em" }}>TaskFlow</div>
            <div style={{ fontSize: 10, color: "var(--s-sub)", marginTop: 1 }}>Project Management</div>
          </div>
          {/* Close button — only visible on mobile */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
            <IcX />
          </button>
        </div>

        {/* Role + Theme */}
        <div style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--s-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            padding: "3px 9px", borderRadius: 6,
            background: `${roleInfo.color}18`, color: roleInfo.color, border: `1px solid ${roleInfo.color}28`,
          }}>{roleInfo.label}</span>
          <button onClick={toggleTheme} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 9px",
            borderRadius: 8, border: "1px solid var(--s-divider)",
            background: "var(--s-toggle-bg)", cursor: "pointer",
            color: "var(--s-nav-text)", fontSize: 11, fontWeight: 500, fontFamily: "inherit",
            transition: "all 0.15s",
          }}>
            {theme === "dark" ? <IcMoon /> : <IcSun />}
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "4px 8px 8px", overflowY: "auto" }}>
          <div className="sidebar-section-label">Overview</div>
          <NavItem path={APP_ROUTES.DASHBOARD} label="Dashboard" Icon={IcDashboard} />
          <NavItem path={APP_ROUTES.PROFILE} label="My Profile" Icon={IcProfile} />

          <div className="sidebar-section-label">Tickets</div>
          <NavItem path={APP_ROUTES.TICKETS_RAISED} label="My raised tickets" Icon={IcTicketOut} />
          <NavItem path={APP_ROUTES.TICKETS_ASSIGNED} label="Assigned to me" Icon={IcTicketIn} />
          <NavItem path={APP_ROUTES.TICKETS_RAISE} label="Raise ticket" Icon={IcPlus} />

          <div className="sidebar-section-label">Projects</div>
          <NavItem path={APP_ROUTES.PROJECTS_ASSIGNED} label="My assigned projects" Icon={IcFolder} />
          {isManagerOrAdmin && <NavItem path={APP_ROUTES.PROJECTS_CREATED} label="Created projects" Icon={IcFolderOpen} />}
          {isManagerOrAdmin && <NavItem path={APP_ROUTES.PROJECTS_CREATE} label="Create project" Icon={IcFolderPlus} />}

          <div className="sidebar-section-label">Communicate</div>
          <NavItem path={APP_ROUTES.MESSAGES} label="Messages" Icon={IcMessage} />

          {user?.role === "ADMIN" && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <NavItem path={APP_ROUTES.ADMIN_USERS} label="Manage Users" Icon={IcShield} />
              <NavItem path={APP_ROUTES.ADMIN_PANEL} label="Admin Panel" Icon={IcDashboard} />
              <NavItem path={APP_ROUTES.ADMIN_PROFILE_REQUESTS} label="Profile Requests" Icon={IcProfile} />
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: "8px 8px 10px", borderTop: "1px solid var(--s-divider)", flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 10px",
              borderRadius: 10, border: "none",
              cursor: "pointer", background: "transparent",
              fontFamily: "inherit", textAlign: "left",
              transition: "background 0.15s",
              minHeight: 52,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--s-user-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>{getInitials(user?.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--s-user-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 11, color: "var(--s-user-sub)", marginTop: 1 }}>{user?.role} · {user?.department || "General"}</div>
            </div>
            <span style={{ color: "var(--s-nav-text)", flexShrink: 0 }}><IcLogOut /></span>
          </button>
        </div>
      </aside>
    </>
  );
}

export { IcMenu };
export default Sidebar;