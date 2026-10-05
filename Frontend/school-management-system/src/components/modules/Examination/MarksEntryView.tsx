import React from 'react';
import { ClassTeacherMarksEntryView } from './ClassTeacherMarksEntryView';

export const MarksEntryView: React.FC<{ onNavigate?: (mod: string) => void }> = ({ onNavigate }) => {
  return <ClassTeacherMarksEntryView onNavigate={onNavigate} />;
};

export default MarksEntryView;
