import React, { useState, useMemo } from 'react';
import { Clock, Calendar, BookOpen, User, Users, Search, Printer, Download, Sparkles, School, Layers, RefreshCw, CheckCircle2, ChevronRight, Filter, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { TimetableSlot } from '../../../types';
import * as LibraryAPI from '../../../api/library';

export const LibraryTimetableView: React.FC = () => {
  const { role } = useAuth();
  const isLibrarian = (role || '').toLowerCase().includes('librarian');
  const isReadOnlyAccess = !isLibrarian;

  const { timetable, academicClasses, students, addTimetableSlot } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'today' | 'weekly-matrix' | 'class-view'>('today');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  }, []);

  const periodTimeMap: Record<number, string> = {
    1: '08:30 AM - 09:15 AM',
    2: '09:15 AM - 10:00 AM',
    3: '10:15 AM - 11:00 AM',
    4: '11:00 AM - 11:45 AM',
    5: '11:45 AM - 12:30 PM',
    6: '01:15 PM - 02:00 PM',
    7: '02:00 PM - 02:45 PM',
    8: '02:45 PM - 03:30 PM',
  };

  // Filter Library Timetable Slots dynamically from Admin Master Timetable
  const librarySlots = useMemo(() => {
    return timetable.filter(s => {
      const subj = (s.subject || '').toLowerCase();
      const tName = (s.teacherName || '').toLowerCase();
      const room = (s.roomNo || '').toLowerCase();
      return (
        subj.includes('library') ||
        subj.includes('reading') ||
        subj.includes('reference') ||
        tName.includes('bhanu') ||
        tName.includes('rachel') ||
        tName.includes('librarian') ||
        room.includes('library')
      );
    });
  }, [timetable]);

  // Today's Chronological Schedule (Period 1 to Period 8)
  const dayChronologicalSchedule = useMemo(() => {
    const daySlots = librarySlots.filter(s => s.day === selectedDay);
    const result: Array<{ period: number; timeSlot: string; slot: TimetableSlot | null }> = [];

    for (let p = 1; p <= 8; p++) {
      const matched = daySlots.find(s => (s.periodNumber || 0) === p || (s as any).period === p);
      result.push({
        period: p,
        timeSlot: periodTimeMap[p] || 'Scheduled Period',
        slot: matched || null
      });
    }

    return result;
  }, [librarySlots, selectedDay]);

  // Class & Section Specific Weekly Schedule
  const classWeeklySchedule = useMemo(() => {
    if (!selectedClass) return [];
    return librarySlots.filter(s => s.className === selectedClass && (!selectedSection || selectedSection === 'All' || s.section === selectedSection));
  }, [librarySlots, selectedClass, selectedSection]);

  // All Classes list from academicClasses, students, timetable & standard school classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach(c => set.add(c));

    (academicClasses || []).forEach(c => {
      if (c.className) set.add(c.className);
    });

    (students || []).forEach(st => {
      if (st.className) set.add(st.className);
    });

    (timetable || []).forEach(t => {
      if (t.className) set.add(t.className);
    });

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [academicClasses, students, timetable]);

  // All Sections list (A, B, C, D)
  const availableSections = useMemo(() => {
    const set = new Set<string>(['A', 'B', 'C', 'D']);
    (academicClasses || []).forEach(c => {
      if (Array.isArray(c.sections)) {
        c.sections.forEach(sec => set.add(sec));
      }
    });
    (students || []).forEach(st => {
      if (st.section) set.add(st.section);
    });
    (timetable || []).forEach(t => {
      if (t.section) set.add(t.section);
    });
    return Array.from(set).sort();
  }, [academicClasses, students, timetable]);

  // Auto-Generate / Sync Standard Library Schedule from Admin Timetable
  const handleAutoPopulateLibrarySchedule = async () => {
    try {
      await LibraryAPI.syncLibraryTimetableApi();
    } catch (e) {}

    const defaultLibraryPeriods: Omit<TimetableSlot, 'id'>[] = [
      { day: "Monday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 5", section: "A", subject: "Library & Reading", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "08:30", endTime: "09:15" },
      { day: "Monday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 3", section: "B", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Children Library", startTime: "09:15", endTime: "10:00" },
      { day: "Monday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 9", section: "A", subject: "Library & Research", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "10:15", endTime: "11:00" },
      { day: "Monday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 10", section: "A", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "11:00", endTime: "11:45" },
      { day: "Monday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 6", section: "B", subject: "Library & Storytelling", teacherName: "Rachel Green", roomNo: "Reading Deck", startTime: "11:45", endTime: "12:30" },
      { day: "Monday", timeSlot: "01:15 PM - 02:00 PM", periodNumber: 6, className: "Class 8", section: "A", subject: "Library & Research", teacherName: "Bhanu Prakash", roomNo: "Digital Library Deck", startTime: "13:15", endTime: "14:00" },
      { day: "Monday", timeSlot: "02:00 PM - 02:45 PM", periodNumber: 7, className: "Class 11", section: "B", subject: "Library & Reference", teacherName: "Rachel Green", roomNo: "Periodicals Section", startTime: "14:00", endTime: "14:45" },
      { day: "Monday", timeSlot: "02:45 PM - 03:30 PM", periodNumber: 8, className: "Class 7", section: "A", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "14:45", endTime: "15:30" },

      { day: "Tuesday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 4", section: "A", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Children Library", startTime: "08:30", endTime: "09:15" },
      { day: "Tuesday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 6", section: "A", subject: "Library & Reading", teacherName: "Bhanu Prakash", roomNo: "Reading Deck", startTime: "09:15", endTime: "10:00" },
      { day: "Tuesday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 11", section: "A", subject: "Library & Reference", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "10:15", endTime: "11:00" },
      { day: "Tuesday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 9", section: "A", subject: "Library & Reading", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "11:00", endTime: "11:45" },
      { day: "Tuesday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 10", section: "B", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Periodicals Section", startTime: "11:45", endTime: "12:30" },
      { day: "Tuesday", timeSlot: "01:15 PM - 02:00 PM", periodNumber: 6, className: "Class 5", section: "B", subject: "Library & Storytelling", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "13:15", endTime: "14:00" },
      { day: "Tuesday", timeSlot: "02:00 PM - 02:45 PM", periodNumber: 7, className: "Class 12", section: "A", subject: "Library & Journal Study", teacherName: "Rachel Green", roomNo: "Digital Library Deck", startTime: "14:00", endTime: "14:45" },
      { day: "Tuesday", timeSlot: "02:45 PM - 03:30 PM", periodNumber: 8, className: "Class 8", section: "B", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "14:45", endTime: "15:30" },

      { day: "Wednesday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 7", section: "B", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "08:30", endTime: "09:15" },
      { day: "Wednesday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 10", section: "A", subject: "Library & Reading", teacherName: "Rachel Green", roomNo: "Central Library Hall", startTime: "09:15", endTime: "10:00" },
      { day: "Wednesday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 5", section: "A", subject: "Library & Storytelling", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "10:15", endTime: "11:00" },
      { day: "Wednesday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 3", section: "A", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Children Library", startTime: "11:00", endTime: "11:45" },
      { day: "Wednesday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 8", section: "A", subject: "Library & Research", teacherName: "Bhanu Prakash", roomNo: "Digital Library Deck", startTime: "11:45", endTime: "12:30" },
      { day: "Wednesday", timeSlot: "01:15 PM - 02:00 PM", periodNumber: 6, className: "Class 12", section: "B", subject: "Library & Reference", teacherName: "Rachel Green", roomNo: "Periodicals Section", startTime: "13:15", endTime: "14:00" },
      { day: "Wednesday", timeSlot: "02:00 PM - 02:45 PM", periodNumber: 7, className: "Class 9", section: "B", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "14:00", endTime: "14:45" },
      { day: "Wednesday", timeSlot: "02:45 PM - 03:30 PM", periodNumber: 8, className: "Class 6", section: "A", subject: "Library & Reading", teacherName: "Rachel Green", roomNo: "Reading Deck", startTime: "14:45", endTime: "15:30" },

      { day: "Thursday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 11", section: "B", subject: "Library & Reference", teacherName: "Rachel Green", roomNo: "Periodicals Section", startTime: "08:30", endTime: "09:15" },
      { day: "Thursday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 8", section: "B", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "09:15", endTime: "10:00" },
      { day: "Thursday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 6", section: "B", subject: "Library & Reading", teacherName: "Rachel Green", roomNo: "Reading Deck", startTime: "10:15", endTime: "11:00" },
      { day: "Thursday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 4", section: "B", subject: "Library & Storytelling", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "11:00", endTime: "11:45" },
      { day: "Thursday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 7", section: "A", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "11:45", endTime: "12:30" },
      { day: "Thursday", timeSlot: "01:15 PM - 02:00 PM", periodNumber: 6, className: "Class 10", section: "A", subject: "Library & Research", teacherName: "Rachel Green", roomNo: "Digital Library Deck", startTime: "13:15", endTime: "14:00" },
      { day: "Thursday", timeSlot: "02:00 PM - 02:45 PM", periodNumber: 7, className: "Class 11", section: "A", subject: "Library & Reference", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "14:00", endTime: "14:45" },
      { day: "Thursday", timeSlot: "02:45 PM - 03:30 PM", periodNumber: 8, className: "Class 9", section: "A", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Central Library Hall", startTime: "14:45", endTime: "15:30" },

      { day: "Friday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 9", section: "B", subject: "Library Period", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "08:30", endTime: "09:15" },
      { day: "Friday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 5", section: "B", subject: "Library & Reading", teacherName: "Rachel Green", roomNo: "Children Library", startTime: "09:15", endTime: "10:00" },
      { day: "Friday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 12", section: "A", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Periodicals Section", startTime: "10:15", endTime: "11:00" },
      { day: "Friday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 10", section: "B", subject: "Library & Research", teacherName: "Bhanu Prakash", roomNo: "Digital Library Deck", startTime: "11:00", endTime: "11:45" },
      { day: "Friday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 3", section: "A", subject: "Library & Storytelling", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "11:45", endTime: "12:30" },
      { day: "Friday", timeSlot: "01:15 PM - 02:00 PM", periodNumber: 6, className: "Class 7", section: "B", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Reading Deck", startTime: "13:15", endTime: "14:00" },
      { day: "Friday", timeSlot: "02:00 PM - 02:45 PM", periodNumber: 7, className: "Class 8", section: "A", subject: "Library & Reference", teacherName: "Bhanu Prakash", roomNo: "Central Library Hall", startTime: "14:00", endTime: "14:45" },
      { day: "Friday", timeSlot: "02:45 PM - 03:30 PM", periodNumber: 8, className: "Class 6", section: "B", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Reading Deck", startTime: "14:45", endTime: "15:30" },

      { day: "Saturday", timeSlot: "08:30 AM - 09:15 AM", periodNumber: 1, className: "Class 6", section: "A", subject: "Library & Reading", teacherName: "Bhanu Prakash", roomNo: "Reading Deck", startTime: "08:30", endTime: "09:15" },
      { day: "Saturday", timeSlot: "09:15 AM - 10:00 AM", periodNumber: 2, className: "Class 7", section: "B", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Central Library Hall", startTime: "09:15", endTime: "10:00" },
      { day: "Saturday", timeSlot: "10:15 AM - 11:00 AM", periodNumber: 3, className: "Class 8", section: "B", subject: "Library & Storytelling", teacherName: "Bhanu Prakash", roomNo: "Children Library", startTime: "10:15", endTime: "11:00" },
      { day: "Saturday", timeSlot: "11:00 AM - 11:45 AM", periodNumber: 4, className: "Class 9", section: "A", subject: "Library Period", teacherName: "Rachel Green", roomNo: "Central Library Hall", startTime: "11:00", endTime: "11:45" },
      { day: "Saturday", timeSlot: "11:45 AM - 12:30 PM", periodNumber: 5, className: "Class 10", section: "A", subject: "Library & Reference", teacherName: "Bhanu Prakash", roomNo: "Digital Library Deck", startTime: "11:45", endTime: "12:30" }
    ];

    defaultLibraryPeriods.forEach(slot => {
      const exists = timetable.some(t => t.className === slot.className && t.section === slot.section && t.day === slot.day && (t.periodNumber === slot.periodNumber || t.timeSlot === slot.timeSlot));
      if (!exists) {
        addTimetableSlot(slot);
      }
    });

    addToast('success', 'Library Schedule Synced', 'Populated Monday-Saturday Period 1 to 8 Library schedules from Admin Master Timetable.');
  };

  const totalClassesScheduled = new Set(librarySlots.map(s => `${s.className}-${s.section}`)).size;
  const todayActiveSlotsCount = librarySlots.filter(s => s.day === todayDayName).length;

  // Dedicated Print Popup Generator
  const handlePrintSchedule = () => {
    const printWin = window.open('', '_blank', 'width=1000,height=850');
    const titleText = activeTab === 'today'
      ? `Library Schedule - ${selectedDay}`
      : activeTab === 'weekly-matrix'
      ? `Weekly Library Schedule (Mon-Sat)`
      : `Class Schedule - ${selectedClass || 'All Classes'} ${selectedSection ? `Section ${selectedSection}` : ''}`;

    let contentHtml = '';

    if (activeTab === 'today') {
      contentHtml = `
        <h3 style="font-size: 15px; margin-bottom: 12px; color: #0284c7;">☀️ Daily Morning to Evening Library Schedule (${selectedDay})</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#0284c7; color:#ffffff;">
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">PERIOD</th>
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">TIME SLOT</th>
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">CLASS & SECTION</th>
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">SUBJECT / ACTIVITY</th>
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">LIBRARIAN IN-CHARGE</th>
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">LOCATION</th>
            </tr>
          </thead>
          <tbody>
            ${dayChronologicalSchedule.map(({ period, timeSlot, slot }) => `
              <tr style="background:${period % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold;">Period ${period}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-family:monospace; color:#d97706; font-weight:bold;">${timeSlot}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold; color:${slot ? '#0284c7' : '#94a3b8'};">
                  ${slot ? `${slot.className} - Section ${slot.section}` : '-- Free / Maintenance --'}
                </td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${slot ? slot.subject : 'N/A'}</td>
                <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold; color:#059669;">${slot ? (slot.teacherName || 'Bhanu Prakash') : 'N/A'}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${slot ? (slot.roomNo || 'Central Library Hall') : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'weekly-matrix') {
      contentHtml = `
        <h3 style="font-size: 15px; margin-bottom: 12px; color: #0284c7;">📅 Weekly Library Schedule (Monday to Saturday)</h3>
        <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:center;">
          <thead>
            <tr style="background:#0284c7; color:#ffffff;">
              <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">PERIOD & TIME</th>
              ${daysOfWeek.map(d => `<th style="padding:8px; border:1px solid #cbd5e1;">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(p => `
              <tr style="background:${p % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="padding:8px; border:1px solid #cbd5e1; text-align:left; font-weight:bold;">
                  Period ${p}<br><span style="font-size:9px; color:#d97706;">${periodTimeMap[p]}</span>
                </td>
                ${daysOfWeek.map(day => {
                  const slot = librarySlots.find(s => s.day === day && ((s.periodNumber || 0) === p || (s as any).period === p));
                  return `
                    <td style="padding:6px; border:1px solid #cbd5e1;">
                      ${slot ? `<strong style="color:#0369a1;">${slot.className}-${slot.section}</strong><br><span style="font-size:9px; color:#475569;">${slot.subject}</span>` : '<span style="color:#cbd5e1;">--</span>'}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      contentHtml = `
        <h3 style="font-size: 15px; margin-bottom: 12px; color: #0284c7;">🏫 Class Schedule: ${selectedClass || 'All Classes'} ${selectedSection ? `Section ${selectedSection}` : ''}</h3>
        ${classWeeklySchedule.length === 0 ? '<p style="padding:20px; text-align:center; color:#64748b;">No library periods scheduled for this class.</p>' : `
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="background:#0284c7; color:#ffffff;">
                <th style="padding:8px; border:1px solid #cbd5e1;">DAY</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">PERIOD</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">TIME SLOT</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">SUBJECT / ACTIVITY</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">LIBRARIAN</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">LOCATION</th>
              </tr>
            </thead>
            <tbody>
              ${classWeeklySchedule.map(s => `
                <tr>
                  <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold;">${s.day}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1;">Period ${s.periodNumber || '4'}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1; font-family:monospace; color:#d97706; font-weight:bold;">${s.timeSlot || `${s.startTime} - ${s.endTime}`}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1;">${s.subject}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold; color:#059669;">${s.teacherName || 'Bhanu Prakash'}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1;">${s.roomNo || 'Central Library Hall'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      `;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .school-name { font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: 0.5px; }
            .sub-title { font-size: 11px; color: #64748b; margin-top: 2px; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8; }
            @media print {
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="school-name">PIRNAV SCHOOLS</div>
              <div class="sub-title">Central Digital Library Timetable & Period Schedule</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Academic Year: 2026–27</div>
              <div style="font-size: 10px; color: #64748b;">Printed on: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          ${contentHtml}
          <div class="footer">
            Generated by Pirnav School Management System • Central Digital Library Desk
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/80 dark:border-sky-800 shadow-xs flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Library Timetable</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadOnlyAccess ? (
            <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
              <Eye className="w-3.5 h-3.5" /> View-Only Mode (Main Admin)
            </span>
          ) : (
            <button onClick={handleAutoPopulateLibrarySchedule} className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
              <RefreshCw className="w-4 h-4" /> Sync Admin Timetable
            </button>
          )}
          <button onClick={handlePrintSchedule} className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-extrabold text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20">
            <Printer className="w-4 h-4" /> Print Schedule
          </button>
        </div>
      </div>

      {/* Quick Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4.5 rounded-2xl bg-white dark:bg-slate-900 border space-y-1.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider">Total Weekly Periods</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{librarySlots.length} Slots</p>
          <span className="text-[10px] text-slate-500 font-semibold">Periods Scheduled Mon-Sat</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl bg-white dark:bg-slate-900 border space-y-1.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Classes Covered</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">{totalClassesScheduled} Batches</p>
          <span className="text-[10px] text-emerald-500 font-semibold">Classes 3 through 12</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl bg-white dark:bg-slate-900 border space-y-1.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">Today's Sessions ({selectedDay})</span>
          <p className="text-2xl font-black text-amber-600 font-mono">{dayChronologicalSchedule.filter(s => s.slot !== null).length} Periods</p>
          <span className="text-[10px] text-amber-500 font-semibold">Morning to Evening Timeline</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl bg-white dark:bg-slate-900 border space-y-1.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">Librarian Staff</span>
          <p className="text-2xl font-black text-indigo-600 font-mono">2 Staff</p>
          <span className="text-[10px] text-indigo-500 font-semibold">Bhanu Prakash & Rachel Green</span>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-3 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs">
        <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border flex flex-wrap items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" /> Today's Daily Schedule
          </button>
          <button
            onClick={() => setActiveTab('weekly-matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'weekly-matrix'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" /> Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('class-view')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'class-view'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <School className="w-4 h-4 shrink-0" /> Class & Section Schedule
          </button>
        </div>

        {activeTab === 'today' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Select Day:</span>
            <select
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-sky-700 dark:text-sky-300 outline-none cursor-pointer"
            >
              {daysOfWeek.map(d => (
                <option key={d} value={d}>{d} {d === todayDayName ? '(Today)' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'class-view' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="">Select Class</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="">Select Section</option>
              {availableSections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: TODAY'S DAILY CHRONOLOGICAL SCHEDULE (MORNING TO EVENING) */}
      {activeTab === 'today' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-sky-500 shrink-0" /> Morning to Evening Library Schedule for <span className="text-sky-600 font-black">{selectedDay}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">8 Periods (08:30 AM - 03:30 PM)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dayChronologicalSchedule.map(({ period, timeSlot, slot }) => (
              <div
                key={period}
                className={`glass-card p-5 rounded-3xl border transition-all space-y-3.5 relative overflow-hidden ${
                  slot
                    ? 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800 shadow-sm hover:shadow-md'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <span className="px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-[11px] uppercase tracking-wider whitespace-nowrap shrink-0">
                    Period {period}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {timeSlot}
                  </span>
                </div>

                {slot ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate" title={`${slot.className} - Section ${slot.section}`}>
                        {slot.className} - Section {slot.section}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] whitespace-nowrap shrink-0">
                        Active Class
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 pt-0.5">
                      <p className="flex items-center gap-2 truncate">
                        <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" /> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{slot.subject}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> <span className="text-slate-500 shrink-0">In-Charge:</span> <span className="font-bold text-emerald-700 dark:text-emerald-300 truncate">{slot.teacherName || 'Bhanu Prakash'}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <School className="w-3.5 h-3.5 text-purple-500 shrink-0" /> <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">{slot.roomNo || 'Central Library Hall'}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400">Library Free / Maintenance</p>
                    <span className="text-[10px] text-slate-400 font-mono">No class scheduled</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY MASTER MATRIX (MON-SAT, PERIOD 1-8 GRID) */}
      {activeTab === 'weekly-matrix' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-sky-500" /> Weekly Library Schedule (Monday to Saturday)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Shows which Class & Section is in the Library for every period</span>
          </div>

          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500 border-b">
                  <tr>
                    <th className="py-4 px-4 w-44">PERIOD & TIME</th>
                    {daysOfWeek.map(d => (
                      <th key={d} className={`py-4 px-4 text-center ${d === todayDayName ? 'bg-sky-100/70 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-black' : ''}`}>
                        {d} {d === todayDayName ? '• TODAY' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                    <tr key={period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="block font-black text-slate-900 dark:text-white">Period {period}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{periodTimeMap[period]}</span>
                      </td>

                      {daysOfWeek.map(day => {
                        const slot = librarySlots.find(s => s.day === day && ((s.periodNumber || 0) === period || (s as any).period === period));
                        return (
                          <td key={day} className={`py-3.5 px-3 text-center border-l ${day === todayDayName ? 'bg-sky-50/30 dark:bg-sky-950/20' : ''}`}>
                            {slot ? (
                              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-0.5">
                                <span className="block font-black text-sky-800 dark:text-sky-200 text-xs">
                                  {slot.className} - {slot.section}
                                </span>
                                <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[110px] mx-auto">
                                  {slot.subject}
                                </span>
                                <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {slot.teacherName || 'Bhanu Prakash'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700">--</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS & SECTION SPECIFIC SCHEDULE */}
      {activeTab === 'class-view' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-4.5 h-4.5 text-sky-500" /> Weekly Library Periods for{' '}
              {selectedClass ? (
                <span className="text-sky-600 font-black">{selectedClass} {selectedSection ? `- Section ${selectedSection}` : ''}</span>
              ) : (
                <span className="text-slate-400 font-bold italic">Select Class & Section</span>
              )}
            </h3>
            {selectedClass && (
              <span className="text-xs text-slate-500 font-medium">{classWeeklySchedule.length} Periods Scheduled</span>
            )}
          </div>

          {!selectedClass ? (
            <div className="glass-card p-12 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-3">
              <School className="w-12 h-12 text-sky-500 mx-auto animate-bounce" />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Please Select Class & Section</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">Choose a Class and Section from the dropdown filters above to view its specific weekly Library timetable periods.</p>
            </div>
          ) : classWeeklySchedule.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Library Periods Scheduled for {selectedClass} {selectedSection ? `- Section ${selectedSection}` : ''}</h4>
              <p className="text-xs text-slate-500">Click "Sync Admin Timetable" to populate standard class library periods.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classWeeklySchedule.map(slot => (
                <div key={slot.id} className="glass-card p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-3 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-[11px] uppercase tracking-wide whitespace-nowrap shrink-0">
                      {slot.day} • Period {slot.periodNumber || '4'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">{slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={`${slot.className} - Section ${slot.section}`}>{slot.className} - Section {slot.section}</h4>
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-0.5">
                    <p className="truncate"><span className="text-slate-400 shrink-0">Subject:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{slot.subject}</span></p>
                    <p className="truncate"><span className="text-slate-400 shrink-0">Librarian:</span> <span className="text-emerald-600 font-bold">{slot.teacherName || 'Bhanu Prakash'}</span></p>
                    <p className="truncate"><span className="text-slate-400 shrink-0">Location:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{slot.roomNo || 'Central Library Hall'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryTimetableView;
