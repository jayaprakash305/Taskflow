import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  handleGetProjectDetails,

  handleGetProjectComments,
} from "../controllers/projectController";
import { handleGetTicketsByProject } from "../controllers/ticketController";
import { handleGetProjectWorkLogs } from "../controllers/projectWorkLogController";

const COMMENT_PAGE_LIMIT = 20;

const ProjectContext = createContext(null);

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotalCount, setCommentTotalCount] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialCommentLoadDone = useRef(false);

  const loadComments = useCallback(async (page = 1, append = false) => {
    if (!projectId) return;
    try {
      setCommentLoading(true);
      const data = await handleGetProjectComments(projectId, {
        page,
        limit: COMMENT_PAGE_LIMIT,
      });
      const newComments = data?.comments || [];
      if (append) {
        setComments(prev => {
          const existingIds = new Set(prev.map(c => c._id));
          const unique = newComments.filter(c => !existingIds.has(c._id));
          return [...prev, ...unique];
        });
      } else {
        setComments(newComments);
      }
      setCommentPage(data?.currentPage || page);
      setCommentTotalPages(data?.totalPages || 1);
      setCommentTotalCount(data?.totalCount || newComments.length);
    } finally {
      setCommentLoading(false);
    }
  }, [projectId]);

  const loadMoreComments = useCallback(async () => {
    if (commentLoading || commentPage >= commentTotalPages) return;
    await loadComments(commentPage + 1, true);
  }, [commentLoading, commentPage, commentTotalPages, loadComments]);

  const hasMoreComments = commentPage < commentTotalPages;

  const refreshProject = useCallback(async (showLoading = true) => {
    if (!projectId) return;

    try {
      if (showLoading) setLoading(true);

      const [projectData, ticketData, commentData, workLogData] = await Promise.all([
        handleGetProjectDetails(projectId),
        handleGetTicketsByProject(projectId),
        handleGetProjectComments(projectId, { page: 1, limit: COMMENT_PAGE_LIMIT }),
        handleGetProjectWorkLogs(projectId),
      ]);

      setProject(projectData?.project || null);
      setTickets(ticketData?.tickets || []);
      setComments(commentData?.comments || []);
      setCommentPage(commentData?.currentPage || 1);
      setCommentTotalPages(commentData?.totalPages || 1);
      setCommentTotalCount(commentData?.totalCount || (commentData?.comments?.length || 0));
      setWorkLogs(workLogData?.workLogs || []);
      initialCommentLoadDone.current = true;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshProject();
  }, [refreshProject]);



  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        tickets,
        setTickets,
        comments,
        setComments,
        commentPage,
        commentTotalPages,
        commentTotalCount,
        commentLoading,
        hasMoreComments,
        loadMoreComments,
        workLogs,
        setWorkLogs,
        loading,
        refreshProject,

      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used inside ProjectProvider");
  }
  return context;
}
