import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { PlanListPage } from "./views/PlanListPage";
import { PlanCreatePage } from "./views/PlanCreatePage";
import { PlanEditPage } from "./views/PlanEditPage";
import { SessionListPage } from "./views/SessionListPage";
import { SessionCreatePage } from "./views/SessionCreatePage";
import { SessionDetailPage } from "./views/SessionDetailPage";
import { RegisterPage } from "./views/RegisterPage";
import { LoginPage } from "./views/LoginPage";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function AppContent() {
  const location = useLocation();

  // Show navigation on main list pages only
  const showNavigation =
    location.pathname === "/plans" || location.pathname === "/sessions";

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/plans" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <PlanListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans/new"
          element={
            <ProtectedRoute>
              <PlanCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans/:id/edit"
          element={
            <ProtectedRoute>
              <PlanEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <SessionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/new"
          element={
            <ProtectedRoute>
              <SessionCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      {showNavigation && <Navigation />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
