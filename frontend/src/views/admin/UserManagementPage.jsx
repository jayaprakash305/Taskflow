import { useEffect, useState } from "react";
import {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleToggleUserStatus,
} from "../../controllers/userController";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IcX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcHierarchy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="5" rx="1.5" />
    <rect x="1" y="17" width="7" height="5" rx="1.5" />
    <rect x="9" y="17" width="7" height="5" rx="1.5" />
    <rect x="17" y="17" width="7" height="5" rx="1.5" />
    <path d="M12 7v4M4.5 17v-3a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v3" />
  </svg>
);
const IcEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcPower = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IcChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IcUser = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.15 }}>
    <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);

// ── Config ────────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  ADMIN: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.18)", label: "Admin" },
  MANAGER: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.18)", label: "Manager" },
  LEAD: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.18)", label: "Lead" },
  EMPLOYEE: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.18)", label: "Employee" },
};

const STATUS_CONFIG = {
  ACTIVE: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.18)", label: "Active" },
  INACTIVE: { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.18)", label: "Inactive" },
};

const AVATAR_PALETTES = [
  ["#6366f1", "#4338ca"], ["#8b5cf6", "#6d28d9"], ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"], ["#ec4899", "#db2777"], ["#06b6d4", "#0891b2"],
  ["#ef4444", "#dc2626"], ["#14b8a6", "#0d9488"],
];

function getInitials(name) {
  if (!name) return "U";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColors(name) {
  return AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
}

const ROLE_FILTERS = ["ALL", "ADMIN", "MANAGER", "LEAD", "EMPLOYEE"];

// ── Dummy data for preview ────────────────────────────────────────────────────
const DUMMY_USERS = [
  { _id: "1", name: "Jaya", email: "jaya@example.com", role: "ADMIN", department: "IT", status: "ACTIVE", manager: null },
  { _id: "2", name: "Jaya", email: "jaya2@example.com", role: "MANAGER", department: "IT", status: "ACTIVE", manager: null },
  { _id: "3", name: "Jaya", email: "jaya1@example.com", role: "EMPLOYEE", department: "IT", status: "ACTIVE", manager: "Jaya" },
  { _id: "4", name: "Jaya", email: "jaya4@gmail.com", role: "LEAD", department: "IT", status: "ACTIVE", manager: "Jaya" },
  { _id: "5", name: "test", email: "test@gmail.com", role: "EMPLOYEE", department: "IT", status: "ACTIVE", manager: "Jaya" },
  { _id: "6", name: "jayaepm", email: "jaya3@example.com", role: "EMPLOYEE", department: "IT", status: "INACTIVE", manager: "Jaya" },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      animation: "um-fadeIn 0.15s ease",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--um-card)", border: "1px solid var(--um-border)",
        borderRadius: 18, padding: 28, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        animation: "um-slideUp 0.2s ease",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--um-text)", letterSpacing: "-0.02em" }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid var(--um-border)",
            background: "var(--um-cell-bg)", cursor: "pointer", color: "var(--um-text3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><IcX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--um-text3)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    leadId: "",
    managerId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await handleGetUsers();
        const normalizedUsers = (data?.users || []).map((u) => ({
          ...u,
          status: u.isActive ? "ACTIVE" : "INACTIVE",
          lead: u.leadId?.name || null,
          manager: u.managerId?.name || null,
        }));
        setUsers(normalizedUsers);
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const managers = users.filter((u) => u.role === "MANAGER" && u.status === "ACTIVE");
  const leads = users.filter((u) => u.role === "LEAD" && u.status === "ACTIVE");

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  const handleDeactivate = async (user) => {
    try {
      const data = await handleToggleUserStatus(user._id);
      const updated = data?.user;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === updated._id
            ? {
              ...updated,
              status: updated.isActive ? "ACTIVE" : "INACTIVE",
              lead: updated.leadId?.name || null,
              manager: updated.managerId?.name || null,
            }
            : u
        )
      );

      setConfirmDeactivate(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update user status");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...createForm,
        leadId: createForm.role === "EMPLOYEE" ? createForm.leadId || "" : "",
        managerId:
          createForm.role === "EMPLOYEE" || createForm.role === "LEAD"
            ? createForm.managerId || ""
            : "",
      };

      const data = await handleCreateUser(payload);
      const newUser = data?.user;

      setUsers((prev) => [
        {
          ...newUser,
          status: newUser.isActive ? "ACTIVE" : "INACTIVE",
          lead: newUser.leadId?.name || null,
          manager: newUser.managerId?.name || null,
        },
        ...prev,
      ]);

      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        department: "",
        leadId: "",
        managerId: "",
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create user");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        leadId: editingUser.role === "EMPLOYEE" ? editingUser.leadId || "" : "",
        managerId:
          editingUser.role === "EMPLOYEE" || editingUser.role === "LEAD"
            ? editingUser.managerId || ""
            : "",
      };

      const data = await handleUpdateUser(editingUser._id, payload);
      const updated = data?.user;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === updated._id
            ? {
              ...updated,
              status: updated.isActive ? "ACTIVE" : "INACTIVE",
              lead: updated.leadId?.name || null,
              manager: updated.managerId?.name || null,
            }
            : u
        )
      );

      setEditingUser(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update user");
    }
  };

  return (
    <>
      <style>{`
        @keyframes um-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes um-slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes um-rowIn   { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes um-spin    { to { transform: rotate(360deg); } }

        [data-theme="dark"] {
          --um-bg: transparent;
          --um-card: rgba(22, 22, 29, 0.2);
          --um-border: rgba(255,255,255,0.1);
          --um-cell-bg: rgba(255,255,255,0.04);
          --um-row-hover: rgba(255,255,255,0.08);
          --um-row-border: rgba(255,255,255,0.05);
          --um-header-bg: rgba(30, 30, 40, 0.25);
          --um-text: #e8e8f0;
          --um-text2: #9898b8;
          --um-text3: #50506a;
          --um-input-bg: rgba(255,255,255,0.05);
          --um-input-border: rgba(255,255,255,0.1);
          --um-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        [data-theme="light"] {
          --um-bg: transparent;
          --um-card: rgba(255, 255, 255, 0.25);
          --um-border: rgba(0, 0, 0, 0.08);
          --um-cell-bg: rgba(255, 255, 255, 0.4);
          --um-row-hover: rgba(255, 255, 255, 0.5);
          --um-row-border: rgba(0, 0, 0, 0.04);
          --um-header-bg: rgba(255, 255, 255, 0.3);
          --um-text: #111827;
          --um-text2: #6b7280;
          --um-text3: #9ca3af;
          --um-input-bg: rgba(255, 255, 255, 0.4);
          --um-input-border: rgba(0, 0, 0, 0.1);
          --um-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .um-root {
          font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
          padding: 16px;
          animation: um-fadeIn 0.2s ease;
        }
        @media (min-width: 640px) { .um-root { padding: 22px; } }
        @media (min-width: 1024px) { .um-root { padding: 28px; } }

        /* Table */
        .um-table-wrap {
          background: var(--um-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--um-border);
          border-radius: 16px;
          overflow-x: auto;
        }
        .um-table-head {
          display: grid;
          grid-template-columns: 220px 1fr 110px 140px 140px 140px 110px 140px;
          min-width: 1100px;
          gap: 0;
          padding: 11px 20px;
          background: var(--um-header-bg);
          border-bottom: 1px solid var(--um-border);
        }
        .um-table-head-cell {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          color: var(--um-text3);
        }
        .um-table-row {
          display: grid;
          grid-template-columns: 220px 1fr 110px 140px 140px 140px 110px 140px;
          min-width: 1100px;
          gap: 0;
          padding: 0 20px;
          align-items: center;
          min-height: 64px;
          border-bottom: 1px solid var(--um-row-border);
          transition: background 0.12s;
          animation: um-rowIn 0.2s ease both;
        }
        .um-table-row:last-child { border-bottom: none; }
        .um-table-row:hover { background: var(--um-row-hover); }
        .um-table-cell {
          padding: 12px 12px 12px 0;
          display: flex; align-items: center;
        }
        .um-table-cell:last-child { padding-right: 0; }

        /* Inputs */
        .um-input {
          width: 100%; height: 40px; padding: 0 12px;
          border-radius: 9px; border: 1px solid var(--um-input-border);
          background: var(--um-input-bg); color: var(--um-text);
          font-size: 13px; font-family: inherit; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .um-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .um-input::placeholder { color: var(--um-text3); }
        .um-select {
          width: 100%; height: 40px; padding: 0 12px;
          border-radius: 9px; border: 1px solid var(--um-input-border);
          background: var(--um-input-bg); color: var(--um-text);
          font-size: 13px; font-family: inherit; outline: none; cursor: pointer;
          box-sizing: border-box;
          appearance: none;
        }

        /* Buttons */
        .um-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 38px; border-radius: 10px; border: none;
          background: #6366f1; color: #fff;
          font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
          transition: all 0.15s; white-space: nowrap;
        }
        .um-btn-primary:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
        .um-btn-outline {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 14px; height: 38px; border-radius: 10px;
          border: 1px solid var(--um-border);
          background: var(--um-cell-bg); color: var(--um-text2);
          font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .um-btn-outline:hover { border-color: rgba(99,102,241,0.35); color: #6366f1; }
        .um-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0 10px; height: 30px; border-radius: 7px; border: none;
          font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }

        /* Search */
        .um-search-wrap { position: relative; display: flex; align-items: center; }
        .um-search-icon { position: absolute; left: 10px; color: var(--um-text3); pointer-events: none; display: flex; align-items: center; }
        .um-search-input {
          height: 38px; padding: 0 32px; border-radius: 9px;
          border: 1px solid var(--um-input-border);
          background: var(--um-input-bg); color: var(--um-text);
          font-size: 13px; font-family: inherit; outline: none; width: 220px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .um-search-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .um-search-input::placeholder { color: var(--um-text3); }
        .um-clear-btn {
          position: absolute; right: 8px; width: 18px; height: 18px;
          border-radius: 50%; border: none; background: var(--um-text3); color: var(--um-card);
          display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.6;
        }
        .um-clear-btn:hover { opacity: 1; }

        /* Role pill filter */
        .um-pill {
          display: inline-flex; align-items: center; gap: 5px;
          height: 38px; padding: 0 14px; border-radius: 9px;
          border: 1px solid var(--um-border);
          background: var(--um-cell-bg); color: var(--um-text2);
          font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .um-pill:hover { border-color: rgba(99,102,241,0.3); color: #6366f1; }
        .um-pill.active-all { background: #6366f1; color: #fff; border-color: #6366f1; }

        /* Hierarchy tree */
        .um-hierarchy {
          background: var(--um-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--um-border);
          border-radius: 16px; padding: 20px; margin-bottom: 20px;
          animation: um-slideUp 0.2s ease;
        }
        .um-tree-node {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 8px; margin-bottom: 4px;
          background: var(--um-cell-bg); border: 1px solid var(--um-row-border);
        }

        /* Empty */
        .um-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 24px;
          gap: 8px; text-align: center;
        }

        /* Modal form submit */
        .um-form-actions {
          display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px;
          border-top: 1px solid var(--um-border);
        }

        /* ── Responsive: Tablet ── */
        @media (max-width: 1199px) {
          .um-table-head, .um-table-row {
            grid-template-columns: 180px 1fr 100px 120px 100px 120px;
            min-width: 680px;
          }
          .um-col-lead, .um-col-manager { display: none; }
        }

        /* ── Responsive: Mobile ── */
        .um-card-view { display: none; }
        @media (max-width: 767px) {
          .um-table-wrap { display: none !important; }
          .um-card-view { display: flex; flex-direction: column; gap: 10px; }
          .um-stats-strip { gap: 8px !important; }
          .um-stats-strip > button { flex: 1 1 calc(50% - 4px) !important; }
          .um-search-input { width: 100% !important; }
          .um-search-wrap { flex: 1; }
          .um-filter-bar { overflow-x: auto; padding-bottom: 4px; }
          .um-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="um-root">

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--um-text)", margin: 0, letterSpacing: "-0.025em" }}>
              User Management
            </h2>
            <p style={{ fontSize: 13, color: "var(--um-text3)", margin: "4px 0 0" }}>
              Manage organisation users, roles, and hierarchy
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button className="um-btn-outline" onClick={() => setShowHierarchy(p => !p)}>
              <IcHierarchy />
              {showHierarchy ? "Hide" : "View"} Hierarchy
            </button>
            <button className="um-btn-primary" onClick={() => setShowCreateModal(true)}>
              <IcPlus />
              Create User
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }} className="um-stats-strip">
          {[
            { role: "ALL", color: "#6366f1", label: "Total Users", count: users.length },
            { role: "ADMIN", color: "#ef4444", label: "Admins", count: roleCounts.ADMIN || 0 },
            { role: "MANAGER", color: "#8b5cf6", label: "Managers", count: roleCounts.MANAGER || 0 },
            { role: "LEAD", color: "#3b82f6", label: "Leads", count: roleCounts.LEAD || 0 },
            { role: "EMPLOYEE", color: "#22c55e", label: "Employees", count: roleCounts.EMPLOYEE || 0 },
          ].map(({ role, color, label, count }) => (
            <button key={role} onClick={() => setRoleFilter(role)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px", borderRadius: 12, border: "1px solid",
              borderColor: roleFilter === role ? `${color}40` : "var(--um-border)",
              background: roleFilter === role ? `${color}0d` : "var(--um-cell-bg)",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s", flex: "1 1 120px",
              outline: roleFilter === role ? `2px solid ${color}30` : "none",
              outlineOffset: 1,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `${color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--um-text3)", marginTop: 2 }}>{label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Hierarchy Panel ── */}
        {showHierarchy && (
          <div className="um-hierarchy">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--um-text)" }}>Organisation Hierarchy</h4>
              <button onClick={() => setShowHierarchy(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--um-text3)" }}><IcX /></button>
            </div>
            {["ADMIN", "MANAGER", "LEAD", "EMPLOYEE"].map(role => {
              const cfg = ROLE_CONFIG[role];
              const group = users.filter(u => u.role === role);
              if (!group.length) return null;
              return (
                <div key={role} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cfg.color, marginBottom: 5, paddingLeft: 2 }}>{cfg.label}s</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: role === "EMPLOYEE" ? 32 : role === "LEAD" ? 20 : role === "MANAGER" ? 10 : 0 }}>
                    {group.map(u => {
                      const [c1, c2] = getAvatarColors(u.name);
                      return (
                        <div key={u._id} className="um-tree-node">
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${c1}, ${c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {getInitials(u.name)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--um-text)" }}>{u.name}</span>
                          <span style={{ fontSize: 11, color: "var(--um-text3)", marginLeft: 4 }}>— {u.email}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 6px", borderRadius: 5, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="um-filter-bar" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <div className="um-search-wrap">
            <span className="um-search-icon"><IcSearch /></span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users…" className="um-search-input"
            />
            {search && <button className="um-clear-btn" onClick={() => setSearch("")}><IcX /></button>}
          </div>

          {ROLE_FILTERS.map(r => {
            const cfg = ROLE_CONFIG[r];
            const active = roleFilter === r;
            return (
              <button key={r} className={`um-pill ${r === "ALL" && active ? "active-all" : ""}`}
                onClick={() => setRoleFilter(r)}
                style={r !== "ALL" && active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}>
                {r !== "ALL" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? cfg.color : "currentColor", opacity: active ? 1 : 0.4, flexShrink: 0 }} />}
                {r === "ALL" ? "All Users" : cfg.label}
              </button>
            );
          })}

          {(search || roleFilter !== "ALL") && (
            <span style={{ fontSize: 12, color: "var(--um-text3)", marginLeft: "auto" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <div className="um-table-wrap">
          {/* Header */}
          <div className="um-table-head">
            {["Name", "Email", "Role", "Department", "Lead", "Manager", "Status", "Actions"].map(h => (
              <div key={h} className={`um-table-head-cell ${h === "Lead" ? "um-col-lead" : ""} ${h === "Manager" ? "um-col-manager" : ""}`}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "var(--um-text3)", fontSize: 13 }}>
              <span style={{ width: 18, height: 18, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "um-spin 0.8s linear infinite", display: "inline-block" }} />
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="um-empty">
              <IcUser />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--um-text2)", margin: 0 }}>No users found</p>
              <p style={{ fontSize: 13, color: "var(--um-text3)", margin: 0 }}>
                {search ? `No results for "${search}"` : "No users match the selected filter."}
              </p>
            </div>
          ) : (
            filtered.map((u, i) => {
              const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.EMPLOYEE;
              const statusCfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.INACTIVE;
              const [c1, c2] = getAvatarColors(u.name);
              const isActive = u.status === "ACTIVE";

              return (
                <div key={u._id} className="um-table-row" style={{ animationDelay: `${i * 0.04}s` }}>

                  {/* Name */}
                  <div className="um-table-cell">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: "#fff",
                        boxShadow: `0 2px 8px ${c1}40`,
                      }}>{getInitials(u.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--um-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="um-table-cell">
                    <span style={{ fontSize: 13, color: "var(--um-text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                  </div>

                  {/* Role */}
                  <div className="um-table-cell">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 9px", borderRadius: 7,
                      background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}`,
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: roleCfg.color }} />
                      {roleCfg.label}
                    </span>
                  </div>

                  {/* Department */}
                  <div className="um-table-cell">
                    <span style={{ fontSize: 13, color: "var(--um-text2)" }}>{u.department || <span style={{ color: "var(--um-text3)", fontStyle: "italic" }}>—</span>}</span>
                  </div>

                  {/* Lead */}
                  <div className="um-table-cell um-col-lead">
                    {u.lead ? (
                      <span style={{ fontSize: 13, color: "var(--um-text2)" }}>{u.lead}</span>
                    ) : (
                      <span style={{ color: "var(--um-text3)", fontSize: 13, fontStyle: "italic" }}>—</span>
                    )}
                  </div>

                  {/* Manager */}
                  <div className="um-table-cell um-col-manager">
                    {u.manager
                      ? <span style={{ fontSize: 13, color: "var(--um-text2)" }}>{u.manager}</span>
                      : <span style={{ color: "var(--um-text3)", fontSize: 13, fontStyle: "italic" }}>—</span>}
                  </div>

                  {/* Status */}
                  <div className="um-table-cell">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 9px", borderRadius: 7,
                      background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusCfg.color }} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="um-table-cell" style={{ gap: 6 }}>
                    <button
                      className="um-action-btn"
                      onClick={() => setEditingUser({ ...u })}
                      style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      <IcEdit /> Edit
                    </button>
                    <button
                      className="um-action-btn"
                      onClick={() => setConfirmDeactivate(u)}
                      style={isActive
                        ? { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)" }
                        : { background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.18)" }
                      }
                    >
                      {isActive ? <><IcPower /> Deactivate</> : <><IcCheck /> Activate</>}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ── Mobile Card View ── */}
        <div className="um-card-view">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "var(--um-text3)", fontSize: 13 }}>
              <span style={{ width: 18, height: 18, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "um-spin 0.8s linear infinite", display: "inline-block" }} />
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="um-empty">
              <IcUser />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--um-text2)", margin: 0 }}>No users found</p>
              <p style={{ fontSize: 13, color: "var(--um-text3)", margin: 0 }}>
                {search ? `No results for "${search}"` : "No users match the selected filter."}
              </p>
            </div>
          ) : (
            filtered.map((u, i) => {
              const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.EMPLOYEE;
              const statusCfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.INACTIVE;
              const [c1, c2] = getAvatarColors(u.name);
              const isActive = u.status === "ACTIVE";

              return (
                <div key={u._id} style={{
                  background: "var(--um-card)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid var(--um-border)",
                  borderRadius: 16,
                  padding: 16,
                  animation: `um-slideUp 0.2s ease ${i * 0.04}s both`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: "#fff",
                        boxShadow: `0 2px 8px ${c1}40`,
                      }}>{getInitials(u.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--um-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--um-text2)" }}>{u.email}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--um-text3)", textTransform: "uppercase", marginBottom: 4 }}>Role</div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 9px", borderRadius: 7,
                        background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}`,
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      }}>
                        {roleCfg.label}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--um-text3)", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 9px", borderRadius: 7,
                        background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--um-row-border)" }}>
                    <button
                      className="um-action-btn"
                      onClick={() => setEditingUser({ ...u })}
                      style={{ flex: 1, justifyContent: "center", background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      <IcEdit /> Edit
                    </button>
                    <button
                      className="um-action-btn"
                      onClick={() => setConfirmDeactivate(u)}
                      style={isActive
                        ? { flex: 1, justifyContent: "center", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)" }
                        : { flex: 1, justifyContent: "center", background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.18)" }
                      }
                    >
                      {isActive ? <><IcPower /> Deactivate</> : <><IcCheck /> Activate</>}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Create User Modal ── */}
        {showCreateModal && (
          <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column" }}>
              <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Full Name">
                  <input required className="um-input" placeholder="e.g. John Doe" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                </FormField>
                <FormField label="Email">
                  <input required type="email" className="um-input" placeholder="john@example.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="Password">
                <input required type="password" className="um-input" placeholder="Minimum 8 characters" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
              </FormField>
              <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Role">
                  <div style={{ position: "relative" }}>
                    <select className="um-select" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                      {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}><IcChevronDown /></span>
                  </div>
                </FormField>
                <FormField label="Department">
                  <input className="um-input" placeholder="e.g. Engineering" value={createForm.department} onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))} />
                </FormField>
              </div>

              {createForm.role === "EMPLOYEE" && (
                <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField label="Assign Lead">
                    <div style={{ position: "relative" }}>
                      <select
                        className="um-select"
                        value={createForm.leadId}
                        onChange={(e) => setCreateForm((p) => ({ ...p, leadId: e.target.value }))}
                      >
                        <option value="">Select Lead</option>
                        {leads.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                        <IcChevronDown />
                      </span>
                    </div>
                  </FormField>

                  <FormField label="Assign Manager">
                    <div style={{ position: "relative" }}>
                      <select
                        className="um-select"
                        value={createForm.managerId}
                        onChange={(e) => setCreateForm((p) => ({ ...p, managerId: e.target.value }))}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                        <IcChevronDown />
                      </span>
                    </div>
                  </FormField>
                </div>
              )}

              {createForm.role === "LEAD" && (
                <FormField label="Assign Manager">
                  <div style={{ position: "relative" }}>
                    <select
                      className="um-select"
                      value={createForm.managerId}
                      onChange={(e) => setCreateForm((p) => ({ ...p, managerId: e.target.value }))}
                    >
                      <option value="">Select Manager</option>
                      {managers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                      <IcChevronDown />
                    </span>
                  </div>
                </FormField>
              )}
              <div className="um-form-actions">
                <button type="button" className="um-btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="um-btn-primary"><IcPlus /> Create User</button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Edit User Modal ── */}
        {editingUser && (
          <Modal title="Edit User" onClose={() => setEditingUser(null)}>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column" }}>
              <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Full Name">
                  <input required className="um-input" value={editingUser.name} onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} />
                </FormField>
                <FormField label="Email">
                  <input required type="email" className="um-input" value={editingUser.email} onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} />
                </FormField>
              </div>
              <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Role">
                  <div style={{ position: "relative" }}>
                    <select className="um-select" value={editingUser.role} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}>
                      {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}><IcChevronDown /></span>
                  </div>
                </FormField>
                <FormField label="Department">
                  <input className="um-input" value={editingUser.department || ""} onChange={e => setEditingUser(p => ({ ...p, department: e.target.value }))} />
                </FormField>
              </div>

              {editingUser.role === "EMPLOYEE" && (
                <div className="um-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField label="Assign Lead">
                    <div style={{ position: "relative" }}>
                      <select
                        className="um-select"
                        value={editingUser.leadId?._id || editingUser.leadId || ""}
                        onChange={(e) => setEditingUser((p) => ({ ...p, leadId: e.target.value }))}
                      >
                        <option value="">Select Lead</option>
                        {leads.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                        <IcChevronDown />
                      </span>
                    </div>
                  </FormField>

                  <FormField label="Assign Manager">
                    <div style={{ position: "relative" }}>
                      <select
                        className="um-select"
                        value={editingUser.managerId?._id || editingUser.managerId || ""}
                        onChange={(e) => setEditingUser((p) => ({ ...p, managerId: e.target.value }))}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                        <IcChevronDown />
                      </span>
                    </div>
                  </FormField>
                </div>
              )}

              {editingUser.role === "LEAD" && (
                <FormField label="Assign Manager">
                  <div style={{ position: "relative" }}>
                    <select
                      className="um-select"
                      value={editingUser.managerId?._id || editingUser.managerId || ""}
                      onChange={(e) => setEditingUser((p) => ({ ...p, managerId: e.target.value }))}
                    >
                      <option value="">Select Manager</option>
                      {managers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--um-text3)" }}>
                      <IcChevronDown />
                    </span>
                  </div>
                </FormField>
              )}
              <div className="um-form-actions">
                <button type="button" className="um-btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="um-btn-primary"><IcCheck /> Save Changes</button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Confirm Deactivate Modal ── */}
        {confirmDeactivate && (
          <Modal title={confirmDeactivate.status === "ACTIVE" ? "Deactivate User" : "Activate User"} onClose={() => setConfirmDeactivate(null)}>
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: confirmDeactivate.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {confirmDeactivate.status === "ACTIVE" ? <IcPower /> : <IcCheck />}
              </div>
              <p style={{ fontSize: 14, color: "var(--um-text2)", margin: "0 0 6px" }}>
                {confirmDeactivate.status === "ACTIVE"
                  ? <>Are you sure you want to deactivate <strong style={{ color: "var(--um-text)" }}>{confirmDeactivate.name}</strong>?</>
                  : <>Reactivate <strong style={{ color: "var(--um-text)" }}>{confirmDeactivate.name}</strong>'s account?</>}
              </p>
              <p style={{ fontSize: 12, color: "var(--um-text3)", margin: 0 }}>
                {confirmDeactivate.status === "ACTIVE" ? "They will lose access to the platform." : "They will regain full access."}
              </p>
            </div>
            <div className="um-form-actions" style={{ justifyContent: "center" }}>
              <button className="um-btn-outline" onClick={() => setConfirmDeactivate(null)}>Cancel</button>
              <button
                className="um-action-btn"
                onClick={() => handleDeactivate(confirmDeactivate)}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 10, fontSize: 13,
                  background: confirmDeactivate.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  color: confirmDeactivate.status === "ACTIVE" ? "#ef4444" : "#22c55e",
                  border: `1px solid ${confirmDeactivate.status === "ACTIVE" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
                  fontWeight: 600,
                }}
              >
                {confirmDeactivate.status === "ACTIVE" ? "Yes, Deactivate" : "Yes, Activate"}
              </button>
            </div>
          </Modal>
        )}

      </div>
    </>
  );
}

export default AdminUsersPage;