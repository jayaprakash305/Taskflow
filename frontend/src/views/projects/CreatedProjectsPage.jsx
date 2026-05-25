// ── CreatedProjectsPage.jsx ──────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleGetMyCreatedProjects } from "../../controllers/projectController";

const PRIORITY_CLASSES = {
  URGENT: "bg-danger-bg text-danger",
  HIGH:   "bg-orange-bg text-orange",
  MEDIUM: "bg-warn-bg text-warn",
  LOW:    "bg-success-bg text-success",
};
const STATUS_CLASSES = {
  OPEN:        "bg-info-bg text-info",
  IN_PROGRESS: "bg-warn-bg text-warn",
  ON_HOLD:     "bg-bg3 text-text3",
  COMPLETED:   "bg-success-bg text-success",
  REOPENED:    "bg-orange-bg text-orange",
  CANCELLED:   "bg-danger-bg text-danger",
};

function PriorityBadge({ value }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${PRIORITY_CLASSES[value] || "bg-warn-bg text-warn"}`}>
      {value}
    </span>
  );
}
function StatusBadge({ value }) {
  const key = value?.toUpperCase().replace(/ /g, "_");
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASSES[key] || "bg-bg3 text-text3"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {value?.replace(/_/g, " ")}
    </span>
  );
}

const RESPONSIVE_CSS = `
  .cp-table-header, .cp-table-row {
    display: grid;
    gap: 16px;
    grid-template-columns: 140px 1fr 130px 90px;
  }
  .cp-card-view { display: none; }
  
  @media (max-width: 1023px) {
    .cp-table-header, .cp-table-row {
      grid-template-columns: 120px 1fr 90px;
    }
    .cp-col-lead { display: none; }
  }
  
  @media (max-width: 767px) {
    .cp-table-wrap { display: none; }
    .cp-card-view { display: flex; flex-direction: column; gap: 10px; }
  }
`;

export function CreatedProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await handleGetMyCreatedProjects();
        setProjects(data?.projects || []);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load");
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-20 text-text3 text-sm">
      <span className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
      Loading projects…
    </div>
  );
  if (error) return <div className="p-6 text-center text-danger text-sm">{error}</div>;

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text">Created Projects</h2>
            <p className="text-sm text-text3 mt-1">Projects you have created and assigned</p>
          </div>
          <button
            onClick={() => navigate("/projects/create")}
            className="h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent-hover shadow hover:shadow-md hover:-translate-y-px transition"
          >
            ⊕ Create Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-card-border bg-card text-center gap-4">
            <span className="text-4xl">📝</span>
            <p className="text-sm text-text3">You haven't created any projects yet.</p>
            <button
              onClick={() => navigate("/projects/create")}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent-hover"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="cp-table-wrap rounded-2xl border border-card-border bg-card overflow-hidden">
              <div className="cp-table-header px-5 py-3 border-b border-border text-[10px] font-semibold uppercase tracking-widest text-text3">
                <span>Project ID</span><span>Title</span><span className="cp-col-lead">Project Lead</span><span>Due Date</span>
              </div>
              {projects.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/projects/${t.projectId}`)}
                  className="cp-table-row px-5 py-3.5 items-center border-b border-border-light last:border-0 cursor-pointer hover:bg-bg-hover transition text-sm"
                >
                  <span className="font-mono text-accent-text font-semibold text-xs">{t.projectId}</span>
                  <span className="text-text font-medium truncate">{t.title}</span>
                  <span className="text-text2 truncate cp-col-lead">{t.leadId?.name || "Unassigned"}</span>
                  <span className="text-text3 text-xs">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Card View */}
            <div className="cp-card-view">
              {projects.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/projects/${t.projectId}`)}
                  className="p-4 rounded-xl border border-card-border bg-card cursor-pointer hover:shadow-md transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-accent-text font-semibold text-[11px] mb-1">{t.projectId}</p>
                      <p className="text-sm font-semibold text-text truncate">{t.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {t.leadId?.name && (
                      <span className="text-[11px] text-text3">Lead: {t.leadId.name}</span>
                    )}
                    <span className="text-[11px] text-text3 ml-auto">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}
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

export default CreatedProjectsPage;
