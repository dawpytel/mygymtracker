/**
 * ConfirmOverwriteModal Component
 * Modal for confirming starting a new session when one is already in progress
 */

import { ConfirmDialog } from "../ConfirmDialog";

interface ConfirmOverwriteModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmOverwriteModal({
  isOpen,
  isProcessing,
  onConfirm,
  onCancel,
}: ConfirmOverwriteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Session In Progress"
      message="You already have a workout session in progress. Starting a new session will cancel the existing one. Do you want to continue?"
      confirmLabel={isProcessing ? "Starting..." : "Start New Session"}
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

