const fs = require('fs');
const path = require('path');

const firstNamesMale = ['Liam', 'Noah', 'Oliver', 'James', 'Elijah', 'William', 'Henry', 'Lucas', 'Benjamin', 'Theodore', 'Mateo', 'Jackson', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Levi', 'Sebastian', 'Jack', 'Owen', 'Alexander', 'Aiden', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Matthew', 'Luke', 'Asher'];
const firstNamesFemale = ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Ava', 'Evelyn', 'Harper', 'Luna', 'Camila', 'Gianna', 'Elizabeth', 'Eleanor', 'Ella', 'Abigail', 'Sofia', 'Avery', 'Scarlett', 'Emily', 'Aria', 'Penelope', 'Chloe', 'Layla', 'Mila', 'Nora', 'Hazel', 'Madison', 'Ellie'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const classes = [
  { name: 'Class 5', p1: 'Class 3', p2: 'Class 4' },
  { name: 'Class 6', p1: 'Class 4', p2: 'Class 5' },
  { name: 'Class 7', p1: 'Class 5', p2: 'Class 6' },
  { name: 'Class 8', p1: 'Class 6', p2: 'Class 7' },
  { name: 'Class 9', p1: 'Class 7', p2: 'Class 8' },
  { name: 'Class 10', p1: 'Class 8', p2: 'Class 9' }
];

const sections = ['A', 'B'];

const students = [];
const feeLedgers = [];
const examMarks = [];

let counter = 1;

