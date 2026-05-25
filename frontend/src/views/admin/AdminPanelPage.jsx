import { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../constants/routes";
import { AuthContext } from "../../context/AuthContext";
import {
  adminGetStatsApi, adminGetAllProjectsApi, adminGetAllTicketsApi,
  adminDeleteTicketApi, adminRestoreProjectApi, getAllUsersAdminApi,
} from "../../services/adminService";
import { deleteProjectApi } from "../../services/projectService";
import TicketDetailPanel, { StatusBadge, PriorityBadge } from "../../components/tickets/TicketDetailPanel";
import { TicketProvider } from "../../context/TicketContext";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "projects", label: "Projects" },
  { key: "tickets", label: "Tickets" },
  { key: "team", label: "Team" },
];

export default function AdminPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (user && user.role !== "ADMIN") navigate(APP_ROUTES.DASHBOARD, { replace: true });
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, projRes, tickRes, usersRes] = await Promise.all([
        adminGetStatsApi(), adminGetAllProjectsApi(showDeleted),
        adminGetAllTicketsApi(), getAllUsersAdminApi(),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (projRes.success) setProjects(projRes.projects);
      if (tickRes.success) setTickets(tickRes.tickets);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (e) {
      console.error("Admin load error:", e);
      showToast("Failed to load data", "error");
    } finally { setLoading(false); }
  }, [showDeleted, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.projectId?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q));
    }
    return list;
  }, [projects, search]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.ticketId?.toLowerCase().includes(q) || t.raisedBy?.name?.toLowerCase().includes(q));
    }
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    return list;
  }, [tickets, search, statusFilter, priorityFilter]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
  }, [users, search]);

  const handleDeleteProject = (proj) => {
    setConfirm({
      title: "Delete Project", message: `Delete "${proj.title}" (${proj.projectId})?`,
      onConfirm: async () => {
        try { const res = await deleteProjectApi(proj.projectId); if (res.success) { showToast("Project deleted"); loadData(); } }
        catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
        setConfirm(null);
      },
    });
  };

  const handleRestoreProject = async (proj) => {
    try { const res = await adminRestoreProjectApi(proj._id); if (res.success) { showToast("Project restored"); loadData(); } }
    catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleDeleteTicket = (ticket) => {
    setConfirm({
      title: "Delete Ticket", message: `Permanently delete "${ticket.title}" (${ticket.ticketId})?`,
      onConfirm: async () => {
        try { const res = await adminDeleteTicketApi(ticket._id); if (res.success) { showToast("Ticket deleted"); setSelectedTicketId(null); loadData(); } }
        catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
        setConfirm(null);
      },
    });
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-20 text-text3 text-sm font-sans">
      <span className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin inline-block" />
      Loading admin panel…
    </div>
  );

  return (
    <div className="font-sans relative flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[1000] px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg animate-fade-in ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center" onClick={() => setConfirm(null)}>
          <div className="bg-card border border-card-border rounded-2xl p-7 max-w-[400px] w-[90%]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-text mb-2">{confirm.title}</h3>
            <p className="text-sm text-text3 mb-5">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-text3 text-xs font-semibold hover:bg-bg-hover transition-colors" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors" onClick={confirm.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Left: main content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">⚡ Admin Control Panel</h1>
          <p className="text-sm text-text3 mt-1">Full access to all projects, tickets, and team management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-bg3 rounded-xl p-1 border border-border w-fit">
          {TABS.map(t => (
            <button key={t.key}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-accent-bg text-accent-text font-semibold" : "text-text3 hover:text-text2"}`}
              onClick={() => { setTab(t.key); setSearch(""); setStatusFilter(""); setPriorityFilter(""); setSelectedTicketId(null); }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab stats={stats} setTab={setTab} />}
        {tab === "projects" && (
          <ProjectsTab projects={filteredProjects} search={search} setSearch={setSearch}
            showDeleted={showDeleted} setShowDeleted={setShowDeleted}
            onView={(p) => navigate(`/projects/${p.projectId}`)} onDelete={handleDeleteProject} onRestore={handleRestoreProject} fmtDate={fmtDate} />
        )}
        {tab === "tickets" && (
          <TicketsTab tickets={filteredTickets} search={search} setSearch={setSearch}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
            selectedTicketId={selectedTicketId}
            onSelect={(t) => setSelectedTicketId(selectedTicketId === t.ticketId ? null : t.ticketId)}
            onDelete={handleDeleteTicket} fmtDate={fmtDate} />
        )}
        {tab === "team" && (
          <TeamTab users={filteredUsers} search={search} setSearch={setSearch} fmtDate={fmtDate}
            onManage={() => navigate(APP_ROUTES.ADMIN_USERS)} />
        )}
      </div>

      {/* Right: Ticket Detail Side Panel */}
      {tab === "tickets" && selectedTicketId && (
        <div className="hidden lg:flex flex-shrink-0 animate-slide-up" style={{ width: "clamp(360px, 30vw, 430px)" }}>
          <TicketProvider ticketId={selectedTicketId}>
            <TicketDetailPanel
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
              currentUser={user}
              onUpdate={() => loadData()}
            />
          </TicketProvider>
        </div>
      )}
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ stats, setTab }) {
  if (!stats) return <div className="text-center py-12 text-text3">No stats available</div>;
  const cards = [
    { label: "Active Projects", value: stats.activeProjects, color: "text-indigo-400" },
    { label: "Deleted Projects", value: stats.deletedProjects, color: "text-red-400" },
    { label: "Total Tickets", value: stats.totalTickets, color: "text-purple-400" },
    { label: "Active Users", value: stats.activeUsers, color: "text-emerald-400" },
    { label: "Inactive Users", value: stats.inactiveUsers, color: "text-amber-400" },
    { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-4 hover:-translate-y-0.5 transition-transform">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text3 mb-1">{c.label}</div>
            <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      {stats.ticketsByStatus && (
        <>
          <h3 className="text-sm font-bold text-text mb-3">Tickets by Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Object.entries(stats.ticketsByStatus).map(([k, v]) => (
              <div key={k} className="bg-card border border-card-border rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-transform" onClick={() => setTab("tickets")}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text3 mb-1">{k.replace("_", " ")}</div>
                <div className="text-xl font-extrabold text-text">{v}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {stats.ticketsByPriority && (
        <>
          <h3 className="text-sm font-bold text-text mb-3">Tickets by Priority</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.ticketsByPriority).map(([k, v]) => (
              <div key={k} className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text3 mb-1">{k}</div>
                <div className="text-xl font-extrabold text-text">{v}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── Projects Tab ── */
function ProjectsTab({ projects, search, setSearch, showDeleted, setShowDeleted, onView, onDelete, onRestore, fmtDate }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input className="flex-1 min-w-[200px] h-9 px-3 rounded-lg border border-border bg-bg3 text-text text-sm outline-none focus:border-accent placeholder:text-text3" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className={`px-3 h-9 rounded-lg border text-xs font-semibold transition-all ${showDeleted ? "border-accent/30 bg-accent-bg text-accent-text" : "border-border bg-bg3 text-text3 hover:text-text2"}`} onClick={() => setShowDeleted(!showDeleted)}>
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
        </button>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-12 text-text3 text-sm">No projects found</div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-bg3 border-b border-border">
                  <Th>ID</Th><Th>Title</Th><Th>Dept</Th><Th>Manager</Th><Th>Lead</Th><Th>Members</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p._id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-indigo-400 whitespace-nowrap text-xs">{p.projectId}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">{p.title}</td>
                    <td className="px-3 py-2.5 text-text2">{p.department || "—"}</td>
                    <td className="px-3 py-2.5 text-text2">{p.managerId?.name || "—"}</td>
                    <td className="px-3 py-2.5 text-text2">{p.leadId?.name || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(p.memberIds || []).slice(0, 2).map(m => <span key={m._id} className="px-2 py-0.5 rounded bg-accent-bg text-accent-text text-[10px] font-medium">{m.name}</span>)}
                        {(p.memberIds || []).length > 2 && <span className="px-2 py-0.5 rounded bg-accent-bg text-accent-text text-[10px] font-medium">+{p.memberIds.length - 2}</span>}
                        {(!p.memberIds || p.memberIds.length === 0) && <span className="text-text3">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><Badge type={p.isDeleted ? "deleted" : "active"}>{p.isDeleted ? "Deleted" : "Active"}</Badge></td>
                    <td className="px-3 py-2.5 text-text3 text-xs whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <ActionBtn color="indigo" onClick={() => onView(p)}>View</ActionBtn>
                      {p.isDeleted
                        ? <ActionBtn color="emerald" onClick={() => onRestore(p)}>Restore</ActionBtn>
                        : <ActionBtn color="red" onClick={() => onDelete(p)}>Delete</ActionBtn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Tickets Tab ── */
function TicketsTab({ tickets, search, setSearch, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, selectedTicketId, onSelect, onDelete, fmtDate }) {
  const statuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input className="flex-1 min-w-[200px] h-9 px-3 rounded-lg border border-border bg-bg3 text-text text-sm outline-none focus:border-accent placeholder:text-text3" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="h-9 px-2 rounded-lg border border-border bg-bg3 text-text text-xs outline-none cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select className="h-9 px-2 rounded-lg border border-border bg-bg3 text-text text-xs outline-none cursor-pointer" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-text3 text-sm">No tickets found</div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-bg3 border-b border-border">
                  <Th>Ticket ID</Th><Th>Title</Th><Th>Project</Th><Th>Raised By</Th><Th>Assigned To</Th><Th>Status</Th><Th>Priority</Th><Th>Created</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  const isSel = selectedTicketId === t.ticketId;
                  return (
                    <tr key={t._id}
                      className={`border-b border-border-light cursor-pointer transition-colors ${isSel ? "bg-accent-bg border-l-2 border-l-accent" : "hover:bg-bg-hover"}`}
                      onClick={() => onSelect(t)}>
                      <td className="px-3 py-2.5 font-semibold text-purple-400 whitespace-nowrap text-xs font-mono">{t.ticketId}</td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate font-medium">{t.title}</td>
                      <td className="px-3 py-2.5 text-text2 text-xs">{t.projectId?.title || "—"}</td>
                      <td className="px-3 py-2.5 text-text2 text-xs">{t.raisedBy?.name || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(t.assignedTo || []).map(a => <span key={a._id} className="px-2 py-0.5 rounded bg-accent-bg text-accent-text text-[10px] font-medium">{a.name}</span>)}
                          {(!t.assignedTo || t.assignedTo.length === 0) && <span className="text-text3">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge value={t.status} /></td>
                      <td className="px-3 py-2.5"><PriorityBadge value={t.priority} /></td>
                      <td className="px-3 py-2.5 text-text3 text-xs whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <ActionBtn color="red" onClick={() => onDelete(t)}>Delete</ActionBtn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] text-text3 mt-3">💡 Click any ticket row to view full details, edit status, assign/reassign in the side panel.</p>
    </>
  );
}

/* ── Team Tab ── */
function TeamTab({ users, search, setSearch, fmtDate, onManage }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input className="flex-1 min-w-[200px] h-9 px-3 rounded-lg border border-border bg-bg3 text-text text-sm outline-none focus:border-accent placeholder:text-text3" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="px-4 h-9 rounded-lg border border-accent/30 text-accent-text text-xs font-semibold hover:bg-accent-bg transition-colors" onClick={onManage}>Manage Users →</button>
      </div>
      {users.length === 0 ? (
        <div className="text-center py-12 text-text3 text-sm">No users found</div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-bg3 border-b border-border">
                  <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Department</Th><Th>Lead</Th><Th>Manager</Th><Th>Status</Th><Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                    <td className="px-3 py-2.5 font-semibold">{u.name}</td>
                    <td className="px-3 py-2.5 text-text3 text-xs">{u.email}</td>
                    <td className="px-3 py-2.5"><RoleBadge role={u.role} /></td>
                    <td className="px-3 py-2.5 text-text2">{u.department || "—"}</td>
                    <td className="px-3 py-2.5 text-text2 text-xs">{u.leadId?.name || "—"}</td>
                    <td className="px-3 py-2.5 text-text2 text-xs">{u.managerId?.name || "—"}</td>
                    <td className="px-3 py-2.5"><Badge type={u.isActive ? "active" : "deleted"}>{u.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-3 py-2.5 text-text3 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Shared tiny components ── */
function Th({ children }) {
  return <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text3 whitespace-nowrap">{children}</th>;
}

function Badge({ type, children }) {
  const cls = type === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : type === "deleted" ? "bg-red-500/10 text-red-400 border-red-500/20"
    : "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${cls}`}>{children}</span>;
}

function RoleBadge({ role }) {
  const map = { ADMIN: "bg-red-500/10 text-red-400", MANAGER: "bg-purple-500/10 text-purple-400", LEAD: "bg-blue-500/10 text-blue-400", EMPLOYEE: "bg-emerald-500/10 text-emerald-400" };
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${map[role] || map.EMPLOYEE}`}>{role}</span>;
}

function ActionBtn({ color, onClick, children }) {
  const cls = color === "red" ? "border-red-500/25 text-red-400 hover:bg-red-500/10"
    : color === "emerald" ? "border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10"
    : "border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10";
  return <button className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all mr-1 ${cls}`} onClick={onClick}>{children}</button>;
}
