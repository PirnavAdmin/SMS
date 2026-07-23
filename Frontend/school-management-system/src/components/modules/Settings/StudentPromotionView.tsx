import React, { useState } from 'react';
import { ArrowUpRight, Search, CheckCircle, ShieldAlert, Bus, Home, Plus } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const StudentPromotionView: React.FC = () => {
  const {
    academicYears,
    students,
    studentEnrollments,
    academicClasses,
    routeMasters,
    pickupPoints,
    hostelMasters,
    roomMasters,
    promoteStudents
  } = useData();

  const { addToast } = useToast();

  const [fromYear, setFromYear] = useState('2025-2026');
  const [toYear, setToYear] = useState('2026-2027');
  const [branch, setBranch] = useState('Main Campus');
  const [className, setClassName] = useState('Class 10');
  const [section, setSection] = useState('A');

  // Destination mapping states
  const [targetClass, setTargetClass] = useState('Class 11');
  const [targetSection, setTargetSection] = useState('A');

  // Checkboxes
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Transport/Hostel options
  const [transportOpt, setTransportOpt] = useState<'copy' | 'new' | 'none'>('copy');
  const [newRouteId, setNewRouteId] = useState('');
  const [newPickupPointId, setNewPickupPointId] = useState('');

  const [hostelOpt, setHostelOpt] = useState<'copy' | 'new' | 'none'>('copy');
  const [newHostelId, setNewHostelId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');

  // Load students belonging to this class & section in FromYear
  // To verify if they are in FromYear, we look at studentEnrollments:
  const enrollmentMatches = studentEnrollments.filter(
    e => e.academicYear === fromYear &&
         e.className === className &&
         e.section === section &&
         e.branch === branch &&
         e.status === 'Active'
  );

  const matchedStudents = students.filter(s =>
    enrollmentMatches.some(e => e.studentId === s.id) &&
    (`${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
     s.admissionNo.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(matchedStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, id]);
    } else {
      setSelectedStudentIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleExecutePromotion = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0) {
      addToast('warning', 'No Selection', 'Please select at least one student to promote.');
      return;
    }

    const targetYearObj = academicYears.find(ay => ay.name === toYear);
    if (targetYearObj && targetYearObj.status === 'Closed') {
      addToast('error', 'Closed Session', 'Promotion into a Closed Academic Year is prohibited.');
      return;
    }

    promoteStudents(selectedStudentIds, fromYear, toYear, targetClass, targetSection, {
      transport: transportOpt,
      hostel: hostelOpt,
      newRouteId: transportOpt === 'new' ? newRouteId : undefined,
      newPickupPointId: transportOpt === 'new' ? newPickupPointId : undefined,
      newHostelId: hostelOpt === 'new' ? newHostelId : undefined,
      newRoomId: hostelOpt === 'new' ? newRoomId : undefined
    });

    addToast('success', 'Promotion Successful', `Promoted ${selectedStudentIds.length} students to ${targetClass} (${toYear})`);
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Student Promotion Panel</h3>
        <p className="text-xs text-slate-500">Migrate students to upcoming semesters, auto-generate payables, and copy facilities assignments</p>
      </div>

      <form onSubmit={handleExecutePromotion} className="space-y-6">
        {/* Step 1: Mapping filters */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-4 shadow-sm">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">From Session *</label>
            <select
              value={fromYear}
              onChange={e => setFromYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            >
              {academicYears.map(ay => <option key={ay.id} value={ay.name}>{ay.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">To Session *</label>
            <select
              value={toYear}
              onChange={e => setToYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-900 dark:text-purple-200 font-bold"
            >
              {academicYears.map(ay => <option key={ay.id} value={ay.name}>{ay.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Branch *</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            >
              <option value="Main Campus">Main Campus</option>
              <option value="North Branch">North Branch</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Class *</label>
            <select
              value={className}
              onChange={e => setClassName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            >
              {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Section *</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* Step 2: Destination Promotion Mapping */}
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-purple-600 dark:text-purple-400">Destination Class & Section Mapping</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Promote Into Class *</label>
              <select
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Promote Into Section *</label>
              <select
                value={targetSection}
                onChange={e => setTargetSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Transport & Hostel Assignment Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transport copy */}
          <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs flex items-center gap-1 text-slate-900 dark:text-white"><Bus className="w-4 h-4 text-purple-500" /> Transport Promotion Policy</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="transPolicy" checked={transportOpt === 'copy'} onChange={() => setTransportOpt('copy')} className="w-4 h-4 cursor-pointer" />
                <span>Copy previous session bus route allocation</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="transPolicy" checked={transportOpt === 'new'} onChange={() => setTransportOpt('new')} className="w-4 h-4 cursor-pointer" />
                <span>Assign a new bus route for this year</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="transPolicy" checked={transportOpt === 'none'} onChange={() => setTransportOpt('none')} className="w-4 h-4 cursor-pointer" />
                <span>Do not allocate transport services</span>
              </label>

              {transportOpt === 'new' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">New Route *</label>
                    <select value={newRouteId} onChange={e => setNewRouteId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                      {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">New Pickup Point *</label>
                    <select value={newPickupPointId} onChange={e => setNewPickupPointId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                      {pickupPoints.map(p => <option key={p.id} value={p.id}>{p.pickupName}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hostel copy */}
          <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs flex items-center gap-1 text-slate-900 dark:text-white"><Home className="w-4 h-4 text-purple-500" /> Hostel Promotion Policy</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="hostelPolicy" checked={hostelOpt === 'copy'} onChange={() => setHostelOpt('copy')} className="w-4 h-4 cursor-pointer" />
                <span>Copy previous session room & bed allocation</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="hostelPolicy" checked={hostelOpt === 'new'} onChange={() => setHostelOpt('new')} className="w-4 h-4 cursor-pointer" />
                <span>Allocate a new hostel room for this year</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer">
                <input type="radio" name="hostelPolicy" checked={hostelOpt === 'none'} onChange={() => setHostelOpt('none')} className="w-4 h-4 cursor-pointer" />
                <span>Do not assign hostel residency</span>
              </label>

              {hostelOpt === 'new' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">New Hostel *</label>
                    <select value={newHostelId} onChange={e => setNewHostelId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                      {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">New Room *</label>
                    <select value={newRoomId} onChange={e => setNewRoomId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                      {roomMasters.map(r => <option key={r.id} value={r.id}>{r.roomNumber} ({r.roomTypeName})</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Students selection List */}
        <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 flex flex-col sm:flex-row gap-3 justify-between items-center border-b">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Active Student Cohort ({matchedStudents.length})</h4>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === matchedStudents.length && matchedStudents.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Current Class</th>
                  <th className="py-3 px-4">Current Section</th>
                  <th className="py-3 px-4">GPA / GPA Grade</th>
                  <th className="py-3 px-4 text-center">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {matchedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No active students found in this search cluster.</td>
                  </tr>
                ) : (
                  matchedStudents.map(student => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => handleSelectOne(student.id, e.target.checked)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{student.admissionNo}</td>
                        <td className="py-3 px-4">{student.firstName} {student.lastName}</td>
                        <td className="py-3 px-4">{student.className}</td>
                        <td className="py-3 px-4">Section {student.section}</td>
                        <td className="py-3 px-4 text-indigo-600 font-mono font-bold">{student.gpa ? `${student.gpa.toFixed(2)} GPA` : 'N/A'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Promoted</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit bar */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" /> Execute Batch Promotion ({selectedStudentIds.length})
          </button>
        </div>
      </form>
    </div>
  );
};
export default StudentPromotionView;