classes.forEach(c => {
  sections.forEach(sec => {
    for (let i = 1; i <= 5; i++) {
      const isMale = (counter % 2 === 1);
      const fn = isMale ? firstNamesMale[counter % firstNamesMale.length] : firstNamesFemale[counter % firstNamesFemale.length];
      const ln = lastNames[counter % lastNames.length];
      const stId = 'STU-' + String(counter).padStart(3, '0');
      const admNo = 'ADM2024-' + String(counter).padStart(3, '0');
      const rollNo = (100 + i).toString();
      
      // Odd student IDs have previous dues, even student IDs have NO previous dues
      const hasDues = (counter % 2 === 1);

      const totalFee2026 = 52000;
      const due2024 = hasDues ? 5000 : 0;
      const due2025 = hasDues ? 8000 : 0;
      const dueFee2026 = hasDues ? 12000 : 0;
      const paidFee2026 = totalFee2026 - dueFee2026;

      const student = {
        id: stId,
        admissionNo: admNo,
        rollNo: rollNo,
        firstName: fn,
        lastName: ln,
        gender: isMale ? 'Male' : 'Female',
        dob: '2012-05-' + String(10 + (counter % 15)).padStart(2, '0'),
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][counter % 4],
        religion: 'General',
        casteCategory: 'General',
        className: c.name,
        section: sec,
        category: 'General',
        status: 'Active',
        avatar: isMale 
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        joiningDate: '2023-06-10',
        branch: 'Main Campus',
        studentType: (counter % 3 === 0) ? 'Hosteller' : 'Day Scholar',
        fatherName: 'Robert ' + ln,
        fatherPhone: '98765' + String(10000 + counter),
        fatherOccupation: 'Professional',
        motherName: 'Clara ' + ln,
        motherPhone: '98765' + String(20000 + counter),
        email: fn.toLowerCase() + '.' + ln.toLowerCase() + '@student.edu',
        phone: '98765' + String(10000 + counter),
        address: 'H.No ' + (10 + counter) + ', Main Street, Knowledge City',
        totalFee: totalFee2026,
        paidFee: paidFee2026,
        dueFee: dueFee2026,
        attendancePct: hasDues ? 91.5 : 97.2,
        gpa: hasDues ? 3.8 : 4.5,
        academicHistory: [
          {
            id: 'ACH-' + stId + '-2024-2025',
            studentId: stId,
            admissionNo: admNo,
            academicYear: '2024-2025',
            className: c.p1,
            section: sec,
            rollNo: rollNo,
            branch: 'Main Campus',
            status: 'Promoted',
            promotionStatus: 'Promoted to Next Class',
            remarks: 'Completed session 2024-2025 successfully',
            createdAt: '2024-06-10'
          },
          {
            id: 'ACH-' + stId + '-2025-2026',
            studentId: stId,
            admissionNo: admNo,
            academicYear: '2025-2026',
            className: c.p2,
            section: sec,
            rollNo: rollNo,
            branch: 'Main Campus',
            status: 'Promoted',
            promotionStatus: 'Promoted to Next Class',
            remarks: 'Completed session 2025-2026 successfully',
            createdAt: '2025-06-10'
          }
        ]
      };

      students.push(student);

      // Fee Ledgers
      // 2024-2025
      const gross2024 = 45000;
      const paid2024 = gross2024 - due2024;
      feeLedgers.push({
        id: 'LED-2024-2025-' + stId,
        studentId: stId,
        studentName: fn + ' ' + ln,
        admissionNo: admNo,
        className: c.p1,
        section: sec,
        studentType: student.studentType,
        academicYear: '2024-2025',
        feeItems: [
          { headId: 'FH-01', headName: 'Tuition Fee', category: 'Tuition Fee', originalAmount: 30000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 30000, isApplicable: true, status: (paid2024 >= 30000 ? 'Paid' : 'Partial') },
          { headId: 'FH-02', headName: 'Admission & Annual Fee', category: 'Admission Fee', originalAmount: 15000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 15000, isApplicable: true, status: (due2024 > 0 ? 'Partial' : 'Paid') }
        ],
        totalOriginalAmount: gross2024,
        grossAmount: gross2024,
        totalScholarship: 0,
        totalDiscount: 0,
        totalFine: 0,
        totalPayable: gross2024,
        paidAmount: paid2024,
        dueBalance: due2024,
        createdAt: '2024-06-01',
        updatedAt: '2025-03-30',
        scholarshipAmount: 0,
        discountAmount: 0,
        fineAmount: 0,
        previousDue: 0
      });

      // 2025-2026
      const gross2025 = 48000;
      const paid2025 = gross2025 - due2025;
      feeLedgers.push({
        id: 'LED-2025-2026-' + stId,
        studentId: stId,
        studentName: fn + ' ' + ln,
        admissionNo: admNo,
        className: c.p2,
        section: sec,
        studentType: student.studentType,
        academicYear: '2025-2026',
        feeItems: [
          { headId: 'FH-01', headName: 'Tuition Fee', category: 'Tuition Fee', originalAmount: 33000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 33000, isApplicable: true, status: (paid2025 >= 33000 ? 'Paid' : 'Partial') },
          { headId: 'FH-02', headName: 'Admission & Annual Fee', category: 'Admission Fee', originalAmount: 15000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 15000, isApplicable: true, status: (due2025 > 0 ? 'Partial' : 'Paid') }
        ],
        totalOriginalAmount: gross2025,
        grossAmount: gross2025,
        totalScholarship: 0,
        totalDiscount: 0,
        totalFine: 0,
        totalPayable: gross2025,
        paidAmount: paid2025,
        dueBalance: due2025,
        createdAt: '2025-06-01',
        updatedAt: '2026-03-30',
        scholarshipAmount: 0,
        discountAmount: 0,
        fineAmount: 0,
        previousDue: due2024
      });

      // 2026-2027
      feeLedgers.push({
        id: 'LED-2026-2027-' + stId,
        studentId: stId,
        studentName: fn + ' ' + ln,
        admissionNo: admNo,
        className: c.name,
        section: sec,
        studentType: student.studentType,
        academicYear: '2026-2027',
        feeItems: [
          { headId: 'FH-01', headName: 'Tuition Fee', category: 'Tuition Fee', originalAmount: 36000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 36000, isApplicable: true, status: (paidFee2026 >= 36000 ? 'Paid' : 'Partial') },
          { headId: 'FH-02', headName: 'Admission & Annual Fee', category: 'Admission Fee', originalAmount: 16000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 16000, isApplicable: true, status: (dueFee2026 > 0 ? 'Partial' : 'Paid') }
        ],
        totalOriginalAmount: totalFee2026,
        grossAmount: totalFee2026,
        totalScholarship: 0,
        totalDiscount: 0,
        totalFine: 0,
        totalPayable: totalFee2026,
        paidAmount: paidFee2026,
        dueBalance: dueFee2026,
        createdAt: '2026-06-01',
        updatedAt: '2026-08-01',
        scholarshipAmount: 0,
        discountAmount: 0,
        fineAmount: 0,
        previousDue: due2025
      });

      // Exam Marks for 2024-2025 and 2025-2026
      ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'].forEach((subj, sIdx) => {
        const score2024 = 75 + ((counter + sIdx * 5) % 23);
        examMarks.push({
          id: 'EXM-2024-' + stId + '-' + subj,
          examId: 'EXAM-2024-2025-Annual',
          studentId: stId,
          subject: subj,
          marksObtained: score2024,
          totalMarks: 100,
          grade: score2024 >= 90 ? 'A1' : score2024 >= 80 ? 'A2' : 'B1',
          remarks: 'Annual Exam 2024-2025'
        });

        const score2025 = 78 + ((counter + sIdx * 7) % 20);
        examMarks.push({
          id: 'EXM-2025-' + stId + '-' + subj,
          examId: 'EXAM-2025-2026-Annual',
          studentId: stId,
          subject: subj,
          marksObtained: score2025,
          totalMarks: 100,
          grade: score2025 >= 90 ? 'A1' : score2025 >= 80 ? 'A2' : 'B1',
          remarks: 'Annual Exam 2025-2026'
        });
      });

      counter++;
    }
  });
});

const mockDataPath = path.join(__dirname, '../src/services/mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Replace initialStudents
const studentsStr = `export const initialStudents: Student[] = ${JSON.stringify(students, null, 2)};`;
mockDataContent = mockDataContent.replace(/export const initialStudents: Student\[\] = \[[\s\S]*?\n\];/m, studentsStr);

// Replace initialStudentFeeLedgers
const ledgersStr = `export const initialStudentFeeLedgers: StudentFeeLedger[] = ${JSON.stringify(feeLedgers, null, 2)};`;
mockDataContent = mockDataContent.replace(/export const initialStudentFeeLedgers: StudentFeeLedger\[\] = \[[\s\S]*?\n\];/m, ledgersStr);

// Replace initialExamMarks
const examMarksStr = `export const initialExamMarks: ExamMark[] = ${JSON.stringify(examMarks, null, 2)};`;
mockDataContent = mockDataContent.replace(/export const initialExamMarks: ExamMark\[\] = \[[\s\S]*?\n\];/m, examMarksStr);

fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
console.log('Successfully updated mockData.ts with 60 students (5 per section) with historical academic & fee ledger data!');
