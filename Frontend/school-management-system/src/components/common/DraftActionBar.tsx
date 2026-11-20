import React from 'react';
import { ApplicationDraft } from '../../api/applicationDrafts';
import { SaveStatus } from '../../hooks/useApplicationDraft';

interface DraftActionBarProps {
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
  applicantName?: string;
  currentStep?: number;
  totalSteps?: number;
  isDraftRestored?: boolean;
  onManualSave?: () => void;
  onDiscardDraft?: () => void;
  allDrafts?: ApplicationDraft[];
  onSelectDraft?: (draft: ApplicationDraft) => void;
  className?: string;
}

/**
 * DraftActionBar: Silent mode (No banners, alerts, or status strips displayed).
 * Background persistence and restoration continue uninterrupted.
 */
export const DraftActionBar: React.FC<DraftActionBarProps> = () => {
  return null;
};
