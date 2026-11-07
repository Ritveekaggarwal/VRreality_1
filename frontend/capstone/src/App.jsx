import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { FullPageSpinner } from "./components/ui";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { API_BASE } from "./lib/api";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const PlanPage = lazy(() => import("./pages/PlanPage"));
const RoadmapPage = lazy(() => import("./pages/RoadmapPage"));
const ClassroomPage = lazy(() => import("./pages/ClassroomPage"));
const MobileClassroomPage = lazy(() => import("./pages/MobileClassroomPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const guarded = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

const App = () => {
  // Free hosting sleeps when idle. This starts waking the API and AI service
  // while the visitor reads the page, so they are ready by the time they sign in.
  useEffect(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/m/:token" element={<MobileClassroomPage />} />
                <Route path="/plan" element={guarded(<PlanPage />)} />
                <Route path="/roadmap" element={guarded(<RoadmapPage />)} />
                <Route path="/dashboard" element={guarded(<DashboardPage />)} />
                <Route
                  path="/classroom/:roadmapId/:chapterIndex"
                  element={guarded(<ClassroomPage />)}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  );
};

export default App;
