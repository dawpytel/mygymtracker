import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PlanListPage } from "./views/PlanListPage";
import { PlanCreatePage } from "./views/PlanCreatePage";
import { PlanEditPage } from "./views/PlanEditPage";
import { SessionListPage } from "./views/SessionListPage";
import { SessionCreatePage } from "./views/SessionCreatePage";
import { SessionDetailPage } from "./views/SessionDetailPage";
import { Navigation } from "./components/Navigation";
import { ErrorBoundary } from "./components/ErrorBoundary";

function AppContent() {
  const location = useLocation();
  
  // Show navigation on main list pages only
  const showNavigation = 
    location.pathname === "/plans" || 
    location.pathname === "/sessions";

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/plans" element={<PlanListPage />} />
        <Route path="/plans/new" element={<PlanCreatePage />} />
        <Route path="/plans/:id/edit" element={<PlanEditPage />} />
        <Route path="/sessions" element={<SessionListPage />} />
        <Route path="/sessions/new" element={<SessionCreatePage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
      </Routes>
      {showNavigation && <Navigation />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
