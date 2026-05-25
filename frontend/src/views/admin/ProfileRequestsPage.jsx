import React, { useState, useEffect } from "react";
import {
  handleGetAllRequests,
  handleApproveRequest,
  handleRejectRequest,
  handleAdminChangePassword,
} from "../../controllers/profileController";

const STATUS_COLORS = {
  PENDING: { bg: "rgba(234,179,8,0.15)", text: "#eab308" },
  APPROVED: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  REJECTED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

const TYPE_COLORS = {
  PASSWORD_CHANGE: { bg: "rgba(99,102,241,0.15)", text: "#818cf8" },
  PROFILE_UPDATE: { bg: "rgba(236,72,153,0.15)", text: "#f472b6" },
};

export default function ProfileRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED, REJECTED
  
  const [activeRequest, setActiveRequest] = useState(null); // request being approved/rejected
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await handleGetAllRequests();
      if (res?.success) {
        setRequests(res.requests);
      }
    } catch (err) {
      showToast("Error loading requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleActionClick = (request, type) => {
    setActiveRequest(request);
    setActionType(type);
    setReviewNote("");
  };

  const submitAction = async () => {
    if (!activeRequest) return;
    setSubmitting(true);
    try {
      let res;
      if (actionType === "APPROVE") {
        res = await handleApproveRequest(activeRequest._id, { reviewNote });
      } else {
        res = await handleRejectRequest(activeRequest._id, { reviewNote });
      }

      if (res?.success) {
        showToast(`Request ${actionType.toLowerCase()}d successfully`);
        setActiveRequest(null);
        loadRequests();
      } else {
        showToast(res?.message || "Failed to process request", "error");
      }
    } catch (err) {
      showToast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);
  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "transparent", color: "var(--clr-text)" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", padding: "10px 20px", borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: 14, fontWeight: 500,
          animation: "slideIn 0.3s ease-out"
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--clr-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Profile Requests</h1>
          {pendingCount > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
              {pendingCount} Pending
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", background: "var(--clr-bg3)", padding: 4, borderRadius: 8, border: "1px solid var(--clr-border)" }}>
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: filter === f ? "var(--clr-accent)" : "transparent",
                color: filter === f ? "#fff" : "var(--clr-text2)",
                transition: "all 0.2s"
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--clr-text3)", marginTop: 40 }}>Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--clr-text3)", marginTop: 40 }}>No requests found for this filter.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredRequests.map(req => {
              const sColor = STATUS_COLORS[req.status];
              const tColor = TYPE_COLORS[req.requestType];
              
              return (
                <div key={req._id} style={{
                  background: "var(--clr-bg3)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden"
                }}>
                  <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--clr-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--clr-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {req.userId?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{req.userId?.name}</div>
                        <div style={{ fontSize: 12, color: "var(--clr-text3)" }}>{req.userId?.email} · {req.userId?.role}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: tColor.bg, color: tColor.text }}>
                        {req.requestType.replace("_", " ")}
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: sColor.bg, color: sColor.text }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 8, fontWeight: 600 }}>REQUESTED CHANGES</div>
                        {req.requestType === "PASSWORD_CHANGE" ? (
                          <div style={{ fontSize: 14 }}>User wants to set a new password.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {req.requestedChanges?.name && <div style={{ fontSize: 14 }}><span style={{ color: "var(--clr-text2)", width: 80, display: "inline-block" }}>Name:</span> {req.requestedChanges.name}</div>}
                            {req.requestedChanges?.email && <div style={{ fontSize: 14 }}><span style={{ color: "var(--clr-text2)", width: 80, display: "inline-block" }}>Email:</span> {req.requestedChanges.email}</div>}
                            {req.requestedChanges?.department && <div style={{ fontSize: 14 }}><span style={{ color: "var(--clr-text2)", width: 80, display: "inline-block" }}>Dept:</span> {req.requestedChanges.department}</div>}
                            {req.requestedChanges?.avatarUrl && <div style={{ fontSize: 14 }}><span style={{ color: "var(--clr-text2)", width: 80, display: "inline-block" }}>Avatar:</span> New Picture Uploaded</div>}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 8, fontWeight: 600 }}>REASON PROVIDED</div>
                        <div style={{ fontSize: 14, color: req.reason ? "var(--clr-text)" : "var(--clr-text3)", fontStyle: req.reason ? "normal" : "italic" }}>
                          {req.reason || "No reason provided."}
                        </div>
                      </div>
                    </div>
                    
                    {req.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, paddingTop: 16, borderTop: "1px dashed var(--clr-border)" }}>
                        <button
                          onClick={() => handleActionClick(req, "REJECT")}
                          style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleActionClick(req, "APPROVE")}
                          style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer" }}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                    
                    {req.status !== "PENDING" && (
                      <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px dashed var(--clr-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "var(--clr-text3)" }}>
                          Reviewed by {req.reviewedBy?.name} on {new Date(req.reviewedAt).toLocaleDateString()}
                        </div>
                        {req.reviewNote && (
                          <div style={{ fontSize: 13, color: "var(--clr-text2)" }}>
                            <span style={{ fontWeight: 600 }}>Note:</span> {req.reviewNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {activeRequest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--clr-bg)", width: "100%", maxWidth: 400, borderRadius: 16, border: "1px solid var(--clr-border)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {actionType === "APPROVE" ? "Approve Request" : "Reject Request"}
              </h3>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Admin Note (Optional)</label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Explain why this was approved/rejected..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14, resize: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setActiveRequest(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text2)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button 
                  type="button" 
                  onClick={submitAction}
                  disabled={submitting} 
                  style={{ 
                    flex: 1, padding: "10px", borderRadius: 8, border: "none", fontWeight: 600, cursor: "pointer", opacity: submitting ? 0.7 : 1,
                    background: actionType === "APPROVE" ? "#22c55e" : "#ef4444", color: "#fff"
                  }}
                >
                  Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
