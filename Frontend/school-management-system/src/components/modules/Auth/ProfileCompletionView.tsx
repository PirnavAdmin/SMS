import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { CheckCircle2, ChevronRight, Upload, User, MapPin, Building, GraduationCap, Briefcase, FileText } from 'lucide-react';

export const ProfileCompletionView: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    personal: { dob: '', gender: '', altPhone: '', maritalStatus: '' },
    contact: { address: '', city: '', state: '', pincode: '', emergencyContact: '' },
    govId: { aadhaar: '', pan: '' },
    qualification: { degree: '', university: '', yearOfPassing: '' },
    experience: { prevOrg: '', years: '', role: '' },
    bank: { accName: '', accNo: '', ifsc: '', bankName: '' }
  });

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Contact', icon: MapPin },
    { num: 3, title: 'Government ID', icon: Building },
    { num: 4, title: 'Qualification', icon: GraduationCap },
    { num: 5, title: 'Experience', icon: Briefcase },
    { num: 6, title: 'Bank Details', icon: FileText }
  ];

  const handleNext = () => setStep(s => Math.min(6, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for updating user profile
    setTimeout(() => {
      if (user) {
        const updatedUser = { ...user, isFirstLogin: false };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
      addToast('success', 'Profile Completed', 'Welcome to your dashboard!');
      setLoading(false);
    }, 1500);
  };

  const handleInputChange = (section: keyof typeof formData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row">
        
        {/* Sidebar Steps */}
        <div className="md:w-1/3 bg-slate-900 dark:bg-brand-900 p-8 text-white hidden md:block">
          <h2 className="text-2xl font-black mb-2">Complete Profile</h2>
          <p className="text-slate-400 text-sm mb-8">Please provide the required details to setup your account.</p>
          
          <div className="space-y-6">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className={`flex items-center gap-4 transition-all ${isActive ? 'opacity-100 scale-105' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPast ? 'bg-emerald-500' : isActive ? 'bg-brand-500' : 'bg-white/10'}`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Step {s.num}</p>
                    <p className="font-semibold">{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 p-6 sm:p-10 relative overflow-y-auto max-h-[80vh]">
          <form onSubmit={step === 6 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6 h-full flex flex-col">
            
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                      <input type="date" required value={formData.personal.dob} onChange={e => handleInputChange('personal', 'dob', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                      <select required value={formData.personal.gender} onChange={e => handleInputChange('personal', 'gender', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alternate Phone</label>
                      <input type="text" placeholder="e.g. 9876543210" value={formData.personal.altPhone} onChange={e => handleInputChange('personal', 'altPhone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Marital Status</label>
                      <select value={formData.personal.maritalStatus} onChange={e => handleInputChange('personal', 'maritalStatus', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent">
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact & Address</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Address</label>
                    <textarea required rows={3} value={formData.contact.address} onChange={e => handleInputChange('contact', 'address', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">City</label>
                      <input type="text" required value={formData.contact.city} onChange={e => handleInputChange('contact', 'city', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">State</label>
                      <input type="text" required value={formData.contact.state} onChange={e => handleInputChange('contact', 'state', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Government ID Details</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aadhaar Number</label>
                    <input type="text" required maxLength={12} value={formData.govId.aadhaar} onChange={e => handleInputChange('govId', 'aadhaar', e.target.value)} placeholder="12 Digit Aadhaar" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono tracking-wider" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">PAN Number</label>
                    <input type="text" required maxLength={10} value={formData.govId.pan} onChange={e => handleInputChange('govId', 'pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono tracking-wider uppercase" />
                  </div>
                  
                  <div className="pt-4 space-y-4">
                    <p className="text-xs font-bold text-slate-500">Upload Documents</p>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Click to upload ID proofs</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Highest Qualification</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Degree / Qualification</label>
                    <input type="text" required value={formData.qualification.degree} onChange={e => handleInputChange('qualification', 'degree', e.target.value)} placeholder="e.g. M.Sc Mathematics, B.Ed" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">University / Board</label>
                    <input type="text" required value={formData.qualification.university} onChange={e => handleInputChange('qualification', 'university', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Year of Passing</label>
                    <input type="number" required value={formData.qualification.yearOfPassing} onChange={e => handleInputChange('qualification', 'yearOfPassing', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Previous Experience</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Previous Organization</label>
                    <input type="text" value={formData.experience.prevOrg} onChange={e => handleInputChange('experience', 'prevOrg', e.target.value)} placeholder="e.g. Delhi Public School" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Years of Experience</label>
                      <input type="number" step="0.1" value={formData.experience.years} onChange={e => handleInputChange('experience', 'years', e.target.value)} placeholder="e.g. 5.5" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role / Designation</label>
                      <input type="text" value={formData.experience.role} onChange={e => handleInputChange('experience', 'role', e.target.value)} placeholder="e.g. Senior Teacher" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bank Details (Payroll)</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Holder Name</label>
                    <input type="text" required value={formData.bank.accName} onChange={e => handleInputChange('bank', 'accName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bank Name</label>
                    <input type="text" required value={formData.bank.bankName} onChange={e => handleInputChange('bank', 'bankName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Number</label>
                      <input type="text" required value={formData.bank.accNo} onChange={e => handleInputChange('bank', 'accNo', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">IFSC Code</label>
                      <input type="text" required value={formData.bank.ifsc} onChange={e => handleInputChange('bank', 'ifsc', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent uppercase font-mono" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-6 mt-auto border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (user) {
                      const updatedUser = { ...user, isFirstLogin: false };
                      setUser(updatedUser);
                      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
                    }
                    addToast('info', 'Profile Setup Skipped', 'You can complete your profile later.');
                  } else {
                    handlePrev();
                  }
                }}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                {step === 1 ? 'Cancel / Skip' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 disabled:opacity-70 transition-all flex items-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                step === 6 ? 'Complete Profile' : 'Next Step'}
                {!loading && step < 6 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};
