import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { handleGetMyAssignedProjects } from "../../controllers/projectController";
import {
  handleGetMyRaisedTickets,
  handleGetMyAssignedTickets,
} from "../../controllers/ticketController";
import { APP_ROUTES } from "../../constants/routes";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [expandedEmployee, setExpandedEmployee] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [raisedData, assignedData, taskData] = await Promise.all([
          handleGetMyRaisedTickets().catch(() => ({ tickets: [] })),
          handleGetMyAssignedTickets().catch(() => ({ tickets: [] })),
          handleGetMyAssignedProjects().catch(() => ({ projects: [] })),
        ]);
        setTickets(raisedData?.tickets || []);
        setAssignedTickets(assignedData?.tickets || []);
        setProjects(taskData?.projects || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Helpers
  const getPriorityClass = (p) => {
    switch (p) {
      case "URGENT": return "badge-urgent";
      case "HIGH": return "badge-high";
      case "MEDIUM": return "badge-medium";
      case "LOW": return "badge-low";
      default: return "badge-medium";
    }
  };
  const getStatusClass = (s) => `status-${s?.toLowerCase().replace(/ /g, "_")}`;
  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const isOverdue = (t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date() && t.status !== "RESOLVED" && t.status !== "CLOSED";
  };
  const isResolved = (t) => t.status === "RESOLVED" || t.status === "CLOSED";
  const isOpen = (t) =>
    t.status === "OPEN" || t.status === "ASSIGNED" || t.status === "IN_PROGRESS" || t.status === "REOPENED";

  const getPriorityWeight = (p) => ({ URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[p] || 0);

  const getStatusProgress = (status) => {
    const map = { OPEN: 0, IN_PROGRESS: 40, REVIEW: 70, COMPLETED: 100, REOPENED: 20, CANCELLED: 0 };
    return map[status] ?? 0;
  };

  const getProjectProgress = (project, allTickets) => {
    const projectTickets = allTickets.filter(t =>
      t.projectId === project._id || t.projectId?.projectId === project._id
    );
    if (projectTickets.length === 0) return getStatusProgress(project.status);
    const resolved = projectTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
    return Math.round((resolved / projectTickets.length) * 100);
  };

  const getProgressColor = (pct) => {
    if (pct === 0) return 'var(--db-border, #e5e7eb)';
    if (pct === 100) return 'var(--db-success, #10b981)';
    if (pct >= 70) return 'var(--db-accent, #6366f1)';
    if (pct >= 40) return 'var(--db-warn, #f59e0b)';
    return 'var(--db-accent, #6366f1)';
  };

  const getProjectTrackLabel = (project, allTickets) => {
    if (project.status === 'COMPLETED') return { label: 'Completed', color: 'var(--db-success)' };
    if (project.status === 'CANCELLED') return { label: 'Cancelled', color: 'var(--db-danger)' };
    const projectTickets = allTickets.filter(t =>
      t.projectId === project._id || t.projectId?.projectId === project._id
    );
    const hasOverdue = projectTickets.some(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
    );
    if (hasOverdue) return { label: 'Overdue', color: 'var(--db-danger, #ef4444)' };
    const progress = getProjectProgress(project, allTickets);
    if (progress < 30 && project.status === 'IN_PROGRESS') return { label: 'At risk', color: 'var(--db-warn, #f59e0b)' };
    return { label: 'On track', color: 'var(--db-success, #10b981)' };
  };

  // Shared Data
  const allTicketsRaw = [...tickets, ...assignedTickets];
  const allTickets = allTicketsRaw.filter(
    (t, i, arr) => arr.findIndex((x) => x._id === t._id) === i
  );

  const openTicketsCount = allTickets.filter(isOpen).length;
  const overdueTicketsCount = allTickets.filter(isOverdue).length;
  const resolvedTicketsCount = allTickets.filter(isResolved).length;
  const unassignedTicketsCount = allTickets.filter(
    (t) => !t.assignedTo || t.assignedTo.length === 0
  ).length;
  const openProjectsCount = projects.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;
  const completedProjectsCount = projects.filter((t) => t.status === "COMPLETED").length;

  const recentTickets = [...allTickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const volumeData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    allTickets.forEach((t) => { counts[new Date(t.createdAt).getDay()]++; });
    return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ day: days[i].charAt(0), count: counts[i] }));
  })();
  const maxVolume = Math.max(...volumeData.map((d) => d.count), 1);

  const distribution = (() => {
    const cats = {};
    allTickets.forEach((t) => { const cat = t.category || "General"; cats[cat] = (cats[cat] || 0) + 1; });
    return Object.entries(cats).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 4);
  })();
  const maxDist = Math.max(...distribution.map((d) => d.count), 1);
  const catColors = ["var(--clr-accent)", "#3b82f6", "var(--clr-success)", "#f59e0b"];

  // Manager data
  const employeeMap = new Map();
  allTickets.forEach((t) => {
    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : t.assignedTo ? [t.assignedTo] : [];
    assignees.forEach((a) => {
      if (!employeeMap.has(a._id)) employeeMap.set(a._id, { _id: a._id, name: a.name || "Unknown", tickets: [] });
      employeeMap.get(a._id).tickets.push(t);
    });
  });
  const teamMembers = Array.from(employeeMap.values());

  const topOverdueTickets = allTickets.filter(isOverdue)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

  const managerFilteredTickets = allTickets.filter((t) => {
    if (ticketFilter === "open") return isOpen(t);
    if (ticketFilter === "overdue") return isOverdue(t);
    if (ticketFilter === "unassigned") return !t.assignedTo || t.assignedTo.length === 0;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleTicketClick = (ticket) => {
    const state = { selectedTicketId: ticket.ticketId };
    if (ticket.projectId) {
      navigate(`/projects/${ticket.projectId.projectId || ticket.projectId}`, { state });
    } else {
      const isCreator = (ticket.raisedBy?._id || ticket.raisedBy) === user?._id;
      navigate(isCreator ? APP_ROUTES.TICKETS_RAISED : APP_ROUTES.TICKETS_ASSIGNED, { state });
    }
  };

  const getInitials = (name = "") => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const avatarColors = [
    { bg: "var(--avatar-1-bg)", color: "var(--avatar-1-fg)" },
    { bg: "var(--avatar-2-bg)", color: "var(--avatar-2-fg)" },
    { bg: "var(--avatar-3-bg)", color: "var(--avatar-3-fg)" },
    { bg: "var(--avatar-4-bg)", color: "var(--avatar-4-fg)" },
  ];
  const getAvatarColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

  if (loading) return <div className="spinner">Loading dashboard...</div>;

  const dashboardStyles = (
    <style>{`
      /* ══════════════════════════════════════════════
         DASHBOARD DESIGN SYSTEM — LIGHT + DARK THEME
         ══════════════════════════════════════════════ */

      :root {
        --db-bg:          transparent;
        --db-surface:     rgba(255, 255, 255, 0.25);
        --db-surface-2:   rgba(255, 255, 255, 0.3);
        --db-surface-3:   rgba(255, 255, 255, 0.4);
        --db-border:      rgba(0,0,0,0.08);
        --db-border-md:   rgba(0,0,0,0.11);
        --db-text:        #111827;
        --db-text-2:      #4b5563;
        --db-text-3:      #9ca3af;
        --db-accent:      #6366f1;
        --db-accent-bg:   rgba(99,102,241,0.08);
        --db-accent-bd:   rgba(99,102,241,0.25);
        --db-danger:      #ef4444;
        --db-danger-bg:   rgba(239,68,68,0.08);
        --db-danger-bd:   rgba(239,68,68,0.2);
        --db-warn:        #f59e0b;
        --db-warn-bg:     rgba(245,158,11,0.08);
        --db-success:     #10b981;
        --db-success-bg:  rgba(16,185,129,0.08);
        --avatar-1-bg: rgba(99,102,241,0.12); --avatar-1-fg: #4f46e5;
        --avatar-2-bg: rgba(16,185,129,0.12); --avatar-2-fg: #059669;
        --avatar-3-bg: rgba(245,158,11,0.12); --avatar-3-fg: #d97706;
        --avatar-4-bg: rgba(239,68,68,0.12);  --avatar-4-fg: #dc2626;
        --db-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        --db-shadow-md: 0 4px 16px rgba(0,0,0,0.08);
      }

      [data-theme="dark"], .dark, body.dark {
        --db-bg:          transparent;
        --db-surface:     rgba(22, 22, 29, 0.2);
        --db-surface-2:   rgba(30, 30, 40, 0.25);
        --db-surface-3:   rgba(37, 37, 48, 0.3);
        --db-border:      rgba(255,255,255,0.1);
        --db-border-md:   rgba(255,255,255,0.15);
        --db-text:        #f1f5f9;
        --db-text-2:      #94a3b8;
        --db-text-3:      #475569;
        --db-accent:      #818cf8;
        --db-accent-bg:   rgba(129,140,248,0.12);
        --db-accent-bd:   rgba(129,140,248,0.3);
        --db-danger:      #f87171;
        --db-danger-bg:   rgba(248,113,113,0.1);
        --db-danger-bd:   rgba(248,113,113,0.25);
        --db-warn:        #fbbf24;
        --db-warn-bg:     rgba(251,191,36,0.1);
        --db-success:     #34d399;
        --db-success-bg:  rgba(52,211,153,0.1);
        --avatar-1-bg: rgba(129,140,248,0.15); --avatar-1-fg: #a5b4fc;
        --avatar-2-bg: rgba(52,211,153,0.15);  --avatar-2-fg: #6ee7b7;
        --avatar-3-bg: rgba(251,191,36,0.15);  --avatar-3-fg: #fcd34d;
        --avatar-4-bg: rgba(248,113,113,0.15); --avatar-4-fg: #fca5a5;
        --db-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
        --db-shadow-md: 0 4px 16px rgba(0,0,0,0.35);
      }

      /* ── Base ── */
      .db { display: flex; flex-direction: column; gap: 20px; padding: 4px 0 32px; }

      /* ── Tabs ── */
      .db-tabs {
        display: flex; gap: 2px;
        background: var(--db-surface);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--db-border);
        border-radius: 12px; padding: 4px;
        width: fit-content; max-width: 100%;
        box-shadow: var(--db-shadow);
        overflow-x: auto; -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        flex-wrap: nowrap;
      }
      .db-tabs::-webkit-scrollbar { display: none; }
      .db-tab {
        background: none; border: none;
        padding: 7px 18px; border-radius: 9px;
        font-size: 13px; font-weight: 500;
        color: var(--db-text-2); cursor: pointer;
        transition: all 0.18s; letter-spacing: -0.01em;
        white-space: nowrap; flex-shrink: 0;
      }
      .db-tab:hover { color: var(--db-text); background: var(--db-surface-3); }
      .db-tab.active { background: var(--db-accent); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.35); }

      /* ── Stat Grid ── */
      .db-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }
      .db-stat {
        background: var(--db-surface);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--db-border);
        border-radius: 16px; padding: 18px 20px 16px;
        box-shadow: var(--db-shadow);
        position: relative; overflow: hidden;
        transition: box-shadow 0.2s;
      }
      .db-stat:hover { box-shadow: var(--db-shadow-md); }
      .db-stat-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
      .db-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 14px; }
      .db-stat-val { font-size: 28px; font-weight: 700; color: var(--db-text); letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px; }
      .db-stat-label { font-size: 12px; font-weight: 500; color: var(--db-text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
      .db-stat-bar { height: 4px; background: var(--db-surface-3); border-radius: 4px; overflow: hidden; }
      .db-stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
      .db-stat-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; margin-top: 8px; }

      /* ── Card ── */
      .db-card { background: var(--db-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--db-border); border-radius: 16px; padding: 20px; box-shadow: var(--db-shadow); }
      .db-card-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
      .db-card-title { font-size: 14px; font-weight: 600; color: var(--db-text); letter-spacing: -0.01em; }
      .db-card-sub { font-size: 12px; color: var(--db-text-3); }

      /* ── Two-col grid ── */
      .db-grid { display: grid; grid-template-columns: 1fr 300px; gap: 14px; }

      /* ── Chips ── */
      .db-chips { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
      .db-chip { background: var(--db-surface-3); border: 1px solid var(--db-border); color: var(--db-text-2); padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
      .db-chip:hover { border-color: var(--db-border-md); color: var(--db-text); }
      .db-chip.active { background: var(--db-accent-bg); border-color: var(--db-accent-bd); color: var(--db-accent); }

      /* ── Table ── */
      .db-table { display: flex; flex-direction: column; }
      .db-table-head { display: grid; padding: 0 12px 8px; border-bottom: 1px solid var(--db-border); font-size: 10px; font-weight: 600; color: var(--db-text-3); text-transform: uppercase; letter-spacing: 0.07em; gap: 10px; }
      .db-table-row { display: grid; padding: 10px 12px; border-radius: 10px; font-size: 13px; align-items: center; gap: 10px; cursor: pointer; transition: background 0.12s; color: var(--db-text); }
      .db-table-row:hover { background: var(--db-surface-3); }
      .db-tid { font-size: 11px; font-weight: 600; color: var(--db-accent); font-family: monospace; }
      .db-title { color: var(--db-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .db-date { font-size: 11px; color: var(--db-text-3); }

      /* ── Avatar ── */
      .db-avatar { width: 24px; height: 24px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; letter-spacing: 0; }

      /* ── Badge overrides ── */
      .db-badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.02em; }
      .db-badge-open { background: var(--db-accent-bg); color: var(--db-accent); }
      .db-badge-danger { background: var(--db-danger-bg); color: var(--db-danger); }
      .db-badge-warn { background: var(--db-warn-bg); color: var(--db-warn); }
      .db-badge-success { background: var(--db-success-bg); color: var(--db-success); }
      .db-badge-neutral { background: var(--db-surface-3); color: var(--db-text-3); }

      /* ── Overdue alert card ── */
      .db-alert { background: var(--db-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--db-danger-bd); border-radius: 16px; padding: 18px 20px; box-shadow: var(--db-shadow); }
      .db-alert-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--db-border); cursor: pointer; }
      .db-alert-row:last-child { border-bottom: none; }
      .db-alert-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--db-danger); flex-shrink: 0; margin-top: 4px; }
      .db-alert-name { font-size: 12px; font-weight: 600; color: var(--db-text); }
      .db-alert-title { font-size: 11px; color: var(--db-text-3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
      .db-alert-days { font-size: 10px; font-weight: 700; color: var(--db-danger); background: var(--db-danger-bg); padding: 2px 7px; border-radius: 5px; white-space: nowrap; margin-left: auto; flex-shrink: 0; }

      /* ── Workload ── */
      .db-wl-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--db-border); }
      .db-wl-row:last-child { border-bottom: none; }
      .db-wl-name { font-size: 12px; font-weight: 500; color: var(--db-text); width: 60px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .db-wl-track { flex: 1; height: 8px; background: var(--db-surface-3); border-radius: 10px; overflow: hidden; display: flex; gap: 1px; }
      .db-wl-open { height: 100%; background: var(--db-accent); border-radius: 10px 0 0 10px; transition: flex 0.4s; }
      .db-wl-resolved { height: 100%; background: var(--db-success); border-radius: 0 10px 10px 0; transition: flex 0.4s; }
      .db-wl-count { font-size: 10px; font-weight: 600; color: var(--db-text-3); width: 28px; text-align: right; flex-shrink: 0; }

      /* ── Project cards ── */
      .db-proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
      .db-proj-card { background: var(--db-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--db-border); border-radius: 16px; padding: 18px; box-shadow: var(--db-shadow); cursor: pointer; transition: all 0.2s; }
      .db-proj-card:hover { border-color: var(--db-accent-bd); box-shadow: var(--db-shadow-md); transform: translateY(-2px); }
      .db-proj-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
      .db-proj-name { font-size: 14px; font-weight: 600; color: var(--db-text); letter-spacing: -0.01em; line-height: 1.3; }
      .db-proj-meta { font-size: 11px; color: var(--db-text-3); margin-bottom: 14px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .db-proj-meta span:nth-child(2) { color: var(--db-border-md); }
      .db-prog-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--db-text-3); margin-bottom: 6px; }
      .db-prog-label strong { color: var(--db-text); font-weight: 600; }
      .db-prog-track { height: 6px; background: var(--db-surface-3); border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
      .db-prog-fill { height: 100%; border-radius: 6px; background: var(--db-accent); transition: width 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .db-proj-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--db-border); flex-wrap: wrap; gap: 6px; }
      .db-proj-count { font-size: 11px; color: var(--db-text-3); }

      /* ── Volume chart ── */
      .db-vol { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; height: 90px; padding: 0 4px; }
      .db-vol-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
      .db-vol-num { font-size: 10px; font-weight: 600; color: var(--db-text-3); }
      .db-vol-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
      .db-vol-bar { width: 100%; border-radius: 5px 5px 0 0; background: var(--db-accent); opacity: 0.7; min-height: 4px; transition: height 0.4s; }
      .db-vol-day { font-size: 10px; color: var(--db-text-3); font-weight: 500; }

      /* ── Distribution ── */
      .db-dist-row { padding: 7px 0; border-bottom: 1px solid var(--db-border); }
      .db-dist-row:last-child { border-bottom: none; }
      .db-dist-info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
      .db-dist-name { color: var(--db-text-2); font-weight: 500; }
      .db-dist-count { color: var(--db-text-3); font-weight: 600; }
      .db-dist-track { height: 5px; background: var(--db-surface-3); border-radius: 5px; overflow: hidden; }
      .db-dist-fill { height: 100%; border-radius: 5px; }

      /* ── Section header ── */
      .db-section-hd { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
      .db-section-title { font-size: 14px; font-weight: 600; color: var(--db-text); }
      .db-see-all { background: none; border: none; color: var(--db-accent); font-size: 12px; font-weight: 500; cursor: pointer; padding: 0; white-space: nowrap; }
      .db-see-all:hover { text-decoration: underline; }

      /* ── Employee table expanded row ── */
      .db-expand { background: var(--db-surface-2); border-radius: 10px; padding: 14px; margin: 4px 0 6px; }
      .db-expand-ticket { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 8px; background: var(--db-surface); border: 1px solid var(--db-border); cursor: pointer; margin-bottom: 6px; transition: border-color 0.15s; flex-wrap: wrap; gap: 8px; }
      .db-expand-ticket:hover { border-color: var(--db-accent-bd); }
      .db-expand-ticket:last-child { margin-bottom: 0; }

      /* ── Legend row ── */
      .db-legend { display: flex; gap: 14px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
      .db-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--db-text-3); font-weight: 500; }
      .db-legend-dot { width: 8px; height: 8px; border-radius: 3px; }

      /* ── Empty state ── */
      .db-empty { text-align: center; padding: 32px 16px; color: var(--db-text-3); font-size: 13px; }

      /* ── Reports placeholder ── */
      .db-reports { text-align: center; padding: 60px 20px; }
      .db-reports-icon { font-size: 40px; margin-bottom: 16px; }
      .db-reports-title { font-size: 17px; font-weight: 600; color: var(--db-text); margin-bottom: 8px; }
      .db-reports-desc { font-size: 13px; color: var(--db-text-3); max-width: 320px; margin: 0 auto; line-height: 1.6; }

      /* ══════════════════════════════════════════
         RESPONSIVE — TABLET (max 1024px)
         ══════════════════════════════════════════ */
      @media (max-width: 1024px) {
        .db-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        /* Main two-col → single column */
        .db-grid {
          grid-template-columns: 1fr;
        }

        /* Manager overview: ticket table + sidebar stack */
        .db-manager-main-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
        }

        /* Employee table: hide some columns */
        .db-emp-col-hide {
          display: none !important;
        }

        /* Project mini stats: 2 cols on tablet */
        .db-proj-mini-stats {
          grid-template-columns: repeat(2, 1fr) !important;
        }

        .db-proj-grid {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
      }

      /* ══════════════════════════════════════════
         RESPONSIVE — MOBILE (max 640px)
         ══════════════════════════════════════════ */
      @media (max-width: 640px) {
        .db {
          gap: 14px;
          padding: 2px 0 24px;
        }

        /* Stat cards: 2 cols on mobile, compact */
        .db-stats {
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .db-stat {
          padding: 14px 14px 12px;
          border-radius: 12px;
        }
        .db-stat-val { font-size: 22px; }
        .db-stat-label { font-size: 10px; margin-bottom: 10px; }
        .db-stat-icon { width: 30px; height: 30px; font-size: 14px; margin-bottom: 10px; }

        /* Cards */
        .db-card {
          padding: 14px;
          border-radius: 12px;
        }

        /* Tabs: full width scrollable */
        .db-tabs {
          width: 100%;
          border-radius: 10px;
        }
        .db-tab {
          padding: 7px 14px;
          font-size: 12px;
        }

        /* Two-col grids → single col */
        .db-grid {
          grid-template-columns: 1fr;
        }
        .db-two-col {
          grid-template-columns: 1fr !important;
        }

        /* Ticket table: simplified columns for mobile */
        .db-table-head.db-mgr-head,
        .db-table-row.db-mgr-row {
          grid-template-columns: 80px 1fr 70px !important;
        }
        .db-mgr-col-assigned,
        .db-mgr-col-due,
        .db-mgr-col-head-assigned,
        .db-mgr-col-head-due {
          display: none !important;
        }

        /* Employee tab: hide extra columns */
        .db-table-head.db-emp-head,
        .db-table-row.db-emp-row {
          grid-template-columns: 1fr 60px 60px 80px !important;
        }
        .db-emp-resolved-col,
        .db-emp-avgpri-col,
        .db-emp-resolved-head,
        .db-emp-avgpri-head {
          display: none !important;
        }

        /* Recent ticket table rows: simplified */
        .db-table-row.db-recent-row {
          grid-template-columns: 80px 1fr 76px !important;
        }
        .db-recent-date-col { display: none !important; }

        /* Chips: wrap naturally */
        .db-chips { gap: 5px; }
        .db-chip { padding: 4px 10px; font-size: 11px; }

        /* Alert title clamp */
        .db-alert-title { max-width: 110px; }
        .db-alert { padding: 14px; border-radius: 12px; }

        /* Project grid: single col */
        .db-proj-grid {
          grid-template-columns: 1fr;
        }
        .db-proj-card { padding: 14px; border-radius: 12px; }
        .db-proj-card:hover { transform: none; }

        /* Project detail mini stats: 2 cols */
        .db-proj-mini-stats {
          grid-template-columns: repeat(2, 1fr) !important;
        }

        /* Employee expand ticket */
        .db-expand { padding: 10px; }
        .db-expand-ticket { padding: 8px 10px; }

        /* Section headers */
        .db-section-hd { gap: 6px; }
        .db-section-title { font-size: 13px; }

        /* My projects summary: 3 cols → squeeze */
        .db-my-projects-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
        }
        .db-my-projects-grid > div {
          padding: 10px 10px !important;
        }
        .db-my-projects-grid > div > div:last-child {
          font-size: 18px !important;
        }

        /* Raised vs Assigned breakdown: single col */
        .db-raised-assigned-grid {
          grid-template-columns: 1fr !important;
        }

        /* Mini stat rows inside cards */
        .db-mini-stats-3 {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 6px !important;
        }
        .db-mini-stats-3 > div {
          padding: 8px 8px !important;
        }
        .db-mini-stats-3 > div > div:last-child {
          font-size: 16px !important;
        }

        /* Volume chart compact */
        .db-vol { height: 70px; gap: 4px; }
        .db-vol-num { font-size: 9px; }
        .db-vol-day { font-size: 9px; }

        /* Workload name wider on mobile */
        .db-wl-name { width: 48px; font-size: 11px; }

        /* Reports */
        .db-reports { padding: 40px 16px; }
        .db-reports-icon { font-size: 32px; }
        .db-reports-title { font-size: 15px; }
      }

      /* ══════════════════════════════════════════
         RESPONSIVE — SMALL MOBILE (max 380px)
         ══════════════════════════════════════════ */
      @media (max-width: 380px) {
        .db-stats {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .db-stat-val { font-size: 20px; }
        .db-tab { padding: 6px 10px; font-size: 11px; }

        .db-my-projects-grid {
          grid-template-columns: 1fr !important;
        }
      }

      /* ══════════════════════════════════════════
         RESPONSIVE — LAPTOP (1025px–1280px)
         ══════════════════════════════════════════ */
      @media (min-width: 1025px) and (max-width: 1280px) {
        .db-stats {
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .db-grid {
          grid-template-columns: 1fr 280px;
        }
        .db-proj-grid {
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        }
        /* Manager ticket table: tighter columns */
        .db-table-head.db-mgr-head,
        .db-table-row.db-mgr-row {
          grid-template-columns: 90px 1fr 100px 80px 65px 55px !important;
        }
      }
    `}</style>
  );

  // ─── MANAGER / LEAD DASHBOARD ─────────────────────────────────────────────
  if (user?.role === "MANAGER" || user?.role === "LEAD") {
    return (
      <div className="db fade-in">
        {dashboardStyles}

        {/* ── Tabs ── */}
        <div className="db-tabs">
          {["overview", "employee", "project"].map((t) => (
            <button key={t} className={`db-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "overview" ? "Overview" : t === "employee" ? "By Employee" : t === "project" ? "By Project" : "Reports"}
            </button>
          ))}
        </div>

        {/* ══════ OVERVIEW TAB ══════ */}
        {activeTab === "overview" && (
          <>
            {/* Stat Cards */}
            <div className="db-stats">
              <div className="db-stat">
                <div className="db-stat-accent" style={{ background: "var(--db-accent)" }} />
                <div className="db-stat-icon" style={{ background: "var(--db-accent-bg)" }}>📊</div>
                <div className="db-stat-val">{allTickets.length}</div>
                <div className="db-stat-label">Total Tickets</div>
                <div className="db-stat-bar"><div className="db-stat-bar-fill" style={{ width: "100%", background: "var(--db-accent)" }} /></div>
              </div>
              <div className="db-stat">
                <div className="db-stat-accent" style={{ background: "var(--db-danger)" }} />
                <div className="db-stat-icon" style={{ background: "var(--db-danger-bg)" }}>⏱</div>
                <div className="db-stat-val" style={{ color: "var(--db-danger)" }}>{overdueTicketsCount}</div>
                <div className="db-stat-label">Overdue</div>
                <div className="db-stat-bar"><div className="db-stat-bar-fill" style={{ width: `${Math.min((overdueTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-danger)" }} /></div>
                {overdueTicketsCount > 0 && <div className="db-stat-tag" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>⚠ Needs action</div>}
              </div>
              <div className="db-stat">
                <div className="db-stat-accent" style={{ background: "var(--db-warn)" }} />
                <div className="db-stat-icon" style={{ background: "var(--db-warn-bg)" }}>⊘</div>
                <div className="db-stat-val" style={{ color: "var(--db-warn)" }}>{unassignedTicketsCount}</div>
                <div className="db-stat-label">Unassigned</div>
                <div className="db-stat-bar"><div className="db-stat-bar-fill" style={{ width: `${Math.min((unassignedTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-warn)" }} /></div>
              </div>
              <div className="db-stat">
                <div className="db-stat-accent" style={{ background: "var(--db-success)" }} />
                <div className="db-stat-icon" style={{ background: "var(--db-success-bg)" }}>✓</div>
                <div className="db-stat-val" style={{ color: "var(--db-success)" }}>{resolvedTicketsCount}</div>
                <div className="db-stat-label">Resolved</div>
                <div className="db-stat-bar"><div className="db-stat-bar-fill" style={{ width: `${Math.min((resolvedTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-success)" }} /></div>
              </div>
            </div>

            {/* Main grid — uses db-grid which collapses to 1 col on tablet/mobile */}
            <div className="db-grid">
              {/* Ticket Table */}
              <div className="db-card">
                <div className="db-card-hd">
                  <span className="db-card-title">All Team Tickets</span>
                  <button className="db-see-all" onClick={() => navigate(APP_ROUTES.TICKETS_RAISED)}>View all →</button>
                </div>
                <div className="db-chips">
                  {["all", "open", "overdue", "unassigned"].map((f) => (
                    <button key={f} className={`db-chip ${ticketFilter === f ? "active" : ""}`} onClick={() => setTicketFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="db-table">
                  {/* Desktop/Laptop head */}
                  <div
                    className="db-table-head db-mgr-head"
                    style={{ gridTemplateColumns: "100px 1fr 120px 90px 70px 60px" }}
                  >
                    <span>Ticket</span>
                    <span>Title</span>
                    <span className="db-mgr-col-head-assigned">Assigned</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span className="db-mgr-col-head-due">Due</span>
                  </div>
                  {managerFilteredTickets.length === 0 ? (
                    <div className="db-empty">No tickets match this filter</div>
                  ) : managerFilteredTickets.slice(0, 10).map((ticket) => {
                    const assignees = Array.isArray(ticket.assignedTo) ? ticket.assignedTo : ticket.assignedTo ? [ticket.assignedTo] : [];
                    const ac = assignees[0] ? getAvatarColor(assignees[0].name) : null;
                    return (
                      <div
                        key={ticket._id}
                        className="db-table-row db-mgr-row"
                        style={{ gridTemplateColumns: "100px 1fr 120px 90px 70px 60px" }}
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <span className="db-tid">{ticket.ticketId}</span>
                        <span className="db-title">{ticket.title}</span>
                        <span className="db-mgr-col-assigned" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {assignees.length > 0 ? (
                            <>
                              <span className="db-avatar" style={{ background: ac?.bg, color: ac?.color }}>{getInitials(assignees[0].name)}</span>
                              <span style={{ fontSize: 12, color: "var(--db-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignees[0].name}{assignees.length > 1 ? ` +${assignees.length - 1}` : ""}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--db-danger)" }}>Unassigned</span>
                          )}
                        </span>
                        <span><span className={`status-badge-sm ${getStatusClass(ticket.status)}`}>{ticket.status?.replace(/_/g, " ")}</span></span>
                        <span><span className={`badge-sm ${getPriorityClass(ticket.priority)}`}>{ticket.priority}</span></span>
                        <span className="db-date db-mgr-col-due">{formatDate(ticket.dueDate)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Overdue alerts */}
                <div className="db-alert">
                  <div className="db-card-hd">
                    <span className="db-card-title" style={{ color: "var(--db-danger)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⚠</span> Overdue Alerts
                    </span>
                    <span className="db-badge db-badge-danger">{overdueTicketsCount}</span>
                  </div>
                  {topOverdueTickets.length === 0 ? (
                    <div className="db-empty" style={{ padding: "12px 0" }}>No overdue tickets 🎉</div>
                  ) : topOverdueTickets.map((t) => {
                    const daysLate = Math.floor((new Date() - new Date(t.dueDate)) / 86400000);
                    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : t.assignedTo ? [t.assignedTo] : [];
                    const ownerName = assignees[0]?.name || "Unassigned";
                    return (
                      <div key={t._id} className="db-alert-row" onClick={() => handleTicketClick(t)}>
                        <div className="db-alert-dot" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="db-alert-name">{ownerName}</div>
                          <div className="db-alert-title">{t.title}</div>
                        </div>
                        <div className="db-alert-days">{daysLate}d late</div>
                      </div>
                    );
                  })}
                </div>

                {/* Team workload */}
                <div className="db-card">
                  <div className="db-card-hd">
                    <span className="db-card-title">Team Workload</span>
                  </div>
                  {teamMembers.length === 0 ? (
                    <div className="db-empty" style={{ padding: "12px 0" }}>No assignments yet</div>
                  ) : teamMembers.slice(0, 6).map((m) => {
                    const mOpen = m.tickets.filter(isOpen).length;
                    const mResolved = m.tickets.filter(isResolved).length;
                    const total = Math.max(mOpen + mResolved, 1);
                    const overloaded = mOpen > 7;
                    return (
                      <div key={m._id} className="db-wl-row">
                        <span className="db-wl-name" title={m.name}>{m.name.split(" ")[0]}</span>
                        <div className="db-wl-track">
                          <div className="db-wl-open" style={{ flex: mOpen / total, background: overloaded ? "var(--db-danger)" : "var(--db-accent)" }} />
                          <div className="db-wl-resolved" style={{ flex: mResolved / total }} />
                        </div>
                        <span className="db-wl-count" style={{ color: overloaded ? "var(--db-danger)" : "var(--db-text-3)" }}>{mOpen}</span>
                      </div>
                    );
                  })}
                  <div className="db-legend">
                    <div className="db-legend-item"><div className="db-legend-dot" style={{ background: "var(--db-accent)" }} />Open</div>
                    <div className="db-legend-item"><div className="db-legend-dot" style={{ background: "var(--db-danger)" }} />Overloaded</div>
                    <div className="db-legend-item"><div className="db-legend-dot" style={{ background: "var(--db-success)" }} />Resolved</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Progression */}
            <div>
              <div className="db-section-hd" style={{ marginBottom: 14 }}>
                <span className="db-section-title">Project Progression</span>
                <button className="db-see-all" onClick={() => navigate("/projects")}>All projects →</button>
              </div>
              <div className="db-proj-grid">
                {projects.length === 0 ? (
                  <div className="db-empty">No active projects</div>
                ) : projects.map((p) => {
                  const pTickets = allTickets.filter((t) => (t.projectId?._id || t.projectId) === p._id);
                  const pCompleted = pTickets.filter(isResolved).length;
                  const percent = getProjectProgress(p, allTickets);
                  const trackInfo = getProjectTrackLabel(p, allTickets);
                  return (
                    <div key={p._id} className="db-proj-card" onClick={() => navigate(`/projects/${p.projectId}`)}>
                      <div className="db-proj-top">
                        <div className="db-proj-name">{p.title}</div>
                        <span className={`status-badge-sm ${getStatusClass(p.status)}`}>{p.status?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="db-proj-meta">
                        <span>Lead: {p.leadId?.name || "—"}</span><span>•</span>
                        <span>{p.memberIds?.length || 0} members</span>
                      </div>
                      <div className="db-prog-label">
                        <span>Progress</span><strong>{percent}%</strong>
                      </div>
                      <div className="db-prog-track">
                        <div className="db-prog-fill" style={{ width: `${percent}%`, background: getProgressColor(percent) }} />
                      </div>
                      <div className="db-proj-foot">
                        <span className="db-proj-count">{pTickets.length === 0 ? <span style={{ color: 'var(--db-text-3)' }}>No tickets yet</span> : `${pCompleted} / ${pTickets.length} resolved`}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: trackInfo.color }}>{trackInfo.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ══════ BY EMPLOYEE TAB ══════ */}
        {activeTab === "employee" && (
          <div className="db-card" style={{ overflowX: "auto" }}>
            <div className="db-card-hd">
              <span className="db-card-title">Employee Ticket Overview</span>
              <span className="db-card-sub">{teamMembers.length} members</span>
            </div>
            <div className="db-table" style={{ minWidth: 400 }}>
              <div
                className="db-table-head db-emp-head"
                style={{ gridTemplateColumns: "1.5fr 80px 80px 80px 100px 110px" }}
              >
                <span>Employee</span>
                <span>Open</span>
                <span>Overdue</span>
                <span className="db-emp-resolved-head">Resolved</span>
                <span className="db-emp-avgpri-head">Avg Priority</span>
                <span></span>
              </div>
              {teamMembers.length === 0 ? (
                <div className="db-empty">No team members found</div>
              ) : teamMembers.map((m) => {
                const mOpen = m.tickets.filter(isOpen);
                const mOverdue = m.tickets.filter(isOverdue);
                const mResolved = m.tickets.filter(isResolved);
                const score = mOpen.reduce((a, t) => a + getPriorityWeight(t.priority), 0) / (mOpen.length || 1);
                const avgPri = score >= 3.5 ? "URGENT" : score >= 2.5 ? "HIGH" : score >= 1.5 ? "MEDIUM" : "LOW";
                const isExp = expandedEmployee === m._id;
                const ac = getAvatarColor(m.name);
                return (
                  <React.Fragment key={m._id}>
                    <div
                      className="db-table-row db-emp-row"
                      style={{ gridTemplateColumns: "1.5fr 80px 80px 80px 100px 110px", background: isExp ? "var(--db-surface-3)" : "transparent" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="db-avatar" style={{ background: ac.bg, color: ac.color }}>{getInitials(m.name)}</span>
                        <span style={{ fontWeight: 600, color: "var(--db-text)" }}>{m.name}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: mOpen.length > 7 ? "var(--db-danger)" : "var(--db-text)" }}>{mOpen.length}</span>
                      <span style={{ fontWeight: 700, color: mOverdue.length > 0 ? "var(--db-danger)" : "var(--db-text-3)" }}>{mOverdue.length}</span>
                      <span className="db-emp-resolved-col" style={{ fontWeight: 700, color: "var(--db-success)" }}>{mResolved.length}</span>
                      <span className="db-emp-avgpri-col"><span className={`badge-sm ${getPriorityClass(avgPri)}`}>{avgPri}</span></span>
                      <span>
                        <button
                          style={{ background: isExp ? "var(--db-accent-bg)" : "var(--db-surface-3)", border: "1px solid", borderColor: isExp ? "var(--db-accent-bd)" : "var(--db-border)", color: isExp ? "var(--db-accent)" : "var(--db-text-2)", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s", whiteSpace: "nowrap" }}
                          onClick={() => setExpandedEmployee(isExp ? null : m._id)}
                        >
                          {isExp ? "Hide ▲" : "View ▼"}
                        </button>
                      </span>
                    </div>
                    {isExp && (
                      <div style={{ padding: "6px 12px 12px" }}>
                        <div className="db-expand">
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                            Open tickets for {m.name.split(" ")[0]}
                          </div>
                          {mOpen.length === 0 ? (
                            <div style={{ fontSize: 12, color: "var(--db-text-3)" }}>No open tickets</div>
                          ) : mOpen.map((t) => (
                            <div key={t._id} className="db-expand-ticket" onClick={() => handleTicketClick(t)}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                                <span className="db-tid" style={{ flexShrink: 0 }}>{t.ticketId}</span>
                                <span style={{ fontSize: 13, color: "var(--db-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                {isOverdue(t) && <span className="db-badge db-badge-danger">Overdue</span>}
                                <span className={`badge-sm ${getPriorityClass(t.priority)}`}>{t.priority}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════ BY PROJECT TAB ══════ */}
        {activeTab === "project" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {projects.length === 0 ? (
              <div className="db-card db-empty">No projects found</div>
            ) : projects.map((p) => {
              const pTickets = allTickets.filter((t) => (t.projectId?._id || t.projectId) === p._id);
              const pOpen = pTickets.filter(isOpen).length;
              const pResolved = pTickets.filter(isResolved).length;
              const pOverdue = pTickets.filter(isOverdue).length;
              const percent = getProjectProgress(p, allTickets);
              const trackInfo = getProjectTrackLabel(p, allTickets);
              return (
                <div key={p._id} className="db-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--db-text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: trackInfo.color, background: 'var(--db-surface-3)', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{trackInfo.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--db-text-3)" }}>
                        Lead: {p.leadId?.name || "—"} · Manager: {p.managerId?.name || "—"} · {p.memberIds?.length || 0} members
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                      <span className={`status-badge-sm ${getStatusClass(p.status)}`}>{p.status?.replace(/_/g, " ")}</span>
                      <button className="db-see-all" onClick={() => navigate(`/projects/${p.projectId}`)}>Open project →</button>
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div className="db-proj-mini-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Total", val: pTickets.length, color: "var(--db-text)" },
                      { label: "Open", val: pOpen, color: "var(--db-accent)" },
                      { label: "Resolved", val: pResolved, color: "var(--db-success)" },
                      { label: "Overdue", val: pOverdue, color: pOverdue > 0 ? "var(--db-danger)" : "var(--db-text-3)" },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: "var(--db-surface-2)", border: "1px solid var(--db-border)", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="db-prog-label"><span>Progress</span><strong>{percent}%</strong></div>
                  <div className="db-prog-track"><div className="db-prog-fill" style={{ width: `${percent}%`, background: getProgressColor(percent) }} /></div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ REPORTS TAB ══════ */}
        {activeTab === "reports" && (
          <div className="db-card db-reports">
            <div className="db-reports-icon">📊</div>
            <div className="db-reports-title">Custom Reports</div>
            <div className="db-reports-desc">Advanced reporting and data export functionality will be available in the next platform update.</div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // EMPLOYEE DASHBOARD
  // ══════════════════════════════════════════════════════

  const raisedOpen = tickets.filter(isOpen);
  const raisedResolved = tickets.filter(isResolved);
  const raisedOverdue = tickets.filter(isOverdue);

  const assignedOpen = assignedTickets.filter(isOpen);
  const assignedResolved = assignedTickets.filter(isResolved);
  const assignedOverdue = assignedTickets.filter(isOverdue);

  const raisedStatusGroups = (() => {
    const map = {};
    tickets.forEach((t) => {
      const s = t.status || "UNKNOWN";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const raisedResolutionRate = tickets.length
    ? Math.round((raisedResolved.length / tickets.length) * 100)
    : 0;
  const assignedResolutionRate = assignedTickets.length
    ? Math.round((assignedResolved.length / assignedTickets.length) * 100)
    : 0;

  const recentRaisedTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentAssignedTickets = [...assignedTickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const activityFeed = [...tickets.map((t) => ({ ...t, _feedType: "raised" })),
  ...assignedTickets.map((t) => ({ ...t, _feedType: "assigned" }))]
    .filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const statusColorMap = {
    OPEN: { bg: "var(--db-accent-bg)", color: "var(--db-accent)" },
    ASSIGNED: { bg: "var(--db-warn-bg)", color: "var(--db-warn)" },
    IN_PROGRESS: { bg: "var(--db-warn-bg)", color: "var(--db-warn)" },
    REOPENED: { bg: "var(--db-danger-bg)", color: "var(--db-danger)" },
    RESOLVED: { bg: "var(--db-success-bg)", color: "var(--db-success)" },
    CLOSED: { bg: "var(--db-success-bg)", color: "var(--db-success)" },
  };

  const getStatusColors = (s) =>
    statusColorMap[s] || { bg: "var(--db-surface-3)", color: "var(--db-text-3)" };

  return (
    <div className="db fade-in">
      {dashboardStyles}

      {/* ── Stat Cards ── */}
      <div className="db-stats">
        <div className="db-stat">
          <div className="db-stat-accent" style={{ background: "var(--db-accent)" }} />
          <div className="db-stat-icon" style={{ background: "var(--db-accent-bg)" }}>📋</div>
          <div className="db-stat-val">{openTicketsCount}</div>
          <div className="db-stat-label">Open Tickets</div>
          <div className="db-stat-bar">
            <div className="db-stat-bar-fill" style={{ width: `${Math.min((openTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-accent)" }} />
          </div>
        </div>
        <div className="db-stat">
          <div className="db-stat-accent" style={{ background: "var(--db-warn)" }} />
          <div className="db-stat-icon" style={{ background: "var(--db-warn-bg)" }}>⊘</div>
          <div className="db-stat-val" style={{ color: "var(--db-warn)" }}>{unassignedTicketsCount}</div>
          <div className="db-stat-label">Unassigned</div>
          <div className="db-stat-bar">
            <div className="db-stat-bar-fill" style={{ width: `${Math.min((unassignedTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-warn)" }} />
          </div>
        </div>
        <div className="db-stat">
          <div className="db-stat-accent" style={{ background: "var(--db-danger)" }} />
          <div className="db-stat-icon" style={{ background: "var(--db-danger-bg)" }}>⏱</div>
          <div className="db-stat-val" style={{ color: "var(--db-danger)" }}>{overdueTicketsCount}</div>
          <div className="db-stat-label">Overdue</div>
          <div className="db-stat-bar">
            <div className="db-stat-bar-fill" style={{ width: `${Math.min((overdueTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-danger)" }} />
          </div>
          {overdueTicketsCount > 0 && (
            <div className="db-stat-tag" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>⚠ Needs action</div>
          )}
        </div>
        <div className="db-stat">
          <div className="db-stat-accent" style={{ background: "var(--db-success)" }} />
          <div className="db-stat-icon" style={{ background: "var(--db-success-bg)" }}>✓</div>
          <div className="db-stat-val" style={{ color: "var(--db-success)" }}>{resolvedTicketsCount}</div>
          <div className="db-stat-label">Resolved</div>
          <div className="db-stat-bar">
            <div className="db-stat-bar-fill" style={{ width: `${Math.min((resolvedTicketsCount / Math.max(allTickets.length, 1)) * 100, 100)}%`, background: "var(--db-success)" }} />
          </div>
        </div>
      </div>

      {/* ── Raised vs Assigned Breakdown ── */}
      <div className="db-raised-assigned-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* My Raised Tickets */}
        <div className="db-card">
          <div className="db-card-hd">
            <span className="db-card-title">Tickets I raised</span>
            <button className="db-see-all" onClick={() => navigate(APP_ROUTES.TICKETS_RAISED)}>View all →</button>
          </div>
          <div className="db-mini-stats-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Open", val: raisedOpen.length, color: "var(--db-accent)" },
              { label: "Overdue", val: raisedOverdue.length, color: "var(--db-danger)" },
              { label: "Resolved", val: raisedResolved.length, color: "var(--db-success)" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: "var(--db-surface-2)", border: "1px solid var(--db-border)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--db-text-3)", marginBottom: 6 }}>
              <span>Resolution rate</span>
              <strong style={{ color: "var(--db-text)" }}>{raisedResolutionRate}%</strong>
            </div>
            <div className="db-stat-bar">
              <div className="db-stat-bar-fill" style={{ width: `${raisedResolutionRate}%`, background: "var(--db-success)" }} />
            </div>
          </div>
          {raisedStatusGroups.length === 0 ? (
            <div className="db-empty" style={{ padding: "8px 0" }}>No tickets raised yet</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {raisedStatusGroups.map(({ status, count }) => {
                const sc = getStatusColors(status);
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 5, background: sc.bg, border: `1px solid ${sc.color}22`, borderRadius: 8, padding: "4px 10px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{count}</span>
                    <span style={{ fontSize: 11, color: sc.color, opacity: 0.85 }}>{status.replace(/_/g, " ")}</span>
                  </div>
                );
              })}
            </div>
          )}
          {recentRaisedTickets.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Recent</div>
              <div className="db-table">
                {recentRaisedTickets.map((ticket) => {
                  const sc = getStatusColors(ticket.status);
                  return (
                    <div key={ticket._id} className="db-table-row db-recent-row"
                      style={{ gridTemplateColumns: "90px 1fr 90px 58px", padding: "8px 10px" }}
                      onClick={() => handleTicketClick(ticket)}>
                      <span className="db-tid">{ticket.ticketId}</span>
                      <span className="db-title">{ticket.title}</span>
                      <span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 6, background: sc.bg, color: sc.color }}>
                          {ticket.status?.replace(/_/g, " ")}
                        </span>
                      </span>
                      <span className="db-date db-recent-date-col">{formatDate(ticket.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tickets Assigned to Me */}
        <div className="db-card">
          <div className="db-card-hd">
            <span className="db-card-title">Assigned to me</span>
            <button className="db-see-all" onClick={() => navigate(APP_ROUTES.TICKETS_ASSIGNED)}>View all →</button>
          </div>
          <div className="db-mini-stats-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Open", val: assignedOpen.length, color: "var(--db-accent)" },
              { label: "Overdue", val: assignedOverdue.length, color: "var(--db-danger)" },
              { label: "Resolved", val: assignedResolved.length, color: "var(--db-success)" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: "var(--db-surface-2)", border: "1px solid var(--db-border)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--db-text-3)", marginBottom: 6 }}>
              <span>Resolution rate</span>
              <strong style={{ color: "var(--db-text)" }}>{assignedResolutionRate}%</strong>
            </div>
            <div className="db-stat-bar">
              <div className="db-stat-bar-fill" style={{ width: `${assignedResolutionRate}%`, background: "var(--db-success)" }} />
            </div>
          </div>
          {assignedOpen.length === 0 ? (
            <div className="db-empty" style={{ padding: "8px 0" }}>No assigned tickets 🎉</div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Open by priority</div>
              {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => {
                const count = assignedOpen.filter((t) => t.priority === p).length;
                if (count === 0) return null;
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className={`badge-sm ${getPriorityClass(p)}`}>{p}</span>
                    <div style={{ flex: 1, height: 5, background: "var(--db-surface-3)", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 5, width: `${(count / assignedOpen.length) * 100}%`, background: p === "URGENT" ? "var(--db-danger)" : p === "HIGH" ? "var(--db-warn)" : "var(--db-accent)" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-2)", minWidth: 16, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </>
          )}
          {recentAssignedTickets.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Recent</div>
              <div className="db-table">
                {recentAssignedTickets.map((ticket) => {
                  const sc = getStatusColors(ticket.status);
                  const raiser = ticket.raisedBy;
                  const ac = raiser?.name ? getAvatarColor(raiser.name) : null;
                  return (
                    <div key={ticket._id} className="db-table-row db-recent-row"
                      style={{ gridTemplateColumns: "90px 1fr 90px 26px", padding: "8px 10px" }}
                      onClick={() => handleTicketClick(ticket)}>
                      <span className="db-tid">{ticket.ticketId}</span>
                      <span className="db-title">{ticket.title}</span>
                      <span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 6, background: sc.bg, color: sc.color }}>
                          {ticket.status?.replace(/_/g, " ")}
                        </span>
                      </span>
                      {ac ? (
                        <span className="db-avatar" style={{ background: ac.bg, color: ac.color }} title={`Raised by ${raiser.name}`}>
                          {getInitials(raiser.name)}
                        </span>
                      ) : <span />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Feed + Charts ── */}
      <div className="db-grid">
        {/* Activity feed */}
        <div className="db-card" style={{ alignSelf: 'start' }}>
          <div className="db-card-hd">
            <span className="db-card-title">Recent activity</span>
            <span className="db-card-sub">{activityFeed.length} tickets</span>
          </div>
          <div style={{ maxHeight: '537px', overflowY: 'auto', paddingRight: '6px' }}>
            {activityFeed.length === 0 ? (
              <div className="db-empty">No activity yet</div>
            ) : activityFeed.map((ticket) => {
              const sc = getStatusColors(ticket.status);
              const isRaised = ticket._feedType === "raised";
              const raiser = ticket.raisedBy;
              const assignees = Array.isArray(ticket.assignedTo) ? ticket.assignedTo : ticket.assignedTo ? [ticket.assignedTo] : [];
              return (
                <div key={ticket._id}
                  style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--db-border)", cursor: "pointer" }}
                  onClick={() => handleTicketClick(ticket)}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, paddingTop: 3, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "var(--db-accent)" }}>{ticket.ticketId}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: isRaised ? "var(--db-accent-bg)" : "var(--db-surface-3)", color: isRaised ? "var(--db-accent)" : "var(--db-text-3)" }}>
                        {isRaised ? "Raised" : "Assigned"}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: sc.bg, color: sc.color }}>
                        {ticket.status?.replace(/_/g, " ")}
                      </span>
                      {isOverdue(ticket) && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>Overdue</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--db-text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
                      {ticket.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className={`badge-sm ${getPriorityClass(ticket.priority)}`}>{ticket.priority}</span>
                      {!isRaised && raiser?.name && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--db-text-3)" }}>
                          <span>by</span>
                          {(() => { const ac = getAvatarColor(raiser.name); return <span className="db-avatar" style={{ background: ac.bg, color: ac.color }}>{getInitials(raiser.name)}</span>; })()}
                          <span>{raiser.name}</span>
                        </span>
                      )}
                      {isRaised && assignees.length > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--db-text-3)" }}>
                          <span>→</span>
                          {(() => { const ac = getAvatarColor(assignees[0].name); return <span className="db-avatar" style={{ background: ac.bg, color: ac.color }}>{getInitials(assignees[0].name)}</span>; })()}
                          <span>{assignees[0].name}{assignees.length > 1 ? ` +${assignees.length - 1}` : ""}</span>
                        </span>
                      )}
                      {isRaised && assignees.length === 0 && (
                        <span style={{ fontSize: 11, color: "var(--db-warn)", fontWeight: 600 }}>Unassigned</span>
                      )}
                      {ticket.dueDate && (
                        <span style={{ fontSize: 11, color: isOverdue(ticket) ? "var(--db-danger)" : "var(--db-text-3)", marginLeft: "auto" }}>
                          Due {formatDate(ticket.dueDate)}
                        </span>
                      )}
                      {!ticket.dueDate && (
                        <span style={{ fontSize: 11, color: "var(--db-text-3)", marginLeft: "auto" }}>{formatDate(ticket.createdAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Volume chart */}
          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">Volume this week</span>
            </div>
            <div className="db-vol">
              {volumeData.map((d, i) => (
                <div key={i} className="db-vol-col">
                  <div className="db-vol-num">{d.count || ""}</div>
                  <div className="db-vol-wrap">
                    <div className="db-vol-bar" style={{ height: `${(d.count / maxVolume) * 100}%`, minHeight: 4, background: "var(--db-accent)", opacity: 0.75 }} />
                  </div>
                  <div className="db-vol-day">{d.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket distribution */}
          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">Ticket distribution</span>
              <span className="db-card-sub">By category</span>
            </div>
            {distribution.length === 0 ? (
              <div className="db-empty">No data yet</div>
            ) : distribution.map((d, i) => (
              <div key={d.name} className="db-dist-row">
                <div className="db-dist-info">
                  <span className="db-dist-name">{d.name}</span>
                  <span className="db-dist-count">{d.count}</span>
                </div>
                <div className="db-dist-track">
                  <div className="db-dist-fill" style={{ width: `${(d.count / maxDist) * 100}%`, background: catColors[i % catColors.length] }} />
                </div>
              </div>
            ))}
          </div>

          {/* Raised ticket status summary */}
          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">My raised — by status</span>
            </div>
            {raisedStatusGroups.length === 0 ? (
              <div className="db-empty" style={{ padding: "8px 0" }}>No tickets raised yet</div>
            ) : raisedStatusGroups.map(({ status, count }) => {
              const sc = getStatusColors(status);
              const pct = Math.round((count / tickets.length) * 100);
              return (
                <div key={status} className="db-dist-row">
                  <div className="db-dist-info">
                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{status.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--db-text-3)" }}>{count} · {pct}%</span>
                  </div>
                  <div className="db-dist-track">
                    <div className="db-dist-fill" style={{ width: `${pct}%`, background: sc.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Project summary ── */}
      <div className="db-card">
        <div className="db-card-hd">
          <span className="db-card-title">My Projects</span>
          <button className="db-see-all" onClick={() => navigate("/projects/assigned")}>View all →</button>
        </div>
        <div className="db-my-projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { label: "Total Projects", val: projects.length, color: "var(--db-text)", icon: "📁" },
            { label: "In Progress", val: openProjectsCount, color: "var(--db-accent)", icon: "🔄" },
            { label: "Completed", val: completedProjectsCount, color: "var(--db-success)", icon: "✅" },
          ].map(({ label, val, color, icon }) => (
            <div key={label} style={{ background: "var(--db-surface-2)", border: "1px solid var(--db-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "var(--db-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{icon}</span>{label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default DashboardPage;