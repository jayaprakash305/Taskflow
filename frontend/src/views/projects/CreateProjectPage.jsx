import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleCreateProject } from "../../controllers/projectController";
import MentionTagInput from "../../components/common/MentionTagInput";

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-input-border bg-input-bg text-text text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text3";
const labelCls =
  "block text-xs font-semibold text-text2 mb-1.5 uppercase tracking-wide";

function CreateProjectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [managerId, setManagerId] = useState([]); // single manager
  const [leadId, setLeadId] = useState([]); // single lead
  const [members, setMembers] = useState([]); // memberIds via MentionTagInput
  const [attachments, setAttachments] = useState([]); // { type, name, data, id }
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* ── Attachments ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      type: "file",
      name: file.name,
      data: file,
      id: Math.random().toString(36).substr(2, 9),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = null;
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        type: "link",
        name: linkUrl.trim(),
        data: linkUrl.trim(),
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  /* ── Submit ── */
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      if (form.dueDate) formData.append("dueDate", form.dueDate);

      // managerId
      if (managerId.length > 0) {
        formData.append("managerId", managerId[0]._id);
      }

      // leadId
      if (leadId.length > 0) {
        formData.append("leadId", leadId[0]._id);
      }

      // memberIds — multiple users
      members.forEach((u) => formData.append("memberIds", u._id));

      // File attachments
      attachments
        .filter((a) => a.type === "file")
        .forEach((a) => formData.append("attachments", a.data));

      // Link attachments
      const links = attachments
        .filter((a) => a.type === "link")
        .map((a) => ({ fileName: a.name, fileUrl: a.data, fileType: "link" }));
      if (links.length > 0) formData.append("links", JSON.stringify(links));

      console.log("Submitting Project FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const data = await handleCreateProject(formData);
      setSuccess(data?.message || "Project created successfully!");
      setForm({
        title: "",
        description: "",
        dueDate: "",
      });
      setManagerId([]);
      setLeadId([]);
      setMembers([]);
      setAttachments([]);

      if (data?.project?.projectId) {
        setTimeout(() => navigate(`/projects/${data.project.projectId}`), 800);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text">Create Project</h2>
        <p className="text-sm text-text3 mt-1">
          Set up a new project and assign your team
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-2xl rounded-2xl border border-card-border bg-card p-4 sm:p-6 shadow-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">

          {/* Title */}
          <div>
            <label className={labelCls}>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className={inputCls}
              placeholder="e.g. Website Redesign"
              required
            />
          </div>

          {/* Description + Attachment Toolbar */}
          <div>
            <label className={labelCls}>Description</label>
            <div className="group relative flex flex-col w-full rounded-lg border border-input-border bg-input-bg transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={5}
                className="w-full px-3 py-2.5 bg-transparent text-text text-sm outline-none placeholder:text-text3 resize-none"
                placeholder="Describe the project goals, scope, and deliverables..."
                required
              />

              {/* Toolbar */}
              <div className="flex items-center gap-2 p-2 border-t border-input-border/50 bg-card/30 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text3 hover:text-accent transition-colors"
                  title="Attach Files"
                >
                  <span className="text-lg">📎</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkInput((v) => !v)}
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text3 hover:text-accent transition-colors"
                  title="Add Link"
                >
                  <span className="text-lg">🔗</span>
                </button>

                {showLinkInput && (
                  <div className="flex items-center gap-2 ml-2 flex-1 animate-slide-in-left">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Paste your URL here..."
                      className="flex-1 h-7 px-2 text-xs rounded border border-input-border bg-card outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={addLink}
                      className="h-7 px-3 bg-accent text-white text-xs font-semibold rounded hover:bg-accent-hover transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Attachment Chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-accent/5 border border-accent/20 text-text text-[11px] font-medium"
                  >
                    <span>{a.type === "file" ? "📄" : "🔗"}</span>
                    <span className="max-w-[150px] truncate">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="ml-1 hover:text-danger hover:scale-110 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manager Assignment */}
          <MentionTagInput
            value={managerId}
            onChange={(val) => setManagerId(val.slice(-1))}
            label="Project Manager"
            filterRole="MANAGER"
            filterByTeam={true}
          />

          {/* Lead Assignment */}
          <MentionTagInput
            value={leadId}
            onChange={(val) => setLeadId(val.slice(-1))}
            label="Project Lead"
            filterRole="LEAD"
            filterByTeam={true}
          />

          {/* Team Members */}
          <MentionTagInput
            value={members}
            onChange={setMembers}
            label="Team Members"
            filterRole="EMPLOYEE"
            filterByTeam={true}
          />



          {/* Due Date */}
          <div>
            <label className={labelCls}>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={onChange}
              className={inputCls}
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-11 px-8 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent to-accent-hover shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "✨ Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectPage;