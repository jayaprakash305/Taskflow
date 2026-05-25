import { useRef, useState, useEffect, useCallback } from "react";

export const useWebRTC = (socket, currentUser) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // Array of { userId, user, stream }
  const [callState, setCallState] = useState("IDLE"); // IDLE, CALLING, INCOMING, ACTIVE
  const [incomingCallData, setIncomingCallData] = useState(null);

  const activeRoomIdRef = useRef(null);
  const peersRef = useRef({}); // { [userId]: RTCPeerConnection }
  const remoteUsersRef = useRef({}); // { [userId]: User Object }
  const iceCandidatesBuffer = useRef({}); // { [userId]: [candidates] }
  
  const isCleaningUp = useRef(false);
  const localStreamRef = useRef(null);
  const allActiveStreams = useRef([]);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const callingTargetsRef = useRef([]); // Track who we are ringing

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  const generateUUID = () => {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (e) {}
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Fetch Metered TURN credentials on mount
  useEffect(() => {
    const fetchTURN = async () => {
      try {
        const response = await fetch("https://projectflow.metered.live/api/v1/turn/credentials?apiKey=d8546f17fb932eee9c3f9fc63de8341ce56f");
        const meteredServers = await response.json();
        iceServersRef.current = [
          { urls: "stun:stun.l.google.com:19302" },
          ...meteredServers
        ];
        console.log("📡 Fetched dynamic TURN credentials successfully.");
      } catch (err) {
        console.error("❌ Failed to fetch TURN credentials:", err);
      }
    };
    fetchTURN();
  }, []);

  const cleanupCall = useCallback(() => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;
    console.log("⚠️ CLEANUP RUNNING");

    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    allActiveStreams.current.forEach(stream => stream.getTracks().forEach(t => t.stop()));
    allActiveStreams.current = [];

    // Close all peer connections
    Object.values(peersRef.current).forEach(pc => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);

    if (activeRoomIdRef.current && socket) {
      socket.emit("leave-call", { roomId: activeRoomIdRef.current, userId: currentUser?._id });
    }

    // If we were ringing people or being rung, notify others that we are out
    if (socket) {
      if (callState === "CALLING") {
        callingTargetsRef.current.forEach(targetId => {
          socket.emit("end-call", { to: targetId });
        });
      } else if (callState === "INCOMING") {
        // If we have a roomId, notify the room that we declined
        const roomId = incomingCallData?.roomId || incomingCallData?.caller?.roomId;
        if (roomId) {
          socket.emit("leave-call", { roomId, userId: currentUser?._id });
        } else if (incomingCallData?.caller?._id) {
          socket.emit("end-call", { to: incomingCallData.caller._id });
        }
      }
    }
    callingTargetsRef.current = [];

    peersRef.current = {};
    remoteUsersRef.current = {};
    iceCandidatesBuffer.current = {};
    activeRoomIdRef.current = null;

    setLocalStream(null);
    setRemoteStreams([]);
    setCallState("IDLE");
    setIncomingCallData(null);
    
    setTimeout(() => { isCleaningUp.current = false; }, 300);
  }, [currentUser, socket, callState, incomingCallData]);

  const removePeer = useCallback((userId) => {
    console.log(`📡 Removing peer: ${userId}`);
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
    delete remoteUsersRef.current[userId];
    delete iceCandidatesBuffer.current[userId];

    setRemoteStreams(prev => prev.filter(rs => rs.userId !== userId));
    
    // Also remove from calling targets if they hadn't answered yet
    callingTargetsRef.current = callingTargetsRef.current.filter(id => id !== userId);

    // If no one is left in the call (no active peers AND no pending targets), end it
    const activePeerCount = Object.keys(peersRef.current).length;
    const pendingTargetCount = callingTargetsRef.current.length;
    
    if (activePeerCount === 0 && pendingTargetCount === 0) {
      console.log("📡 No participants left, ending call...");
      cleanupCall();
    }
  }, [cleanupCall]);

  const diagnoseMediaError = (error) => {
    const errors = {
      NotAllowedError: "Permission denied by user or browser policy. On mobile, the page MUST be served over HTTPS.",
      NotFoundError: "No camera/microphone found on this device.",
      NotReadableError: "Camera/mic is already in use by another app (common on Android).",
      OverconstrainedError: "The requested constraints cannot be satisfied by the device.",
      SecurityError: "Media access blocked by security policy. Ensure HTTPS.",
      AbortError: "Media access was aborted. Try again.",
      TypeError: "Invalid constraints passed to getUserMedia.",
    };
    return errors[error.name] || `Unknown error: ${error.name} — ${error.message}`;
  };

  const initLocalStream = async (video = true) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support camera/microphone access or requires HTTPS.");
      return null;
    }

    const constraints = [
      { audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }, video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false },
      { audio: true, video: video ? { facingMode: "user" } : false },
      { audio: true, video: false },
    ];

    let stream = null;
    let lastError = null;

    for (let i = 0; i < constraints.length; i++) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
        allActiveStreams.current.push(stream);
        break;
      } catch (error) {
        lastError = error;
        if (error.name === "NotAllowedError" || error.name === "SecurityError") break;
      }
    }

    if (!stream) {
      alert(`Could not access camera/microphone:\n\n${diagnoseMediaError(lastError)}`);
      return null;
    }

    if (isCleaningUp.current) {
      stream.getTracks().forEach(track => track.stop());
      return null;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const createPeerConnection = useCallback((targetUserId, targetSocketId, targetUser) => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close();
    }

    console.log(`📡 Creating PeerConnection for ${targetUser?.name || targetUserId}...`);
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetSocketId) {
        socket.emit("group-ice-candidate", {
          targetSocketId,
          candidate: event.candidate,
          sender: { _id: currentUser._id, socketId: socket.id }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`📡 Connection State for ${targetUserId}:`, pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        removePeer(targetUserId);
      }
    };

    pc.ontrack = (event) => {
      console.log(`📡 Remote track received from ${targetUserId}`);
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => {
          // Replace if exists, otherwise add
          const existing = prev.filter(rs => rs.userId !== targetUserId);
          return [...existing, { userId: targetUserId, user: targetUser, stream: event.streams[0] }];
        });
      }
    };

    peersRef.current[targetUserId] = pc;
    remoteUsersRef.current[targetUserId] = targetUser;
    
    // Add local tracks to this new connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }, [socket, currentUser, removePeer]);

  const startCall = async (usersToCall, video = true) => {
    if (callState !== "IDLE") return;
    
    const roomId = generateUUID();
    activeRoomIdRef.current = roomId;
    setCallState("CALLING");

    const stream = await initLocalStream(video);
    if (!stream) {
      cleanupCall();
      return;
    }

    socket.emit("join-call", { roomId, user: currentUser });
    
    const targets = Array.isArray(usersToCall) ? usersToCall : [usersToCall];
    callingTargetsRef.current = targets.map(t => t._id).filter(Boolean);

    targets.forEach(targetUser => {
      if (!targetUser || !targetUser._id) return;
      socket.emit("call-user", {
        to: targetUser._id,
        offer: null, 
        caller: currentUser,
        roomId
      });
    });
  };

  const inviteUser = (userId) => {
    if (!activeRoomIdRef.current || callState !== "ACTIVE") return;
    console.log("📡 Inviting user to ongoing call:", userId);
    socket.emit("call-user", {
      to: userId,
      offer: null,
      caller: { ...currentUser, roomId: activeRoomIdRef.current }
    });
  };

  const answerCall = async (video = true) => {
    if (!incomingCallData) return;
    const { caller } = incomingCallData;
    const roomId = incomingCallData.roomId || caller?.roomId;

    if (!roomId) {
      console.error("❌ No roomId found in incoming call data");
      cleanupCall();
      return;
    }

    activeRoomIdRef.current = roomId;

    const stream = await initLocalStream(video);
    if (!stream) {
      cleanupCall();
      return;
    }

    setCallState("ACTIVE");
    socket.emit("join-call", { roomId, user: currentUser });
  };

  const endCall = useCallback(() => {
    console.log("📡 Ending call");
    cleanupCall();
  }, [cleanupCall]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      });
      setLocalStream(localStreamRef.current);
    }
  }, []);

  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsSharingScreen(true);

        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Replace video track for all peers
        Object.values(peersRef.current).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Update local preview
        setLocalStream(new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]));

      } catch (err) {
        console.error("❌ Failed to start screen share:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  useEffect(() => {
    if (!socket || !socket.id) return;

    const handleIncomingCall = ({ caller, roomId }) => {
      console.log("📡 Incoming call from:", caller.name);
      if (callState !== "IDLE") {
        return;
      }
      setIncomingCallData({ caller, roomId });
      setCallState("INCOMING");

      // Trigger Push Notification
      if ("Notification" in window && Notification.permission === "granted") {
        const notif = new Notification(`Incoming Group Call`, {
          body: `${caller.name} is inviting you to a video call!`,
          icon: "/favicon.ico",
          requireInteraction: true // Keeps notification visible until clicked
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    };

    const handleUserJoined = async ({ user, socketId }) => {
      console.log(`📡 User joined room: ${user.name}`);
      if (callState === "CALLING") setCallState("ACTIVE");

      // 1. Create a peer connection for them
      const pc = createPeerConnection(user._id, socketId, user);
      
      // 2. Create and send an offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit("group-call-offer", {
          roomId: activeRoomIdRef.current,
          offer,
          sender: { ...currentUser, socketId: socket.id, targetUserId: user._id }
        });
      } catch (err) {
        console.error("❌ Failed to create offer for joined user:", err);
      }
    };

    const handleGroupCallOffer = async ({ offer, sender }) => {
      // Check if this offer is meant for me
      if (sender.targetUserId !== currentUser._id) return;
      console.log(`📡 Received offer from ${sender.name}`);

      const pc = createPeerConnection(sender._id, sender.socketId, sender);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Drain ICE buffer if any
        const buffer = iceCandidatesBuffer.current[sender._id] || [];
        for (const candidate of buffer) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } 
          catch (e) { console.warn("ICE error:", e); }
        }
        iceCandidatesBuffer.current[sender._id] = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("group-call-answer", {
          targetSocketId: sender.socketId,
          answer,
          sender: { ...currentUser, socketId: socket.id }
        });
      } catch (err) {
        console.error("❌ Failed to handle group offer:", err);
      }
    };

    const handleGroupCallAnswer = async ({ answer, sender }) => {
      console.log(`📡 Received answer from ${sender.name}`);
      const pc = peersRef.current[sender._id];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          
          const buffer = iceCandidatesBuffer.current[sender._id] || [];
          for (const candidate of buffer) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } 
            catch (e) { console.warn("ICE error:", e); }
          }
          iceCandidatesBuffer.current[sender._id] = [];
        } catch (err) {
          console.error("❌ Failed to set remote desc from answer:", err);
        }
      }
    };

    const handleGroupIceCandidate = async ({ candidate, sender }) => {
      const pc = peersRef.current[sender._id];
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("❌ Failed to add ICE candidate:", err);
        }
      } else {
        console.log(`📡 Buffering ICE candidate for ${sender._id}`);
        if (!iceCandidatesBuffer.current[sender._id]) {
          iceCandidatesBuffer.current[sender._id] = [];
        }
        iceCandidatesBuffer.current[sender._id].push(candidate);
      }
    };

    const handleUserLeft = ({ userId }) => {
      removePeer(userId);
    };

    const handleCallEnded = ({ from }) => {
      console.log("📡 Call event ended/cancelled by:", from);
      if (from) {
        removePeer(from);
      } else {
        cleanupCall();
      }
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("user-joined-call", handleUserJoined);
    socket.on("group-call-offer", handleGroupCallOffer);
    socket.on("group-call-answer", handleGroupCallAnswer);
    socket.on("group-ice-candidate", handleGroupIceCandidate);
    socket.on("user-left-call", handleUserLeft);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("user-joined-call", handleUserJoined);
      socket.off("group-call-offer", handleGroupCallOffer);
      socket.off("group-call-answer", handleGroupCallAnswer);
      socket.off("group-ice-candidate", handleGroupIceCandidate);
      socket.off("user-left-call", handleUserLeft);
      socket.off("call-ended", handleCallEnded);
    };
  }, [socket, currentUser, callState, createPeerConnection, removePeer]);

  return {
    localStream,
    remoteStreams,
    callState,
    incomingCallData,
    startCall,
    answerCall,
    endCall,
    rejectCall: cleanupCall,
    inviteUser,
    isSharingScreen,
    toggleScreenShare
  };
};
