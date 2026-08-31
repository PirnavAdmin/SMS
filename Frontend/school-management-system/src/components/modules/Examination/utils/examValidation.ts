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
 * Extracts all assigned invigilator names from a timetable slot object
 */
export function getScheduleInvigilatorNames(s: any): string[] {
  if (!s) return [];
  if (Array.isArray(s.invigilatorNames) && s.invigilatorNames.length > 0) {
    return s.invigilatorNames.map((n: string) => String(n).trim()).filter(Boolean);
  }
  const nameStr = s.invigilatorName || s.invigilatorFaculty;
  if (nameStr && nameStr !== 'TBA' && nameStr !== 'Unassigned') {
    return String(nameStr).split(',').map((n: string) => n.trim()).filter(Boolean);
  }
  return [];
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
  schedules: any[],
  ignoreScheduleId?: string
): CollisionResult {
  if (!targetRoom || !targetDate || targetRoom === 'TBA' || targetRoom === 'Unassigned' || !targetStartTime || !targetEndTime) {
    return { hasConflict: false };
  }

  const cleanTarget = targetRoom.trim().toLowerCase();

  const conflict = (schedules || []).find(s => {
    if (!s) return false;
    if (s.id && ignoreScheduleId && s.id === ignoreScheduleId) return false;
    if (s.slotId && ignoreScheduleId && `item_${s.slotId}` === ignoreScheduleId) return false;
    if (!s.date || s.date !== targetDate) return false;
    if (!isTimeOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime)) return false;

    const sRoom = (s.room || s.roomHall || '').trim().toLowerCase();
    return sRoom && sRoom !== 'tba' && sRoom !== 'unassigned' && sRoom === cleanTarget;
  });

  if (conflict) {
    const secStr = conflict.section ? (conflict.section.startsWith('Section') ? conflict.section : `Section ${conflict.section}`) : '';
    return {
      hasConflict: true,
      message: `Room ${targetRoom} is already assigned to ${conflict.className} ${secStr} (${conflict.subject}) on ${conflict.date} at ${conflict.startTime}–${conflict.endTime}.`,
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
  schedules: any[],
  ignoreScheduleId?: string
): CollisionResult {
  if (!targetInvigilatorName || !targetDate || targetInvigilatorName === 'TBA' || targetInvigilatorName === 'Unassigned' || !targetStartTime || !targetEndTime) {
    return { hasConflict: false };
  }

  const cleanTarget = targetInvigilatorName.trim().toLowerCase();

  const conflict = (schedules || []).find(s => {
    if (!s) return false;
    if (s.id && ignoreScheduleId && s.id === ignoreScheduleId) return false;
    if (s.slotId && ignoreScheduleId && `item_${s.slotId}` === ignoreScheduleId) return false;
    if (!s.date || s.date !== targetDate) return false;
    if (!isTimeOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime)) return false;

    const slotNames = getScheduleInvigilatorNames(s);
    return slotNames.some(name => name.toLowerCase() === cleanTarget);
  });

  if (conflict) {
    const secStr = conflict.section ? (conflict.section.startsWith('Section') ? conflict.section : `Section ${conflict.section}`) : '';
    return {
      hasConflict: true,
      message: `Invigilator ${targetInvigilatorName} is already assigned to ${conflict.className} ${secStr} (${conflict.subject}) on ${conflict.date} at ${conflict.startTime}–${conflict.endTime}.`,
      details: conflict as any
    };
  }

  return { hasConflict: false };
}

/**
 * Finds all invigilator and room collisions across an entire schedule dataset
 */
export function findScheduleCollisions(schedules: any[]): {
  invigilatorCollisions: { slotA: any; slotB: any; teacherName: string; message: string }[];
  roomCollisions: { slotA: any; slotB: any; room: string; message: string }[];
} {
  const invigilatorCollisions: any[] = [];
  const roomCollisions: any[] = [];
  const seenInvPairs = new Set<string>();
  const seenRoomPairs = new Set<string>();

  const list = schedules || [];

  for (let i = 0; i < list.length; i++) {
    const s1 = list[i];
    if (!s1 || !s1.date || !s1.startTime || !s1.endTime) continue;

    for (let j = i + 1; j < list.length; j++) {
      const s2 = list[j];
      if (!s2 || !s2.date || !s2.startTime || !s2.endTime) continue;
      if (s1.date !== s2.date) continue;
      if (!isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) continue;

      // Don't compare slot with itself
      if (s1.id && s2.id && s1.id === s2.id) continue;
      if (s1.slotId && s2.slotId && s1.slotId === s2.slotId) continue;

      // Check invigilator collision
      const names1 = getScheduleInvigilatorNames(s1);
      const names2 = getScheduleInvigilatorNames(s2);
      names1.forEach(n1 => {
        if (names2.some(n2 => n2.toLowerCase() === n1.toLowerCase())) {
          const s1Desc = `${s1.className} ${s1.section || 'A'}`;
          const s2Desc = `${s2.className} ${s2.section || 'A'}`;
          const pairKey = [s1.id || s1Desc, s2.id || s2Desc, n1.toLowerCase()].sort().join('|');
          if (!seenInvPairs.has(pairKey)) {
            seenInvPairs.add(pairKey);
            invigilatorCollisions.push({
              slotA: s1,
              slotB: s2,
              teacherName: n1,
              message: `Invigilator ${n1} is assigned to both ${s1Desc} (${s1.subject}) and ${s2Desc} (${s2.subject}) on ${s1.date} at ${s1.startTime}–${s1.endTime}.`
            });
          }
        }
      });

      // Check room collision
      const r1 = (s1.room || s1.roomHall || '').trim();
      const r2 = (s2.room || s2.roomHall || '').trim();
      if (r1 && r2 && r1 !== 'TBA' && r2 !== 'TBA' && r1.toLowerCase() === r2.toLowerCase()) {
        const s1Desc = `${s1.className} ${s1.section || 'A'}`;
        const s2Desc = `${s2.className} ${s2.section || 'A'}`;
        const pairKey = [s1.id || s1Desc, s2.id || s2Desc, r1.toLowerCase()].sort().join('|');
        if (!seenRoomPairs.has(pairKey)) {
          seenRoomPairs.add(pairKey);
          roomCollisions.push({
            slotA: s1,
            slotB: s2,
            room: r1,
            message: `Room ${r1} is double-booked for both ${s1Desc} (${s1.subject}) and ${s2Desc} (${s2.subject}) on ${s1.date} at ${s1.startTime}–${s1.endTime}.`
          });
        }
      }
    }
  }

  return { invigilatorCollisions, roomCollisions };
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
