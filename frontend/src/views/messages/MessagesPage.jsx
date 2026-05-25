import React, { useState, useEffect, useRef, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCall } from "../../context/CallContext";
import {
  handleGetInbox,
  handleGetConversation,
  handleSendMessage,
  handleSearchUsers,
  handleCreateDirectChat,
} from "../../controllers/messageController";
import { useMessageContext } from "../../context/MessageContext";
import { APP_ROUTES } from "../../constants/routes";
import { CreateGroupModal, ManageGroupModal } from "./GroupModals";

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const getInitials = (name) =>
  name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatDayLabel = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: now.getFullYear() !== d.getFullYear() ? "numeric" : undefined });
};

const ROLE_COLORS = {
  ADMIN:    { bg: "rgba(239,68,68,0.15)",   fg: "#f87171" },
  MANAGER:  { bg: "rgba(139,92,246,0.18)",  fg: "#a78bfa" },
  EMPLOYEE: { bg: "rgba(99,102,241,0.18)",  fg: "#818cf8" },
  LEAD:     { bg: "rgba(34,197,94,0.15)",   fg: "#22c55e" },
  default:  { bg: "rgba(99,102,241,0.18)",  fg: "#818cf8" },
};
const getRoleColor = (role) => ROLE_COLORS[role] || ROLE_COLORS.default;

