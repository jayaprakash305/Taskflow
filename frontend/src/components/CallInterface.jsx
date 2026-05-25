import React, { useState, useEffect } from "react";
import { useCall } from "../context/CallContext";
import { handleGetUsers } from "../controllers/authController";

export default function CallInterface() {
  const call = useCall();
  const [permissionError, setPermissionError] = useState(null);
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const {
    localStream = null, remoteStreams = [], callState = "IDLE",
    incomingCallData = null,
    answerCall, endCall, rejectCall, inviteUser,
    isSharingScreen, toggleScreenShare
  } = call || {};

  const handleAnswer = async () => {
    setPermissionError(null);
    const stream = await answerCall(true);
    if (!stream) {
      setPermissionError(getPermissionGuide());
    }
  };

  const getPermissionGuide = () => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    if (isIOS) return "iOS Safari: Go to Settings → Safari → Camera & Microphone → set to 'Allow'";
    if (isAndroid) return "Android Chrome: Tap the lock icon in the URL bar → Permissions → Allow Camera & Microphone";
    return "Please allow camera and microphone access in your browser settings and reload the page.";
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setLoadingUsers(true);
    try {
      const data = await handleGetUsers();
      if (data?.users) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInvite = (userId) => {
    inviteUser(userId);
    setShowInviteModal(false);
  };

  const callerName = incomingCallData?.caller?.name || "Unknown";
  const callerInitial = callerName && callerName.length > 0 ? callerName.charAt(0).toUpperCase() : "?";

  // Calculate dynamic grid based on number of participants
  const getGridStyle = (count) => {
    if (count === 0) return { display: "flex" };
    if (count === 1) return { display: "grid", gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (count === 2) return { display: "grid", gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
    return { display: "grid", gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  };

  // Ringtone Audio Effect
  useEffect(() => {
    let ringtone;
    if ((callState === "INCOMING" || callState === "CALLING") && typeof Audio !== "undefined") {
      const src = callState === "INCOMING" 
        ? "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" 
        : "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
      
      try {
        ringtone = new Audio(src);
        ringtone.loop = true;
        ringtone.play().catch(e => console.log("Autoplay blocked by browser:", e));
      } catch (err) {
        console.warn("Audio play failed:", err);
      }
    }
    return () => {
      try {
        if (ringtone) {
          ringtone.pause();
          ringtone.currentTime = 0;
        }
      } catch (e) {
        console.warn("Audio cleanup error:", e);
      }
    };
  }, [callState]);

  if (callState === "IDLE") return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#0a0a0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 10000, color: "white",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    }}>

      {/* Permission error banner */}
      {permissionError && (
        <div style={{
          position: "absolute", top: 20,
          left: "50%", transform: "translateX(-50%)",
          background: "#ef4444", color: "#fff",
          padding: "12px 20px", borderRadius: 12,
          fontSize: 13, maxWidth: 360, textAlign: "center",
          lineHeight: 1.5, zIndex: 1,
        }}>
          📵 {permissionError}
        </div>
      )}

      {/* Main video area */}
      <div style={{
        position: "relative", width: "90%", maxWidth: 1000,
        height: "70vh", borderRadius: 20,
        overflow: "hidden", backgroundColor: "#111118",
        border: "1px solid rgba(255,255,255,0.08)",
        ...getGridStyle(remoteStreams.length)
      }}>
        
        {/* Remote streams mapping */}
        {remoteStreams.length > 0 ? (
          remoteStreams.map((rs) => (
            <div key={rs.userId} style={{ position: "relative", width: "100%", height: "100%", border: "1px solid #222" }}>
              <video autoPlay playsInline
                ref={(v) => { if (v && v.srcObject !== rs.stream) v.srcObject = rs.stream; }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", bottom: 12, left: 12,
                background: "rgba(0,0,0,0.6)", padding: "4px 10px",
                borderRadius: 6, fontSize: 13, fontWeight: 500,
                backdropFilter: "blur(4px)"
              }}>
                {rs.user?.name || "Participant"}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            width: "100%", height: "100%", gap: 16,
          }}>
            {callState === "ACTIVE" ? (
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
                Waiting for participants to connect...
              </div>
            ) : (
              <>
                <div style={{
                  width: 90, height: 90, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700,
                }}>
                  {callerInitial}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{callState === "CALLING" ? "Calling..." : callerName}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                  {callState === "INCOMING" && "📲 Incoming group call..."}
                </div>
                
                {/* Pulse ring animation for incoming */}
                {(callState === "CALLING" || callState === "INCOMING") && (
                  <div style={{ position: "relative", marginTop: 8 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        position: "absolute", width: 90, height: 90,
                        borderRadius: "50%", border: "2px solid rgba(99,102,241,0.4)",
                        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        animation: `callPulse 2s ease-out ${i * 0.6}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Local stream PiP (floating) */}
        {localStream && (
          <div style={{
            position: "absolute", bottom: 16, right: 16,
            width: 140, height: 100, borderRadius: 12,
            overflow: "hidden", zIndex: 10,
            border: "2px solid rgba(255,255,255,0.15)",
            backgroundColor: "#1a1a2e", boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
          }}>
            <video autoPlay playsInline muted
              ref={(v) => { if (v && v.srcObject !== localStream) v.srcObject = localStream; }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Call state indicator */}
        {callState === "ACTIVE" && (
          <div style={{
            position: "absolute", top: 16, left: 16, zIndex: 10,
            background: "rgba(34,197,94,0.2)",
            border: "1px solid rgba(34,197,94,0.4)",
            color: "#22c55e", fontSize: 12, fontWeight: 600,
            padding: "4px 12px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "livePulse 1.5s ease-in-out infinite" }} />
            Live
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 32, display: "flex", gap: 24, alignItems: "center" }}>
        {callState === "INCOMING" ? (
          <>
            <div style={{ textAlign: "center" }}>
              <button onClick={handleAnswer} style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(34,197,94,0.4)", transition: "transform 0.15s",
              }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
                <PhoneAcceptIcon />
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Accept</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={rejectCall} style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg, #b91c1c, #ef4444)",
                border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
              }}>
                <PhoneRejectIcon />
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Decline</div>
            </div>
          </>
        ) : (
          <>
            {callState === "ACTIVE" && remoteStreams.length < 3 && (
              <div style={{ textAlign: "center" }}>
                <button onClick={openInviteModal} style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <AddPersonIcon />
                </button>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Add Person</div>
              </div>
            )}

            {callState === "ACTIVE" && (
              <div style={{ textAlign: "center" }}>
                <button onClick={toggleScreenShare} style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: isSharingScreen ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.1)",
                  border: isSharingScreen ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.2)",
                  color: isSharingScreen ? "#6366f1" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ScreenShareIcon />
                </button>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                  {isSharingScreen ? "Stop Share" : "Share"}
                </div>
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <button onClick={endCall} style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg, #b91c1c, #ef4444)",
                border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
              }}>
                <PhoneEndIcon />
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>End call</div>
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000
        }}>
          <div style={{
            background: "#1a1a24", width: "90%", maxWidth: 400, borderRadius: 16,
            padding: 24, border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Invite to Call</h3>
            {loadingUsers ? (
              <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Loading users...</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {usersList.map(u => (
                  <button key={u._id} onClick={() => handleInvite(u._id)} style={{
                    background: "rgba(255,255,255,0.05)", border: "none", padding: "12px 16px",
                    borderRadius: 8, color: "white", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <span>{u.name}</span>
                    <span style={{ fontSize: 12, color: "#6366f1" }}>Invite</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowInviteModal(false)} style={{
              marginTop: 16, width: "100%", padding: 12, background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 8, cursor: "pointer"
            }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes callPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

const PhoneAcceptIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 12 19.79 19.79 0 0 1 1.89 3.37 2 2 0 0 1 3.86 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const PhoneRejectIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const PhoneEndIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);
const AddPersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);
const ScreenShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v9"/>
  </svg>
);
