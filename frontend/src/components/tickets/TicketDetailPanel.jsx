import { useEffect, useState, useRef, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  handleGetTicketComments,
  handleAddTicketComment,
} from "../../controllers/ticketController";
import { handleGetTicketActivityLogs } from "../../controllers/activityLogController";
import { handleGetMentionUsers } from "../../controllers/userController";
import { handleAddTicketWorkLog } from "../../controllers/workLogController";
import { useTicketContext } from "../../context/TicketContext";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IcX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IcPaperclip = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const IcCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IcClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const IcWarning = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);
const IcUser = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const IcChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ── Meta ───────────────────────────────────────────────────────────────────────
export const PRIORITY_META = {
  URGENT: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", label: "Urgent" },
  HIGH: { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", label: "High" },
  MEDIUM: { color: "#ca8a04", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", label: "Medium" },
  LOW: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", label: "Low" },
};
export const STATUS_META = {
  OPEN: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", label: "Open" },
  ASSIGNED: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", label: "Assigned" },
  IN_PROGRESS: { color: "#ca8a04", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", label: "In Progress" },
  RESOLVED: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", label: "Resolved" },
  CLOSED: { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", label: "Closed" },
  REOPENED: { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", label: "Reopened" },
};
const STATUS_OPTIONS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];
const WORKLOG_TYPES = ["INVESTIGATION", "PROGRESS_UPDATE", "BLOCKER", "FIX_APPLIED", "TESTING_UPDATE", "RESOLUTION", "CLOSURE_NOTE"];
const AVATAR_PALETTES = [
  ["#6366f1", "#4338ca"], ["#8b5cf6", "#6d28d9"], ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"], ["#ec4899", "#db2777"], ["#06b6d4", "#0891b2"],
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getAvatarColors(name) {
  return AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Shared sub-components ──────────────────────────────────────────────────────
export function Avatar({ name, size = 32 }) {
  const [c1, c2] = getAvatarColors(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, color: "#fff",
      letterSpacing: "-0.02em", boxShadow: `0 2px 8px ${c1}40`,
    }}>
      {getInitials(name)}
    </div>
  );
}

export function PriorityBadge({ value }) {
  const m = PRIORITY_META[value] || PRIORITY_META.MEDIUM;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 6,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

export function StatusBadge({ value }) {
  const key = value?.toUpperCase().replace(/ /g, "_");
  const m = STATUS_META[key] || STATUS_META.CLOSED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 6,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}


function InfoCell({ label, children }) {
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 8,
      background: "var(--tp-cell-bg)", border: "1px solid var(--tp-cell-border)",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--tp-text3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tp-text)" }}>{children}</div>
    </div>
  );
}

function PersonCard({ user, accent = "#6366f1", accentBg = "rgba(99,102,241,0.08)", accentBorder = "rgba(99,102,241,0.18)", sublabel }) {
  if (!user) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "9px 11px", borderRadius: 9,
      background: accentBg, border: `1px solid ${accentBorder}`,
      marginBottom: 6,
    }}>
      <Avatar name={user.name} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
        <div style={{ fontSize: 10, color: "var(--tp-text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 5, background: `${accent}1a`, color: accent, flexShrink: 0 }}>
        {sublabel || user.role}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--tp-text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7, marginTop: 16 }}>
      {children}
    </div>
  );
}

function Chip({ children, color = "#6366f1", onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 99, fontSize: 11,
      background: `${color}10`, border: `1px solid ${color}25`, color,
    }}>
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 13, height: 13, borderRadius: "50%", border: "none",
          background: `${color}20`, color, cursor: "pointer", padding: 0,
        }}>
          <IcX />
        </button>
      )}
    </span>
  );
}