/* ─── Global Styles ────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  /* ── Layout ── */
  .msg-page {
    display: flex;
    height: 100%;
    overflow: hidden;
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    position: relative;
    background: transparent;
  }

  /* ── Sidebar / Inbox panel ── */
  .inbox-panel {
    width: 300px;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--clr-border);
    background: transparent;
    overflow: hidden;
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    z-index: 20;
  }

  /* ── Chat window ── */
  .chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
    min-width: 0;
  }

  /* ── Empty state ── */
  .empty-state-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--txt3);
    padding: 24px;
  }

  /* ─────────── TABLET (≤ 900px) ─────────── */
  @media (max-width: 900px) {
    .inbox-panel { width: 260px; min-width: 260px; }
  }

  /* ─────────── MOBILE (≤ 680px) ─────────── */
  @media (max-width: 680px) {
    /* Inbox covers full width; slide off-screen when chat open */
    .inbox-panel {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      min-width: 100%;
      height: 100%;
      transform: translateX(0);
    }
    .inbox-panel.hidden {
      transform: translateX(-100%);
      pointer-events: none;
    }

    /* Chat window covers full width when conversation open */
    .chat-window {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      transform: translateX(100%);
      z-index: 15;
      transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    }
    .chat-window.visible {
      transform: translateX(0);
    }

    .empty-state-wrap { display: none; }
  }

  /* ── Conversation items ── */
  .ci {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--clr-border);
    transition: background 0.12s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .ci:hover  { background: var(--bg3); }
  .ci.sel    { background: var(--acc-dim, rgba(99,102,241,0.10)); }
  .ci:active { background: var(--acc-dim, rgba(99,102,241,0.14)); }

  /* ── Tabs ── */
  .tab-btn {
    flex: 1;
    padding: 9px 0;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--txt3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .tab-btn.on { color: var(--acc, #6366f1); border-bottom-color: var(--acc, #6366f1); }

  /* ── Search input (inbox) ── */
  .si-msg {
    width: 100%;
    padding: 8px 10px 8px 34px;
    font-size: 13px;
    border-radius: 10px;
    border: 1px solid var(--clr-border);
    background: var(--clr-bg3);
    color: var(--clr-text);
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .si-msg::placeholder { color: var(--txt3); }
  .si-msg:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
  }

  /* ── Message input ── */
  .msg-in-chat {
    flex: 1;
    padding: 9px 13px;
    font-size: 14px;
    border-radius: 12px;
    border: 1px solid var(--clr-border);
    background: var(--clr-bg3);
    color: var(--clr-text);
    outline: none;
    font-family: inherit;
    resize: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .msg-in-chat::placeholder { color: var(--txt3); }
  .msg-in-chat:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
  }

  /* ── Header action buttons (chat header) ── */
  .hdr-action-btn {
    width: 34px; height: 34px;
    border-radius: 9px;
    border: 1px solid var(--clr-border);
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--txt3);
    transition: all 0.13s;
    -webkit-tap-highlight-color: transparent;
  }
  .hdr-action-btn:hover { background: var(--bg3); color: var(--txt2); }
  .hdr-action-btn:active { background: var(--acc-dim); color: var(--acc); }

  /* ── Footer icon buttons ── */
  .ft-icon-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: transparent;
    border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--txt3);
    transition: color 0.13s, background 0.13s;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .ft-icon-btn:hover  { color: var(--txt2); background: var(--bg3); }
  .ft-icon-btn:active { color: var(--acc); }

  /* ── Send button ── */
  .send-btn {
    width: 38px; height: 38px;
    border-radius: 11px;
    border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .send-btn.active  { background: #6366f1; color: #fff; box-shadow: 0 2px 12px rgba(99,102,241,0.4); }
  .send-btn.inactive{ background: var(--bg3); color: var(--txt3); border: 1px solid var(--bd); cursor: default; }
  .send-btn.active:hover { background: #4f46e5; }

  /* ── Scroll area ── */
  .msg-scroll::-webkit-scrollbar { width: 4px; }
  .msg-scroll::-webkit-scrollbar-track { background: transparent; }
  .msg-scroll::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 4px; }

  /* ── Attachment preview ── */
  .attach-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg3);
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid var(--bd);
    width: fit-content;
    max-width: 100%;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Mobile: bigger tap targets ── */
  @media (max-width: 680px) {
    .ci { padding: 13px 16px; }
    .msg-in-chat { font-size: 16px; } /* prevent iOS zoom */
    .hdr-action-btn { width: 38px; height: 38px; }
    .ft-icon-btn { width: 40px; height: 40px; }
    .send-btn { width: 42px; height: 42px; border-radius: 13px; }
  }

  /* ── Role badge ── */
  .role-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 5px;
    display: inline-block;
    margin-top: 3px;
    letter-spacing: 0.02em;
  }

  /* ── Back button (mobile) ── */
  .back-btn-mobile { display: none; }
  @media (max-width: 680px) {
    .back-btn-mobile { display: flex !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   MessagesPage
   ════════════════════════════════════════════════════════════════════════ */
export default function MessagesPage() {
  const { user, socket } = useAuth();
  const { startCall } = useCall();
  const { refreshUnreadMsgCount } = useMessageContext();
  const navigate = useNavigate();

  const [inbox, setInbox] = useState([]);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevConvoRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  /* ── Load inbox ── */
  useEffect(() => {
    handleGetInbox().then((data) => {
      if (data?.chats) setInbox(data.chats);
    });
  }, []);

  /* ── Socket listeners ── */
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { chatId, message } = data;
      if (selectedConvo?._id === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
        socket.emit("read-messages", { chatId });
        refreshUnreadMsgCount();
      }
      setInbox((prev) =>
        prev
          .map((c) => {
            if (c._id !== chatId) return c;
            return {
              ...c,
              lastMessage: message.message || `[${message.messageType.toLowerCase()}]`,
              lastMessageAt: message.createdAt,
              lastMessageSender: message.senderId,
              unreadCount:
                selectedConvo?._id === chatId ? 0 : (c.unreadCount || 0) + 1,
            };
          })
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    const handleMessagesRead = ({ chatId, readBy, readAt }) => {
      if (selectedConvo?._id === chatId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (String(m.senderId?._id || m.senderId) !== String(user._id)) return m;
            const alreadyRead = m.readBy?.some(
              (r) => String(r.userId) === String(readBy)
            );
            if (!alreadyRead)
              return { ...m, readBy: [...(m.readBy || []), { userId: readBy, readAt }] };
            return m;
          })
        );
      }
    };

    const handleChatNotification = (data) => {
      const { chatId, message } = data;
      setInbox((prev) => {
        const exists = prev.some((c) => c._id === chatId);
        if (!exists) {
          handleGetInbox().then((d) => { if (d?.chats) setInbox(d.chats); });
          return prev;
        }
        return prev
          .map((c) => {
            if (c._id !== chatId) return c;
            return {
              ...c,
              lastMessage:
                message.message ||
                (message.messageType === "ATTACHMENT"
                  ? "[Attachment]"
                  : `[${message.messageType.toLowerCase()}]`),
              lastMessageAt: message.createdAt,
              lastMessageSender: message.senderId,
              unreadCount: (c.unreadCount || 0) + 1,
            };
          })
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    socket.emit("get-online-users", (users) => {
      setOnlineUsers(new Set(users));
    });

    const handleUserOnline  = ({ userId }) => setOnlineUsers((p) => new Set([...p, String(userId)]));
    const handleUserOffline = ({ userId }) =>
      setOnlineUsers((p) => { const s = new Set(p); s.delete(String(userId)); return s; });

    socket.on("new-message",       handleNewMessage);
    socket.on("messages-read",     handleMessagesRead);
    socket.on("chat-notification", handleChatNotification);
    socket.on("user-online",       handleUserOnline);
    socket.on("user-offline",      handleUserOffline);

    return () => {
      socket.off("new-message",       handleNewMessage);
      socket.off("messages-read",     handleMessagesRead);
      socket.off("chat-notification", handleChatNotification);
      socket.off("user-online",       handleUserOnline);
      socket.off("user-offline",      handleUserOffline);
    };
  }, [socket, selectedConvo, user]);

  /* ── Room join/leave ── */
  useEffect(() => {
    if (!socket) return;
    const rejoinRoom = () => {
      if (selectedConvo?._id) socket.emit("join-chat", selectedConvo._id);
    };
    if (prevConvoRef.current) socket.emit("leave-chat", prevConvoRef.current);
    if (selectedConvo?._id) {
      socket.emit("join-chat", selectedConvo._id);
      socket.emit("read-messages", { chatId: selectedConvo._id });
      refreshUnreadMsgCount();
      prevConvoRef.current = selectedConvo._id;
    }
    socket.on("connect",   rejoinRoom);
    socket.on("reconnect", rejoinRoom);
    return () => {
      if (selectedConvo?._id) socket.emit("leave-chat", selectedConvo._id);
      socket.off("connect",   rejoinRoom);
      socket.off("reconnect", rejoinRoom);
    };
  }, [socket, selectedConvo?._id, refreshUnreadMsgCount]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Select conversation ── */
  const selectConversation = useCallback(
    async (convoItem) => {
      const other = convoItem.participants?.find(
        (p) => String(p._id) !== String(user._id)
      );
      setSelectedConvo({ ...convoItem, otherUser: other });
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setInbox((prev) =>
        prev.map((c) => (c._id === convoItem._id ? { ...c, unreadCount: 0 } : c))
      );
      const data = await handleGetConversation(convoItem._id, 1, 20);
      if (data?.messages) {
        if (data.messages.length < 20) setHasMore(false);
        setMessages(data.messages);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [user]
  );

  /* ── Infinite scroll ── */
  const handleScroll = async (e) => {
    if (!e.target.scrollTop && hasMore && !loadingMore && selectedConvo) {
      setLoadingMore(true);
      const prevH = e.target.scrollHeight;
      try {
        const nextPage = page + 1;
        const data = await handleGetConversation(selectedConvo._id, nextPage, 20);
        if (data?.messages) {
          if (data.messages.length < 20) setHasMore(false);
          setMessages((prev) => [...data.messages, ...prev]);
          setPage(nextPage);
          requestAnimationFrame(() => {
            if (e.target) e.target.scrollTop = e.target.scrollHeight - prevH;
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  /* ── Search ── */
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }
    setIsSearchingGlobal(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await handleSearchUsers(val);
        if (res?.users) {
          const newUsers = res.users.filter((u) => {
            if (String(u._id) === String(user._id)) return false;
            return !inbox.some((chat) =>
              chat.participants?.some((p) => String(p._id) === String(u._id))
            );
          });
          setGlobalSearchResults(newUsers);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 400);
  };

  /* ── Start direct chat ── */
  const startDirectChat = async (participant) => {
    try {
      const res = await handleCreateDirectChat(participant._id);
      if (res?.chat) {
        setInbox((prev) => {
          if (!prev.find((c) => String(c._id) === String(res.chat._id)))
            return [res.chat, ...prev];
          return prev;
        });
        selectConversation(res.chat);
        setSearchQuery("");
        setGlobalSearchResults([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Send message ── */
  const sendMsg = useCallback(async () => {
    if ((!input.trim() && !attachment) || !selectedConvo || sending) return;
    const content = input.trim();
    const fileToSend = attachment;
    setInput("");
    setAttachment(null);
    setShowEmoji(false);
    setSending(true);
    try {
      let payload;
      if (fileToSend) {
        payload = new FormData();
        payload.append("chatId", selectedConvo._id);
        payload.append("message", content);
        payload.append("messageType", "ATTACHMENT");
        payload.append("attachments", fileToSend);
      } else {
        payload = { chatId: selectedConvo._id, message: content, messageType: "TEXT" };
      }
      const data = await handleSendMessage(payload);
      if (data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(data.message._id))) return prev;
          return [...prev, data.message];
        });
        setInbox((prev) =>
          prev
            .map((c) => {
              if (c._id !== selectedConvo._id) return c;
              return {
                ...c,
                lastMessage:
                  data.message.message || (fileToSend ? "[Attachment]" : "[text]"),
                lastMessageAt: data.message.createdAt,
                lastMessageSender: data.message.senderId,
              };
            })
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        );
      }
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, attachment, selectedConvo, sending]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };

  /* ── Filtered inbox ── */
  const filteredInbox = inbox.filter((c) => {
    const other = c.participants?.find((p) => String(p._id) !== String(user._id));
    const matchSearch =
      !searchQuery ||
      other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.chatType === "GROUP" &&
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTab =
      activeTab === "all" ||
      (activeTab === "direct" && c.chatType !== "GROUP") ||
      (activeTab === "unread" && c.unreadCount > 0);
    return matchSearch && matchTab;
  });

  /* ── Back handler (mobile) ── */
  const handleBack = () => setSelectedConvo(null);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div className="msg-page">
        {/* Inbox */}
        <InboxPanel
          className={`inbox-panel${selectedConvo ? " hidden" : ""}`}
          inbox={filteredInbox}
          selectedConvo={selectedConvo}
          onSelect={selectConversation}
          onlineUsers={onlineUsers}
          currentUser={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearch={handleSearchChange}
          globalSearchResults={globalSearchResults}
          isSearchingGlobal={isSearchingGlobal}
          onStartDirectChat={startDirectChat}
          onCreateGroup={() => setShowCreateGroup(true)}
        />

        {/* Chat window */}
        <div className={`chat-window${selectedConvo ? " visible" : ""}`}>
          {selectedConvo ? (
            <ChatWindow
              chat={selectedConvo}
              messages={messages}
              currentUser={user}
              otherUser={selectedConvo.otherUser}
              isOnline={onlineUsers.has(String(selectedConvo.otherUser?._id))}
              input={input}
              onInputChange={setInput}
              onSend={sendMsg}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              sending={sending}
              attachment={attachment}
              setAttachment={setAttachment}
              showEmoji={showEmoji}
              setShowEmoji={setShowEmoji}
              onBack={handleBack}
              onScroll={handleScroll}
              loadingMore={loadingMore}
              onManageGroup={() => setShowManageGroup(true)}
              startCall={startCall}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          currentUser={user}
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(chat) => {
            setInbox((p) => [chat, ...p]);
            selectConversation(chat);
          }}
        />
      )}

      {showManageGroup && selectedConvo?.chatType === "GROUP" && (
        <ManageGroupModal
          chat={selectedConvo}
          currentUser={user}
          onClose={() => setShowManageGroup(false)}
          onUpdate={(updatedChat) => {
            setSelectedConvo({ ...updatedChat, otherUser: selectedConvo.otherUser });
            setInbox((p) =>
              p.map((c) => (c._id === updatedChat._id ? updatedChat : c))
            );
          }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   InboxPanel
   ════════════════════════════════════════════════════════════════════════ */
function InboxPanel({
  inbox, selectedConvo, onSelect, onlineUsers, currentUser,
  activeTab, onTabChange, searchQuery, onSearch, globalSearchResults,
  isSearchingGlobal, onStartDirectChat, onCreateGroup, className,
}) {
  return (
    <div
      className={className}
      style={{
        width: 300, minWidth: 300,
        display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--clr-border)",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid var(--clr-border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.02em" }}>
            Messages
          </span>
          <button
            onClick={onCreateGroup}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              background: "var(--acc-dim, rgba(99,102,241,0.10))",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "var(--acc, #6366f1)",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Group
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--txt3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 11, pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="si-msg"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex",
        padding: "0 12px",
        borderBottom: "1px solid var(--bd)",
        flexShrink: 0,
      }}>
        {["all", "direct", "unread"].map((t) => (
          <button
            key={t}
            className={`tab-btn ${activeTab === t ? "on" : ""}`}
            onClick={() => onTabChange(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Conversation List ── */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {!searchQuery && inbox.length === 0 && (
          <div style={{ padding: 36, textAlign: "center", fontSize: 13, color: "var(--txt3)" }}>
            No conversations yet
          </div>
        )}

        {searchQuery && inbox.length > 0 && (
          <SectionLabel>Conversations</SectionLabel>
        )}

        {inbox.map((c) => {
          const isGroup = c.chatType === "GROUP";
          const other = c.participants?.find(
            (p) => String(p._id) !== String(currentUser._id)
          );
          const isOnline = !isGroup && onlineUsers.has(String(other?._id));
          const isSelected = selectedConvo?._id === c._id;
          const isUnread = c.unreadCount > 0;
          const displayName = isGroup ? c.name : other?.name;
          const rc = getRoleColor(isGroup ? "GROUP" : other?.role);

          let preview = c.lastMessage || "";
          if (!preview && c.lastMessageSender) preview = "Sent a message";

          const isMyPreview =
            String(c.lastMessageSender?._id || c.lastMessageSender) ===
            String(currentUser._id);

          return (
            <div
              key={c._id}
              className={`ci ${isSelected ? "sel" : ""}`}
              onClick={() => onSelect(c)}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar name={displayName} rc={rc} size={38} />
                {isOnline && <OnlineDot />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: "var(--txt)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    display: "flex", alignItems: "center", gap: 5,
                    maxWidth: "calc(100% - 52px)",
                  }}>
                    {isGroup && <GroupIcon />}
                    {displayName}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--txt3)", flexShrink: 0, marginLeft: 6 }}>
                    {formatTime(c.lastMessageAt)}
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: isUnread ? "var(--txt2)" : "var(--txt3)",
                  fontWeight: isUnread ? 500 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {isMyPreview && preview ? "You: " : ""}
                  {preview || <span style={{ fontStyle: "italic" }}>No messages yet</span>}
                </div>
                <span
                  className="role-badge"
                  style={
                    isGroup
                      ? { background: "var(--acc-dim)", color: "var(--acc, #6366f1)", border: "1px solid rgba(99,102,241,0.3)" }
                      : { background: "var(--bg3)", color: "var(--txt3)", border: "1px solid var(--bd)" }
                  }
                >
                  {isGroup ? "Group" : (other?.role || "Employee")}
                </span>
              </div>

              {/* Unread badge */}
              {isUnread && (
                <span style={{
                  background: "#ef4444", color: "#fff",
                  fontSize: 10, borderRadius: 9, padding: "2px 6px",
                  fontWeight: 700, flexShrink: 0, alignSelf: "center",
                }}>
                  {c.unreadCount > 9 ? "9+" : c.unreadCount}
                </span>
              )}
            </div>
          );
        })}

        {/* Global search results */}
        {searchQuery && (
          <>
            <SectionLabel style={{ marginTop: 8, borderTop: inbox.length ? "1px solid var(--bd)" : "none" }}>
              Global Search
            </SectionLabel>
            {isSearchingGlobal ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--txt3)" }}>
                Searching…
              </div>
            ) : globalSearchResults.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--txt3)" }}>
                No new users found
              </div>
            ) : (
              globalSearchResults.map((u) => {
                const rc = getRoleColor(u.role);
                const online = onlineUsers.has(String(u._id));
                return (
                  <div key={u._id} className="ci" onClick={() => onStartDirectChat(u)}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar name={u.name} rc={rc} size={38} />
                      {online && <OnlineDot />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 2 }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--txt3)", marginBottom: 2 }}>{u.email}</div>
                      <span className="role-badge" style={{ background: "var(--bg3)", color: "var(--txt3)", border: "1px solid var(--bd)" }}>
                        {u.role}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc,#6366f1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, alignSelf: "center" }}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ChatWindow
   ════════════════════════════════════════════════════════════════════════ */
function ChatWindow({
  chat, messages, currentUser, otherUser, isOnline, input,
  onInputChange, onSend, onKeyDown, inputRef, messagesEndRef, sending,
  attachment, setAttachment, showEmoji, setShowEmoji, onBack, onScroll,
  loadingMore, onManageGroup, startCall,
}) {
  const isGroup = chat?.chatType === "GROUP";
  const displayName = isGroup ? chat.name : otherUser?.name;
  const rc = getRoleColor(isGroup ? "GROUP" : otherUser?.role);
  const fileInputRef = useRef(null);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
      {/* ── Header ── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--bd)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--bg)", flexShrink: 0,
      }}>
        {/* Back (always rendered, hidden on desktop via CSS) */}
        <button
          onClick={onBack}
          className="hdr-action-btn back-btn-mobile"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar name={displayName} rc={rc} size={40} />
          {isOnline && !isGroup && <OnlineDot />}
        </div>

        {/* Name & status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: "var(--txt)", letterSpacing: "-0.01em",
            display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {isGroup && <GroupIcon />}
            {displayName}
          </div>
          <div style={{
            fontSize: 11, marginTop: 1,
            color: isOnline && !isGroup ? "#22c55e" : "var(--txt3)",
          }}>
            {isGroup
              ? `${chat.participants?.length || 0} members`
              : <>{isOnline ? "Online" : "Offline"} · {otherUser?.role} · {otherUser?.department || "General"}</>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            className="hdr-action-btn"
            title="Voice call"
            onClick={() => {
              const targets = isGroup
                ? chat.participants.filter((p) => String(p._id || p) !== String(currentUser._id)).slice(0, 4)
                : [otherUser];
              startCall(targets, true);
            }}
          >
            <PhoneIcon />
          </button>
          <button
            className="hdr-action-btn"
            title={isGroup ? "Manage group" : "More options"}
            onClick={isGroup ? onManageGroup : undefined}
          >
            <DotsIcon />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="msg-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
        onScroll={onScroll}
      >
        {loadingMore && (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--txt3)", padding: "6px 0" }}>
            Loading older messages…
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = String(msg.senderId?._id || msg.senderId) === String(currentUser._id);
          const prevMsg = messages[i - 1];
          const sameSender =
            prevMsg &&
            String(prevMsg.senderId?._id || prevMsg.senderId) ===
              String(msg.senderId?._id || msg.senderId);

          // Show a day separator when the date changes between messages
          let showDaySep = false;
          if (i === 0) {
            showDaySep = true;
          } else if (prevMsg) {
            const prevDate = new Date(prevMsg.createdAt).toDateString();
            const curDate = new Date(msg.createdAt).toDateString();
            showDaySep = prevDate !== curDate;
          }

          return (
            <React.Fragment key={msg._id || i}>
              {showDaySep && <DaySeparator label={formatDayLabel(msg.createdAt)} />}
              <MessageRow
                msg={msg}
                isMe={isMe}
                sameSender={showDaySep ? false : sameSender}
                otherUser={msg.senderId}
                currentUser={currentUser}
                isGroup={isGroup}
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--bd)",
        background: "var(--bg)",
        flexShrink: 0,
        position: "relative",
      }}>
        {/* Emoji picker */}
        {showEmoji && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 6px)", right: 14,
            zIndex: 10, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", borderRadius: 14,
          }}>
            <EmojiPicker
              theme="auto"
              onEmojiClick={(emojiData) => onInputChange(input + emojiData.emoji)}
            />
          </div>
        )}

        {/* Attachment preview */}
        {attachment && (
          <div className="attach-preview">
            <PaperclipIcon />
            <span style={{
              fontSize: 12, color: "var(--txt)",
              maxWidth: 200, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {attachment.name}
            </span>
            <button
              onClick={() => setAttachment(null)}
              style={{
                background: "transparent", border: "none",
                color: "var(--txt3)", cursor: "pointer",
                display: "flex", alignItems: "center", padding: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) setAttachment(e.target.files[0]);
              e.target.value = null;
            }}
          />
          <button
            className="ft-icon-btn"
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon />
          </button>

          <input
            ref={inputRef}
            className="msg-in-chat"
            placeholder={`Message ${otherUser?.name?.split(" ")[0] || "them"}…`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            autoComplete="off"
          />

          <button
            className="ft-icon-btn"
            aria-label="Emoji"
            onClick={() => setShowEmoji((p) => !p)}
          >
            <EmojiIcon />
          </button>

          <button
            onClick={onSend}
            disabled={(!input.trim() && !attachment) || sending}
            className={`send-btn ${input.trim() || attachment ? "active" : "inactive"}`}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MessageRow
   ════════════════════════════════════════════════════════════════════════ */
function MessageRow({ msg, isMe, sameSender, otherUser, currentUser, isGroup }) {
  const rc = getRoleColor(isMe ? currentUser?.role : otherUser?.role);
  const isTicketRef = msg.messageType === "TICKET_REF";
  const isRead = msg.readBy?.some(
    (r) => String(r.userId) !== String(currentUser._id)
  );

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-end",
      flexDirection: isMe ? "row-reverse" : "row",
      marginTop: sameSender ? -4 : 0,
    }}>
      {/* Avatar */}
      <div style={{ width: 26, height: 26, flexShrink: 0, marginBottom: 2 }}>
        {!isMe && !sameSender && (
          <div style={{ position: "relative" }}>
            <Avatar name={otherUser?.name} rc={rc} size={26} fontSize={9} />
            {isGroup && (
              <div style={{
                position: "absolute", top: -18, left: 0,
                fontSize: 10, color: "var(--txt3)",
                whiteSpace: "nowrap", pointerEvents: "none",
                fontWeight: 600,
              }}>
                {otherUser?.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 3,
        maxWidth: "70%", alignItems: isMe ? "flex-end" : "flex-start",
      }}>
        {isTicketRef ? (
          <TicketBubble ticket={msg.ticketRef} />
        ) : (
          <div style={{
            padding: "9px 13px",
            borderRadius: isMe
              ? `14px 14px ${sameSender ? "14px" : "4px"} 14px`
              : `14px 14px 14px ${sameSender ? "14px" : "4px"}`,
            fontSize: 13, lineHeight: 1.55, wordBreak: "break-word",
            background: isMe ? "#6366f1" : "var(--bubble-other, var(--bg3))",
            color: isMe ? "#fff" : "var(--txt)",
            boxShadow: isMe
              ? "0 2px 10px rgba(99,102,241,0.25)"
              : "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {msg.message}
            {msg.attachments?.length > 0 && (
              <div style={{ marginTop: msg.message ? 8 : 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {msg.attachments.map((att, idx) => (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 10px",
                    background: isMe ? "rgba(255,255,255,0.15)" : "var(--bg)",
                    borderRadius: 8,
                    border: isMe ? "none" : "1px solid var(--bd)",
                  }}>
                    <PaperclipIcon />
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}${att.fileUrl}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: "inherit", textDecoration: "underline", fontSize: 12, wordBreak: "break-all" }}
                    >
                      {att.fileName}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time + read receipt */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
          <span style={{ fontSize: 10, color: "var(--txt3)" }}>{formatTime(msg.createdAt)}</span>
          {isMe && isRead && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12l5 5L17 5M7 12l5 5L22 5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Small reusable components
   ════════════════════════════════════════════════════════════════════════ */
function Avatar({ name, rc, size = 36, fontSize }) {
  const fs = fontSize || Math.max(9, Math.round(size * 0.32));
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: rc.bg, color: rc.fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: fs, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

function OnlineDot() {
  return (
    <div style={{
      position: "absolute", bottom: 1, right: 1,
      width: 9, height: 9, borderRadius: "50%",
      background: "#22c55e", border: "2px solid var(--bg)",
    }} />
  );
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      padding: "8px 14px",
      fontSize: 10, fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--txt3)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function TicketBubble({ ticket }) {
  return (
    <div style={{
      background: "var(--bg3)", border: "1px solid var(--bd)",
      borderRadius: 10, padding: "9px 12px", maxWidth: 240, cursor: "pointer",
    }}>
      <div style={{ fontSize: 10, color: "var(--txt3)", marginBottom: 4 }}>Referenced ticket</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>{ticket?.title}</div>
      <span style={{
        fontSize: 10, padding: "2px 7px", borderRadius: 5,
        background: "var(--acc-dim)", color: "var(--nav-active-txt, #6366f1)",
        display: "inline-block", fontWeight: 600,
      }}>
        {ticket?.ticketId} · {ticket?.status}
      </span>
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div style={{
      textAlign: "center", fontSize: 11, color: "var(--txt3)",
      display: "flex", alignItems: "center", gap: 8, margin: "4px 0",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
      {label}
      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state-wrap">
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "var(--acc-dim, rgba(99,102,241,0.10))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="var(--acc, #6366f1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--txt2)" }}>
        Select a conversation
      </div>
      <div style={{ fontSize: 13, color: "var(--txt3)", textAlign: "center", maxWidth: 240 }}>
        Pick someone from the inbox to start chatting, or create a group.
      </div>
    </div>
  );
}

/* ── Icons ── */
const GroupIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--txt3)", flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 12 19.79 19.79 0 0 1 1.89 3.37 2 2 0 0 1 3.86 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const PaperclipIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47" />
  </svg>
);
const EmojiIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);