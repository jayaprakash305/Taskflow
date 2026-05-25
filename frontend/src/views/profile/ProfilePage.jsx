import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import ProfileCard from "../../components/ProfileCard";
import {
  handleGetMyProfile,
  handleCreateProfileRequest,
  handleGetMyRequests,
} from "../../controllers/profileController";

const STATUS_COLORS = {
  PENDING: { bg: "rgba(234,179,8,0.15)", text: "#eab308" },
  APPROVED: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  REJECTED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

const TYPE_LABELS = {
  PASSWORD_CHANGE: "Password Change",
  PROFILE_UPDATE: "Profile Update",
};

const generateAvatar = (name) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6366f1"/><text x="50" y="50" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="50" font-weight="bold">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, requestsRes] = await Promise.all([
        handleGetMyProfile(),
        handleGetMyRequests(),
      ]);
      if (profileRes?.success) {
        setProfile(profileRes.user);
        setEditName(profileRes.user.name);
        setEditEmail(profileRes.user.email);
        setEditDept(profileRes.user.department);
      }
      if (requestsRes?.success) {
        setRequests(requestsRes.requests);
      }
    } catch (error) {
      console.error(error);
      showToast("Error loading profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showToast("Passwords do not match", "error");
    }
    if (newPassword.length < 6) {
      return showToast("Password must be at least 6 characters", "error");
    }

    setSubmitting(true);
    try {
      const res = await handleCreateProfileRequest({
        requestType: "PASSWORD_CHANGE",
        requestedChanges: { newPassword },
        reason,
      });
      if (res?.success) {
        showToast("Password change request submitted");
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setReason("");
        loadData();
      } else {
        showToast(res?.message || "Failed to submit request", "error");
      }
    } catch (err) {
      showToast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("requestType", "PROFILE_UPDATE");
      formData.append("reason", reason);
      formData.append("requestedChanges", JSON.stringify({
        name: editName,
        email: editEmail,
        department: editDept,
      }));
      
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await handleCreateProfileRequest(formData);
      if (res?.success) {
        showToast("Profile update request submitted");
        setShowProfileModal(false);
        setReason("");
        setAvatarFile(null);
        loadData();
      } else {
        showToast(res?.message || "Failed to submit request", "error");
      }
    } catch (err) {
      showToast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--clr-text3)", background: "transparent", height: "100%" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "transparent", color: "var(--clr-text)" }}>
      {/* Toast */}
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

      <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--clr-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>My Profile</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 32, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
        
        {/* Left Col - Card */}
        <div style={{ flex: "1 1 350px", maxWidth: 450, width: "100%" }}>
          <ProfileCard
            avatarUrl={profile?.avatarUrl || user?.avatarUrl || generateAvatar(profile?.name || user?.name || "U")}
            name={profile?.name || user?.name}
            title={profile?.role || user?.role}
            handle={profile?.name?.toLowerCase().replace(/\s+/g, '') || "user"}
            status="Active"
            contactText="Edit Profile"
            onContactClick={() => setShowProfileModal(true)}
          />
        </div>

        {/* Right Col - Details & Requests */}
        <div style={{ flex: "2 1 450px", display: "flex", flexDirection: "column", gap: 24, minWidth: 300, width: "100%" }}>
          
          {/* Details Panel */}
          <div style={{ background: "var(--clr-bg3)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid var(--clr-border)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Profile Details</h2>
            </div>
            
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Full Name</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{profile?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Email Address</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{profile?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Role</div>
                <span style={{
                  display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: "var(--clr-accent-bg)", color: "var(--acc, #818cf8)"
                }}>
                  {profile?.role}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Department</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{profile?.department}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Lead</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{profile?.leadId?.name || "None"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--clr-text3)", marginBottom: 4 }}>Manager</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{profile?.managerId?.name || "None"}</div>
              </div>
            </div>

            <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.02)", borderTop: "1px solid var(--clr-border)", display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowPasswordModal(true)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: "transparent", color: "var(--clr-text2)", border: "1px solid var(--clr-border)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--clr-bg)"; e.currentTarget.style.color = "var(--clr-text)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--clr-text2)"; }}
              >
                Change Password
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: "var(--acc, #6366f1)", color: "#fff", border: "none",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--acc, #6366f1)"}
              >
                Request Update
              </button>
            </div>
          </div>

          {/* Requests History */}
          <div style={{ background: "var(--clr-bg3)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid var(--clr-border)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>My Requests</h2>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {requests.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--clr-text3)", fontSize: 14, padding: "20px 0" }}>
                  No requests submitted yet.
                </div>
              ) : (
                requests.map(req => {
                  const sColor = STATUS_COLORS[req.status];
                  return (
                    <div key={req._id} style={{
                      padding: 16, borderRadius: 12, border: "1px solid var(--clr-border)",
                      background: "var(--clr-bg2)", display: "flex", flexDirection: "column", gap: 12
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                            {TYPE_LABELS[req.requestType]}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--clr-text3)" }}>
                            {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <span style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                          background: sColor.bg, color: sColor.text
                        }}>
                          {req.status}
                        </span>
                      </div>
                      
                      {req.reason && (
                        <div style={{ fontSize: 13, color: "var(--clr-text2)", background: "var(--clr-bg3)", padding: "8px 12px", borderRadius: 8 }}>
                          <span style={{ color: "var(--clr-text3)", marginRight: 6 }}>Reason:</span>
                          {req.reason}
                        </div>
                      )}
                      
                      {req.reviewNote && (
                        <div style={{ fontSize: 13, color: "var(--clr-text2)", background: sColor.bg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${sColor.text}33` }}>
                          <span style={{ color: sColor.text, fontWeight: 600, marginRight: 6 }}>Admin Note:</span>
                          {req.reviewNote}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--clr-bg)", width: "100%", maxWidth: 400, borderRadius: 16, border: "1px solid var(--clr-border)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: "transparent", border: "none", color: "var(--clr-text3)", cursor: "pointer", fontSize: 20 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitPassword} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14, resize: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text2)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "var(--clr-accent)", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--clr-bg)", width: "100%", maxWidth: 450, borderRadius: 16, border: "1px solid var(--clr-border)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Update Profile</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: "transparent", border: "none", color: "var(--clr-text3)", cursor: "pointer", fontSize: 20 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitProfile} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Full Name</label>
                <input
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Department</label>
                <input
                  required
                  value={editDept}
                  onChange={e => setEditDept(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14, resize: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--clr-text2)" }}>Profile Picture (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files[0])}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg3)", color: "var(--clr-text)", fontSize: 14 }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowProfileModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text2)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "var(--clr-accent)", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>Submit Request</button>
              </div>
            </form>
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
