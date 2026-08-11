import { ExamSchedule, ExamSetup } from '../../../../types';

export interface ConflictDetails {
  className: string;
  section?: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  invigilatorName: string;
}

export interface CollisionResult {
  hasConflict: boolean;
  message?: string;
  details?: ConflictDetails;
}

/**
 * Checks if two time intervals overlap.
 * Format of time parameters: "HH:MM"
 */
export function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const [hStartA, mStartA] = startA.split(':').map(Number);
  const [hEndA, mEndA] = endA.split(':').map(Number);
  const [hStartB, mStartB] = startB.split(':').map(Number);
  const [hEndB, mEndB] = endB.split(':').map(Number);

  const tStartA = hStartA * 60 + (mStartA || 0);
  const tEndA = hEndA * 60 + (mEndA || 0);
  const tStartB = hStartB * 60 + (mStartB || 0);
  const tEndB = hEndB * 60 + (mEndB || 0);

  return tStartA < tEndB && tStartB < tEndA;
}

/**
 * Verifies if room booking overlaps with another schedule entry.
 */
export function checkRoomCollision(
  targetRoom: string,
  targetDate: string,
  targetStartTime: string,
  targetEndTime: string,
  schedules: ExamSchedule[],
  ignoreScheduleId?: string
): CollisionResult {
  if (!targetRoom || !targetDate || targetRoom === 'TBA' || !targetStartTime || !targetEndTime) return { hasConflict: false };

  const conflict = schedules.find(s => 
    s.id !== ignoreScheduleId &&
    s.room === targetRoom &&
    s.date === targetDate &&
    isTimeOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime)
  );

  if (conflict) {
    return {
      hasConflict: true,
      message: `Room ${targetRoom} is already assigned to ${conflict.className}-${conflict.section || 'A'} for ${conflict.subject} on ${conflict.date} at ${conflict.startTime}–${conflict.endTime}.`,
      details: conflict as any
    };
  }

  return { hasConflict: false };
}

/**
 * Verifies if invigilator booking overlaps with another schedule entry.
 */
export function checkInvigilatorCollision(
  targetInvigilatorName: string,
  targetDate: string,
  targetStartTime: string,
  targetEndTime: string,
  schedules: ExamSchedule[],
  ignoreScheduleId?: string
): CollisionResult {
  if (!targetInvigilatorName || !targetDate || targetInvigilatorName === 'TBA' || !targetStartTime || !targetEndTime) return { hasConflict: false };

  const conflict = schedules.find(s => 
    s.id !== ignoreScheduleId &&
    s.invigilatorName === targetInvigilatorName &&
    s.date === targetDate &&
    isTimeOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime)
  );

  if (conflict) {
    return {
      hasConflict: true,
      message: `Invigilator ${targetInvigilatorName} is already assigned to invigilate ${conflict.className}-${conflict.section || 'A'} for ${conflict.subject} on ${conflict.date} at ${conflict.startTime}–${conflict.endTime}.`,
      details: conflict as any
    };
  }

  return { hasConflict: false };
}

/**
 * Verifies if date falls within exam start and end limits.
 */
export function validateScheduleDate(dateStr: string, startDateStr: string, endDateStr: string): boolean {
  if (!dateStr || !startDateStr || !endDateStr) return true;
  const d = new Date(dateStr);
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  // Reset time portions for pure date checks
  d.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  return d >= start && d <= end;
}

/**
 * Validates the entire exam setup configuration status for publishing.
 */
export function getPublishValidationIssues(
  exam: ExamSetup,
  schedules: ExamSchedule[],
  classSubjectsMap: Record<string, string[]>
): string[] {
  const issues: string[] = [];

  if (!exam.applicableClasses || exam.applicableClasses.length === 0) {
    issues.push('No target classes are selected for this examination.');
    return issues;
  }

  exam.applicableClasses.forEach(className => {
    const subjects = classSubjectsMap[className] || [];
    if (subjects.length === 0) {
      issues.push(`Class ${className} has no mapped subjects in the academics configuration.`);
    }

    subjects.forEach(subject => {
      // Find if this subject is scheduled for this class
      const hasSched = schedules.some(s => s.examId === exam.id && s.className === className && s.subject === subject);
      if (!hasSched) {
        issues.push(`Subject ${subject} for ${className} has not been scheduled.`);
      }
    });
  });

  // Verify schedules themselves for room/teacher collisions
  schedules.forEach(s => {
    if (s.examId === exam.id) {
      const roomCheck = checkRoomCollision(s.room, s.date, s.startTime, s.endTime, schedules, s.id);
      if (roomCheck.hasConflict) {
        issues.push(`Room collision: ${s.room} is double-booked on ${s.date} at ${s.startTime}.`);
      }

      const invCheck = checkInvigilatorCollision(s.invigilatorName, s.date, s.startTime, s.endTime, schedules, s.id);
      if (invCheck.hasConflict) {
        issues.push(`Invigilator collision: Teacher ${s.invigilatorName} is double-booked on ${s.date} at ${s.startTime}.`);
      }

      if (s.date) {
        const d = new Date(s.date);
        if (!isNaN(d.getTime()) && d.getDay() === 0) {
          issues.push(`Sunday Warning: ${s.subject} is scheduled on a Sunday (${s.date}). Exams should not be scheduled on Sundays.`);
        }
      }

      if (exam.startDate && exam.endDate && !validateScheduleDate(s.date, exam.startDate, exam.endDate)) {
        issues.push(`Date out of bounds: ${s.subject} schedule date (${s.date}) falls outside exam range (${exam.startDate} to ${exam.endDate}).`);
      }
    }
  });

  return Array.from(new Set(issues));
}
