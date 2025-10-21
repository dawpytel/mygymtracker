import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlanListPage } from "./views/PlanListPage";
import { PlanCreatePage } from "./views/PlanCreatePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/plans" element={<PlanListPage />} />
        <Route path="/plans/new" element={<PlanCreatePage />} />
        {/* Placeholder routes for future implementation */}
        <Route
          path="/plans/:id/edit"
          element={<div>Edit Plan Page (TODO)</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
