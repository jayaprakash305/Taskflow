// ── MyAssignedProjectsPage.jsx ───────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleGetMyAssignedProjects } from "../../controllers/projectController";

const PRIORITY_META = {
  URGENT: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", dot: "#ef4444" },
  HIGH:   { bg: "rgba(249,115,22,0.1)", text: "#f97316", dot: "#f97316" },
  MEDIUM: { bg: "rgba(234,179,8,0.1)",  text: "#ca8a04", dot: "#eab308" },
  LOW:    { bg: "rgba(34,197,94,0.1)",  text: "#16a34a", dot: "#22c55e" },
};
const STATUS_META = {
  OPEN:        { bg: "rgba(59,130,246,0.1)",  text: "#3b82f6",  dot: "#3b82f6" },
  IN_PROGRESS: { bg: "rgba(234,179,8,0.1)",   text: "#ca8a04",  dot: "#eab308" },
  ON_HOLD:     { bg: "rgba(107,114,128,0.1)", text: "#6b7280",  dot: "#9ca3af" },
  COMPLETED:   { bg: "rgba(34,197,94,0.1)",   text: "#16a34a",  dot: "#22c55e" },
  REOPENED:    { bg: "rgba(249,115,22,0.1)",  text: "#f97316",  dot: "#f97316" },
  CANCELLED:   { bg: "rgba(239,68,68,0.1)",   text: "#ef4444",  dot: "#ef4444" },
};

function Badge({ meta, value }) {
  if (!meta) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 6,
      background: meta.bg, color: meta.text,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
      {value?.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ value }) { return <Badge meta={PRIORITY_META[value] || PRIORITY_META.MEDIUM} value={value} />; }
function StatusBadge({ value }) {
  const key = value?.toUpperCase().replace(/ /g, "_");
  return <Badge meta={STATUS_META[key] || { bg: "rgba(107,114,128,0.1)", text: "#6b7280", dot: "#9ca3af" }} value={value} />;
}

const IcFolder = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </svg>
);

const SHARED_STYLES = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  [data-theme="dark"] {
    --pl-bg: #0d0d11; --pl-card: #13131a; --pl-border: rgba(255,255,255,0.07);
    --pl-text: #e8e8f0; --pl-text2: #a8a8c0; --pl-text3: #55556a;
    --pl-header-bg: rgba(255,255,255,0.03); --pl-row-hover: rgba(255,255,255,0.03);
    --pl-row-border: rgba(255,255,255,0.04);
  }
  [data-theme="light"] {
    --pl-bg: #f7f7fb; --pl-card: #ffffff; --pl-border: #e5e7eb;
    --pl-text: #111827; --pl-text2: #4b5563; --pl-text3: #9ca3af;
    --pl-header-bg: #f9fafb; --pl-row-hover: #f9fafb; --pl-row-border: #f3f4f6;
  }
  .pl-root { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; padding: 16px; animation: fadeUp 0.2s ease; }
  @media (min-width: 640px) { .pl-root { padding: 20px; } }
  @media (min-width: 1024px) { .pl-root { padding: 24px; } }
  .pl-card { background: var(--pl-card); border: 1px solid var(--pl-border); border-radius: 14px; overflow: hidden; }
  .pl-table-header {
    display: grid; gap: 12px; padding: 10px 16px;
    background: var(--pl-header-bg); border-bottom: 1px solid var(--pl-border);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--pl-text3);
    grid-template-columns: 130px 1fr 140px 90px;
  }
  .pl-table-row {
    display: grid; gap: 12px; padding: 13px 16px; align-items: center;
    border-bottom: 1px solid var(--pl-row-border); cursor: pointer;
    transition: background 0.12s; font-size: 13px;
    grid-template-columns: 130px 1fr 140px 90px;
  }
  .pl-table-row:last-child { border-bottom: none; }
  .pl-table-row:hover { background: var(--pl-row-hover); }
  .pl-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 64px 24px; text-align: center; gap: 12px;
  }
  .pl-btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 0 16px; height: 36px; border-radius: 9px; border: none;
    background: #6366f1; color: #fff;
    font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
    transition: all 0.15s;
  }
  .pl-btn-primary:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }

  /* Tablet: hide Created By column */
  @media (max-width: 1023px) {
    .pl-table-header, .pl-table-row {
      grid-template-columns: 120px 1fr 90px;
    }
    .pl-col-creator { display: none; }
  }

  /* Mobile: hide table, show cards */
  .pl-card-view { display: none; }
  @media (max-width: 767px) {
    .pl-table-wrap { display: none; }
    .pl-card-view { display: flex; flex-direction: column; gap: 10px; }
  }
`;

export function MyAssignedProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await handleGetMyAssignedProjects();
        setProjects(data?.projects || []);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load");
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", fontSize: 13, color: "var(--pl-text3)", fontFamily: "inherit" }}>
      <span style={{ width: 16, height: 16, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "pd-spin 0.8s linear infinite", display: "inline-block" }} />
      Loading projects…
    </div>
  );
  if (error) return <div style={{ padding: 24, textAlign: "center", color: "#ef4444", fontSize: 13 }}>{error}</div>;

  return (
    <>
      <style>{SHARED_STYLES}</style>
      <div className="pl-root">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--pl-text)", margin: 0, letterSpacing: "-0.02em" }}>My Assigned Projects</h2>
          <p style={{ fontSize: 13, color: "var(--pl-text3)", margin: "4px 0 0" }}>Projects assigned to you</p>
        </div>

        {projects.length === 0 ? (
          <div className="pl-card">
            <div className="pl-empty">
              <IcFolder />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pl-text2)", margin: 0 }}>No projects assigned to you</p>
              <p style={{ fontSize: 13, color: "var(--pl-text3)", margin: 0 }}>Projects assigned to you will appear here.</p>
            </div>
          </div>
        ) : (
          <>
          {/* Desktop / Tablet Table */}
          <div className="pl-card pl-table-wrap">
            <div className="pl-table-header">
              <span>Project ID</span><span>Title</span>
              <span className="pl-col-creator">Created By</span><span>Due Date</span>
            </div>
            {projects.map((p, i) => (
              <div key={p._id} className="pl-table-row" style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => navigate(`/projects/${p.projectId}`)}>
                <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#6366f1" }}>{p.projectId}</span>
                <span style={{ color: "var(--pl-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                <span className="pl-col-creator" style={{ color: "var(--pl-text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.createdBy?.name || "—"}</span>
                <span style={{ color: "var(--pl-text3)", fontSize: 12 }}>
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Mobile Card View */}
          <div className="pl-card-view">
            {projects.map((p) => (
              <div
                key={p._id}
                onClick={() => navigate(`/projects/${p.projectId}`)}
                style={{
                  padding: 16, borderRadius: 12,
                  border: "1px solid var(--pl-border)",
                  background: "var(--pl-card)",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#6366f1", margin: "0 0 4px" }}>{p.projectId}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pl-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {p.createdBy?.name && <span style={{ fontSize: 11, color: "var(--pl-text3)" }}>By: {p.createdBy.name}</span>}
                  <span style={{ fontSize: 11, color: "var(--pl-text3)", marginLeft: "auto" }}>
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </>
  );
}

export default MyAssignedProjectsPage;