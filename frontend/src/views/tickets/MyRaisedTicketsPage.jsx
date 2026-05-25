import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { handleGetMyRaisedTickets } from "../../controllers/ticketController";
import TicketDetailPanel, { StatusBadge, PriorityBadge } from "../../components/tickets/TicketDetailPanel";
import { TicketProvider } from "../../context/TicketContext";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IcTicket = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
    <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V8z" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IcX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IcArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IcArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IcUser = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const IcCalendar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const STATUS_OPTIONS = ["ALL", "OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];
const PRIORITY_OPTIONS = ["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"];

const STATUS_META = {
  OPEN: { color: "#3b82f6" },
  ASSIGNED: { color: "#8b5cf6" },
  IN_PROGRESS: { color: "#ca8a04" },
  RESOLVED: { color: "#16a34a" },
  CLOSED: { color: "#6b7280" },
  REOPENED: { color: "#f97316" },
};

function MyRaisedTicketsPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [initialTab, setInitialTab] = useState("details");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Mobile detail panel state
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const fetchTickets = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await handleGetMyRaisedTickets();
      setTickets(data?.tickets || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.selectedTicketId) {
      setSelectedTicketId(location.state.selectedTicketId);
      if (location.state.activeTab) setInitialTab(location.state.activeTab);
      setMobilePanelOpen(true);
    }
  }, [location.state]);

  const handleSelectTicket = (ticketId) => {
    const next = selectedTicketId === ticketId ? null : ticketId;
    setSelectedTicketId(next);
    setMobilePanelOpen(!!next);
  };

  const handleClosePanel = () => {
    setSelectedTicketId(null);
    setMobilePanelOpen(false);
  };

  const filteredTickets = useMemo(() => tickets.filter(t => {
    const sMatch = statusFilter === "ALL" || t.status?.toUpperCase() === statusFilter;
    const pMatch = priorityFilter === "ALL" || t.priority?.toUpperCase() === priorityFilter;
    return sMatch && pMatch;
  }), [tickets, statusFilter, priorityFilter]);

  const hasFilters = statusFilter !== "ALL" || priorityFilter !== "ALL";

  const statusCounts = useMemo(() => tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {}), [tickets]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", fontSize: 13, color: "var(--tk-text3)", fontFamily: "inherit" }}>
      <span style={{ width: 18, height: 18, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "tk-spin 0.8s linear infinite", display: "inline-block" }} />
      Loading tickets…
    </div>
  );
  if (error) return <div style={{ padding: 24, textAlign: "center", color: "#ef4444", fontSize: 13 }}>{error}</div>;

  return (
    <>
      <style>{`
        @keyframes tk-spin   { to { transform: rotate(360deg); } }
        @keyframes tk-fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tk-panelIn{ from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes tk-slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }

        [data-theme="dark"] {
          --tk-bg:          #0d0d11; --tk-card:        #13131a;
          --tk-border:      rgba(255,255,255,0.07); --tk-row-hover:   rgba(255,255,255,0.03);
          --tk-row-border:  rgba(255,255,255,0.04); --tk-row-sel-bg:  rgba(99,102,241,0.07);
          --tk-row-sel-pip: #6366f1; --tk-header-bg:   rgba(255,255,255,0.025);
          --tk-text:        #e8e8f0; --tk-text2:       #9898b8; --tk-text3:       #50506a;
          --tk-input-bg:    rgba(255,255,255,0.05); --tk-input-border:rgba(255,255,255,0.1);
          --tk-select-bg:   rgba(255,255,255,0.05); --tk-pill-bg:     rgba(255,255,255,0.05);
          --tk-pill-border: rgba(255,255,255,0.08); --tk-empty-border: rgba(255,255,255,0.05);
        }
        [data-theme="light"] {
          --tk-bg:          #f7f7fb; --tk-card:        #ffffff;
          --tk-border:      #e5e7eb; --tk-row-hover:   #fafafa;
          --tk-row-border:  #f5f5f8; --tk-row-sel-bg:  rgba(99,102,241,0.05);
          --tk-row-sel-pip: #6366f1; --tk-header-bg:   #f9fafb;
          --tk-text:        #111827; --tk-text2:       #4b5563; --tk-text3:       #9ca3af;
          --tk-input-bg:    #ffffff; --tk-input-border:#e5e7eb;
          --tk-select-bg:   #ffffff; --tk-pill-bg:     #f3f4f6;
          --tk-pill-border: #e5e7eb; --tk-empty-border: #e5e7eb;
        }

        .tk-root { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; }

        .tk-row {
          display: grid; align-items: center;
          border-bottom: 1px solid var(--tk-row-border);
          cursor: pointer; transition: background 0.12s;
          border-left: 3px solid transparent;
        }
        .tk-row:last-child { border-bottom: none; }
        .tk-row:hover { background: var(--tk-row-hover); }
        .tk-row.sel { background: var(--tk-row-sel-bg) !important; border-left-color: var(--tk-row-sel-pip) !important; }

        /* Mobile card rows */
        .tk-card-row {
          padding: 13px 14px;
          border-bottom: 1px solid var(--tk-row-border);
          cursor: pointer; transition: background 0.12s;
          border-left: 3px solid transparent;
          display: flex; flex-direction: column; gap: 6px;
        }
        .tk-card-row:last-child { border-bottom: none; }
        .tk-card-row:hover { background: var(--tk-row-hover); }
        .tk-card-row.sel { background: var(--tk-row-sel-bg) !important; border-left-color: var(--tk-row-sel-pip) !important; }

        .tk-select {
          height: 34px; padding: 0 28px 0 10px; border-radius: 8px;
          border: 1px solid var(--tk-input-border); background: var(--tk-select-bg);
          color: var(--tk-text); font-size: 12px; font-family: inherit;
          outline: none; cursor: pointer; appearance: none; min-width: 130px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tk-select:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .tk-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 36px; border-radius: 9px; border: none;
          background: #6366f1; color: #fff;
          font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3); transition: all 0.15s; white-space: nowrap;
        }
        .tk-btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
        .tk-btn-ghost {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0 12px; height: 34px; border-radius: 8px;
          border: 1px solid var(--tk-pill-border);
          background: var(--tk-pill-bg); color: var(--tk-text2);
          font-size: 12px; font-weight: 500; font-family: inherit; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .tk-btn-ghost:hover { border-color: rgba(99,102,241,0.3); color: #6366f1; }
        .tk-status-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 0 10px; height: 30px; border-radius: 99px;
          border: 1px solid var(--tk-pill-border);
          background: var(--tk-pill-bg); color: var(--tk-text3);
          font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .tk-status-pill:hover { color: var(--tk-text2); }
        .tk-col-label {
          font-size: 9.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.09em; color: var(--tk-text3);
        }

        /* Mobile full-screen detail panel */
        .tk-mobile-panel {
          display: none; position: fixed; inset: 0; z-index: 150;
          animation: tk-slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @media (max-width: 1023px) {
          .tk-mobile-panel.open { display: flex; flex-direction: column; }
        }

        .tk-back-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: inherit;
          background: var(--tk-header-bg); border-bottom: 1px solid var(--tk-border);
          color: var(--tk-text2); transition: color 0.15s; flex-shrink: 0;
        }
        .tk-back-btn:hover { color: #6366f1; }

        /* Filter bar: scroll on mobile */
        .tk-filter-bar {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap; margin-bottom: 14px;
        }
        @media (max-width: 640px) {
          .tk-filter-bar { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
          .tk-filter-bar::-webkit-scrollbar { display: none; }
        }

        /* Page header: stack on small screens */
        .tk-page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12; flex-wrap: wrap; margin-bottom: 20px;
        }
        @media (max-width: 480px) {
          .tk-page-header { flex-direction: column; gap: 10px; }
          .tk-page-header .tk-btn-primary { width: 100%; justify-content: center; }
        }

        /* Table vs cards */
        .tk-table-view { display: block; }
        .tk-cards-view  { display: none; }
        @media (max-width: 767px) {
          .tk-table-view { display: none; }
          .tk-cards-view  { display: block; }
        }

        /* Side panel: hidden on tablet/mobile */
        .tk-side-panel { display: flex; flex-shrink: 0; animation: tk-panelIn 0.25s cubic-bezier(0.16,1,0.3,1); }
        @media (max-width: 1023px) { .tk-side-panel { display: none; } }

        .tk-list-pad { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 24px; }
        @media (max-width: 640px) { .tk-list-pad { padding: 16px 14px; } }
      `}</style>

      {/* ── Mobile full-screen detail panel (<1024px) ── */}
      <div className={`tk-mobile-panel ${mobilePanelOpen ? "open" : ""}`}
        style={{ background: "var(--tk-card)" }}>
        <button className="tk-back-btn" onClick={handleClosePanel}>
          <IcArrowLeft /> Back to tickets
        </button>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedTicketId && (
            <TicketProvider ticketId={selectedTicketId}>
              <TicketDetailPanel
                ticketId={selectedTicketId}
                onClose={handleClosePanel}
                currentUser={user}
                onUpdate={() => fetchTickets(false)}
                initialTab={initialTab}
                fullPage
              />
            </TicketProvider>
          )}
        </div>
      </div>

      <div className="tk-root" style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* ── Left: List ── */}
        <div className="tk-list-pad">
          <div style={{ animation: "tk-fadeUp 0.2s ease" }}>

            {/* Page header */}
            <div className="tk-page-header">
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--tk-text)", margin: 0, letterSpacing: "-0.02em" }}>My Raised Tickets</h2>
                <p style={{ fontSize: 13, color: "var(--tk-text3)", margin: "4px 0 0" }}>
                  Tickets you have submitted · {tickets.length} total
                </p>
              </div>
              <button className="tk-btn-primary" onClick={() => navigate("/tickets/raise")}>
                <IcPlus /> Raise Ticket
              </button>
            </div>

            {/* Filters */}
            {tickets.length > 0 && (
              <div className="tk-filter-bar">
                <button className="tk-status-pill" onClick={() => setStatusFilter("ALL")}
                  style={statusFilter === "ALL" ? { background: "#6366f1", color: "#fff", borderColor: "#6366f1" } : {}}>
                  All <span style={{ fontWeight: 800 }}>{tickets.length}</span>
                </button>
                {Object.entries(statusCounts).map(([status, count]) => {
                  const meta = STATUS_META[status] || {};
                  const active = statusFilter === status;
                  return (
                    <button key={status} className="tk-status-pill"
                      onClick={() => setStatusFilter(active ? "ALL" : status)}
                      style={active ? { background: `${meta.color}15`, color: meta.color, borderColor: `${meta.color}35` } : {}}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color || "var(--tk-text3)", flexShrink: 0, display: "inline-block" }} />
                      {status.replace(/_/g, " ")} <span style={{ fontWeight: 800 }}>{count}</span>
                    </button>
                  );
                })}
                <div style={{ width: 1, height: 20, background: "var(--tk-border)", margin: "0 6px", flexShrink: 0 }} />
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <select className="tk-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ height: 30, fontSize: 11, minWidth: 110 }}>
                    <option value="ALL">All Priorities</option>
                    {PRIORITY_OPTIONS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--tk-text3)" }}><IcChevronDown /></span>
                </div>
                {hasFilters && (
                  <button className="tk-btn-ghost"
                    onClick={() => { setStatusFilter("ALL"); setPriorityFilter("ALL"); }}
                    style={{ height: 30, fontSize: 11, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", flexShrink: 0 }}>
                    <IcX /> Reset
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {filteredTickets.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "60px 24px", textAlign: "center",
                background: "var(--tk-card)", borderRadius: 16,
                border: "1px dashed var(--tk-empty-border)",
              }}>
                <IcTicket />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--tk-text2)", margin: 0 }}>
                  {hasFilters ? "No tickets match your filters" : "You haven't raised any tickets yet"}
                </p>
                <p style={{ fontSize: 13, color: "var(--tk-text3)", margin: 0 }}>
                  {hasFilters ? "Try adjusting or resetting the filters above." : "Raise a ticket to track issues and requests."}
                </p>
                {!hasFilters && (
                  <button className="tk-btn-primary" style={{ marginTop: 4 }} onClick={() => navigate("/tickets/raise")}>
                    <IcPlus /> Raise your first ticket
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── Desktop Table ── */}
                <div className="tk-table-view">
                  <div style={{ background: "var(--tk-card)", borderRadius: 14, border: "1px solid var(--tk-border)", overflow: "hidden" }}>
                    <div className="tk-row" style={{
                      gridTemplateColumns: selectedTicketId ? "120px 1fr 110px 90px 80px" : "140px 1fr 110px 90px 150px 80px",
                      padding: "10px 18px 10px 21px", background: "var(--tk-header-bg)",
                      borderBottom: "1px solid var(--tk-border)", cursor: "default", pointerEvents: "none", gap: 12,
                    }}>
                      <span className="tk-col-label">Ticket ID</span>
                      <span className="tk-col-label">Title</span>
                      <span className="tk-col-label">Status</span>
                      <span className="tk-col-label">Priority</span>
                      {!selectedTicketId && <span className="tk-col-label">Assigned To</span>}
                      <span className="tk-col-label">Date</span>
                    </div>
                    {filteredTickets.map((t, i) => {
                      const isSelected = selectedTicketId === t.ticketId;
                      const assignedNames = Array.isArray(t.assignedTo) && t.assignedTo.length > 0
                        ? t.assignedTo.map(u => u.name || u).join(", ") : null;
                      return (
                        <div key={t._id}
                          className={`tk-row${isSelected ? " sel" : ""}`}
                          onClick={() => handleSelectTicket(t.ticketId)}
                          style={{
                            gridTemplateColumns: selectedTicketId ? "120px 1fr 110px 90px 80px" : "140px 1fr 110px 90px 150px 80px",
                            gap: 12, padding: "13px 18px 13px 18px", animationDelay: `${i * 0.03}s`,
                          }}>
                          <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#6366f1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.ticketId}</span>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{t.title}</span>
                            {t.category && <span style={{ fontSize: 10, color: "var(--tk-text3)", display: "block", marginTop: 1 }}>{t.category}</span>}
                          </div>
                          <span><StatusBadge value={t.status} /></span>
                          <span><PriorityBadge value={t.priority} /></span>
                          {!selectedTicketId && (
                            <span style={{ minWidth: 0 }}>
                              {assignedNames
                                ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--tk-text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}><IcUser /> {assignedNames}</span>
                                : <span style={{ fontSize: 12, color: "var(--tk-text3)", fontStyle: "italic" }}>Unassigned</span>}
                            </span>
                          )}
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--tk-text3)" }}>
                              <IcCalendar />{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span style={{ color: "var(--tk-text3)", opacity: isSelected ? 1 : 0, transition: "opacity 0.15s" }}><IcArrowRight /></span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Mobile Card List ── */}
                <div className="tk-cards-view">
                  <div style={{ background: "var(--tk-card)", borderRadius: 14, border: "1px solid var(--tk-border)", overflow: "hidden" }}>
                    {filteredTickets.map((t) => {
                      const isSelected = selectedTicketId === t.ticketId;
                      const assignedNames = Array.isArray(t.assignedTo) && t.assignedTo.length > 0
                        ? t.assignedTo.map(u => u.name || u).join(", ") : null;
                      return (
                        <div key={t._id}
                          className={`tk-card-row${isSelected ? " sel" : ""}`}
                          onClick={() => handleSelectTicket(t.ticketId)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#6366f1" }}>{t.ticketId}</span>
                            <StatusBadge value={t.status} />
                            <PriorityBadge value={t.priority} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-text)", lineHeight: 1.35 }}>{t.title}</div>
                          {t.category && <div style={{ fontSize: 11, color: "var(--tk-text3)" }}>{t.category}</div>}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            {assignedNames
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--tk-text2)" }}><IcUser />{assignedNames}</span>
                              : <span style={{ fontSize: 11, color: "var(--tk-text3)", fontStyle: "italic" }}>Unassigned</span>
                            }
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--tk-text3)" }}>
                              <IcCalendar />{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span style={{ marginLeft: "auto", color: "var(--tk-text3)" }}><IcArrowRight /></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Detail Panel (desktop ≥1024px only) ── */}
        {selectedTicketId && (
          <div className="tk-side-panel">
            <TicketProvider ticketId={selectedTicketId}>
              <TicketDetailPanel
                ticketId={selectedTicketId}
                onClose={handleClosePanel}
                currentUser={user}
                onUpdate={() => fetchTickets(false)}
                initialTab={initialTab}
              />
            </TicketProvider>
          </div>
        )}
      </div>
    </>
  );
}

export default MyRaisedTicketsPage;