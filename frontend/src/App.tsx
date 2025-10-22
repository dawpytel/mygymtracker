import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlanListPage } from "./views/PlanListPage";
import { PlanCreatePage } from "./views/PlanCreatePage";
import { PlanEditPage } from "./views/PlanEditPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/plans" element={<PlanListPage />} />
        <Route path="/plans/new" element={<PlanCreatePage />} />
        <Route path="/plans/:id/edit" element={<PlanEditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
