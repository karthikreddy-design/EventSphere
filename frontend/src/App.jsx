import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/skeleton.css";
import "./styles/toast.css";

import AdminLayout from "./layouts/AdminLayout";
import ParticipantLayout from "./layouts/ParticipantLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import ParticipantRoute from "./routes/ParticipantRoute";
import { PageSkeleton } from "./components/Skeleton";

import Login from "./pages/common/Login";
import Register from "./pages/common/Register";
import AuthCallback from "./pages/common/AuthCallback";
import Profile from "./pages/common/Profile";
import Notifications from "./pages/common/Notifications";

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const CreateEvent = lazy(() => import("./pages/admin/CreateEvent"));
const EditEvent = lazy(() => import("./pages/admin/EditEvent"));
const ScanAttendance = lazy(() => import("./pages/admin/ScanAttendance"));
const EventParticipants = lazy(() => import("./pages/admin/EventParticipants"));
const Participants = lazy(() => import("./pages/admin/Participants"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const ParticipantDashboard = lazy(() => import("./pages/participant/Dashboard"));
const BrowseEvents = lazy(() => import("./pages/participant/BrowseEvents"));
const MyEvents = lazy(() => import("./pages/participant/MyEvents"));
const EventDetails = lazy(() => import("./pages/participant/EventDetails"));
const MyTicket = lazy(() => import("./pages/participant/MyTicket"));
const ParticipantNotifications = lazy(
  () => import("./pages/participant/ParticipantNotifications")
);

function LazyPage({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin-dashboard" element={<LazyPage><AdminDashboard /></LazyPage>} />
              <Route path="/admin/events" element={<LazyPage><AdminEvents /></LazyPage>} />
              <Route path="/admin/events/create" element={<LazyPage><CreateEvent /></LazyPage>} />
              <Route path="/admin/events/edit/:id" element={<LazyPage><EditEvent /></LazyPage>} />
              <Route
                path="/admin/events/:id/participants"
                element={<LazyPage><EventParticipants /></LazyPage>}
              />
              <Route
                path="/admin/participants"
                element={<LazyPage><Participants /></LazyPage>}
              />
              <Route
                path="/admin/scan-attendance"
                element={<LazyPage><ScanAttendance /></LazyPage>}
              />
              <Route path="/admin/reports" element={<LazyPage><Reports /></LazyPage>} />
              <Route path="/admin/notifications" element={<Notifications role="admin" />} />
              <Route path="/admin/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route element={<ParticipantRoute />}>
            <Route element={<ParticipantLayout />}>
              <Route path="/participant-dashboard" element={<LazyPage><ParticipantDashboard /></LazyPage>} />
              <Route path="/participant/browse" element={<LazyPage><BrowseEvents /></LazyPage>} />
              <Route path="/participant/events" element={<LazyPage><MyEvents /></LazyPage>} />
              <Route path="/participant/events/:id" element={<LazyPage><EventDetails /></LazyPage>} />
              <Route path="/participant/qr-ticket" element={<LazyPage><MyTicket /></LazyPage>} />
              <Route
                path="/participant/notifications"
                element={<LazyPage><ParticipantNotifications /></LazyPage>}
              />
              <Route path="/participant/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable
        limit={3}
        theme="light"
      />
    </BrowserRouter>
  );
}

export default App;
