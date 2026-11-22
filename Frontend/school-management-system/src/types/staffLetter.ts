export type StaffLetterType = 'offer' | 'relieving' | 'experience';

export interface StaffLetterSalaryBreakdown {
  basic: number;
  hra: number;
  specialAllowance: number;
  transportAllowance: number;
  grossMonthly: number;
  annualCtc: number;
}

export interface StaffLetterPayload {
  refNo: string;
  issueDate: string;
  candidateName: string;
  empId?: string;
  address?: string;
  phone?: string;
  email?: string;
  designation: string;
  department: string;
  branch: string;
  joiningDate: string;
  relievingDate?: string;
  salaryBreakdown?: StaffLetterSalaryBreakdown;
  probationMonths?: number;
  noticePeriodDays?: number;
  workingHours?: string;
  conductRating?: 'Exemplary' | 'Very Good' | 'Good' | 'Satisfactory';
  noDuesCleared?: boolean;
  reasonForRelieving?: string;
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
  signatureImageUrl?: string;
  sealImageUrl?: string;
  customTerms?: string[];
  remarks?: string;
}

export interface GeneratedStaffLetterRecord {
  id: string;
  letterNumber: string;
  letterType: StaffLetterType;
  staffId: string;
  staffEmpId: string;
  staffName: string;
  designation: string;
  department: string;
  branch: string;
  issueDate: string;
  generatedBy: string;
  status: 'Issued' | 'Draft';
  payload: StaffLetterPayload;
}

export interface StaffLetterRequest {
  id: string;
  requestType: 'relieving' | 'experience';
  staffId: string;
  staffEmpId: string;
  staffName: string;
  designation: string;
  department: string;
  branch: string;
  reason: string;
  relievingDate?: string;
  comments?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  generatedLetterId?: string;
  createdAt: string;
  updatedAt: string;
}
