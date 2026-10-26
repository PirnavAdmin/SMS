import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, X, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformSupplier } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import { validateEmail, validatePhoneNumber, validateGSTNumber } from '../../../utils/validation';

export const UniformSupplierView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniformSuppliers = [], addUniformSupplier, updateUniformSupplier, deleteUniformSupplier, fetchUniformData } = useData();
  const { addToast } = useToast();

  useEffect(() => {
    if (fetchUniformData) {
      fetchUniformData();
    }
  }, []);

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<UniformSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<UniformSupplier | null>(null);

  const [form, setForm] = useState<Partial<UniformSupplier>>({
    supplierName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    gstNumber: '',
    address: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateField = (field: string, value: any): string => {
    let err = '';
    const strVal = (value ?? '').toString().trim();

    if (field === 'supplierName') {
      if (!strVal) {
        err = 'Supplier / Company Name is required.';
      } else if (strVal.length < 2) {
        err = 'Supplier name must be at least 2 characters.';
      }
    } else if (field === 'contactPerson') {
      if (!strVal) {
        err = 'Contact person is required.';
      } else if (strVal.length < 2) {
        err = 'Contact person name must be at least 2 characters.';
      }
    } else if (field === 'mobile') {
      const res = validatePhoneNumber(strVal, true);
      if (!res.isValid) {
        err = res.error || 'Enter a valid 10-digit mobile number.';
      }
    } else if (field === 'email') {
      if (strVal) {
        const res = validateEmail(strVal, false);
        if (!res.isValid) {
          err = res.error || 'Please enter a valid email address.';
        }
      }
    } else if (field === 'gstNumber') {
      if (strVal) {
        const res = validateGSTNumber(strVal, false);
        if (!res.isValid) {
          err = res.error || 'Invalid GST registration number format.';
        }
      }
    } else if (field === 'status') {
      if (!strVal) {
        err = 'Supplier status is required.';
      }
    }

    setErrors(prev => {
      const updated = { ...prev };
      if (err) {
        updated[field] = err;
      } else {
        delete updated[field];
      }
      return updated;
    });

    return err;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    const sName = (form.supplierName || (form as any).companyName || '').trim();
    if (!sName) {
      newErrors.supplierName = 'Supplier / Company Name is required.';
    } else if (sName.length < 2) {
      newErrors.supplierName = 'Supplier name must be at least 2 characters.';
    }

    const cPerson = (form.contactPerson || (form as any).contactRepresentative || '').trim();
    if (!cPerson) {
      newErrors.contactPerson = 'Contact person is required.';
    } else if (cPerson.length < 2) {
      newErrors.contactPerson = 'Contact person name must be at least 2 characters.';
    }

    const mobileVal = (form.mobile || form.phone || '').trim();
    const mobRes = validatePhoneNumber(mobileVal, true);
    if (!mobRes.isValid) {
      newErrors.mobile = mobRes.error || 'Enter a valid 10-digit mobile number.';
    }

    const emailVal = (form.email || '').trim();
    if (emailVal) {
      const emRes = validateEmail(emailVal, false);
      if (!emRes.isValid) {
        newErrors.email = emRes.error || 'Please enter a valid email address.';
      }
    }

    const gstVal = (form.gstNumber || '').trim();
    if (gstVal) {
      const gstRes = validateGSTNumber(gstVal, false);
      if (!gstRes.isValid) {
        newErrors.gstNumber = gstRes.error || 'Invalid GST registration number format.';
      }
    }

    if (!form.status) {
      newErrors.status = 'Supplier status is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filtered = uniformSuppliers.filter(s => {
    const name = (s.supplierName || (s as any).companyName || '').toLowerCase();
    const contact = (s.contactPerson || (s as any).contactRepresentative || '').toLowerCase();
    const gst = (s.gstNumber || (s as any).gstRegistrationNo || '').toLowerCase();
    const q = (query || '').toLowerCase().trim();
    const matchQuery = !q || name.includes(q) || contact.includes(q) || gst.includes(q);
    const matchStatus = !filterStatus || filterStatus === 'All' || s.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setForm({ supplierName: '', contactPerson: '', mobile: '', email: '', gstNumber: '', address: '', status: 'Active' });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: UniformSupplier) => {
    setEditingSupplier(s);
    setForm({
      ...s,
      supplierName: s.supplierName || (s as any).companyName || '',
      contactPerson: s.contactPerson || (s as any).contactRepresentative || '',
      mobile: s.mobile || s.phone || (s as any).mobileNumber || '',
      email: s.email || (s as any).emailAddress || '',
      gstNumber: s.gstNumber || (s as any).gstRegistrationNo || '',
      address: s.address || (s as any).warehouseAddress || '',
      status: s.status || 'Active'
    });
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateAll()) {
      setTouched({
        supplierName: true,
        contactPerson: true,
        mobile: true,
        email: true,
        gstNumber: true,
        status: true
      });
      addToast('error', 'Validation Error', 'Please correct the highlighted errors before saving.');
      return;
    }

    const sName = (form.supplierName || (form as any).companyName || '').trim();
    const payload = {
      ...form,
      supplierName: sName,
      companyName: sName,
      contactPerson: (form.contactPerson || '').trim(),
      mobile: (form.mobile || '').trim(),
      phone: (form.mobile || '').trim(),
      email: (form.email || '').trim(),
      gstNumber: (form.gstNumber || '').trim().toUpperCase(),
      address: (form.address || '').trim(),
      status: form.status || 'Active'
    };

    try {
      setIsSaving(true);
      if (editingSupplier) {
        await updateUniformSupplier(editingSupplier.id, payload);
        addToast('success', 'Supplier Updated', `Updated supplier ${sName}`);
      } else {
        await addUniformSupplier(payload as Omit<UniformSupplier, 'id'>);
        addToast('success', 'Supplier Added', `Added supplier ${sName}`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Failed to save supplier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Corporate Suppliers
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {tabs}

      <div className="glass-card p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-col justify-center w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search suppliers by name, GST..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  e.target.removeAttribute('data-global-invalid');
                  e.target.style.borderColor = '';
                  const wrap = e.target.parentElement;
                  wrap?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
                  wrap?.parentElement?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
                }
              }}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={(e) => {
                  setQuery('');
                  const wrap = e.currentTarget.parentElement;
                  const inp = wrap?.querySelector('input');
                  if (inp) {
                    inp.removeAttribute('data-global-invalid');
                    inp.style.borderColor = '';
                  }
                  wrap?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
                  wrap?.parentElement?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Status</option>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Contact Representative</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 font-mono">GST Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No corporate suppliers found matching the selected criteria. Click "+ Add Supplier" to create one.</td>
                </tr>
              ) : (
                paginated.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono">{s.mobile}</td>
                    <td className="py-3 px-4">{s.email || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-sky-600 dark:text-sky-400">{s.gstNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeletingSupplier(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        itemsPerPageOptions={[10, 25, 50, 100]}
        label="suppliers"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
              {/* Supplier / Company Name */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Supplier / Company Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Uniform Mills Ltd"
                  value={form.supplierName || ''}
                  onChange={e => {
                    setForm({ ...form, supplierName: e.target.value });
                    if (touched.supplierName || submitted) {
                      validateField('supplierName', e.target.value);
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, supplierName: true }));
                    validateField('supplierName', form.supplierName);
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none transition-colors ${
                    (touched.supplierName || submitted) && errors.supplierName
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                  }`}
                />
                {(touched.supplierName || submitted) && errors.supplierName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.supplierName}</p>
                )}
              </div>

              {/* Contact Person & Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Contact Person <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={form.contactPerson || ''}
                    onChange={e => {
                      setForm({ ...form, contactPerson: e.target.value });
                      if (touched.contactPerson || submitted) {
                        validateField('contactPerson', e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, contactPerson: true }));
                      validateField('contactPerson', form.contactPerson);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none transition-colors ${
                      (touched.contactPerson || submitted) && errors.contactPerson
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {(touched.contactPerson || submitted) && errors.contactPerson && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.contactPerson}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    value={form.mobile || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm({ ...form, mobile: val });
                      if (touched.mobile || submitted) {
                        validateField('mobile', val);
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, mobile: true }));
                      validateField('mobile', form.mobile);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors ${
                      (touched.mobile || submitted) && errors.mobile
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {(touched.mobile || submitted) && errors.mobile && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.mobile}</p>
                  )}
                </div>
              </div>

              {/* Email & GST */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@company.com"
                    value={form.email || ''}
                    onChange={e => {
                      setForm({ ...form, email: e.target.value });
                      if (touched.email || submitted) {
                        validateField('email', e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, email: true }));
                      validateField('email', form.email);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none transition-colors ${
                      (touched.email || submitted) && errors.email
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {(touched.email || submitted) && errors.email && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    GST Registration No
                  </label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    value={form.gstNumber || ''}
                    onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                      setForm({ ...form, gstNumber: val });
                      if (touched.gstNumber || submitted) {
                        validateField('gstNumber', val);
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, gstNumber: true }));
                      validateField('gstNumber', form.gstNumber);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono uppercase text-xs text-slate-900 dark:text-white outline-none transition-colors ${
                      (touched.gstNumber || submitted) && errors.gstNumber
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {(touched.gstNumber || submitted) && errors.gstNumber && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.gstNumber}</p>
                  )}
                </div>
              </div>

              {/* Status & Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Supplier Status <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={form.status || ''}
                    onChange={e => {
                      setForm({ ...form, status: e.target.value as any });
                      if (touched.status || submitted) {
                        validateField('status', e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, status: true }));
                      validateField('status', form.status);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer transition-colors ${
                      (touched.status || submitted) && errors.status
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-500'
                    }`}
                  >
                    <option value="">Select Status *</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {(touched.status || submitted) && errors.status && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.status}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Warehouse Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 5, Industrial Area"
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSupplier}
        title="Remove Supplier Partner"
        message={`Are you sure you want to delete supplier ${deletingSupplier?.supplierName}?`}
        onConfirm={async () => {
          if (deletingSupplier) {
            try {
              await deleteUniformSupplier(deletingSupplier.id);
              addToast('success', 'Supplier deleted');
              setDeletingSupplier(null);
            } catch (err: any) {
              addToast('error', 'Delete Failed', err?.message || 'Failed to delete supplier');
            }
          }
        }}
        onCancel={() => setDeletingSupplier(null)}
      />
    </div>
  );
};
