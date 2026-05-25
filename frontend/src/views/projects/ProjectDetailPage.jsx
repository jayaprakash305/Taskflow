import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  handleGetProjectComments, handleAddProjectComment, handleUpdateProjectDetails, handleDeleteProject, handleAssignProject
} from "../../controllers/projectController";
import { handleGetProjectActivityLogs } from "../../controllers/activityLogController";
import { handleGetMentionUsers } from "../../controllers/userController";
import TicketDetailPanel, { StatusBadge as TicketStatusBadge, PriorityBadge as TicketPriorityBadge } from "../../components/tickets/TicketDetailPanel";
import { handleAddProjectWorkLog } from "../../controllers/projectWorkLogController";
import { useProjectContext } from "../../context/ProjectContext";
import { TicketProvider } from "../../context/TicketContext";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IcArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IcSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IcPaperclip = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// ── Meta maps ─────────────────────────────────────────────────────────────────
const PRIORITY_META = {
  URGENT: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", dot: "#ef4444", border: "rgba(239,68,68,0.2)" },
  HIGH: { bg: "rgba(249,115,22,0.1)", text: "#f97316", dot: "#f97316", border: "rgba(249,115,22,0.2)" },
  MEDIUM: { bg: "rgba(234,179,8,0.1)", text: "#ca8a04", dot: "#eab308", border: "rgba(234,179,8,0.2)" },
  LOW: { bg: "rgba(34,197,94,0.1)", text: "#16a34a", dot: "#22c55e", border: "rgba(34,197,94,0.2)" },
};
const STATUS_META = {
  OPEN: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", dot: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  IN_PROGRESS: { bg: "rgba(234,179,8,0.1)", text: "#ca8a04", dot: "#eab308", border: "rgba(234,179,8,0.2)" },
  REVIEW: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", dot: "#8b5cf6", border: "rgba(139,92,246,0.2)" },
  COMPLETED: { bg: "rgba(34,197,94,0.1)", text: "#16a34a", dot: "#22c55e", border: "rgba(34,197,94,0.2)" },
  REOPENED: { bg: "rgba(249,115,22,0.1)", text: "#f97316", dot: "#f97316", border: "rgba(249,115,22,0.2)" },
  CANCELLED: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", dot: "#ef4444", border: "rgba(239,68,68,0.2)" },
};

const PROJECT_WORKLOG_TYPES = ["DAILY_UPDATE", "PROGRESS_SUMMARY", "BLOCKER", "TICKET_SUMMARY", "REVIEW_NOTE", "CLOSURE_NOTE"];

// ── Helper components ─────────────────────────────────────────────────────────
function Badge({ meta, value }) {
  if (!meta) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 6,
      background: meta.bg, color: meta.text,
      border: `1px solid ${meta.border}`,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
      {value?.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ value }) {
  return <Badge meta={PRIORITY_META[value] || PRIORITY_META.MEDIUM} value={value} />;
}
function StatusBadge({ value }) {
  const key = value?.toUpperCase().replace(/ /g, "_");
  return <Badge meta={STATUS_META[key] || { bg: "rgba(107,114,128,0.1)", text: "#6b7280", dot: "#6b7280", border: "rgba(107,114,128,0.2)" }} value={value} />;
}

function Avatar({ name, size = "sm" }) {
  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const sz = size === "sm" ? 28 : 38;
  const fs = size === "sm" ? 10 : 13;
  const palettes = ["#6366f1,#e0e7ff", "#8b5cf6,#ede9fe", "#10b981,#d1fae5", "#f59e0b,#fef3c7", "#ec4899,#fce7f3"];
  const [bg, fg] = (palettes[(name?.charCodeAt(0) || 0) % palettes.length]).split(",");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: sz, height: sz, borderRadius: "50%", flexShrink: 0,
      background: `${bg}22`, color: bg,
      border: `1.5px solid ${bg}44`,
      fontSize: fs, fontWeight: 700, lineHeight: 1,
    }}>{initials}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div className="detail-card" style={style}>
      {children}
    </div>
  );
}

function SectionHeader({ emoji, title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--pd-text)" }}>{title}</h4>
      {count > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
          background: "rgba(99,102,241,0.12)", color: "#6366f1",
        }}>{count}</span>
      )}
    </div>
  );
}

function InfoCell({ label, children }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px",
      borderRadius: 8, background: "var(--pd-cell-bg)",
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pd-text3)" }}>{label}</span>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pd-text)" }}>{children}</div>
    </div>
  );
}

