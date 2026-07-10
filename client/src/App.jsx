import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BrowseProjects from "./pages/BrowseProjects";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import MyApplications from "./pages/MyApplications";
import ProjectApplications from "./pages/ProjectApplications";
import Chat from "./pages/Chat";
import Workspace from "./pages/Workspace";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import SearchUsers from "./pages/SearchUsers";
import Calendar from "./pages/Calendar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Landing */}
              <Route index element={<Home />} />

              {/* Authentication Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Public Project & Directory Routes */}
              <Route path="/projects" element={<BrowseProjects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/users" element={<SearchUsers />} />
              <Route path="/profile/:id" element={<Profile />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/projects/new" element={<CreateProject />} />
                <Route path="/applications" element={<MyApplications />} />
                <Route path="/projects/:id/applications" element={<ProjectApplications />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/workspace/:projectId" element={<Workspace />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Public About Route */}
              <Route path="/about" element={<About />} />
              <Route
                path="/contact"
                element={
                  <ComingSoon
                    title="Contact Us"
                    subtitle="We'd love to hear from you. Contact page coming soon."
                  />
                }
              />
              <Route
                path="/privacy"
                element={
                  <ComingSoon
                    title="Privacy Policy"
                    subtitle="Our privacy policy is being prepared. Check back soon."
                  />
                }
              />
            </Route>

            {/* 454 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
