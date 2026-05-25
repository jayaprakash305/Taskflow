import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  handleGetNotifications,
  handleGetUnreadNotificationCount,
  handleMarkAllNotificationsAsRead,
  handleMarkNotificationAsRead,
} from "../controllers/notificationController";
import { handleGetTicketDetails, handleSearchTickets } from "../controllers/ticketController";
import { handleGetUnreadCount } from "../controllers/messageController";
import { useMessageContext } from "../context/MessageContext";
import { APP_ROUTES } from "../constants/routes";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IcClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IcTicket = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V8z" />
  </svg>
);
const IcMessage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcProject = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);
const IcArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
export const IcMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/**
 * Navbar
 * Props:
 *   onMenuToggle — called when hamburger is tapped (mobile/tablet only)
 */
function Navbar({ onMenuToggle }) {
  const { user, socket } = useAuth();
  const { unreadMsgCount } = useMessageContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Full-screen mobile search overlay
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const getDateString = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const loadNotifications = async () => {
    try {
      const [notifData, unreadData] = await Promise.all([
        handleGetNotifications(),
        handleGetUnreadNotificationCount(),
      ]);
      setNotifications(notifData?.notifications || []);
      setUnreadCount(unreadData?.count || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  // Notification permission state
  const [showNotifPermissionBanner, setShowNotifPermissionBanner] = useState(false);

  useEffect(() => { 
    loadNotifications(); 
    // Check if we need to show the permission banner
    if ("Notification" in window && Notification.permission === "default") {
      setShowNotifPermissionBanner(true);
      // Also try requesting directly — some browsers allow this on page load
      Notification.requestPermission().then((result) => {
        console.log("🔔 Notification permission:", result);
        if (result === "granted") setShowNotifPermissionBanner(false);
      }).catch(() => {
        // Browser requires user gesture — we'll show banner
        console.log("🔔 Permission request needs user gesture, showing banner");
      });
    }
  }, []);

  const requestNotifPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      console.log("🔔 Notification permission result:", result);
      if (result === "granted" || result === "denied") {
        setShowNotifPermissionBanner(false);
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  useEffect(() => {
    if (socket) {
      console.log("🔔 Setting up notification listener on socket:", socket.id);
      
      const handleNewNotification = (data) => {
        console.log("🔔 Received new-notification event:", data);
        const { notification } = data;
        if (!notification) return;
        
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Try OS-level push notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const pushNotif = new Notification("TaskFlow", {
              body: notification.message,
              icon: "/vite.svg",
              tag: notification._id || Date.now().toString(), // Prevent duplicate popups
              requireInteraction: false,
            });
            
            pushNotif.onclick = () => {
              window.focus();
              handleNotifClick(notification);
              pushNotif.close();
            };
            console.log("🔔 OS push notification shown");
          } catch (err) {
            console.warn("🔔 Failed to show OS notification:", err);
          }
        } else {
          console.log("🔔 OS notification skipped — permission:", 
            "Notification" in window ? Notification.permission : "API not available");
        }
      };
      socket.on("new-notification", handleNewNotification);

      return () => { 
        socket.off("new-notification", handleNewNotification); 
      };
    }
  }, [socket]);

  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  // Debounced search (shared)
  const runSearch = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      setSearchLoading(true);
      const data = await handleSearchTickets({ query });
      setSearchResults(data?.tickets || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNotifClick = async (n) => {
    try {
      if (!n.isRead) await handleMarkNotificationAsRead(n._id);
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
      setUnreadCount(prev => Math.max(0, prev - (n.isRead ? 0 : 1)));
      const isMention = n.type === "COMMENT_MENTION";
      const isStatusChange = n.type === "TICKET_STATUS_CHANGED" || n.type === "PROJECT_STATUS_CHANGED";
      const tab = isMention ? "comments" : (isStatusChange ? "history" : "details");

      if (n.entityType === "PROJECT") navigate(`/projects/${n.entityIdentifier}`, { state: { activeTab: tab } });
      if (n.entityType === "TICKET") {
        try {
          const td = await handleGetTicketDetails(n.entityIdentifier);
          const ticket = td?.ticket;
          const state = { selectedTicketId: n.entityIdentifier, activeTab: tab };
          if (ticket?.projectId) {
            const pId = ticket.projectId.projectId || ticket.projectId;
            navigate(`/projects/${pId}`, { state });
          } else {
            const isCreator = (ticket?.raisedBy?._id || ticket?.raisedBy) === user?._id;
            navigate(isCreator ? APP_ROUTES.TICKETS_RAISED : APP_ROUTES.TICKETS_ASSIGNED, { state });
          }
        } catch {
          navigate(APP_ROUTES.TICKETS_ASSIGNED, { state: { selectedTicketId: n.entityIdentifier, activeTab: tab } });
        }
      }
      setNotifOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await handleMarkAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchResultClick = (ticket) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    if (ticket.projectId) {
      const pId = ticket.projectId?.projectId || ticket.projectId;
      navigate(`/projects/${pId}`, { state: { selectedTicketId: ticket.ticketId } });
    } else {
      navigate(APP_ROUTES.TICKETS_ASSIGNED, { state: { selectedTicketId: ticket.ticketId } });
    }
  };

  const statusColor = {
    OPEN: "#3b82f6", ASSIGNED: "#8b5cf6",
    IN_PROGRESS: "#eab308", RESOLVED: "#22c55e", CLOSED: "#6b7280",
  };

  // Shared search results list
  const SearchResultsList = () => (
    <>
      {searchLoading ? (
        <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "var(--s-sub, #55556a)" }}>
          Searching…
        </div>
      ) : searchResults.length === 0 ? (
        <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "var(--s-sub, #55556a)" }}>
          No tickets found for "{searchQuery}"
        </div>
      ) : (
        <>
          <div style={{ padding: "10px 14px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--s-section, #55556a)" }}>
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {searchResults.map(ticket => (
              <button
                key={ticket._id}
                className="search-result-item"
                onClick={() => handleSearchResultClick(ticket)}
              >
                <span style={{ color: statusColor[ticket.status] || "#6b7280", flexShrink: 0 }}><IcTicket /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: "#6366f1" }}>{ticket.ticketId}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                      padding: "1px 5px", borderRadius: 4,
                      background: `${statusColor[ticket.status] || "#6b7280"}18`,
                      color: statusColor[ticket.status] || "#6b7280",
                    }}>{ticket.status?.replace(/_/g, " ")}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.title}</div>
                </div>
                <span style={{ color: "var(--s-sub, #55556a)", flexShrink: 0 }}><IcArrowRight /></span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      <style>{`
        /* ── Navbar ── */
        .navbar-root {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 40;
          transition: background 0.2s, border-color 0.2s;
          gap: 12px;
        }
        [data-theme="dark"] .navbar-root {
          background: rgba(13, 13, 17, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        [data-theme="light"] .navbar-root {
          background: rgba(255, 255, 255, 0.25);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* Reduce horizontal padding on small screens */
        @media (max-width: 640px) {
          .navbar-root { padding: 0 14px; gap: 8px; height: 58px; }
        }

        /* ── Greeting ── */
        .nav-greeting {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .nav-greeting { color: #f0f0f5; }
        [data-theme="light"] .nav-greeting { color: #111827; }

        @media (max-width: 480px) {
          .nav-greeting { font-size: 14px; }
        }

        .nav-date {
          font-size: 12px;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .nav-date { color: #55556a; }
        [data-theme="light"] .nav-date { color: #9ca3af; }

        /* Hide date on very small screens */
        @media (max-width: 380px) {
          .nav-date { display: none; }
        }

        /* ── Left section: hamburger + greeting ── */
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        /* ── Right section: actions ── */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .navbar-right { gap: 6px; }
        }

        /* ── Hamburger (hidden on desktop) ── */
        .navbar-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--s-border, #e5e7eb);
          background: var(--s-toggle-bg, #f3f4f6);
          color: var(--s-nav-text, #6b7280);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        @media (max-width: 1023px) {
          .navbar-hamburger { display: flex; }
        }
        [data-theme="dark"] .navbar-hamburger {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.07);
          color: #9090a8;
        }
        [data-theme="dark"] .navbar-hamburger:hover { background: rgba(255,255,255,0.09); color: #c8c8e0; }
        [data-theme="light"] .navbar-hamburger:hover { background: #e9eaec; color: #374151; }

        /* ── Nav Buttons ── */
        .nav-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; transition: all 0.15s;
          flex-shrink: 0;
        }
        [data-theme="dark"] .nav-btn {
          background: rgba(255,255,255,0.05);
          color: #9090a8;
          border: 1px solid rgba(255,255,255,0.07);
        }
        [data-theme="dark"] .nav-btn:hover { background: rgba(255,255,255,0.09); color: #c8c8e0; }
        [data-theme="light"] .nav-btn { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
        [data-theme="light"] .nav-btn:hover { background: #e9eaec; color: #374151; }

        /* ── Desktop Search ── */
        .search-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        /* Hide desktop search on mobile — replaced by full-screen overlay */
        @media (max-width: 639px) {
          .search-bar-wrapper { display: none; }
          .search-btn-mobile { display: flex !important; }
        }
        .search-btn-mobile { display: none; }

        .search-expanded {
          display: flex; align-items: center; gap: 8px;
          padding: 0 12px;
          height: 36px; border-radius: 10px;
          border: none; outline: none;
          font-size: 13px; font-family: inherit;
          transition: all 0.2s ease;
        }
        [data-theme="dark"] .search-expanded {
          background: rgba(255,255,255,0.07); color: #e0e0ec;
          border: 1px solid rgba(255,255,255,0.12);
        }
        [data-theme="dark"] .search-expanded::placeholder { color: #55556a; }
        [data-theme="dark"] .search-expanded:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        [data-theme="light"] .search-expanded {
          background: #f9fafb; color: #111827; border: 1px solid #e5e7eb;
        }
        [data-theme="light"] .search-expanded::placeholder { color: #9ca3af; }
        [data-theme="light"] .search-expanded:focus {
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }

        /* Shrink search width on tablets */
        @media (max-width: 900px) and (min-width: 640px) {
          .search-expanded { width: 180px !important; }
        }

        .search-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 360px; border-radius: 14px;
          overflow: hidden; z-index: 100;
          animation: dropIn 0.15s ease;
        }
        /* Fit within screen on tablet */
        @media (max-width: 900px) {
          .search-dropdown { width: 300px; }
        }
        [data-theme="dark"] .search-dropdown {
          background: #16161e;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        [data-theme="light"] .search-dropdown {
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
        }

        /* ── Mobile search full-screen overlay ── */
        .mobile-search-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 300;
          flex-direction: column;
          animation: fadeIn 0.15s ease;
        }
        .mobile-search-overlay.open { display: flex; }
        [data-theme="dark"] .mobile-search-overlay { background: #0d0d11; }
        [data-theme="light"] .mobile-search-overlay { background: #fff; }

        .mobile-search-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--s-divider, #e5e7eb);
          flex-shrink: 0;
        }
        .mobile-search-input {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: none;
          outline: none;
          padding: 0 14px 0 38px;
          font-size: 14px;
          font-family: inherit;
        }
        [data-theme="dark"] .mobile-search-input {
          background: rgba(255,255,255,0.07);
          color: #e0e0ec;
          border: 1px solid rgba(255,255,255,0.12);
        }
        [data-theme="dark"] .mobile-search-input::placeholder { color: #55556a; }
        [data-theme="light"] .mobile-search-input {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        [data-theme="light"] .mobile-search-input::placeholder { color: #9ca3af; }

        /* ── Shared result items ── */
        .search-result-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; cursor: pointer; border: none;
          width: 100%; text-align: left; font-family: inherit;
          background: transparent; transition: background 0.1s;
        }
        [data-theme="dark"] .search-result-item {
          border-bottom: 1px solid rgba(255,255,255,0.05); color: #d4d4e8;
        }
        [data-theme="dark"] .search-result-item:hover { background: rgba(255,255,255,0.05); }
        [data-theme="light"] .search-result-item {
          border-bottom: 1px solid #f3f4f6; color: #374151;
        }
        [data-theme="light"] .search-result-item:hover { background: #f9fafb; }

        /* ── Notif dropdown ── */
        .notif-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 360px; border-radius: 14px;
          overflow: hidden; z-index: 100;
          animation: dropIn 0.15s ease;
        }
        @media (max-width: 640px) {
          .notif-dropdown {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100dvh;
            border-radius: 0;
            z-index: 200;
            animation: notifSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
          }
          .notif-scroll-area {
            max-height: calc(100dvh - 56px) !important;
          }
        }
        @keyframes notifSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        [data-theme="dark"] .notif-dropdown {
          background: #16161e;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        [data-theme="light"] .notif-dropdown {
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
        }

        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
        }
        @media (max-width: 640px) {
          .notif-header { padding: 16px; }
        }
        [data-theme="dark"] .notif-header { border-bottom: 1px solid rgba(255,255,255,0.07); }
        [data-theme="light"] .notif-header { border-bottom: 1px solid #f0f0f5; }

        .notif-item {
          display: block; width: 100%; text-align: left; border: none;
          padding: 11px 16px; cursor: pointer; transition: background 0.1s;
          /* Ensure comfortable tap target */
          min-height: 52px;
        }
        [data-theme="dark"] .notif-item { border-bottom: 1px solid rgba(255,255,255,0.04); }
        [data-theme="dark"] .notif-item.unread { background: rgba(99,102,241,0.07); }
        [data-theme="dark"] .notif-item:hover { background: rgba(255,255,255,0.05); }
        [data-theme="light"] .notif-item { border-bottom: 1px solid #f6f6f9; }
        [data-theme="light"] .notif-item.unread { background: #f0f0ff; }
        [data-theme="light"] .notif-item:hover { background: #f9fafb; }

        .notif-msg { font-size: 13px; line-height: 1.4; }
        [data-theme="dark"] .notif-msg { color: #d0d0e8; }
        [data-theme="light"] .notif-msg { color: #374151; }

        .notif-time { font-size: 11px; margin-top: 3px; }
        [data-theme="dark"] .notif-time { color: #4a4a65; }
        [data-theme="light"] .notif-time { color: #9ca3af; }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ── Mobile search overlay ── */}
      <div className={`mobile-search-overlay ${mobileSearchOpen ? "open" : ""}`} role="dialog" aria-label="Search">
        <div className="mobile-search-header">
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 12, color: "var(--s-nav-text, #9090a8)", pointerEvents: "none" }}>
              <IcSearch />
            </span>
            <input
              ref={mobileSearchInputRef}
              type="text"
              className="mobile-search-input"
              placeholder="Search ticket ID, title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Escape" && (setMobileSearchOpen(false), setSearchQuery(""), setSearchResults([]))}
              autoComplete="off"
            />
          </div>
          <button
            className="nav-btn"
            onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
            aria-label="Close search"
          >
            <IcClose />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {searchQuery.trim().length > 0
            ? <SearchResultsList />
            : (
              <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--s-sub, #55556a)" }}>
                Type to search tickets…
              </div>
            )
          }
        </div>
      </div>

      {/* ── Notification permission banner ── */}
      {showNotifPermissionBanner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "10px 20px",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
          boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
        }}>
          <span>🔔 Enable push notifications to stay updated on tickets and projects</span>
          <button onClick={requestNotifPermission} style={{
            padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>Allow</button>
          <button onClick={() => setShowNotifPermissionBanner(false)} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.7)",
            cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
          }}>✕</button>
        </div>
      )}

      <header
        className="navbar-root"
        style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}
      >
        {/* Left: Hamburger (mobile/tablet) + Greeting */}
        <div className="navbar-left">
          {/* Hamburger — only on mobile/tablet; controlled by CSS display */}
          <button
            className="navbar-hamburger"
            onClick={onMenuToggle}
            aria-label="Open navigation"
          >
            <IcMenu />
          </button>

          <div style={{ minWidth: 0 }}>
            <div className="nav-greeting">
              {getGreeting()},{" "}
              <span style={{ color: "#6366f1" }}>{user?.name?.split(" ")[0] || "User"}</span>
            </div>
            <div className="nav-date">
              {getDateString()} · {user?.department || "General"} dept
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right">

          {/* Desktop + tablet search */}
          <div className="search-bar-wrapper" ref={searchRef}>
            {searchOpen ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 10, color: "var(--s-nav-text, #9090a8)", pointerEvents: "none" }}>
                    <IcSearch />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-expanded"
                    style={{ width: 260, paddingLeft: 34 }}
                    placeholder="Search ticket ID, title…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Escape" && (setSearchOpen(false), setSearchQuery(""), setSearchResults([]))}
                  />
                </div>
                <button
                  className="nav-btn"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                  aria-label="Close search"
                >
                  <IcClose />
                </button>

                {searchQuery.trim().length > 0 && (
                  <div className="search-dropdown">
                    <SearchResultsList />
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-btn" onClick={() => setSearchOpen(true)} title="Search tickets" aria-label="Search tickets">
                <IcSearch />
              </button>
            )}
          </div>

          {/* Mobile-only search button (opens full-screen overlay) */}
          <button
            className="nav-btn search-btn-mobile"
            onClick={() => setMobileSearchOpen(true)}
            title="Search tickets"
            aria-label="Search tickets"
          >
            <IcSearch />
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="nav-btn"
              title="Notifications"
              aria-label="Notifications"
              onClick={() => setNotifOpen(p => !p)}
            >
              <IcBell />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  minWidth: 15, height: 15, padding: "0 3px",
                  borderRadius: 99, background: "#ef4444",
                  color: "#fff", fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
              <div className="notif-header">
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--s-brand, #f0f0f5)" }}>Notifications</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {notifications.length > 0 && (
                      <button onClick={handleMarkAll} style={{
                        fontSize: 12, fontWeight: 600, color: "#6366f1",
                        background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                      }}>Mark all read</button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="notif-close-btn"
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: "1px solid var(--s-border, rgba(255,255,255,0.1))",
                        background: "transparent", color: "var(--s-sub, #9ca3af)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    ><IcClose /></button>
                  </div>
                </div>
                <div className="notif-scroll-area" style={{ maxHeight: 400, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--s-sub, #55556a)" }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n._id}
                        className={`notif-item ${!n.isRead ? "unread" : ""}`}
                        onClick={() => handleNotifClick(n)}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{ marginTop: 2, color: n.entityType === "TICKET" ? "#6366f1" : "#22c55e", flexShrink: 0 }}>
                            {n.entityType === "TICKET" ? <IcTicket /> : <IcProject />}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="notif-msg">{n.message}</p>
                            <p className="notif-time">
                              {new Date(n.createdAt).toLocaleString("en-US", {
                                month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: "#6366f1", marginTop: 4, flexShrink: 0,
                            }} />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <button className="nav-btn" title="Messages" aria-label="Messages"
            onClick={() => navigate(APP_ROUTES.MESSAGES)}
            style={unreadMsgCount > 0 ? { color:"#6366f1", background:"rgba(99,102,241,0.13)", borderColor:"rgba(99,102,241,0.2)" } : {}}>
            <IcMessage />
            {unreadMsgCount > 0 && (
              <span style={{
                position:"absolute", top:5, right:5, minWidth:15, height:15,
                padding:"0 3px", borderRadius:99, background:"#ef4444",
                color:"#fff", fontSize:9, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center",
                lineHeight: 1,
              }}>
                {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12, color: "#fff",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
              cursor: "default",
            }}
            title={user?.name}
          >
            {getInitials(user?.name)}
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;