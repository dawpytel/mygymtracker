import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlanListPage } from './views/PlanListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/plans" element={<PlanListPage />} />
        {/* Placeholder routes for future implementation */}
        <Route path="/plans/create" element={<div>Create Plan Page (TODO)</div>} />
        <Route path="/plans/:id/edit" element={<div>Edit Plan Page (TODO)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
