export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    USERS: "/auth/users",
  },

  PROJECTS: {
    MY_CREATED: "/projects/my-created",
    MY_ASSIGNED: "/projects/my-assigned",
    CREATE: "/projects",
    DETAILS: (projectIdentifier) => `/projects/${projectIdentifier}`,

    ASSIGN: (projectIdentifier) => `/projects/${projectIdentifier}/assign`,
    ALL: "/projects/all",
    UPDATE_DETAILS: (projectIdentifier) => `/projects/${projectIdentifier}`,
    DELETE: (projectIdentifier) => `/projects/${projectIdentifier}`,
  },

  TICKETS: {
    CREATE: "/tickets",
    MY_RAISED: "/tickets/my-raised",
    MY_ASSIGNED: "/tickets/my-assigned",
    DETAILS: (ticketIdentifier) => `/tickets/${ticketIdentifier}`,
    UPDATE_STATUS: (ticketIdentifier) => `/tickets/${ticketIdentifier}/status`,
    UPDATE_PRIORITY: (ticketIdentifier) => `/tickets/${ticketIdentifier}/priority`,
    ASSIGN: (ticketIdentifier) => `/tickets/${ticketIdentifier}/assign`,
    BY_PROJECT: (projectId) => `/tickets/project/${projectId}`,
    SEARCH: "/tickets/search",
  },

  COMMENTS: {
    PROJECT: (projectIdentifier) => `/comments/project/${projectIdentifier}`,
    TICKET: (ticketIdentifier) => `/comments/ticket/${ticketIdentifier}`,
  },

  WORKLOGS: {
    TICKET: (ticketIdentifier) => `/worklogs/ticket/${ticketIdentifier}`,
  },

  ADMIN: {
    USERS: {
      GET_ALL: "/users",
      CREATE: "/users",
      UPDATE: (id) => `/users/${id}`,
      TOGGLE_STATUS: (id) => `/users/${id}/status`,
    },
    PANEL: {
      STATS: "/admin/stats",
      ALL_PROJECTS: "/admin/projects",
      ALL_TICKETS: "/admin/tickets",
      DELETE_TICKET: (id) => `/admin/tickets/${id}`,
      RESTORE_PROJECT: (id) => `/admin/projects/${id}/restore`,
    },
  },
  
  USERS: {
    MENTIONS: "/users/mentions",
  },

  PROFILE: {
    ME: "/profile/me",
    CREATE_REQUEST: "/profile/requests",
    MY_REQUESTS: "/profile/requests/my",
    ALL_REQUESTS: "/profile/requests",
    APPROVE: (id) => `/profile/requests/${id}/approve`,
    REJECT: (id) => `/profile/requests/${id}/reject`,
    ADMIN_CHANGE_PASSWORD: (id) => `/profile/admin/users/${id}/password`,
  },

  NOTIFICATIONS: {
  GET_ALL: "/notifications",
  UNREAD_COUNT: "/notifications/unread-count",
  MARK_AS_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: "/notifications/mark-all-read",
},

  ACTIVITY_LOGS: {
    PROJECT: (id) => `/activity-logs/project/${id}`,
    TICKET: (id) => `/activity-logs/ticket/${id}`,
  },
  
  PROJECT_WORKLOGS: {
    PROJECT: (projectIdentifier) => `/project-worklogs/project/${projectIdentifier}`,
  },
};