function UserCard({ user }) {
  if (!user) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      borderRadius: 10, background: "var(--pd-cell-bg)",
    }}>
      <Avatar name={user.name} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--pd-text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            padding: "2px 6px", borderRadius: 4,
            background: "rgba(99,102,241,0.1)", color: "#6366f1",
            flexShrink: 0,
          }}>{user.role}</span>
        </div>
      </div>
      {user.department && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--pd-text2)",
          padding: "4px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--pd-border)",
          flexShrink: 0,
        }}>{user.department}</span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, socket } = useContext(AuthContext);
  const {
    project,
    tickets,
    comments,
    setComments,
    commentTotalCount,
    commentLoading: commentPaginationLoading,
    hasMoreComments,
    loadMoreComments,
    workLogs: projectWorkLogs,
    setWorkLogs: setProjectWorkLogs,
    loading,

    refreshProject,
  } = useProjectContext();

  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [commentMsg, setCommentMsg] = useState("");

  const [commentSending, setCommentSending] = useState(false);
  const commentScrollRef = useRef(null);
  const [error, setError] = useState("");
  const [mentionState, setMentionState] = useState({ show: false, filter: "", cursorPos: 0 });
  const [updateMentionState, setUpdateMentionState] = useState({ show: false, filter: "", cursorPos: 0 });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [projectWorkLogLoading, setProjectWorkLogLoading] = useState(false);
  const [projectWorkLogForm, setProjectWorkLogForm] = useState({ title: "", description: "", logType: "DAILY_UPDATE", summaryDate: new Date().toISOString().split("T")[0] });
  const [projectWorkLogFiles, setProjectWorkLogFiles] = useState([]);
  const [projectWorkLogLinks, setProjectWorkLogLinks] = useState([]);
  const [projectWorkLogLinkInput, setProjectWorkLogLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const location = useLocation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", department: "", dueDate: "" });
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ managerId: "", leadId: "", memberIds: [] });
  const [submittingAction, setSubmittingAction] = useState(false);

  // ── Fire Toast state ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const fireToast = (message, type = "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };


  const isCreator = project?.createdBy?._id === currentUser?._id || project?.createdBy === currentUser?._id;
  const isLead = currentUser?.role === "LEAD" || project?.leadId?._id === currentUser?._id;
  const isManager = currentUser?.role === "MANAGER" || project?.managerId?._id === currentUser?._id;
  const isAdmin = currentUser?.role === "ADMIN";
  const isEmployee = currentUser?.role === "EMPLOYEE";

  const canEditOrDelete = isCreator || isManager || isAdmin;
  const canManageTeam = canEditOrDelete || isLead;



  const canAddProjectWorkLog = isLead || isManager || isAdmin || project?.createdBy?._id === currentUser?._id;

  useEffect(() => {
    if (!id || !socket) return;

    socket.emit("join-project", id);

    const handleProjectCommentAdded = ({ comment, projectIdentifier }) => {
      if (!comment) return;
      if (String(projectIdentifier) !== String(id)) return;

      setComments((prev) => {
        const exists = prev.some((c) => String(c._id) === String(comment._id));
        if (exists) return prev;
        return [comment, ...prev];
      });
    };

    const handleProjectStatusChanged = ({ project: updatedProject }) => {
      if (!updatedProject || String(updatedProject.projectId) !== String(id)) return;
      refreshProject(true);
    };

    const handleProjectTicketUpdated = ({ ticket }) => {
      refreshProject(false);
    };

    const rejoinRoom = () => {
      socket.emit("join-project", id);
      console.log("Re-joined project room after reconnect:", id);
    };

    socket.on("project-comment-added", handleProjectCommentAdded);
    socket.on("project-status-changed", handleProjectStatusChanged);
    socket.on("project-ticket-updated", handleProjectTicketUpdated);
    socket.on("connect", rejoinRoom);
    socket.on("reconnect", rejoinRoom);

    return () => {
      socket.emit("leave-project", id);
      socket.off("project-comment-added", handleProjectCommentAdded);
      socket.off("project-status-changed", handleProjectStatusChanged);
      socket.off("project-ticket-updated", handleProjectTicketUpdated);
      socket.off("connect", rejoinRoom);
      socket.off("reconnect", rejoinRoom);
    };
  }, [id, socket, refreshProject]);

  useEffect(() => {
    (async () => {
      try {
        const [historyData, userData] = await Promise.all([
          handleGetProjectActivityLogs(id, { page: 1, limit: 10 }),
          handleGetMentionUsers(),
        ]);
        setAllUsers(userData?.users || []);
        setHistory(historyData?.logs || []);
        setHistoryTotalPages(historyData?.totalPages || 1);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load history and users");
      }
    })();
  }, [id]);

  useEffect(() => {
    if (location.state?.selectedTicketId) {
      setSelectedTicketId(location.state.selectedTicketId);
    }
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const loadMoreHistory = async () => {
    if (historyPage >= historyTotalPages || historyLoading) return;
    try {
      setHistoryLoading(true);
      const nextPage = historyPage + 1;
      const data = await handleGetProjectActivityLogs(id, { page: nextPage, limit: 10 });
      setHistory(prev => [...prev, ...data.logs]);
      setHistoryPage(nextPage);
      setHistoryTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };



  const onComment = async (e) => {
    e.preventDefault();
    if (!commentMsg.trim()) return;

    // Robust mention detection: check for @Name for all known users
    // Sort by name length descending to avoid partial matches (e.g., @John Doe matching @John)
    const sortedUsers = [...allUsers].sort((a, b) => b.name.length - a.name.length);
    const mentionedIds = [];
    sortedUsers.forEach(u => {
      if (commentMsg.includes(`@${u.name}`)) {
        if (!mentionedIds.includes(u._id)) {
          mentionedIds.push(u._id);
        }
      }
    });

    try {
      setCommentSending(true);
      const data = await handleAddProjectComment(id, { message: commentMsg, mentionedUsers: mentionedIds });
      if (data?.comment) {
        setComments((prev) => {
          const exists = prev.some((c) => String(c._id) === String(data.comment._id));
          if (exists) return prev;
          return [data.comment, ...prev];
        });
        // Auto-scroll to top to show new comment
        setTimeout(() => {
          if (commentScrollRef.current) {
            commentScrollRef.current.scrollTop = 0;
          }
        }, 50);
      }
      setCommentMsg("");
    } catch (err) {
      fireToast(err?.response?.data?.message || "Failed");
    } finally {
      setCommentSending(false);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setCommentMsg(val);
    const lastAt = val.lastIndexOf("@", pos - 1);
    const textAfterAt = val.substring(lastAt + 1, pos);
    if (lastAt !== -1 && !textAfterAt.includes(" ") && (lastAt === 0 || val[lastAt - 1] === " ")) {
      setMentionState({ show: true, filter: textAfterAt, cursorPos: lastAt });
    } else {
      setMentionState(prev => ({ ...prev, show: false }));
    }
  };

  const selectUser = (user) => {
    const before = commentMsg.substring(0, mentionState.cursorPos);
    const after = commentMsg.substring(mentionState.cursorPos + mentionState.filter.length + 1);
    setCommentMsg(`${before}@${user.name} ${after}`);
    setMentionState(prev => ({ ...prev, show: false }));
  };

  const handleUpdateTextChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setProjectWorkLogForm(p => ({ ...p, description: val }));
    const lastAt = val.lastIndexOf("@", pos - 1);
    const textAfterAt = val.substring(lastAt + 1, pos);
    if (lastAt !== -1 && !textAfterAt.includes(" ") && (lastAt === 0 || val[lastAt - 1] === " ")) {
      setUpdateMentionState({ show: true, filter: textAfterAt, cursorPos: lastAt });
    } else {
      setUpdateMentionState(prev => ({ ...prev, show: false }));
    }
  };

  const selectUpdateUser = (user) => {
    const before = projectWorkLogForm.description.substring(0, updateMentionState.cursorPos);
    const after = projectWorkLogForm.description.substring(updateMentionState.cursorPos + updateMentionState.filter.length + 1);
    setProjectWorkLogForm(p => ({ ...p, description: `${before}@${user.name} ${after}` }));
    setUpdateMentionState(prev => ({ ...prev, show: false }));
  };

  const submitProjectWorkLog = async (e) => {
    e.preventDefault();
    if (!projectWorkLogForm.title.trim() || !projectWorkLogForm.description.trim()) return;
    try {
      setProjectWorkLogLoading(true);
      const formData = new FormData();
      formData.append("title", projectWorkLogForm.title);
      formData.append("description", projectWorkLogForm.description);
      formData.append("logType", projectWorkLogForm.logType);
      formData.append("summaryDate", projectWorkLogForm.summaryDate);
      if (projectWorkLogLinks.length > 0) formData.append("links", JSON.stringify(projectWorkLogLinks));

      // Robust mention detection: check for @Name for all known users
      const sortedUsers = [...allUsers].sort((a, b) => b.name.length - a.name.length);
      const mentionedIds = [];
      sortedUsers.forEach(u => {
        if (projectWorkLogForm.description.includes(`@${u.name}`)) {
          if (!mentionedIds.includes(u._id)) {
            mentionedIds.push(u._id);
          }
        }
      });

      if (mentionedIds.length > 0) {
        mentionedIds.forEach(id => formData.append("mentionedUsers", id));
      }

      if (projectWorkLogFiles.length > 0) {
        projectWorkLogFiles.forEach(f => formData.append("attachments", f));
      }

      console.log("Submitting Project WorkLog FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
      const data = await handleAddProjectWorkLog(id, formData);
      if (data?.workLog) setProjectWorkLogs(prev => [data.workLog, ...prev]);
      setProjectWorkLogForm({ title: "", description: "", logType: "DAILY_UPDATE", summaryDate: new Date().toISOString().split("T")[0] });
      setProjectWorkLogFiles([]);
      setProjectWorkLogLinks([]);
      setShowLinkInput(false);
    } catch (err) {
      fireToast(err?.response?.data?.message || "Failed to add project update");
    } finally {
      setProjectWorkLogLoading(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      title: project.title,
      description: project.description,
      department: project.department || "",
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split("T")[0] : "",
    });
    setShowEditModal(true);
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await handleUpdateProjectDetails(id, editForm);
      fireToast("Project details updated successfully", "success");
      setShowEditModal(false);
      refreshProject(false);
    } catch (err) {
      fireToast(err?.response?.data?.message || "Failed to update project");
    } finally {
      setSubmittingAction(false);
    }
  };

  const onDeleteProjectAction = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      setSubmittingAction(true);
      await handleDeleteProject(id);
      navigate("/projects");
    } catch (err) {
      fireToast(err?.response?.data?.message || "Failed to delete project");
    } finally {
      setSubmittingAction(false);
    }
  };

  const openManageTeamModal = () => {
    setTeamForm({
      managerId: project.managerId?._id || "",
      leadId: project.leadId?._id || "",
      memberIds: project.memberIds?.map(m => m._id) || [],
    });
    setShowManageTeamModal(true);
  };

  const onManageTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await handleAssignProject(id, teamForm);
      fireToast("Team updated successfully", "success");
      setShowManageTeamModal(false);
      refreshProject(false);
    } catch (err) {
      fireToast(err?.response?.data?.message || "Failed to update team");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 0", fontSize: 13, color: "var(--pd-text3)" }}>
      <span style={{ width: 18, height: 18, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "pd-spin 0.8s linear infinite", display: "inline-block" }} />
      Loading project…
    </div>
  );
  if (error) return (
    <div style={{ padding: 24, textAlign: "center", color: "#ef4444", fontSize: 13 }}>
      {error}
      <button onClick={() => navigate(-1)} style={{ display: "block", margin: "12px auto 0", padding: "8px 16px", borderRadius: 8, border: "1px solid var(--pd-border)", background: "var(--pd-cell-bg)", color: "var(--pd-text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Go Back</button>
    </div>
  );
  if (!project) return <div style={{ padding: 24, textAlign: "center", color: "var(--pd-text3)", fontSize: 13 }}>Project not found</div>;

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => ["OPEN", "ASSIGNED"].includes(t.status)).length;
  const inProgressTickets = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const resolvedTickets = tickets.filter(t => t.status === "RESOLVED").length;
  const closedTickets = tickets.filter(t => t.status === "CLOSED").length;
  const overdueTickets = tickets.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !["RESOLVED", "CLOSED"].includes(t.status)).length;
  const todayActions = projectWorkLogs.filter(log => { const d = new Date(log.createdAt); const n = new Date(); return d.toDateString() === n.toDateString(); }).length;

  return (
    <>
      <style>{`
        @keyframes pd-spin { to { transform: rotate(360deg); } }
        @keyframes pd-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tp-toastIn { from { opacity: 0; transform: translateY(-12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes tp-toastOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-8px); } }

        [data-theme="dark"] {
          color-scheme: dark;
          --pd-bg: #0d0d11;
          --pd-card: #13131a;
          --pd-card-border: rgba(255,255,255,0.07);
          --pd-cell-bg: rgba(255,255,255,0.04);
          --pd-text: #e8e8f0;
          --pd-text2: #a8a8c0;
          --pd-text3: #55556a;
          --pd-border: rgba(255,255,255,0.08);
          --pd-input-bg: rgba(255,255,255,0.05);
          --pd-input-border: rgba(255,255,255,0.1);
          --pd-select-bg: rgba(255,255,255,0.05);
        }
        [data-theme="dark"] .pd-select option {
          background-color: #13131a;
          color: #e8e8f0;
        }
        [data-theme="light"] {
          --pd-bg: #f7f7fb;
          --pd-card: #ffffff;
          --pd-card-border: #e5e7eb;
          --pd-cell-bg: #f9fafb;
          --pd-text: #111827;
          --pd-text2: #4b5563;
          --pd-text3: #9ca3af;
          --pd-border: #e5e7eb;
          --pd-input-bg: #ffffff;
          --pd-input-border: #e5e7eb;
          --pd-select-bg: #ffffff;
        }

        .pd-root { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; }
        .detail-card {
          background: var(--pd-card);
          border: 1px solid var(--pd-card-border);
          border-radius: 14px;
          padding: 20px;
          animation: pd-in 0.2s ease;
        }
        .pd-input {
          width: 100%; height: 38px; padding: 0 12px;
          border-radius: 8px; border: 1px solid var(--pd-input-border);
          background: var(--pd-input-bg); color: var(--pd-text);
          font-size: 13px; font-family: inherit;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .pd-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .pd-input::placeholder { color: var(--pd-text3); }
        .pd-select {
          width: 100%; height: 38px; padding: 0 10px;
          border-radius: 8px; border: 1px solid var(--pd-input-border);
          background: var(--pd-select-bg); color: var(--pd-text);
          font-size: 13px; font-family: inherit;
          outline: none; cursor: pointer;
        }
        .pd-textarea {
          width: 100%; padding: 10px 12px;
          border-radius: 8px; border: 1px solid var(--pd-input-border);
          background: var(--pd-input-bg); color: var(--pd-text);
          font-size: 13px; font-family: inherit;
          outline: none; resize: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .pd-textarea:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .pd-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 36px; border-radius: 8px; border: none;
          background: #6366f1; color: #fff;
          font-size: 13px; font-weight: 600; font-family: inherit;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
        }
        .pd-btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
        .pd-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .pd-btn-ghost {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0 12px; height: 32px; border-radius: 7px;
          border: 1px solid var(--pd-border);
          background: var(--pd-cell-bg); color: var(--pd-text2);
          font-size: 12px; font-weight: 500; font-family: inherit; cursor: pointer;
          transition: all 0.15s;
        }
        .pd-btn-ghost:hover { background: rgba(99,102,241,0.08); color: #6366f1; border-color: rgba(99,102,241,0.3); }
        .pd-divider { height: 1px; background: var(--pd-border); margin: 16px 0; }
        .pd-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 8px; border-radius: 99px; font-size: 11px;
        }
        .pd-chip-remove {
          display: flex; align-items: center; justify-content: center;
          width: 14px; height: 14px; border-radius: 50%; border: none;
          background: rgba(239,68,68,0.15); color: #ef4444; cursor: pointer;
        }
        .ticket-row {
          padding: 12px 14px; border-radius: 10px; cursor: pointer;
          border: 1px solid var(--pd-card-border);
          background: var(--pd-cell-bg); margin-bottom: 8px;
          transition: all 0.15s;
        }
        .ticket-row:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); }
        .ticket-row.selected { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.06); }
        .comment-bubble {
          padding: 12px 14px; border-radius: 10px;
          background: var(--pd-cell-bg); border: 1px solid var(--pd-card-border);
          margin-bottom: 10px;
        }
        .mention-dropdown {
          position: absolute; bottom: calc(100% + 6px); left: 0; right: 0;
          background: var(--pd-card); border: 1px solid var(--pd-card-border);
          border-radius: 10px; overflow: hidden; z-index: 50;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          animation: pd-in 0.1s ease;
        }
        .mention-item {
          width: 100%; padding: 9px 12px; border: none;
          background: transparent; text-align: left; cursor: pointer;
          font-family: inherit; transition: background 0.1s;
          border-bottom: 1px solid var(--pd-border);
        }
        .mention-item:last-child { border-bottom: none; }
        .mention-item:hover { background: rgba(99,102,241,0.06); }
        .worklog-card {
          padding: 14px 16px; border-radius: 10px;
          border: 1px solid var(--pd-card-border);
          background: var(--pd-cell-bg); margin-bottom: 10px;
        }
        .history-item {
          padding: 10px 14px; border-radius: 8px;
          background: var(--pd-cell-bg); border: 1px solid var(--pd-card-border);
          margin-bottom: 8px;
        }
        .label-text {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--pd-text3); margin-bottom: 6px; display: block;
        }

        /* ── Responsive ── */
        @media (max-width: 767px) {
          .pd-layout { flex-direction: column !important; height: auto !important; }
          .pd-main-scroll { padding: 14px !important; }
          .pd-ticket-panel {
            position: fixed !important; inset: 0 !important;
            z-index: 100; width: 100% !important; min-width: 100% !important;
            height: 100vh !important;
          }
          .detail-card { padding: 14px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .pd-main-scroll { padding: 18px !important; }
        }
      `}</style>

      <div className="pd-root pd-layout" style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
        {/* Main scroll area */}
        <div className="pd-main-scroll" style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "24px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600, color: "#6366f1",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", padding: "0 0 10px", marginBottom: 2,
              }}
            >
              <IcArrowLeft /> Back to projects
            </button>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--pd-text)", margin: 0, letterSpacing: "-0.02em" }}>{project.title}</h2>
                <p style={{ fontSize: 11, color: "var(--pd-text3)", margin: "4px 0 0", fontFamily: "monospace" }}>{project.projectId}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 4 }}>

                {canEditOrDelete && (
                  <>
                    <button onClick={openEditModal} className="pd-btn-ghost">Edit</button>
                    <button onClick={onDeleteProjectAction} className="pd-btn-ghost" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Fire Toast ── */}
            {toast && (
              <div style={{
                position: "fixed", top: 16, right: 16, zIndex: 9999,
                animation: "tp-toastIn 0.25s cubic-bezier(0.16,1,0.3,1)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10,
                  background: toast.type === "warning"
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff",
                  boxShadow: toast.type === "warning"
                    ? "0 6px 24px rgba(245,158,11,0.35)"
                    : "0 6px 24px rgba(239,68,68,0.35)",
                  fontSize: 12, fontWeight: 600, lineHeight: 1.45,
                  minWidth: 250, maxWidth: 350
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🔥</span>
                  <span style={{ flex: 1 }}>{toast.message}</span>
                  <button
                    onClick={() => setToast(null)}
                    style={{
                      background: "rgba(255,255,255,0.2)", border: "none",
                      borderRadius: 6, width: 22, height: 22,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#fff", flexShrink: 0, padding: 0,
                    }}
                  ><IcX /></button>
                </div>
              </div>
            )}

            {/* ── Description ── */}
            <Card>
              <SectionHeader emoji="📄" title="Description" />
              <p style={{ fontSize: 13, color: "var(--pd-text2)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{project.description}</p>

              {project.attachments?.length > 0 && (
                <>
                  <div className="pd-divider" style={{ margin: "14px 0" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {project.attachments.map((att, idx) => {
                      const isImage = att.fileType?.startsWith("image/");
                      const isPdf = att.fileType === "application/pdf" || att.fileName?.toLowerCase().endsWith(".pdf");
                      const isZip = att.fileType?.includes("zip") || att.fileName?.toLowerCase().endsWith(".zip");

                      return (
                        <a
                          key={idx}
                          href={att.fileType === "link" ? att.fileUrl : `http://localhost:5000${att.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pd-btn-ghost"
                          style={{ height: "auto", padding: "6px 12px", borderRadius: 8, textDecoration: "none", gap: 8 }}
                        >
                          {att.fileType === "link" ? <IcLink /> :
                            isImage ? <span>🖼️</span> :
                              isPdf ? <span>📕</span> :
                                isZip ? <span>📦</span> :
                                  <IcPaperclip />}
                          <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {att.fileName}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* ── Details ── */}
            <Card>
              <SectionHeader emoji="ℹ️" title="Details" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 16 }}>

                <InfoCell label="Due Date">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "—"}</InfoCell>
                <InfoCell label="Created By">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={project.createdBy?.name} size="sm" />
                    {project.createdBy?.name || "—"}
                  </span>
                </InfoCell>
                <InfoCell label="Created">{new Date(project.createdAt).toLocaleDateString()}</InfoCell>

              </div>


            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <SectionHeader emoji="👥" title="Team" />
                {canManageTeam && (
                  <button onClick={openManageTeamModal} className="pd-btn-ghost">Manage Team</button>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <span className="label-text">Project Manager</span>
                {project.managerId ? <UserCard user={project.managerId} /> : <p style={{ fontSize: 13, color: "var(--pd-text3)", fontStyle: "italic" }}>No manager assigned</p>}
              </div>
              <div className="pd-divider" style={{ margin: "12px 0" }} />
              <div style={{ marginBottom: 14 }}>
                <span className="label-text">Project Lead</span>
                {project.leadId ? <UserCard user={project.leadId} /> : <p style={{ fontSize: 13, color: "var(--pd-text3)", fontStyle: "italic" }}>No lead assigned</p>}
              </div>
              <div className="pd-divider" style={{ margin: "12px 0" }} />
              <div>
                <span className="label-text">Team Members {project.memberIds?.length > 0 && `(${project.memberIds.length})`}</span>
                {project.memberIds?.length > 0
                  ? <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{project.memberIds.map(m => <UserCard key={m._id} user={m} />)}</div>
                  : <p style={{ fontSize: 13, color: "var(--pd-text3)", fontStyle: "italic" }}>No team members added</p>
                }
              </div>
            </Card>

            {/* ── Ticket Summary ── */}
            <Card>
              <SectionHeader emoji="📊" title="Ticket Summary" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                {[
                  { label: "Total", value: totalTickets, color: "#6366f1" },
                  { label: "Open / Assigned", value: openTickets, color: "#3b82f6" },
                  { label: "In Progress", value: inProgressTickets, color: "#eab308" },
                  { label: "Resolved", value: resolvedTickets, color: "#22c55e" },
                  { label: "Closed", value: closedTickets, color: "#6b7280" },
                  { label: "Overdue", value: overdueTickets, color: "#ef4444" },
                  { label: "Today's Actions", value: todayActions, color: "#8b5cf6" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: "12px", borderRadius: 8, background: "var(--pd-cell-bg)", border: "1px solid var(--pd-card-border)" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--pd-text3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Project Updates ── */}
            <Card>
              <SectionHeader emoji="📝" title="Project Updates" count={projectWorkLogs.length} />

              {canAddProjectWorkLog && (
                <form onSubmit={submitProjectWorkLog} style={{ marginBottom: 20 }}>
                  <div style={{ padding: "14px", borderRadius: 10, border: "1px solid var(--pd-card-border)", background: "var(--pd-cell-bg)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        type="text" name="title" value={projectWorkLogForm.title}
                        onChange={e => setProjectWorkLogForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Update title" className="pd-input"
                      />
                      <select
                        name="logType" value={projectWorkLogForm.logType}
                        onChange={e => setProjectWorkLogForm(p => ({ ...p, logType: e.target.value }))}
                        className="pd-select"
                      >
                        {PROJECT_WORKLOG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <div style={{ position: "relative" }}>
                      <textarea
                        name="description" value={projectWorkLogForm.description} rows={3}
                        onChange={handleUpdateTextChange}
                        placeholder="Write today's project update, actions taken, blockers… use @ to mention"
                        className="pd-textarea"
                      />
                      {updateMentionState.show && (
                        <div className="mention-dropdown">
                          <div style={{ maxHeight: 200, overflowY: "auto" }}>
                            {allUsers.filter(u => u.name.toLowerCase().includes(updateMentionState.filter.toLowerCase())).map(u => (
                              <button key={u._id} type="button" className="mention-item" onClick={() => selectUpdateUser(u)}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pd-text)" }}>{u.name}</span>
                                <span style={{ fontSize: 11, color: "var(--pd-text3)", display: "block", marginTop: 1 }}>{u.department} · {u.role}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                      <input
                        type="date" name="summaryDate" value={projectWorkLogForm.summaryDate}
                        onChange={e => setProjectWorkLogForm(p => ({ ...p, summaryDate: e.target.value }))}
                        className="pd-input"
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="pd-btn-ghost" onClick={() => setShowLinkInput(p => !p)}>
                          <IcLink /> Link
                        </button>
                        <label className="pd-btn-ghost" style={{ cursor: "pointer" }}>
                          <IcPaperclip /> Attach
                          <input type="file" multiple style={{ display: "none" }} onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setProjectWorkLogFiles(p => [...p, ...files]);
                            e.target.value = null;
                          }} />
                        </label>
                      </div>
                    </div>

                    {showLinkInput && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="url" value={projectWorkLogLinkInput}
                          onChange={e => setProjectWorkLogLinkInput(e.target.value)}
                          placeholder="Paste URL here…" className="pd-input" style={{ flex: 1 }}
                        />
                        <button type="button" className="pd-btn-ghost" onClick={() => {
                          if (!projectWorkLogLinkInput.trim()) return;
                          setProjectWorkLogLinks(p => [...p, { label: projectWorkLogLinkInput, url: projectWorkLogLinkInput }]);
                          setProjectWorkLogLinkInput(""); setShowLinkInput(false);
                        }}>Add</button>
                      </div>
                    )}

                    {(projectWorkLogLinks.length > 0 || projectWorkLogFiles.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {projectWorkLogLinks.map((link, idx) => (
                          <span key={idx} className="pd-chip" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1" }}>
                            <IcLink /> {link.url.slice(0, 30)}…
                            <button className="pd-chip-remove" onClick={() => setProjectWorkLogLinks(p => p.filter((_, i) => i !== idx))}><IcX /></button>
                          </span>
                        ))}
                        {projectWorkLogFiles.map((file, idx) => (
                          <span key={idx} className="pd-chip" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>
                            <IcPaperclip /> {file.name.slice(0, 20)}
                            <button className="pd-chip-remove" onClick={() => setProjectWorkLogFiles(p => p.filter((_, i) => i !== idx))}><IcX /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" disabled={projectWorkLogLoading} className="pd-btn-primary">
                        {projectWorkLogLoading ? "Saving…" : "Add Update"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {projectWorkLogs.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--pd-text3)", fontSize: 13 }}>No project updates yet</div>
              ) : (
                projectWorkLogs.map(log => (
                  <div key={log._id} className="worklog-card">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--pd-text)", margin: 0 }}>{log.title}</p>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pd-text3)" }}>{log.logType?.replace(/_/g, " ")}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--pd-text3)", flexShrink: 0 }}>{new Date(log.summaryDate || log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <Avatar name={log.userId?.name} size="sm" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6366f1" }}>{log.userId?.name || "System"}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--pd-text2)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{log.description}</p>
                    {log.mentionedUsers?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {log.mentionedUsers.map(u => (
                          <span key={u._id} style={{ fontSize: 10, background: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>
                            @{u.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.links?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                        {log.links.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6366f1", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            🔗 {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    )}
                    {log.attachments?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {log.attachments.map((file, idx) => {
                          const isImage = file.fileType?.startsWith("image/");
                          const isPdf = file.fileType === "application/pdf" || file.fileName?.toLowerCase().endsWith(".pdf");
                          const isZip = file.fileType?.includes("zip") || file.fileName?.toLowerCase().endsWith(".zip");
                          const url = file.fileUrl?.startsWith("http") ? file.fileUrl : `http://localhost:5000${file.fileUrl}`;
                          return (
                            <a key={idx} href={url} target="_blank" rel="noreferrer" className="pd-btn-ghost" style={{ height: "auto", padding: "4px 10px", fontSize: 11, textDecoration: "none", gap: 6 }}>
                              {isImage ? "🖼️" : isPdf ? "📕" : isZip ? "📦" : <IcPaperclip />}
                              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>

            {/* ── Tickets (Grouped by Assignee) ── */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <SectionHeader emoji="🎫" title="Project Tickets" count={tickets.length} />
                <button
                  onClick={() => navigate("/tickets/raise", { state: { projectId: project._id, projectTitle: project.title } })}
                  className="pd-btn-ghost"
                  style={{ marginBottom: 16 }}
                >
                  <IcPlus /> Raise Ticket
                </button>
              </div>
              <div style={{ maxHeight: 500, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
                {tickets.length === 0 ? (
                  <div style={{ padding: "32px 0", textAlign: "center", color: "var(--pd-text3)", fontSize: 13 }}>No tickets linked</div>
                ) : (() => {
                  // Group tickets by assignee
                  const grouped = {};
                  const UNASSIGNED_KEY = "__unassigned__";

                  tickets.forEach(t => {
                    if (!t.assignedTo || t.assignedTo.length === 0) {
                      if (!grouped[UNASSIGNED_KEY]) {
                        grouped[UNASSIGNED_KEY] = { user: null, tickets: [] };
                      }
                      grouped[UNASSIGNED_KEY].tickets.push(t);
                    } else {
                      t.assignedTo.forEach(assignee => {
                        const key = assignee._id || assignee;
                        if (!grouped[key]) {
                          grouped[key] = { user: assignee, tickets: [] };
                        }
                        if (!grouped[key].tickets.some(existing => existing._id === t._id)) {
                          grouped[key].tickets.push(t);
                        }
                      });
                    }
                  });

                  // Sort: assigned users first (alphabetical), unassigned last
                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    if (a === UNASSIGNED_KEY) return 1;
                    if (b === UNASSIGNED_KEY) return -1;
                    const nameA = grouped[a].user?.name?.toLowerCase() || "";
                    const nameB = grouped[b].user?.name?.toLowerCase() || "";
                    return nameA.localeCompare(nameB);
                  });

                  return sortedKeys.map(key => {
                    const { user: assignee, tickets: assigneeTickets } = grouped[key];
                    const isUnassigned = key === UNASSIGNED_KEY;

                    return (
                      <div key={key} style={{ marginBottom: 18 }}>
                        {/* Assignee header */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 10,
                          background: isUnassigned
                            ? "rgba(107,114,128,0.06)"
                            : "rgba(99,102,241,0.05)",
                          border: `1px solid ${isUnassigned ? "rgba(107,114,128,0.12)" : "rgba(99,102,241,0.12)"}`,
                          marginBottom: 8,
                        }}>
                          {isUnassigned ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                              background: "rgba(107,114,128,0.12)", color: "#6b7280",
                              fontSize: 11, fontWeight: 700,
                            }}>?</span>
                          ) : (
                            <Avatar name={assignee?.name} size="sm" />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 13, fontWeight: 700, margin: 0,
                              color: isUnassigned ? "var(--pd-text3)" : "var(--pd-text)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {isUnassigned ? "Unassigned" : assignee?.name || "Unknown"}
                            </p>
                            {!isUnassigned && assignee?.role && (
                              <p style={{ fontSize: 10, color: "var(--pd-text3)", margin: "1px 0 0", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                                {assignee.role}{assignee.department ? ` · ${assignee.department}` : ""}
                              </p>
                            )}
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                            background: isUnassigned
                              ? "rgba(107,114,128,0.12)"
                              : "rgba(99,102,241,0.12)",
                            color: isUnassigned ? "#6b7280" : "#6366f1",
                            flexShrink: 0,
                          }}>
                            {assigneeTickets.length} {assigneeTickets.length === 1 ? "ticket" : "tickets"}
                          </span>
                        </div>

                        {/* Tickets for this assignee */}
                        <div style={{ paddingLeft: 12, borderLeft: `2px solid ${isUnassigned ? "rgba(107,114,128,0.12)" : "rgba(99,102,241,0.15)"}`, marginLeft: 16 }}>
                          {assigneeTickets.map(t => (
                            <div
                              key={t._id}
                              className={`ticket-row ${selectedTicketId === t.ticketId ? "selected" : ""}`}
                              onClick={() => setSelectedTicketId(prev => prev === t.ticketId ? null : t.ticketId)}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{t.ticketId}</span>
                                <span style={{ fontSize: 11, color: "var(--pd-text3)" }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: selectedTicketId === t.ticketId ? "#6366f1" : "var(--pd-text)", margin: "0 0 6px 0", transition: "color 0.15s" }}>{t.title}</p>
                              <div style={{ display: "flex", gap: 6 }}>
                                <TicketStatusBadge value={t.status} />
                                <TicketPriorityBadge value={t.priority} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            {/* ── Comments ── */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 15 }}>💬</span>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--pd-text)" }}>Comments</h4>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                  background: "rgba(99,102,241,0.12)", color: "#6366f1",
                }}>
                  {comments.length}
                </span>
              </div>

              {/* Compose box */}
              <div style={{ marginBottom: 16, position: "relative" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Avatar name={currentUser?.name} size="sm" />
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="text" value={commentMsg} onChange={handleTextChange}
                      placeholder="Write a comment… use @ to mention"
                      className="pd-input"
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && onComment(e)}
                    />
                    {mentionState.show && (
                      <div className="mention-dropdown">
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                          {allUsers.filter(u => u.name.toLowerCase().includes(mentionState.filter.toLowerCase())).map(u => (
                            <button key={u._id} type="button" className="mention-item" onClick={() => selectUser(u)}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pd-text)" }}>{u.name}</span>
                              <span style={{ fontSize: 11, color: "var(--pd-text3)", display: "block", marginTop: 1 }}>{u.department} · {u.role}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onComment}
                    disabled={commentSending || !commentMsg.trim()}
                    className="pd-btn-primary"
                    style={{ gap: 6, paddingLeft: 14, paddingRight: 14 }}
                  >
                    <IcSend />
                    {commentSending ? "…" : "Send"}
                  </button>
                </div>
              </div>

              {/* Scrollable comment list with infinite scroll */}
              <div
                ref={commentScrollRef}
                style={{ maxHeight: 500, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target;
                  if (scrollHeight - scrollTop - clientHeight < 80 && hasMoreComments && !commentPaginationLoading) {
                    loadMoreComments();
                  }
                }}
              >
                {comments.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--pd-text3)", fontSize: 13 }}>No comments yet. Start the conversation.</div>
                ) : (
                  <>
                    {comments.map(c => (
                      <div key={c._id} className="comment-bubble">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Avatar name={c.userId?.name} size="sm" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>{c.userId?.name}</span>
                          <span style={{ fontSize: 11, color: "var(--pd-text3)", marginLeft: "auto" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--pd-text2)", margin: 0, lineHeight: 1.55 }}>{c.message}</p>
                      </div>
                    ))}
                    {commentPaginationLoading && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0", color: "var(--pd-text3)", fontSize: 12 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "pd-spin 0.8s linear infinite", display: "inline-block" }} />
                        Loading more…
                      </div>
                    )}
                    {!hasMoreComments && comments.length > 0 && (
                      <div style={{ textAlign: "center", padding: "10px 0", fontSize: 11, color: "var(--pd-text3)" }}>
                        All {commentTotalCount} comments loaded
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* ── History ── */}
            <Card>
              <SectionHeader emoji="🕓" title="History" count={history.length} />
              <div style={{ maxHeight: 500, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
                {history.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--pd-text3)", fontSize: 13 }}>No history</div>
                ) : (
                  <>
                    {history.map(h => (
                      <div key={h._id} className="history-item">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pd-text)" }}>{h.performedBy?.name || h.userId?.name || "System"}</span>
                          <span style={{ fontSize: 11, color: "var(--pd-text3)" }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--pd-text2)", margin: 0 }}>{h.message}</p>
                      </div>
                    ))}
                    {historyPage < historyTotalPages && (
                      <button onClick={loadMoreHistory} disabled={historyLoading} style={{
                        width: "100%", padding: "10px 0", fontSize: 12, fontWeight: 600, color: "#6366f1",
                        background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4,
                      }}>
                        {historyLoading ? "Loading…" : "Load more history"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </Card>

          </div>
        </div>

        {/* Ticket panel */}
        {selectedTicketId && (
          <TicketProvider ticketId={selectedTicketId}>
            <div className="pd-ticket-panel">
              <TicketDetailPanel
                ticketId={selectedTicketId}
                onClose={() => setSelectedTicketId(null)}
                currentUser={currentUser}
                onUpdate={() => refreshProject(false)}
                initialTab={activeTab}
              />
            </div>
          </TicketProvider>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="detail-card" style={{ width: "100%", maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Edit Project Details</h3>
              <button onClick={() => setShowEditModal(false)} className="pd-btn-ghost" style={{ padding: 4, height: 'auto', border: "none" }}><IcX /></button>
            </div>
            <form onSubmit={onEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <span className="label-text">Title</span>
                <input required className="pd-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <span className="label-text">Description</span>
                <textarea required className="pd-textarea" rows={4} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <span className="label-text">Department</span>
                  <input className="pd-input" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
                </div>
                <div>
                  <span className="label-text">Due Date</span>
                  <input type="date" className="pd-input" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="pd-btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingAction} className="pd-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManageTeamModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="detail-card" style={{ width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Manage Team</h3>
              <button onClick={() => setShowManageTeamModal(false)} className="pd-btn-ghost" style={{ padding: 4, height: 'auto', border: "none" }}><IcX /></button>
            </div>
            <form onSubmit={onManageTeamSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingRight: 4 }}>
              <div>
                <span className="label-text">Manager</span>
                <select className="pd-select" value={teamForm.managerId} onChange={e => setTeamForm(f => ({ ...f, managerId: e.target.value }))}>
                  <option value="">None</option>
                  {allUsers.filter(u => u.role === "MANAGER" || u.role === "ADMIN").map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label-text">Lead</span>
                <select className="pd-select" value={teamForm.leadId} onChange={e => setTeamForm(f => ({ ...f, leadId: e.target.value }))}>
                  <option value="">None</option>
                  {allUsers.filter(u => u.role === "LEAD" || u.role === "MANAGER" || u.role === "ADMIN").map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label-text">Members</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", border: "1px solid var(--pd-input-border)", borderRadius: 8, padding: 8 }}>
                  {allUsers
                    .filter(u => {
                      if (teamForm.memberIds.includes(u._id)) return true;
                      if (teamForm.managerId) {
                        return (u.managerId?._id === teamForm.managerId || u.managerId === teamForm.managerId);
                      }
                      return true;
                    })
                    .map(u => (
                    <label key={u._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "4px 0" }}>
                      <input
                        type="checkbox"
                        checked={teamForm.memberIds.includes(u._id)}
                        onChange={e => {
                          if (e.target.checked) setTeamForm(f => ({ ...f, memberIds: [...f.memberIds, u._id] }));
                          else setTeamForm(f => ({ ...f, memberIds: f.memberIds.filter(id => id !== u._id) }));
                        }}
                      />
                      {u.name} <span style={{ color: "var(--pd-text3)", fontSize: 11 }}>({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setShowManageTeamModal(false)} className="pd-btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingAction} className="pd-btn-primary">Save Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectDetailPage;