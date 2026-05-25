import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";

// Auth
import LoginPage from "../views/auth/LoginPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";

// Layout
import AppLayout from "../layouts/AppLayout";

// Pages
import DashboardPage from "../views/dashboard/DashboardPage";
import MyRaisedTicketsPage from "../views/tickets/MyRaisedTicketsPage";
import MyAssignedTicketsPage from "../views/tickets/MyAssignedTicketsPage";
import RaiseTicketPage from "../views/tickets/RaiseTicketPage";
import MyAssignedProjectsPage from "../views/projects/MyAssignedProjectsPage";
import CreatedProjectsPage from "../views/projects/CreatedProjectsPage";
import CreateProjectPage from "../views/projects/CreateProjectPage";
import ProjectDetailPageWrapper from "../views/projects/ProjectDetailPageWrapper";
import MessagesPage from "../views/messages/MessagesPage";
import ProfilePage from "../views/profile/ProfilePage";
import ProfileRequestsPage from "../views/admin/ProfileRequestsPage";


import UserManagementPage from "../views/admin/UserManagementPage";
import AdminPanelPage from "../views/admin/AdminPanelPage";
import RootRedirect from "../components/auth/RootRedirect";

function AppRoutes() {
  return (
    <Routes>
      <Route path={APP_ROUTES.LOGIN} element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      {/* Protected layout with sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />

        {/* Admin routes */}
        <Route path={APP_ROUTES.ADMIN_USERS} element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <UserManagementPage />
          </ProtectedRoute>
        } />
        <Route path={APP_ROUTES.ADMIN_PANEL} element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminPanelPage />
          </ProtectedRoute>
        } />

        {/* Tickets */}
        <Route path={APP_ROUTES.TICKETS_RAISED} element={<MyRaisedTicketsPage />} />
        <Route path={APP_ROUTES.TICKETS_ASSIGNED} element={<MyAssignedTicketsPage />} />
        <Route path={APP_ROUTES.TICKETS_RAISE} element={<RaiseTicketPage />} />

        {/* Projects */}
        <Route path={APP_ROUTES.PROJECTS_ASSIGNED} element={<MyAssignedProjectsPage />} />
        <Route path={APP_ROUTES.PROJECTS_CREATED} element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
            <CreatedProjectsPage />
          </ProtectedRoute>
        } />
        <Route path={APP_ROUTES.PROJECTS_CREATE} element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
            <CreateProjectPage />
          </ProtectedRoute>
        } />
        <Route path={APP_ROUTES.PROJECT_DETAIL} element={<ProjectDetailPageWrapper />} />

        {/* Messages */}
        <Route path={APP_ROUTES.MESSAGES} element={<MessagesPage />} />

        {/* Profile */}
        <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={APP_ROUTES.ADMIN_PROFILE_REQUESTS} element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ProfileRequestsPage />
          </ProtectedRoute>
        } />


      </Route>

      {/* Redirect root to appropriate dashboard */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

export default AppRoutes;