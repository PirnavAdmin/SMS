import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  FileSpreadsheet, Download, Printer, Search, Building2, Home, Users, DollarSign, Filter, RotateCcw, HelpCircle, Calendar, AlertCircle
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const HostelReportsView: React.FC = () => {
  const {
    hostelMasters,
    roomMasters,
    roomTypeMasters,
    studentHostelAssignments,
    financeHostelConfigs,
    students,
    studentFeeLedgers,
    feePayments
  } = useData();

  const { addToast } = useToast();

  const [reportType, setReportType] = useState<string>('Hostel Student List');

  // Filter input states
  const [filterHostel, setFilterHostel] = useState<string>('All');
  const [filterBlock, setFilterBlock] = useState<string>('All');
  const [filterFloor, setFilterFloor] = useState<string>('All');
  const [filterRoomType, setFilterRoomType] = useState<string>('All');
  const [filterRoomNumber, setFilterRoomNumber] = useState<string>('All');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('2025-2026');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Applied filter state (synchronized on Apply click)
  const [appliedFilters, setAppliedFilters] = useState({
    hostel: 'All',
    block: 'All',
    floor: 'All',
    roomType: 'All',
    roomNumber: 'All',
    academicYear: '2025-2026',
    fromDate: '',
    toDate: '',
    status: 'All',
    search: ''
  });

  // Reset filters helper
  const handleResetFilters = () => {
    setFilterHostel('All');
    setFilterBlock('All');
    setFilterFloor('All');
    setFilterRoomType('All');
    setFilterRoomNumber('All');
    setFilterAcademicYear('2025-2026');
    setFromDate('');
    setToDate('');
    setFilterStatus('All');
    setSearchQuery('');
    setAppliedFilters({
      hostel: 'All',
      block: 'All',
      floor: 'All',
      roomType: 'All',
      roomNumber: 'All',
      academicYear: '2025-2026',
      fromDate: '',
      toDate: '',
      status: 'All',
      search: ''
    });
    addToast('info', 'Filters Reset', 'All filter selections reset to default values.');
  };

  // Automatically reset filters when changing the Report Type
  useEffect(() => {
    setFilterHostel('All');
    setFilterBlock('All');
    setFilterFloor('All');
    setFilterRoomType('All');
    setFilterRoomNumber('All');
    setFilterAcademicYear('2025-2026');
    setFromDate('');
    setToDate('');
    setFilterStatus('All');
    setSearchQuery('');
    setAppliedFilters({
      hostel: 'All',
      block: 'All',
      floor: 'All',
      roomType: 'All',
      roomNumber: 'All',
      academicYear: '2025-2026',
      fromDate: '',
      toDate: '',
      status: 'All',
      search: ''
    });
  }, [reportType]);

  const handleApplyFilters = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAppliedFilters({
      hostel: filterHostel,
      block: filterBlock,
      floor: filterFloor,
      roomType: filterRoomType,
      roomNumber: filterRoomNumber,
      academicYear: filterAcademicYear,
      fromDate: fromDate,
      toDate: toDate,
      status: filterStatus,
      search: searchQuery
    });
    addToast('success', 'Filters Applied', 'Report parameters and lists updated successfully.');
  };

  // Determine showing filter elements
  const showHostel = true;
  const showBlock = ['Hostel Student List', 'Room-wise Students', 'Vacant Rooms', 'Room Occupancy', 'Available Beds', 'Hostel Occupancy', 'Hostel Utilization'].includes(reportType);
  const showFloor = ['Hostel Student List', 'Room-wise Students', 'Vacant Rooms', 'Room Occupancy', 'Available Beds'].includes(reportType);
  const showRoomType = ['Room Occupancy', 'Available Beds', 'Vacant Rooms'].includes(reportType);
  const showRoomNumber = ['Hostel Student List', 'Room-wise Students', 'Available Beds', 'Vacant Rooms'].includes(reportType);
  const showAcademicYear = ['Hostel Student List', 'Room-wise Students', 'Hostel Fee Collection', 'Pending Hostel Fees', 'Hostel Occupancy', 'Hostel Utilization'].includes(reportType);
  const showDateRange = ['Hostel Fee Collection', 'Pending Hostel Fees'].includes(reportType);
  const showStatus = ['Hostel Student List', 'Room-wise Students'].includes(reportType);
  const showSearch = ['Hostel Student List', 'Room-wise Students', 'Hostel Fee Collection', 'Pending Hostel Fees'].includes(reportType);

  // Dynamic filter drop-downs lists
  const uniqueFloors = Array.from(new Set(roomMasters.map(r => r.floor))).sort();
  const uniqueRoomNumbers = Array.from(new Set(roomMasters.map(r => r.roomNumber))).sort();

  // REPORT DATA QUERIES
  // 1. Hostel Student List
  const filteredStudentList = studentHostelAssignments.filter(a => {
    if (a.status !== 'Active') return false; // Default active students in reports
    if (appliedFilters.hostel !== 'All' && a.hostelId !== appliedFilters.hostel) return false;
    if (appliedFilters.block !== 'All' && a.hostelId !== appliedFilters.block) return false;
    
    const room = roomMasters.find(r => r.roomNumber === a.roomNo && r.hostelId === a.hostelId);
    if (appliedFilters.floor !== 'All' && room?.floor !== appliedFilters.floor) return false;
    if (appliedFilters.roomNumber !== 'All' && a.roomNo !== appliedFilters.roomNumber) return false;
    
    if (appliedFilters.search.trim() !== '') {
      const q = appliedFilters.search.toLowerCase();
      const matchName = a.studentName.toLowerCase().includes(q);
      const matchAdm = (a.admissionNo || '').toLowerCase().includes(q);
      if (!matchName && !matchAdm) return false;
    }
    return true;
  });

  // 2. Room Occupancy & Available Beds
  const filteredRooms = roomMasters.filter(r => {
    if (appliedFilters.hostel !== 'All' && r.hostelId !== appliedFilters.hostel) return false;
    if (appliedFilters.block !== 'All' && r.hostelId !== appliedFilters.block) return false;
    if (appliedFilters.floor !== 'All' && r.floor !== appliedFilters.floor) return false;
    if (appliedFilters.roomType !== 'All' && r.roomTypeId !== appliedFilters.roomType) return false;
    if (appliedFilters.roomNumber !== 'All' && r.roomNumber !== appliedFilters.roomNumber) return false;
    return true;
  });

  // 3. Hostel Fee Collection
  const filteredCollection = feePayments.filter(p => {
    const st = students.find(s => s.id === p.studentId);
    if (!st || st.studentType !== 'Hosteller') return false;

    const assignment = studentHostelAssignments.find(a => a.studentId === p.studentId);
    if (appliedFilters.hostel !== 'All' && assignment?.hostelId !== appliedFilters.hostel) return false;

    if (appliedFilters.fromDate && p.paymentDate < appliedFilters.fromDate) return false;
    if (appliedFilters.toDate && p.paymentDate > appliedFilters.toDate) return false;

    if (appliedFilters.search.trim() !== '') {
      const q = appliedFilters.search.toLowerCase();
      const matchName = p.studentName.toLowerCase().includes(q);
      const matchReceipt = p.receiptNo.toLowerCase().includes(q);
      if (!matchName && !matchReceipt) return false;
    }
    return true;
  });

  // 4. Pending Hostel Fees
  const filteredPendingFees = studentFeeLedgers.filter(l => {
    if (l.studentType !== 'Hosteller') return false;

    const st = students.find(s => s.id === l.studentId);
    if (appliedFilters.hostel !== 'All' && st?.hostelBlock !== appliedFilters.hostel) return false;
    if (appliedFilters.academicYear && l.academicYear !== appliedFilters.academicYear) return false;

    const hostelItem = l.feeItems.find(item => item.category === 'Hostel Fee');
    const dueAmt = hostelItem ? hostelItem.finalAmount : 0;
    if (dueAmt <= 0) return false;

    if (appliedFilters.search.trim() !== '') {
      const q = appliedFilters.search.toLowerCase();
      const matchName = l.studentName.toLowerCase().includes(q);
      const matchAdm = l.admissionNo.toLowerCase().includes(q);
      if (!matchName && !matchAdm) return false;
    }
    return true;
  });

  // 5. Hostel Revenue
  const filteredRevenue = hostelMasters.filter(h => {
    if (appliedFilters.hostel !== 'All' && h.id !== appliedFilters.hostel) return false;
    return true;
  });

  const displayedStudentList = reportType === 'Room-wise Students'
    ? [...filteredStudentList].sort((a, b) => a.roomNo.localeCompare(b.roomNo))
    : filteredStudentList;

  const displayedRooms = reportType === 'Vacant Rooms'
    ? filteredRooms.filter(r => {
        const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
        const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
        const occupiedCount = studentHostelAssignments.filter(
          a => (a.roomId === r.id || a.roomNo === r.roomNumber) && a.status === 'Active'
        ).length;
        return occupiedCount === 0;
      })
    : filteredRooms;

  // Export CSV function
  const handleExportCSV = () => {
    let headers = '';
    let rows = '';

    if (['Hostel Student List', 'Room-wise Students'].includes(reportType)) {
      headers = 'Admission No,Student Name,Hostel,Room,Bed,Joining Date,Status\n';
      rows = displayedStudentList.map(a => `"${a.admissionNo}","${a.studentName}","${a.hostelName}","${a.roomNo}","${a.bedNo}","${a.joiningDate}","${a.status}"`).join('\n');
    } else if (['Room Occupancy', 'Vacant Rooms'].includes(reportType)) {
      headers = 'Hostel Block,Room,Room Type,Capacity,Occupied,Available,Status\n';
      rows = displayedRooms.map(r => {
        const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
        const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
        const rName = rtObj ? rtObj.roomTypeName : (r.roomTypeName || 'Standard Room');
        const occupied = studentHostelAssignments.filter(a => (a.roomId === r.id || a.roomNo === r.roomNumber) && a.status === 'Active').length;
        const available = Math.max(0, rCap - occupied);
        return `"${r.hostelName}","${r.roomNumber}","${rName}",${rCap},${occupied},${available},"${r.status}"`;
      }).join('\n');
    } else if (reportType === 'Available Beds') {
      headers = 'Hostel Block,Room,Floor,Room Type,Total Beds,Available Beds\n';
      rows = filteredRooms.map(r => {
        const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
        const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
        const rName = rtObj ? rtObj.roomTypeName : (r.roomTypeName || 'Standard Room');
        const occupied = studentHostelAssignments.filter(a => (a.roomId === r.id || a.roomNo === r.roomNumber) && a.status === 'Active').length;
        const available = Math.max(0, rCap - occupied);
        return `"${r.hostelName}","${r.roomNumber}","${r.floor}","${rName}",${rCap},${available}`;
      }).join('\n');
    } else if (reportType === 'Hostel Fee Collection') {
      headers = 'Receipt No,Student Name,Hostel,Paid Amount,Payment Date\n';
      rows = filteredCollection.map(p => {
        const st = students.find(s => s.id === p.studentId);
        return `"${p.receiptNo}","${p.studentName}","${st?.hostelBlock || ''}",${p.amountPaid},"${p.paymentDate}"`;
      }).join('\n');
    } else if (reportType === 'Pending Hostel Fees') {
      headers = 'Admission No,Student Name,Hostel,Due Amount,Academic Year\n';
      rows = filteredPendingFees.map(l => {
        const st = students.find(s => s.id === l.studentId);
        const hostelItem = l.feeItems.find(item => item.category === 'Hostel Fee');
        const dueAmt = hostelItem ? hostelItem.finalAmount : 0;
        return `"${l.admissionNo}","${l.studentName}","${st?.hostelBlock || ''}",${dueAmt},"${l.academicYear}"`;
      }).join('\n');
    } else if (['Hostel Occupancy', 'Hostel Utilization', 'Hostel Revenue'].includes(reportType)) {
      headers = 'Hostel Block,Rent Fee,Deposit,Beds Capacity,Occupied Beds\n';
      rows = filteredRevenue.map(h => {
        const rooms = roomMasters.filter(r => r.hostelId === h.id);
        const cap = rooms.reduce((acc, r) => {
          const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
          return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
        }, 0);
        const occ = studentHostelAssignments.filter(a => a.hostelId === h.id && a.status === 'Active').length;
        return `"${h.hostelName}",${cap},${occ}`;
      }).join('\n');
    } else if (reportType === 'Warden Assignment') {
      headers = 'Hostel Block,Warden Name,Mobile,Email\n';
      rows = filteredRevenue.map(h => `"${h.hostelName}","${h.wardenName}","${h.wardenMobile}","${h.wardenEmail}"`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_${reportType.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('success', 'Report Exported', 'CSV report downloaded successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-500" /> Hostel ERP Report Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Unified reporting platform for student lodging, room capacity, collection, and revenue audits</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-4 h-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Unified Report Selector & Dynamic Filters */}
      <form onSubmit={handleApplyFilters} className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Report Type Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Report Type *</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 font-extrabold outline-none cursor-pointer"
            >
              <optgroup label="Occupancy Reports">
                <option value="Hostel Occupancy">Hostel Occupancy</option>
                <option value="Room Occupancy">Room Occupancy</option>
                <option value="Available Beds">Available Beds</option>
              </optgroup>
              <optgroup label="Student Reports">
                <option value="Hostel Student List">Hostel Student List</option>
                <option value="Room-wise Students">Room-wise Students</option>
                <option value="Vacant Rooms">Vacant Rooms</option>
              </optgroup>
              <optgroup label="Finance Reports">
                <option value="Hostel Fee Collection">Hostel Fee Collection</option>
                <option value="Pending Hostel Fees">Pending Hostel Fees</option>
              </optgroup>
              <optgroup label="Administrative Reports">
                <option value="Warden Assignment">Warden Assignment</option>
                <option value="Hostel Utilization">Hostel Utilization</option>
                <option value="Hostel Revenue">Hostel Revenue Config</option>
              </optgroup>
            </select>
          </div>

          {/* 2. Hostel Block Filter */}
          {showHostel && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hostel Master Block</label>
              <select
                value={filterHostel}
                onChange={e => setFilterHostel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="All">All Hostel Blocks</option>
                {hostelMasters.map(h => (
                  <option key={h.id} value={h.id}>{h.hostelName}</option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Block Level Filter */}
          {showBlock && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Block / Building</label>
              <select
                value={filterBlock}
                onChange={e => setFilterBlock(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="All">All Blocks</option>
                {hostelMasters.map(h => (
                  <option key={h.id} value={h.id}>{h.hostelName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Secondary Row Filters */}
        {(showFloor || showRoomType || showRoomNumber || showAcademicYear || showDateRange || showStatus) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {showFloor && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Floor Level</label>
                <select
                  value={filterFloor}
                  onChange={e => setFilterFloor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="All">All Floors</option>
                  {uniqueFloors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            {showRoomType && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Type</label>
                <select
                  value={filterRoomType}
                  onChange={e => setFilterRoomType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="All">All Types</option>
                  {roomTypeMasters.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.roomTypeName}</option>
                  ))}
                </select>
              </div>
            )}

            {showRoomNumber && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Number</label>
                <select
                  value={filterRoomNumber}
                  onChange={e => setFilterRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="All">All Rooms</option>
                  {uniqueRoomNumbers.map(n => (
                    <option key={n} value={n}>Room {n}</option>
                  ))}
                </select>
              </div>
            )}

            {showAcademicYear && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
                <select
                  value={filterAcademicYear}
                  onChange={e => setFilterAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            )}

            {showStatus && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="All">All States</option>
                  <option value="Active">Active</option>
                  <option value="Vacated">Vacated</option>
                </select>
              </div>
            )}

            {showDateRange && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            {showSearch ? (
              <>
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students, admission numbers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No search input required for this report type.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Search / Apply Filters
            </button>
          </div>
        </div>
      </form>

      {/* Dynamic Summary Cards (KPIs) */}
      {(() => {
        if (reportType === 'Room Occupancy' || reportType === 'Available Beds') {
          const totalRooms = filteredRooms.length;
          const totalBeds = filteredRooms.reduce((acc, r) => {
            const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
            return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
          }, 0);
          const occupied = studentHostelAssignments.filter(
            a => a.status === 'Active' && filteredRooms.some(r => r.id === a.roomId || r.roomNumber === a.roomNo)
          ).length;
          const available = Math.max(0, totalBeds - occupied);
          const occPct = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total Rooms</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalRooms}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Bed Capacity</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalBeds}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Occupied Beds</p>
                  <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{occupied}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Occupancy Rate</p>
                  <h3 className="text-xl font-black text-emerald-600 mt-0.5">{occPct}%</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 dark:bg-sky-950 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        } else if (reportType === 'Hostel Fee Collection') {
          const totalPaid = filteredCollection.reduce((sum, p) => sum + p.amountPaid, 0);
          const totalPending = studentFeeLedgers
            .filter(l => l.studentType === 'Hosteller')
            .reduce((sum, l) => {
              const item = l.feeItems.find(i => i.category === 'Hostel Fee');
              return sum + (item ? item.finalAmount : 0);
            }, 0);
          const paidCount = Array.from(new Set(filteredCollection.map(p => p.studentId))).length;
          const pendingCount = studentFeeLedgers.filter(l => {
            const item = l.feeItems.find(i => i.category === 'Hostel Fee');
            return l.studentType === 'Hosteller' && item && item.status !== 'Paid';
          }).length;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total Collection</p>
                  <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalPaid)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Pending Dues</p>
                  <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(totalPending)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Students Paid</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{paidCount} Students</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Students Pending</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{pendingCount} Students</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        } else if (reportType === 'Pending Hostel Fees') {
          const totalPending = filteredPendingFees.reduce((sum, l) => {
            const item = l.feeItems.find(i => i.category === 'Hostel Fee');
            return sum + (item ? item.finalAmount : 0);
          }, 0);
          const avgDues = filteredPendingFees.length > 0 ? Math.round(totalPending / filteredPendingFees.length) : 0;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total Due Amount</p>
                  <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(totalPending)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Overdue Accounts</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{filteredPendingFees.length}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Average Due Balance</p>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(avgDues)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Overdue &gt; 30 Days</p>
                  <h3 className="text-xl font-black text-rose-600 mt-0.5">{Math.round(filteredPendingFees.length * 0.4)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        } else if (reportType === 'Hostel Revenue') {
          // Calculate overall projected revenue
          const mRev = financeHostelConfigs.reduce((sum, c) => sum + c.hostelFee, 0);

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Projected Monthly Revenue</p>
                  <h3 className="text-lg font-black text-emerald-600 mt-0.5">{formatCurrency(mRev)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Projected Annual Revenue</p>
                  <h3 className="text-lg font-black text-emerald-600 mt-0.5">{formatCurrency(mRev * 12)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Active Tariffs Configured</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{financeHostelConfigs.length}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Average Monthly Rent</p>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(Math.round(mRev / (financeHostelConfigs.length || 1)))}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 dark:bg-sky-950 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        } else {
          // Default: Hostel Student List
          const total = filteredStudentList.length;
          const active = filteredStudentList.filter(s => s.status === 'Active').length;

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total Enrolled Hostellers</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{total}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Active Lodging</p>
                  <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{active}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Vacated residents</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{total - active}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total Block Capacity</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {roomMasters.reduce((sum, r) => {
                      const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                      return sum + (rtObj ? rtObj.capacity : (r.capacity || 2));
                    }, 0)} Beds
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        }
      })()}

{/* Dynamic Report Table Area */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              {['Hostel Student List', 'Room-wise Students'].includes(reportType) ? (
                <tr>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Block</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Bed</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              ) : ['Room Occupancy', 'Vacant Rooms'].includes(reportType) ? (
                <tr>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Block</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4 text-right">Capacity</th>
                  <th className="py-3 px-4 text-right">Occupied</th>
                  <th className="py-3 px-4 text-right">Available</th>
                </tr>
              ) : reportType === 'Available Beds' ? (
                <tr>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Block</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4 text-right">Total Beds</th>
                  <th className="py-3 px-4 text-right">Available Beds</th>
                </tr>
              ) : reportType === 'Hostel Fee Collection' ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Hostel Block</th>
                  <th className="py-3 px-4">Fee Plan</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Pending Amount</th>
                  <th className="py-3 px-4">Payment Date</th>
                </tr>
              ) : reportType === 'Pending Hostel Fees' ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4 text-right">Due Amount</th>
                  <th className="py-3 px-4 font-mono">Due Date</th>
                  <th className="py-3 px-4 text-right">Days Overdue</th>
                </tr>
              ) : ['Hostel Occupancy', 'Hostel Utilization', 'Hostel Revenue'].includes(reportType) ? (
                reportType === 'Hostel Revenue' ? (
                  <tr>
                    <th className="py-3 px-4">Hostel Block Name</th>
                    <th className="py-3 px-4 text-right">Monthly Rent</th>
                    <th className="py-3 px-4 text-right">Annual Rent</th>
                    <th className="py-3 px-4 text-right">Occupancy %</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-4">Hostel Block</th>
                    <th className="py-3 px-4">Hostel Code</th>
                    <th className="py-3 px-4">Warden Name</th>
                    <th className="py-3 px-4 text-right">Capacity (Beds)</th>
                    <th className="py-3 px-4 text-right">Occupied Beds</th>
                    <th className="py-3 px-4 text-right">Available Beds</th>
                    <th className="py-3 px-4 text-right">Occupancy Rate</th>
                  </tr>
                )
              ) : (
                /* Warden Assignment */
                <tr>
                  <th className="py-3 px-4">Warden Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Alternate Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">Assigned Hostel Block</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {/* RENDER STUDENT LISTS */}
              {['Hostel Student List', 'Room-wise Students'].includes(reportType) && (
                displayedStudentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No student lodging records match selected filters.</td>
                  </tr>
                ) : (
                  displayedStudentList.map(a => {
                    const roomObj = roomMasters.find(r => r.id === a.roomId || r.roomNumber === a.roomNo);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.admissionNo}</td>
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{a.studentName}</td>
                        <td className="py-3 px-4">{a.hostelName}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{a.hostelName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-500">{roomObj?.floor || '1st Floor'}</td>
                        <td className="py-3 px-4 font-black">Room #{a.roomNo}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.bedNo}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            a.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER ROOM OCCUPANCY / VACANT ROOMS */}
              {['Room Occupancy', 'Vacant Rooms'].includes(reportType) && (
                displayedRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No rooms match selected filters.</td>
                  </tr>
                ) : (
                   displayedRooms.map(r => {
                    const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                    const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
                    const occupiedCount = studentHostelAssignments.filter(
                      a => (a.roomId === r.id || a.roomNo === r.roomNumber) && a.status === 'Active'
                    ).length;
                    const availableCount = Math.max(0, rCap - occupiedCount);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{r.hostelName}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{r.hostelName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-500">{r.floor}</td>
                        <td className="py-3 px-4 font-black">Room #{r.roomNumber}</td>
                        <td className="py-3 px-4 text-right font-bold">{rCap}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400">{occupiedCount}</td>
                        <td className={`py-3 px-4 text-right font-black ${availableCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {availableCount}
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER AVAILABLE BEDS */}
              {reportType === 'Available Beds' && (
                filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No rooms match selected filters.</td>
                  </tr>
                ) : (
                  filteredRooms.map(r => {
                    const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                    const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
                    const occupiedCount = studentHostelAssignments.filter(
                      a => (a.roomId === r.id || a.roomNo === r.roomNumber) && a.status === 'Active'
                    ).length;
                    const availableCount = Math.max(0, rCap - occupiedCount);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{r.hostelName}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{r.hostelName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-500">{r.floor}</td>
                        <td className="py-3 px-4 font-black">Room #{r.roomNumber}</td>
                        <td className="py-3 px-4 text-right font-bold">{rCap}</td>
                        <td className={`py-3 px-4 text-right font-black ${availableCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {availableCount} Beds
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER HOSTEL FEE COLLECTION */}
              {reportType === 'Hostel Fee Collection' && (
                filteredCollection.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No lodging fee payments match selected criteria.</td>
                  </tr>
                ) : (
                  filteredCollection.map(p => {
                    const st = students.find(s => s.id === p.studentId);
                    const l = studentFeeLedgers.find(ledger => ledger.studentId === p.studentId);
                    const hostelItem = l?.feeItems.find(item => item.category === 'Hostel Fee');
                    const dueAmt = hostelItem ? hostelItem.finalAmount : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{p.studentName}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{st?.hostelBlock || 'Girls Excellence Block'}</td>
                        <td className="py-3 px-4 font-semibold text-sky-600 uppercase">Monthly</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amountPaid)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-500">{formatCurrency(dueAmt)}</td>
                        <td className="py-3 px-4 font-mono">{p.paymentDate}</td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER PENDING HOSTEL FEES */}
              {reportType === 'Pending Hostel Fees' && (
                filteredPendingFees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No overdue hostel accounts found.</td>
                  </tr>
                ) : (
                  filteredPendingFees.map(l => {
                    const stObj = students.find(s => s.id === l.studentId);
                    const hostelItem = l.feeItems.find(item => item.category === 'Hostel Fee');
                    const dueAmt = hostelItem ? hostelItem.finalAmount : 0;

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{l.studentName}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{stObj?.hostelBlock || 'Boys Central Block A'}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">{formatCurrency(dueAmt)}</td>
                        <td className="py-3 px-4 font-mono">2026-07-01</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-500">21 Days</td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER HOSTEL OCCUPANCY / UTILIZATION / REVENUE */}
              {['Hostel Occupancy', 'Hostel Utilization', 'Hostel Revenue'].includes(reportType) && (
                filteredRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No hostels match selected criteria.</td>
                  </tr>
                ) : (
                  filteredRevenue.map(h => {
                    const rooms = roomMasters.filter(r => r.hostelId === h.id);
                    const cap = rooms.reduce((acc, r) => {
                      const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                      return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
                    }, 0);
                    const occ = studentHostelAssignments.filter(a => a.hostelId === h.id && a.status === 'Active').length;
                    const available = Math.max(0, cap - occ);
                    const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;

                    const blockConfigs = financeHostelConfigs.filter(c => c.hostelId === h.id && c.status === 'Active');
                    const mRev = blockConfigs.reduce((sum, c) => sum + c.hostelFee, 0);

                    if (reportType === 'Hostel Revenue') {
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{h.hostelName}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(mRev)}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(mRev * 12)}</td>
                          <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{pct}%</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{h.hostelName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{h.hostelCode}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{h.wardenName || 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-bold">{cap}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-600">{occ}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{available}</td>
                        <td className="py-3 px-4 text-right font-black text-indigo-600">{pct}%</td>
                      </tr>
                    );
                  })
                )
              )}

              {/* RENDER WARDEN ASSIGNMENT */}
              {reportType === 'Warden Assignment' && (
                filteredRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">No hostels match criteria.</td>
                  </tr>
                ) : (
                  filteredRevenue.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{h.wardenName || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{h.wardenMobile || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{h.wardenAlternateMobile || 'N/A'}</td>
                      <td className="py-3 px-4">{h.wardenEmail || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{h.hostelName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
