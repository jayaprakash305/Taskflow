import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  handleGetTicketDetails,
  handleUpdateTicketStatus,
  handleUpdateTicketPriority,
  handleGetTicketComments,
  handleAssignTicket,
} from "../controllers/ticketController";
import { handleGetTicketActivityLogs } from "../controllers/activityLogController";
import { handleGetTicketWorkLogs } from "../controllers/workLogController";
import { handleGetProjectDetails } from "../controllers/projectController";

const TicketContext = createContext(null);

export function TicketProvider({ ticketId, children }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState(null);
  const [canModify, setCanModify] = useState(false);

  const refreshTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const [detData, cmtToday, workLogData, historyData] = await Promise.all([
        handleGetTicketDetails(ticketId),
        handleGetTicketComments(ticketId, { filter: "today" }),
        handleGetTicketWorkLogs(ticketId),
        handleGetTicketActivityLogs(ticketId, { page: 1, limit: 20 }),
      ]);

      const loadedTicket = detData?.ticket || null;
      setTicket(loadedTicket);
      setCanModify(detData?.canModify ?? false);
      setComments(cmtToday?.comments || []);
      setWorkLogs(workLogData?.workLogs || []);
      setHistory(historyData?.logs || []);

      if (loadedTicket?.projectId) {
        const pId = loadedTicket.projectId._id || loadedTicket.projectId;
        try {
          const projData = await handleGetProjectDetails(pId);
          setProjectDetails(projData?.project || null);
        } catch {
          setProjectDetails(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    refreshTicket();
  }, [refreshTicket]);

  const updateTicketStatus = async (status) => {
    const data = await handleUpdateTicketStatus(ticketId, { status });
    setTicket(data?.ticket || null);
    refreshTicket(); // To update history logs
    return data;
  };

  const updateTicketPriority = async (priority) => {
    const data = await handleUpdateTicketPriority(ticketId, { priority });
    setTicket(data?.ticket || null);
    refreshTicket(); // To update history logs
    return data;
  };

  const reassignTicket = async (assignedTo) => {
    const data = await handleAssignTicket(ticketId, { assignedTo });
    setTicket(data?.ticket || null);
    refreshTicket();
    return data;
  };

  return (
    <TicketContext.Provider
      value={{
        ticket,
        setTicket,
        comments,
        setComments,
        history,
        setHistory,
        workLogs,
        setWorkLogs,
        projectDetails,
        canModify,
        loading,
        refreshTicket,
        updateTicketStatus,
        updateTicketPriority,
        reassignTicket,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTicketContext() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error("useTicketContext must be used inside TicketProvider");
  }
  return context;
}
