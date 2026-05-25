import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../context/CallContext";
import { toast, Toaster } from "react-hot-toast";
import CallInterface from "./CallInterface";

export default function GlobalSocketListener() {
  const { socket } = useAuth();

  useEffect(() => {
    if (!socket) return;

    socket.on("project-status-updated", (data) => {
      toast.success(`Project status updated to ${data.status} by ${data.updatedBy}`);
    });

    socket.on("project-priority-updated", (data) => {
      toast.success(`Project priority updated to ${data.priority} by ${data.updatedBy}`);
    });

    socket.on("project-comment-added", (data) => {
      toast.success(`New comment on project from ${data.user.name}`);
    });

    socket.on("ticket-status-updated", (data) => {
      toast.success(`Ticket ${data.ticketId} status updated to ${data.status} by ${data.updatedBy}`);
    });

    socket.on("ticket-priority-updated", (data) => {
      toast.success(`Ticket ${data.ticketId} priority updated to ${data.priority} by ${data.updatedBy}`);
    });

    socket.on("ticket-comment-added", (data) => {
      toast.success(`New comment on ticket from ${data.user.name}`);
    });

    socket.on("worklog-added", (data) => {
      toast.success(`New worklog added by ${data.addedBy}`);
    });

    socket.on("ticket-overdue", (data) => {
      toast.error(`Ticket ${data.ticketId} is overdue!`, { duration: 6000 });
    });

    return () => {
      socket.off("project-status-updated");
      socket.off("project-priority-updated");
      socket.off("project-comment-added");
      socket.off("ticket-status-updated");
      socket.off("ticket-priority-updated");
      socket.off("ticket-comment-added");
      socket.off("worklog-added");
      socket.off("ticket-overdue");
    };
  }, [socket]);

  return (
    <>
      <Toaster position="top-right" />
      <CallInterface />
    </>
  );
}