function CommentBubble({ comment, isMe }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-end",
      flexDirection: isMe ? "row-reverse" : "row",
      marginBottom: 14,
    }}>
      <Avatar name={comment.userId?.name} size={26} />
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 3, alignItems: isMe ? "flex-end" : "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexDirection: isMe ? "row-reverse" : "row" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tp-text2)" }}>{comment.userId?.name || "System"}</span>
          <span style={{ fontSize: 10, color: "var(--tp-text3)", display: "flex", alignItems: "center", gap: 3 }}><IcClock />{timeAgo(comment.createdAt)}</span>
        </div>
        <div style={{
          background: isMe ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "var(--tp-bubble-bg)",
          color: isMe ? "#fff" : "var(--tp-text)",
          borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "9px 13px", fontSize: 13, lineHeight: 1.55,
          boxShadow: isMe ? "0 4px 14px rgba(99,102,241,0.25)" : "none",
          border: isMe ? "none" : "1px solid var(--tp-cell-border)",
          wordBreak: "break-word", whiteSpace: "pre-wrap",
        }}>
          {comment.message}
        </div>
        {comment.mentionedUsers?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2, flexDirection: isMe ? "row-reverse" : "row" }}>
            {comment.mentionedUsers.map(u => (
              <span key={u._id} style={{ fontSize: 10, background: isMe ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.1)", color: isMe ? "#fff" : "#6366f1", borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>
                @{u.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function TicketDetailPanel({ ticketId, onClose, currentUser, fullPage = false, onUpdate, initialTab = "details" }) {
  const {
    ticket,
    comments,
    setComments,
    history,
    setHistory,
    workLogs,
    setWorkLogs,
    projectDetails,
    canModify,
    loading,
    refreshTicket,
    updateTicketStatus,
    updateTicketPriority,
    reassignTicket,
  } = useTicketContext();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [mentionState, setMentionState] = useState({ show: false, filter: "", cursorPos: 0 });
  const [updateMentionState, setUpdateMentionState] = useState({ show: false, filter: "", cursorPos: 0 });
  const [workLogLoading, setWorkLogLoading] = useState(false);
  const [workLogForm, setWorkLogForm] = useState({ title: "", description: "", logType: "PROGRESS_UPDATE", isClosureNote: false, closureSummary: "" });
  const [workLogFiles, setWorkLogFiles] = useState([]);
  const [workLogLinks, setWorkLogLinks] = useState([]);
  const [workLogLinkInput, setWorkLogLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const commentsEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { socket } = useContext(AuthContext);

  // ── Fire Toast state ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const fireToast = (message, type = "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const fetchHistory = async () => {
    try {
      const [historyData, cmtOlder] = await Promise.all([
        handleGetTicketActivityLogs(ticketId, { page: 1, limit: 20 }),
        handleGetTicketComments(ticketId, { filter: "older" }),
      ]);
      const merged = [...(historyData?.logs || []), ...(cmtOlder?.comments || [])]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(merged);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!ticketId || !socket) return;
    socket.emit("join-ticket", ticketId);
    
    const rejoinRoom = () => {
      socket.emit("join-ticket", ticketId);
      console.log("Re-joined ticket room after reconnect:", ticketId);
    };

    const handler = ({ comment, ticketIdentifier }) => {
      if (!comment || String(ticketIdentifier) !== String(ticketId)) return;
      setComments(prev => prev.some(c => String(c._id) === String(comment._id)) ? prev : [comment, ...prev]);
    };
    
    const statusHandler = ({ ticket: updatedTicket }) => {
      if (!updatedTicket || String(updatedTicket.ticketId) !== String(ticketId)) return;
      refreshTicket();
      if (onUpdate) onUpdate();
    };

    socket.on("ticket-comment-added", handler);
    socket.on("ticket-status-changed", statusHandler);
    socket.on("connect", rejoinRoom);
    socket.on("reconnect", rejoinRoom);
    
    return () => { 
      socket.emit("leave-ticket", ticketId); 
      socket.off("ticket-comment-added", handler); 
      socket.off("ticket-status-changed", statusHandler);
      socket.off("connect", rejoinRoom);
      socket.off("reconnect", rejoinRoom);
    };
  }, [ticketId, socket, refreshTicket, onUpdate]);

  useEffect(() => {
    if (!ticketId || !ticket) return;
    setAssignableUsers([]); setAllUsers([]); setSelectedAssignees([]);

    (async () => {
      try {
        const [userData] = await Promise.all([
          handleGetMentionUsers(),
        ]);
        setAllUsers(userData?.users || []);

        const initial = Array.isArray(ticket?.assignedTo) ? ticket.assignedTo : ticket?.assignedTo ? [ticket.assignedTo] : [];
        setSelectedAssignees(initial.map(u => u._id));

        if (projectDetails) {
          const pUsers = [projectDetails?.createdBy, projectDetails?.managerId, projectDetails?.leadId, ...(projectDetails?.memberIds || [])]
            .filter(Boolean).reduce((acc, u) => { if (!acc.some(x => x._id === u._id)) acc.push(u); return acc; }, []);
          setAssignableUsers(pUsers);
          setAllUsers(pUsers); // Also restrict mentions to project members
        } else {
          setAssignableUsers(userData?.users || []);
          setAllUsers(userData?.users || []);
        }
        await fetchHistory();
      } catch (err) { console.error(err); }
    })();
  }, [ticketId, ticket, projectDetails]);

  // Auto-scroll removed since newest items are now at the top.

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [newComment]);

  const assignees = Array.isArray(ticket?.assignedTo) ? ticket.assignedTo : ticket?.assignedTo ? [ticket.assignedTo] : [];
  const isRaisedByMe = ticket?.raisedBy?._id === currentUser?._id;
  const isAssignedToMe = assignees.some(a => a._id === currentUser?._id);
  const isEmployee = currentUser?.role === "EMPLOYEE";
  const isLead = currentUser?.role === "LEAD";
  const isManager = currentUser?.role === "MANAGER";
  const isAdmin = currentUser?.role === "ADMIN";
  const canCloseOrReopen = isLead || isManager || isAdmin;
  const isProjectTicket = !!ticket?.projectId;
  const isProjectManager = projectDetails?.managerId?._id === currentUser?._id || projectDetails?.managerId === currentUser?._id;
  const isProjectLead = projectDetails?.leadId?._id === currentUser?._id || projectDetails?.leadId === currentUser?._id;
  const canReassign = isProjectTicket ? isProjectManager || isProjectLead || isRaisedByMe || isAdmin : isRaisedByMe || isAssignedToMe || isLead || isManager || isAdmin;
  const hasClosureNote = workLogs.some(log => {
    if (!log.isClosureNote || !log.closureSummary?.trim()) return false;
    if (ticket?.reopenedAt) {
      return new Date(log.createdAt) > new Date(ticket.reopenedAt);
    }
    return true;
  });

  const allowedStatusOptions = STATUS_OPTIONS.filter(s => {
    if (isEmployee) return ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(s);
    if (canCloseOrReopen) return true;
    return ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(s);
  });

  const onStatusChange = async (e) => {
    const next = e.target.value;
    if (next === "CLOSED" && !hasClosureNote) { fireToast("Please add a closure note in the Updates tab before closing this ticket.", "warning"); return; }
    try {
      setStatusLoading(true);
      await updateTicketStatus(next);
      await fetchHistory();
      if (onUpdate) onUpdate();
    } catch (err) { fireToast(err?.response?.data?.message || "Failed to update status"); }
    finally { setStatusLoading(false); }
  };

  const onPriorityChange = async (e) => {
    try {
      setPriorityLoading(true);
      await updateTicketPriority(e.target.value);
      await fetchHistory();
      if (onUpdate) onUpdate();
    } catch (err) { fireToast(err?.response?.data?.message || "Failed to update priority"); }
    finally { setPriorityLoading(false); }
  };

  const sendComment = async () => {
    if (!newComment.trim() || sending) return;
    const sorted = [...allUsers].sort((a, b) => b.name.length - a.name.length);
    const mentionedIds = [];
    sorted.forEach(u => { if (newComment.includes(`@${u.name}`) && !mentionedIds.includes(u._id)) mentionedIds.push(u._id); });
    try {
      setSending(true);
      const data = await handleAddTicketComment(ticketId, { message: newComment, mentionedUsers: mentionedIds });
      if (data?.comment) setComments(prev => prev.some(c => String(c._id) === String(data.comment._id)) ? prev : [data.comment, ...prev]);
      setNewComment("");
    } catch { fireToast("Failed to send comment"); }
    finally { setSending(false); }
  };

  const handleTextChange = (e) => {
    const val = e.target.value; const pos = e.target.selectionStart;
    setNewComment(val);
    const lastAt = val.lastIndexOf("@", pos - 1);
    const textAfterAt = val.substring(lastAt + 1, pos);
    if (lastAt !== -1 && !textAfterAt.includes(" ") && (lastAt === 0 || val[lastAt - 1] === " ")) {
      setMentionState({ show: true, filter: textAfterAt, cursorPos: lastAt });
    } else { setMentionState({ show: false, filter: "", cursorPos: 0 }); }
  };

  const selectUser = (user) => {
    const before = newComment.substring(0, mentionState.cursorPos);
    const after = newComment.substring(mentionState.cursorPos + mentionState.filter.length + 1);
    setNewComment(`${before}@${user.name} ${after}`);
    setMentionState({ show: false, filter: "", cursorPos: 0 });
  };

  const handleUpdateTextChange = (e) => {
    const val = e.target.value; const pos = e.target.selectionStart;
    setWorkLogForm(p => ({ ...p, description: val }));
    const lastAt = val.lastIndexOf("@", pos - 1);
    const textAfterAt = val.substring(lastAt + 1, pos);
    if (lastAt !== -1 && !textAfterAt.includes(" ") && (lastAt === 0 || val[lastAt - 1] === " ")) {
      setUpdateMentionState({ show: true, filter: textAfterAt, cursorPos: lastAt });
    } else { setUpdateMentionState({ show: false, filter: "", cursorPos: 0 }); }
  };

  const selectUpdateUser = (user) => {
    const before = workLogForm.description.substring(0, updateMentionState.cursorPos);
    const after = workLogForm.description.substring(updateMentionState.cursorPos + updateMentionState.filter.length + 1);
    setWorkLogForm(p => ({ ...p, description: `${before}@${user.name} ${after}` }));
    setUpdateMentionState({ show: false, filter: "", cursorPos: 0 });
  };

  const handleWorkLogInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkLogForm(prev => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      // Auto-set isClosureNote based on logType selection
      if (name === "logType") {
        updated.isClosureNote = value === "CLOSURE_NOTE";
      }
      return updated;
    });
  };

  const submitWorkLog = async (e) => {
    e.preventDefault();
    if (!workLogForm.title.trim() || !workLogForm.description.trim()) return;
    try {
      setWorkLogLoading(true);
      const formData = new FormData();
      formData.append("title", workLogForm.title);
      formData.append("description", workLogForm.description);
      formData.append("logType", workLogForm.logType);
      const isClosure = workLogForm.logType === "CLOSURE_NOTE";
      formData.append("isClosureNote", isClosure);
      if (isClosure) formData.append("closureSummary", workLogForm.closureSummary || "");
      const sorted = [...allUsers].sort((a, b) => b.name.length - a.name.length);
      const mentionedIds = [];
      sorted.forEach(u => { if (workLogForm.description.includes(`@${u.name}`) && !mentionedIds.includes(u._id)) mentionedIds.push(u._id); });
      if (mentionedIds.length > 0) {
        mentionedIds.forEach(id => formData.append("mentionedUsers", id));
      }
      if (workLogLinks.length > 0) formData.append("links", JSON.stringify(workLogLinks));

      if (workLogFiles.length > 0) {
        workLogFiles.forEach(f => formData.append("attachments", f));
      }

      console.log("Submitting Ticket WorkLog FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
      const data = await handleAddTicketWorkLog(ticketId, formData);
      if (data?.workLog) setWorkLogs(prev => [data.workLog, ...prev]);
      setWorkLogForm({ title: "", description: "", logType: "PROGRESS_UPDATE", isClosureNote: false, closureSummary: "" });
      setWorkLogFiles([]); setWorkLogLinks([]); setWorkLogLinkInput(""); setShowLinkInput(false);
      await fetchHistory();
    } catch (err) { fireToast(err?.response?.data?.message || "Failed to add work log"); }
    finally { setWorkLogLoading(false); }
  };

  const submitAssignment = async () => {
    if (!selectedAssignees.length) { fireToast("Please select at least one assignee.", "warning"); return; }
    try {
      setAssignLoading(true);
      await reassignTicket(selectedAssignees);
      await fetchHistory();
      if (onUpdate) onUpdate();
    } catch (err) { fireToast(err?.response?.data?.message || "Failed to assign ticket"); }
    finally { setAssignLoading(false); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    @keyframes tp-panelIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes tp-spin    { to { transform: rotate(360deg); } }
    @keyframes tp-toastIn { from { opacity: 0; transform: translateY(-12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes tp-toastOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-8px); } }
    @keyframes tp-dropIn  { from { opacity: 0; transform: translateY(-4px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

    [data-theme="dark"] {
      --tp-panel:       #13131a;
      --tp-panel-border: rgba(255,255,255,0.07);
      --tp-header:      rgba(255,255,255,0.025);
      --tp-tab-active:  #818cf8;
      --tp-tab-pip:     #6366f1;
      --tp-cell-bg:     rgba(255,255,255,0.04);
      --tp-cell-border: rgba(255,255,255,0.07);
      --tp-bubble-bg:   rgba(255,255,255,0.06);
      --tp-text:        #e8e8f0;
      --tp-text2:       #9898b8;
      --tp-text3:       #50506a;
      --tp-input-bg:    rgba(255,255,255,0.05);
      --tp-input-border:rgba(255,255,255,0.1);
      --tp-select-bg:   rgba(255,255,255,0.05);
      --tp-mention-bg:  #1a1a24;
      --tp-mention-border: rgba(255,255,255,0.1);
      --tp-mention-hover:  rgba(255,255,255,0.05);
      --tp-divider:     rgba(255,255,255,0.06);
      --tp-info-bg:     rgba(99,102,241,0.07);
      --tp-info-border: rgba(99,102,241,0.18);
      --tp-shadow:      0 24px 60px rgba(0,0,0,0.5);
    }
    [data-theme="light"] {
      --tp-panel:       #ffffff;
      --tp-panel-border: #e5e7eb;
      --tp-header:      #fafafa;
      --tp-tab-active:  #4f46e5;
      --tp-tab-pip:     #6366f1;
      --tp-cell-bg:     #f9fafb;
      --tp-cell-border: #f0f0f5;
      --tp-bubble-bg:   #f3f4f6;
      --tp-text:        #111827;
      --tp-text2:       #4b5563;
      --tp-text3:       #9ca3af;
      --tp-input-bg:    #ffffff;
      --tp-input-border:#e5e7eb;
      --tp-select-bg:   #ffffff;
      --tp-mention-bg:  #ffffff;
      --tp-mention-border: #e5e7eb;
      --tp-mention-hover:  #f9fafb;
      --tp-divider:     #f0f0f5;
      --tp-info-bg:     rgba(99,102,241,0.05);
      --tp-info-border: rgba(99,102,241,0.15);
      --tp-shadow:      0 8px 30px rgba(0,0,0,0.1);
    }

    .tp-root {
      font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
      display: flex; flex-direction: column;
      background: var(--tp-panel);
      border-left: 1px solid var(--tp-panel-border);
      height: 100%; overflow: hidden;
    }
    .tp-root-anim { animation: tp-panelIn 0.25s cubic-bezier(0.16,1,0.3,1); }

    /* Header */
    .tp-header {
      padding: 16px 16px 0;
      background: var(--tp-header);
      flex-shrink: 0;
      border-bottom: 1px solid var(--tp-divider);
    }
    .tp-title-row {
      display: flex; align-items: flex-start; gap: 8; margin-bottom: 10px;
    }
    .tp-ticket-id { font-size: 10px; font-family: monospace; color: "#6366f1"; font-weight: 700; margin-bottom: 3px; }
    .tp-title { font-size: 14px; font-weight: 800; color: var(--tp-text); margin: 0; line-height: 1.35; letter-spacing: -0.01em; }
    .tp-close-btn {
      width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
      border: 1px solid var(--tp-cell-border);
      background: var(--tp-cell-bg); color: var(--tp-text3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
    }
    .tp-close-btn:hover { border-color: rgba(239,68,68,0.3); color: #ef4444; background: rgba(239,68,68,0.08); }

    /* Tabs */
    .tp-tabs {
      display: flex; gap: 0;
      padding: 0 16px;
      margin-top: 10px;
    }
    .tp-tab {
      padding: 9px 0; margin-right: 18px;
      font-size: 12px; font-weight: 600; font-family: inherit;
      background: none; border: none; cursor: pointer;
      color: var(--tp-text3);
      border-bottom: 2px solid transparent;
      transition: color 0.15s; white-space: nowrap;
    }
    .tp-tab.active { color: var(--tp-tab-active); border-bottom-color: var(--tp-tab-pip); }
    .tp-tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 16px; height: 16px; padding: 0 4px;
      border-radius: 99px; font-size: 9px; font-weight: 700;
      background: rgba(99,102,241,0.12); color: #6366f1;
      margin-left: 4px;
    }

    /* Scrollable content */
    .tp-scroll { flex: 1; overflow-y: auto; padding: 14px 16px; }

    /* Inputs */
    .tp-input {
      width: 100%; height: 36px; padding: 0 11px;
      border-radius: 8px; border: 1px solid var(--tp-input-border);
      background: var(--tp-input-bg); color: var(--tp-text);
      font-size: 13px; font-family: inherit; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
    }
    .tp-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
    .tp-input::placeholder { color: var(--tp-text3); }
    .tp-textarea {
      width: 100%; padding: 9px 11px;
      border-radius: 8px; border: 1px solid var(--tp-input-border);
      background: var(--tp-input-bg); color: var(--tp-text);
      font-size: 13px; font-family: inherit; outline: none; resize: none;
      transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
    }
    .tp-textarea:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
    .tp-textarea::placeholder { color: var(--tp-text3); }
    .tp-select {
      width: 100%; height: 36px; padding: 0 10px;
      border-radius: 8px; border: 1px solid var(--tp-input-border);
      background: var(--tp-select-bg); color: var(--tp-text);
      font-size: 13px; font-family: inherit; outline: none; cursor: pointer;
      appearance: none; box-sizing: border-box;
    }

    /* Buttons */
    .tp-btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; height: 36px; border-radius: 8px; border: none;
      background: #6366f1; color: #fff;
      font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s;
    }
    .tp-btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .tp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .tp-btn-ghost {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 0 10px; height: 30px; border-radius: 7px;
      border: 1px solid var(--tp-cell-border);
      background: var(--tp-cell-bg); color: var(--tp-text2);
      font-size: 11px; font-weight: 500; font-family: inherit; cursor: pointer;
      transition: all 0.15s;
    }
    .tp-btn-ghost:hover { border-color: rgba(99,102,241,0.3); color: #6366f1; }

    /* Mention dropdown */
    .tp-mention {
      position: absolute; bottom: calc(100% + 6px); left: 0; right: 0;
      background: var(--tp-mention-bg); border: 1px solid var(--tp-mention-border);
      border-radius: 10px; overflow: hidden; z-index: 60;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      animation: tp-dropIn 0.12s ease;
    }
    .tp-mention-item {
      width: 100%; text-align: left; padding: 8px 12px;
      border: none; border-bottom: 1px solid var(--tp-divider);
      background: transparent; cursor: pointer; font-family: inherit;
      transition: background 0.1s;
    }
    .tp-mention-item:last-child { border-bottom: none; }
    .tp-mention-item:hover { background: var(--tp-mention-hover); }

    /* Worklog card */
    .tp-worklog-card {
      padding: 13px 14px; border-radius: 10px; margin-bottom: 10px;
      background: var(--tp-cell-bg); border: 1px solid var(--tp-cell-border);
    }
    .tp-history-item {
      padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;
      background: var(--tp-cell-bg); border: 1px solid var(--tp-cell-border);
    }
    .tp-assignee-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 8px; margin-bottom: 5px;
      border: 1px solid var(--tp-cell-border); cursor: pointer;
      transition: all 0.12s; background: var(--tp-cell-bg);
    }
    .tp-assignee-item.selected {
      background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3);
    }
    .tp-divider { height: 1px; background: var(--tp-divider); margin: 12px 0; }
    .tp-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--tp-text3); margin-bottom: 6px; display: block; }
    .tp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; gap: 8px; }
  `;

  const TABS = [
    { id: "details", label: "Details", count: null },
    { id: "comments", label: "Comments", count: comments.length },
    { id: "updates", label: "Updates", count: workLogs.length },
    { id: "history", label: "History", count: history.filter(h => h.action !== "COMMENT_ADDED").length },
  ];

  return (
    <>
      <style>{css}</style>
      <div
        className={`tp-root ${fullPage ? "" : "tp-root-anim"}`}
        style={{ width: fullPage ? "100%" : "clamp(360px, 30vw, 430px)", minWidth: fullPage ? "100%" : 360, position: "relative" }}
      >

        {/* ── Fire Toast ── */}
        {toast && (
          <div style={{
            position: "absolute", top: 8, left: 12, right: 12, zIndex: 100,
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

        {/* ── Loading ── */}
        {loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--tp-text3)" }}>
            <span style={{ width: 22, height: 22, border: "2.5px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "tp-spin 0.7s linear infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12 }}>Loading ticket…</span>
          </div>
        )}

        {/* ── Ticket not found ── */}
        {!loading && !ticket && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tp-text3)", fontSize: 13 }}>Ticket not found</div>
        )}

        {/* ── Main content ── */}
        {!loading && ticket && (
          <>
            {/* Header */}
            <div className="tp-header">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#6366f1", marginBottom: 3 }}>{ticket.ticketId}</div>
                  <h3 className="tp-title" style={{
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{ticket.title}</h3>
                </div>
                <button className="tp-close-btn" onClick={onClose}><IcX /></button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 0 }}>
                <StatusBadge value={ticket.status} />
                <PriorityBadge value={ticket.priority} />
                {ticket.category && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--tp-text3)", padding: "3px 7px", borderRadius: 6, background: "var(--tp-cell-bg)", border: "1px solid var(--tp-cell-border)" }}>
                    {ticket.category}
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="tp-tabs">
                {TABS.map(tab => (
                  <button key={tab.id} className={`tp-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && <span className="tp-tab-count">{tab.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ── DETAILS TAB ── */}
            {activeTab === "details" && (
              <div className="tp-scroll">

                {/* Description */}
                <span className="tp-label">Description</span>
                <div style={{ fontSize: 13, color: "var(--tp-text2)", lineHeight: 1.6, padding: "10px 12px", borderRadius: 8, background: "var(--tp-cell-bg)", border: "1px solid var(--tp-cell-border)", marginBottom: 14, whiteSpace: "pre-wrap" }}>
                  {ticket.description || <span style={{ color: "var(--tp-text3)", fontStyle: "italic" }}>No description provided.</span>}
                </div>

                {ticket.attachments?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span className="tp-label">Attachments & Links</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ticket.attachments.map((att, idx) => {
                        const isImage = att.fileType?.startsWith("image/");
                        const isPdf = att.fileType === "application/pdf" || att.fileName?.toLowerCase().endsWith(".pdf");
                        const isZip = att.fileType?.includes("zip") || att.fileName?.toLowerCase().endsWith(".zip");

                        return (
                          <a
                            key={idx}
                            href={att.fileType === "link" ? att.fileUrl : `http://localhost:5000${att.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tp-btn-ghost"
                            style={{ height: "auto", padding: "6px 12px", borderRadius: 8, textDecoration: "none", gap: 8, fontSize: 11 }}
                          >
                            {att.fileType === "link" ? <IcLink /> :
                              isImage ? <span>🖼️</span> :
                                isPdf ? <span>📕</span> :
                                  isZip ? <span>📦</span> :
                                    <IcPaperclip />}
                            <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {att.fileName}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                  <InfoCell label="Status"><StatusBadge value={ticket.status} /></InfoCell>
                  <InfoCell label="Priority"><PriorityBadge value={ticket.priority} /></InfoCell>
                  <InfoCell label="Category">{ticket.category || "General"}</InfoCell>
                  <InfoCell label="Department">{ticket.department || <span style={{ color: "var(--tp-text3)", fontStyle: "italic" }}>—</span>}</InfoCell>
                  <InfoCell label="Due Date">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span style={{ color: "var(--tp-text3)", fontStyle: "italic" }}>—</span>}</InfoCell>
                  <InfoCell label="Created">{new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</InfoCell>
                  {ticket.projectId && (
                    <InfoCell label="Project" style={{ gridColumn: "1 / -1" }}>
                      {ticket.projectId.title || ticket.projectId.projectId || "Linked Project"}
                    </InfoCell>
                  )}
                </div>

                <div className="tp-divider" />

                {/* Read-only notice */}
                {!canModify && (
                  <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 14, background: "rgba(107,114,128,0.06)", border: "1px solid rgba(107,114,128,0.12)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>🔒</span>
                    <span style={{ fontSize: 11, color: "var(--tp-text2)", lineHeight: 1.45 }}>You can view this ticket but cannot make changes. Only the raiser, assignees, or project leads/managers can modify it.</span>
                  </div>
                )}

                {/* Status & Priority selects */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <span className="tp-label">Update Status</span>
                    <div style={{ position: "relative" }}>
                      <select value={ticket.status} onChange={onStatusChange} disabled={statusLoading || !canModify} className="tp-select" style={!canModify ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
                        {allowedStatusOptions.map(s => (
                          <option key={s} value={s} disabled={s === "CLOSED" && !hasClosureNote}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--tp-text3)" }}><IcChevronDown /></span>
                    </div>
                    {isEmployee && (
                      <p style={{ fontSize: 10, color: "var(--tp-text3)", marginTop: 4, lineHeight: 1.4 }}>Employees can resolve. Only lead/manager can close or reopen.</p>
                    )}
                  </div>
                  <div>
                    <span className="tp-label">Update Priority</span>
                    <div style={{ position: "relative" }}>
                      <select value={ticket.priority} onChange={onPriorityChange} disabled={priorityLoading || !canModify} className="tp-select" style={!canModify ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
                        {Object.keys(PRIORITY_META).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--tp-text3)" }}><IcChevronDown /></span>
                    </div>
                  </div>
                </div>

                {/* Closure Summary — shown in Details when no closure note exists */}
                {!hasClosureNote && canCloseOrReopen && (
                  <div style={{ padding: "11px 13px", borderRadius: 10, marginBottom: 14, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <IcWarning />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>Closure Summary Required</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--tp-text2)", margin: "0 0 8px", lineHeight: 1.45 }}>
                      A closure note with summary is required before this ticket can be marked as Closed. Go to the <button type="button" onClick={() => setActiveTab("updates")} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Updates</button> tab and select <strong>CLOSURE NOTE</strong> from the dropdown to add one.
                    </p>
                  </div>
                )}

                {hasClosureNote && (
                  <div style={{ padding: "11px 13px", borderRadius: 10, marginBottom: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <IcCheck />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>Closure note submitted — this ticket can be closed.</span>
                    </div>
                  </div>
                )}

                <div className="tp-divider" />

                {/* People */}
                <SectionLabel>People</SectionLabel>

                {ticket.raisedBy && (
                  <>
                    <span className="tp-label" style={{ color: "#8b5cf6" }}>Raised By</span>
                    <PersonCard user={ticket.raisedBy} accent="#8b5cf6" accentBg="rgba(139,92,246,0.07)" accentBorder="rgba(139,92,246,0.18)" />
                  </>
                )}

                {assignees.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <span className="tp-label" style={{ color: "#3b82f6" }}>Assigned To</span>
                    {assignees.map(a => (
                      <PersonCard key={a._id} user={a} accent="#3b82f6" accentBg="rgba(59,130,246,0.07)" accentBorder="rgba(59,130,246,0.18)" />
                    ))}
                  </div>
                )}

                {/* Reassign */}
                {canReassign && canModify && (
                  <div style={{ marginTop: 14 }}>
                    <span className="tp-label">Assign / Reassign</span>
                    <div style={{ padding: 10, borderRadius: 10, background: "var(--tp-cell-bg)", border: "1px solid var(--tp-cell-border)" }}>
                      <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                        {assignableUsers.length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--tp-text3)", padding: "8px 0", textAlign: "center" }}>No users available</div>
                        ) : assignableUsers.map(user => {
                          const checked = selectedAssignees.includes(user._id);
                          return (
                            <label key={user._id} className={`tp-assignee-item ${checked ? "selected" : ""}`}>
                              <div style={{
                                width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? "#6366f1" : "var(--tp-input-border)"}`,
                                background: checked ? "#6366f1" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, transition: "all 0.15s",
                              }}>
                                {checked && <IcCheck />}
                              </div>
                              <input type="checkbox" checked={checked} onChange={() => setSelectedAssignees(prev => prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id])} style={{ display: "none" }} />
                              <Avatar name={user.name} size={26} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tp-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                                <div style={{ fontSize: 10, color: "var(--tp-text3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 5, background: "rgba(99,102,241,0.1)", color: "#6366f1", flexShrink: 0 }}>{user.role}</span>
                            </label>
                          );
                        })}
                      </div>
                      <button type="button" onClick={submitAssignment} disabled={assignLoading} className="tp-btn-primary">
                        {assignLoading ? "Saving…" : assignees.length ? "Reassign Ticket" : "Assign Ticket"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── UPDATES TAB ── */}
            {activeTab === "updates" && (
              <div className="tp-scroll">
                {/* Closure notice */}
                <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 14, background: "var(--tp-info-bg)", border: "1px solid var(--tp-info-border)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "#6366f1", marginTop: 1, flexShrink: 0 }}><IcWarning /></span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 2 }}>Closure Requirement</div>
                    <div style={{ fontSize: 11, color: "var(--tp-text2)", lineHeight: 1.45 }}>A closure note is required before this ticket can be marked as Closed.</div>
                  </div>
                </div>

                {/* Form — only show if user can modify */}
                {canModify ? (
                  <form onSubmit={submitWorkLog} style={{ marginBottom: 20 }}>
                    <div style={{ padding: 13, borderRadius: 10, border: "1px solid var(--tp-cell-border)", background: "var(--tp-cell-bg)", display: "flex", flexDirection: "column", gap: 9 }}>
                      <input type="text" name="title" value={workLogForm.title} onChange={handleWorkLogInputChange} placeholder="Update title" className="tp-input" />

                      <div style={{ position: "relative" }}>
                        <textarea name="description" value={workLogForm.description} onChange={handleUpdateTextChange} rows={3} placeholder="Describe work done… (@ to mention)" className="tp-textarea" />
                        {updateMentionState.show && (
                          <div className="tp-mention">
                            <div style={{ maxHeight: 180, overflowY: "auto" }}>
                              {allUsers.filter(u => u.name.toLowerCase().includes(updateMentionState.filter.toLowerCase())).map(user => (
                                <button key={user._id} type="button" className="tp-mention-item" onClick={() => selectUpdateUser(user)}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp-text)" }}>{user.name}</div>
                                  <div style={{ fontSize: 10, color: "var(--tp-text3)" }}>{user.department} · {user.role}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ position: "relative" }}>
                        <select name="logType" value={workLogForm.logType} onChange={handleWorkLogInputChange} className="tp-select">
                          {WORKLOG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--tp-text3)" }}><IcChevronDown /></span>
                      </div>

                      {workLogForm.logType === "CLOSURE_NOTE" && (
                        <div>
                          <span className="tp-label" style={{ color: "#ef4444" }}>Closure Summary</span>
                          <textarea name="closureSummary" value={workLogForm.closureSummary} onChange={handleWorkLogInputChange} rows={3} placeholder="Summarize the final resolution…" className="tp-textarea" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "var(--tp-text)" }} />
                        </div>
                      )}

                      {/* Link + Attach row */}
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" className="tp-btn-ghost" onClick={() => setShowLinkInput(p => !p)}><IcLink /> Link</button>
                        <label className="tp-btn-ghost" style={{ cursor: "pointer" }}>
                          <IcPaperclip /> Attach
                          <input type="file" multiple style={{ display: "none" }} onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setWorkLogFiles(p => [...p, ...files]);
                            e.target.value = null;
                          }} />
                        </label>
                      </div>

                      {showLinkInput && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input type="url" value={workLogLinkInput} onChange={e => setWorkLogLinkInput(e.target.value)} placeholder="Paste URL…" className="tp-input" style={{ flex: 1 }} />
                          <button type="button" className="tp-btn-ghost" onClick={() => {
                            if (!workLogLinkInput.trim()) return;
                            setWorkLogLinks(p => [...p, { label: workLogLinkInput, url: workLogLinkInput }]);
                            setWorkLogLinkInput(""); setShowLinkInput(false);
                          }}>Add</button>
                        </div>
                      )}

                      {(workLogLinks.length > 0 || workLogFiles.length > 0) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {workLogLinks.map((link, idx) => (
                            <Chip key={idx} color="#6366f1" onRemove={() => setWorkLogLinks(p => p.filter((_, i) => i !== idx))}>
                              <IcLink /> {link.url.slice(0, 24)}…
                            </Chip>
                          ))}
                          {workLogFiles.map((file, idx) => (
                            <Chip key={idx} color="#3b82f6" onRemove={() => setWorkLogFiles(p => p.filter((_, i) => i !== idx))}>
                              <IcPaperclip /> {file.name.slice(0, 18)}
                            </Chip>
                          ))}
                        </div>
                      )}

                      <button type="submit" disabled={workLogLoading} className="tp-btn-primary">
                        {workLogLoading ? "Saving…" : "Save Update"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 14, background: "rgba(107,114,128,0.06)", border: "1px solid rgba(107,114,128,0.12)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>🔒</span>
                    <span style={{ fontSize: 11, color: "var(--tp-text2)", lineHeight: 1.45 }}>You cannot add updates to this ticket. Only the raiser, assignees, or project leads/managers can add updates.</span>
                  </div>
                )}

                {/* Worklog list */}
                {workLogs.length === 0 ? (
                  <div className="tp-empty">
                    <span style={{ fontSize: 28 }}>📝</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--tp-text3)" }}>No updates yet</span>
                  </div>
                ) : workLogs.map(log => (
                  <div key={log._id} className="tp-worklog-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp-text)", marginBottom: 2 }}>{log.title}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tp-text3)" }}>
                          {log.logType?.replace(/_/g, " ")} {log.isClosureNote && <span style={{ color: "#ef4444" }}>· Closure Note</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--tp-text3)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}><IcClock />{timeAgo(log.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Avatar name={log.userId?.name} size={22} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1" }}>{log.userId?.name || "System"}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--tp-text2)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{log.description}</div>
                    {log.mentionedUsers?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {log.mentionedUsers.map(u => (
                          <span key={u._id} style={{ fontSize: 10, background: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>@{u.name}</span>
                        ))}
                      </div>
                    )}
                    {log.closureSummary && (
                      <div style={{ marginTop: 10, padding: "9px 11px", background: "rgba(239,68,68,0.07)", borderLeft: "3px solid #ef4444", borderRadius: "0 8px 8px 0" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Closure Note</div>
                        <div style={{ fontSize: 12, color: "var(--tp-text2)" }}>{log.closureSummary}</div>
                      </div>
                    )}
                    {log.links?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                        {log.links.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#6366f1", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <IcLink /> {link.label || link.url}
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
                            <a key={idx} href={url} target="_blank" rel="noreferrer" className="tp-btn-ghost" style={{ height: "auto", padding: "4px 10px", fontSize: 11, textDecoration: "none", gap: 6 }}>
                              {isImage ? "🖼️" : isPdf ? "📕" : isZip ? "📦" : <IcPaperclip />}
                              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* ── COMMENTS TAB ── */}
            {activeTab === "comments" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
                  {comments.length === 0 ? (
                    <div className="tp-empty" style={{ minHeight: 200 }}>
                      <span style={{ fontSize: 28 }}>💬</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tp-text2)" }}>No comments yet</span>
                      <span style={{ fontSize: 12, color: "var(--tp-text3)" }}>Start the conversation</span>
                    </div>
                  ) : (
                    <>
                      {comments.map(c => <CommentBubble key={c._id} comment={c} isMe={c.userId?._id === currentUser?._id} />)}
                      <div ref={commentsEndRef} />
                    </>
                  )}
                </div>

                {/* Compose */}
                <div style={{ borderTop: "1px solid var(--tp-divider)", padding: "10px 14px 14px", flexShrink: 0, background: "var(--tp-header)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    {/* Avatar — align to bottom of the input row */}
                    <div style={{ flexShrink: 0, paddingBottom: 1 }}>
                      <Avatar name={currentUser?.name} size={28} />
                    </div>

                    {/* Textarea wrapper — grows, holds mention dropdown */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={handleTextChange}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                        placeholder="Write a comment… (@ to mention)"
                        rows={1}
                        className="tp-textarea"
                        style={{ borderRadius: 12, lineHeight: 1.5, overflow: "hidden", paddingRight: 12, width: "100%", display: "block" }}
                      />

                      {mentionState.show && (
                        <div className="tp-mention">
                          <div style={{ maxHeight: 180, overflowY: "auto" }}>
                            {allUsers.filter(u => u.name.toLowerCase().includes(mentionState.filter.toLowerCase())).map(user => (
                              <button key={user._id} className="tp-mention-item" onClick={() => selectUser(user)}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp-text)" }}>{user.name}</div>
                                <div style={{ fontSize: 10, color: "var(--tp-text3)" }}>{user.department} · {user.role}</div>
                              </button>
                            ))}
                            {allUsers.filter(u => u.name.toLowerCase().includes(mentionState.filter.toLowerCase())).length === 0 && (
                              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--tp-text3)", textAlign: "center" }}>No users found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Send button — flex sibling, anchored to bottom */}
                    <button
                      onClick={sendComment}
                      disabled={sending || !newComment.trim()}
                      style={{
                        flexShrink: 0,
                        width: 34, height: 34, borderRadius: "50%", border: "none",
                        background: newComment.trim() ? "#6366f1" : "var(--tp-cell-bg)",
                        color: newComment.trim() ? "#fff" : "var(--tp-text3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: newComment.trim() ? "pointer" : "default",
                        transition: "all 0.2s",
                        boxShadow: newComment.trim() ? "0 2px 10px rgba(99,102,241,0.45)" : "none",
                        transform: newComment.trim() ? "scale(1)" : "scale(0.92)",
                        paddingBottom: 1,
                      }}
                    >
                      {sending
                        ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "tp-spin 0.7s linear infinite", display: "inline-block" }} />
                        : <IcSend />}
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--tp-text3)", margin: "5px 0 0 36px" }}>Enter to send · Shift+Enter for new line</p>
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
              <div className="tp-scroll">
                {history.filter(h => h.action !== "COMMENT_ADDED").length === 0 ? (
                  <div className="tp-empty" style={{ minHeight: 200 }}>
                    <span style={{ fontSize: 28 }}>🕘</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tp-text2)" }}>No history yet</span>
                  </div>
                ) : (
                  history.filter(h => h.action !== "COMMENT_ADDED").map((h, i) => (
                    <div key={h._id || i} className="tp-history-item">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tp-text)" }}>{h.performedBy?.name || h.userId?.name || "System"}</span>
                        <span style={{ fontSize: 10, color: "var(--tp-text3)", display: "flex", alignItems: "center", gap: 3 }}><IcClock />{timeAgo(h.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--tp-text2)", lineHeight: 1.55 }}>{h.message}</div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}