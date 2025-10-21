/**
 * PlanCreatePage Component
 * Main page for creating a new workout plan
 */

import { PlanForm } from "../components/PlanForm";
import { HeaderBar } from "../components/HeaderBar";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export function PlanCreatePage() {
  const navigate = useNavigate();

  const handleCancel = useCallback(() => {
    navigate("/plans");
  }, [navigate]);

  const handleSuccess = useCallback(() => {
    navigate("/plans");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar title="Create Workout Plan" />
      <main className="px-4 py-6 max-w-4xl mx-auto">
        <PlanForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </main>
    </div>
  );
}
