import React, { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWebRTC } from "../hooks/useWebRTC";

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  return context;
};

export default function CallProvider({ children }) {
  const { socket, user } = useAuth();

  // Defer initialization until user exists to prevent socket undefined issues
  if (!user) {
    return (
      <CallContext.Provider value={null}>
        {children}
      </CallContext.Provider>
    );
  }

  return <CallProviderInner socket={socket} user={user}>{children}</CallProviderInner>;
}

function CallProviderInner({ socket, user, children }) {
  const callData = useWebRTC(socket, user);
  return (
    <CallContext.Provider value={callData}>
      {children}
    </CallContext.Provider>
  );
}
