import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { familyApi, vaccinationApi } from '../../services/api';
import { calculateAge, formatDate } from '../../lib/utils';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Heart, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Droplet, 
  FileText, 
  Sparkles,
  Info,
  X,
  AlertTriangle,
  Syringe,
  Clock,
  Plus,
  Check,
  ChevronRight,
  Filter,
  Activity,
  Layers,
  Award,
  RefreshCw
} from 'lucide-react';

const RELATIONSHIPS = [
  { value: 'CHILD', label: 'Child' },
  { value: 'SPOUSE', label: 'Spouse / Partner' },
  { value: 'SELF', label: 'Self (Account Owner)' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'SIBLING', label: 'Sibling' },
  { value: 'OTHER', label: 'Other Dependent' },
];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other / Prefer not to say' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];

const INJECTION_SITES = [
  'Left Deltoid (Upper Arm)',
  'Right Deltoid (Upper Arm)',
  'Left Anterolateral Thigh',
  'Right Anterolateral Thigh',
  'Oral (Drops)',
  'Subcutaneous (Upper Arm)',
  'Intradermal',
  'Other / Unspecified'
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Active selected member for vaccination view
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [catalog, setCatalog] = useState([]);

  // Vaccination state for active member
  const [scheduleData, setScheduleData] = useState(null);
  const [records, setRecords] = useState([]);
  const [vaxLoading, setVaxLoading] = useState(false);
  const [vaxError, setVaxError] = useState(null);
  const [vaxViewTab, setVaxViewTab] = useState('schedule'); // 'schedule' or 'history'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTION_NEEDED', 'COMPLETED', 'UPCOMING'

  // Modals & form states - Family & Members
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Member form fields
  const [memberName, setMemberName] = useState('');
  const [memberDob, setMemberDob] = useState('');
  const [memberGender, setMemberGender] = useState('MALE');
  const [memberRelationship, setMemberRelationship] = useState('CHILD');
  const [memberBloodGroup, setMemberBloodGroup] = useState('');
  const [memberAllergies, setMemberAllergies] = useState('');
  const [memberNotes, setMemberNotes] = useState('');

  // Family edit form fields
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [familyDescInput, setFamilyDescInput] = useState('');

  // Vaccination Record Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalMode, setRecordModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedScheduleDose, setSelectedScheduleDose] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Vaccination record form fields
  const [vaxVaccineCode, setVaxVaccineCode] = useState('');
  const [vaxVaccineName, setVaxVaccineName] = useState('');
  const [vaxDoseNumber, setVaxDoseNumber] = useState(1);
  const [vaxAdminDate, setVaxAdminDate] = useState('');
  const [vaxAdminBy, setVaxAdminBy] = useState('');
  const [vaxBatchNum, setVaxBatchNum] = useState('');
  const [vaxSite, setVaxSite] = useState('');
  const [vaxNotes, setVaxNotes] = useState('');
  const [vaxFormError, setVaxFormError] = useState(null);

  const todayString = new Date().toISOString().split('T')[0];

  // Fetch family and members
  const fetchFamilyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [familyRes, membersRes] = await Promise.all([
        familyApi.getMyFamily(),
        familyApi.getMembers(),
      ]);

      if (familyRes && familyRes.data) {
        setFamily(familyRes.data);
        setFamilyNameInput(familyRes.data.family_name);
        setFamilyDescInput(familyRes.data.description || '');
      }
      if (membersRes && membersRes.data) {
        const memList = membersRes.data;
        setMembers(memList);
        if (memList.length > 0 && !selectedMemberId) {
          setSelectedMemberId(memList[0].id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load family information');
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  // Fetch Vaccine Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await vaccinationApi.getCatalog();
        if (res && res.data) {
          setCatalog(res.data);
        }
      } catch (err) {
        console.warn('Could not load vaccine catalog:', err);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  // Fetch vaccination schedule & history for active member
  const fetchMemberVaccinationData = useCallback(async (memberId) => {
    if (!memberId) return;
    setVaxLoading(true);
    setVaxError(null);
    try {
      const [schedRes, recsRes] = await Promise.all([
        vaccinationApi.getMemberSchedule(memberId),
        vaccinationApi.getMemberRecords(memberId),
      ]);
      if (schedRes && schedRes.data) {
        setScheduleData(schedRes.data);
      }
      if (recsRes && recsRes.data) {
        setRecords(recsRes.data);
      }
    } catch (err) {
      setVaxError(err.message || 'Failed to load vaccination data');
    } finally {
      setVaxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchMemberVaccinationData(selectedMemberId);
    }
  }, [selectedMemberId, fetchMemberVaccinationData]);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // --- Family Member Modal Handlers ---
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberDob('');
    setMemberGender('MALE');
    setMemberRelationship('CHILD');
    setMemberBloodGroup('');
    setMemberAllergies('');
    setMemberNotes('');
    setFormError(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setMemberName(member.full_name);
    setMemberDob(member.date_of_birth);
    setMemberGender(member.gender);
    setMemberRelationship(member.relationship);
    setMemberBloodGroup(member.blood_group || '');
    setMemberAllergies((member.allergies || []).join(', '));
    setMemberNotes(member.notes || '');
    setFormError(null);
    setIsMemberModalOpen(true);
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!memberName.trim()) {
      setFormError('Member name is required.');
      return;
    }
    if (!memberDob) {
      setFormError('Date of birth is required.');
      return;
    }
    if (memberDob > todayString) {
      setFormError('Date of birth cannot be in the future.');
      return;
    }

    setFormSubmitting(true);
    const allergiesList = memberAllergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      full_name: memberName.trim(),
      date_of_birth: memberDob,
      gender: memberGender,
      relationship: memberRelationship,
      blood_group: memberBloodGroup || null,
      allergies: allergiesList,
      notes: memberNotes.trim() || null,
    };

    try {
      if (editingMember) {
        await familyApi.updateMember(editingMember.id, payload);
        showNotification(`Updated profile for ${payload.full_name}`);
      } else {
        const added = await familyApi.addMember(payload);
        showNotification(`Added ${payload.full_name} to your family`);
        if (added && added.data) {
          setSelectedMemberId(added.data.id);
        }
      }
      setIsMemberModalOpen(false);
      fetchFamilyData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setFormSubmitting(true);
    try {
      await familyApi.deleteMember(deletingMember.id);
      showNotification(`Removed ${deletingMember.full_name} from family`);
      if (selectedMemberId === deletingMember.id) {
        const remaining = members.filter((m) => m.id !== deletingMember.id);
        setSelectedMemberId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeletingMember(null);
      fetchFamilyData();
    } catch (err) {
      setError(err.message || 'Failed to delete member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFamilyUpdateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!familyNameInput.trim()) {
      setFormError('Family name cannot be empty.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await familyApi.updateMyFamily({
        family_name: familyNameInput.trim(),
        description: familyDescInput.trim() || null,
      });
      if (res && res.data) {
        setFamily(res.data);
      }
      showNotification('Family details updated successfully');
      setIsFamilyModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to update family');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- Vaccination Record Modal Handlers ---

  // Open modal to record a specific dose from the schedule
  const handleRecordScheduleDose = (schedItem) => {
    setRecordModalMode('add');
    setSelectedScheduleDose(schedItem);
    setEditingRecord(null);
    setVaxVaccineCode(schedItem.vaccine_code);
    setVaxVaccineName(schedItem.vaccine_name);
    setVaxDoseNumber(schedItem.dose_number);
    setVaxAdminDate(todayString);
    setVaxAdminBy('');
    setVaxBatchNum('');
    setVaxSite('Left Deltoid (Upper Arm)');
    setVaxNotes('');
    setVaxFormError(null);
    setIsRecordModalOpen(true);
  };

  // Open modal to record any arbitrary vaccine dose
  const handleOpenGeneralRecordModal = () => {
    setRecordModalMode('add');
    setSelectedScheduleDose(null);
    setEditingRecord(null);
    const defaultCatalogItem = catalog[0];
    setVaxVaccineCode(defaultCatalogItem ? defaultCatalogItem.vaccine_code : 'BCG');
    setVaxVaccineName(defaultCatalogItem ? defaultCatalogItem.vaccine_name : 'BCG');
    setVaxDoseNumber(defaultCatalogItem ? defaultCatalogItem.dose_number : 1);
    setVaxAdminDate(todayString);
    setVaxAdminBy('');
    setVaxBatchNum('');
    setVaxSite('Left Deltoid (Upper Arm)');
    setVaxNotes('');
    setVaxFormError(null);
    setIsRecordModalOpen(true);
  };

  // Open modal to edit an existing vaccination record
  const handleOpenEditRecordModal = (rec) => {
    setRecordModalMode('edit');
    setSelectedScheduleDose(null);
    setEditingRecord(rec);
    setVaxVaccineCode(rec.vaccine_code);
    setVaxVaccineName(rec.vaccine_name);
    setVaxDoseNumber(rec.dose_number);
    setVaxAdminDate(rec.administered_date);
    setVaxAdminBy(rec.administered_by || '');
    setVaxBatchNum(rec.batch_number || '');
    setVaxSite(rec.route_or_site || '');
    setVaxNotes(rec.notes || '');
    setVaxFormError(null);
    setIsRecordModalOpen(true);
  };

  // Vaccine selection from dropdown in Record Modal
  const handleCatalogSelect = (e) => {
    const val = e.target.value;
    const found = catalog.find((c) => `${c.vaccine_code}-${c.dose_number}` === val);
    if (found) {
      setVaxVaccineCode(found.vaccine_code);
      setVaxVaccineName(found.vaccine_name);
      setVaxDoseNumber(found.dose_number);
    } else {
      setVaxVaccineCode(val);
      setVaxVaccineName(val);
      setVaxDoseNumber(1);
    }
  };

  // Submit vaccination record (Add or Edit)
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setVaxFormError(null);

    if (!selectedMember) {
      setVaxFormError('Please select a family member first.');
      return;
    }

    if (!vaxVaccineCode.trim()) {
      setVaxFormError('Vaccine code is required.');
      return;
    }
    if (!vaxAdminDate) {
      setVaxFormError('Administration date is required.');
      return;
    }
    if (vaxAdminDate > todayString) {
      setVaxFormError('Administration date cannot be in the future.');
      return;
    }
    if (vaxAdminDate < selectedMember.date_of_birth) {
      setVaxFormError(`Administration date cannot be before date of birth (${formatDate(selectedMember.date_of_birth)}).`);
      return;
    }

    setFormSubmitting(true);
    try {
      if (recordModalMode === 'edit' && editingRecord) {
        await vaccinationApi.updateRecord(editingRecord.id, {
          administered_date: vaxAdminDate,
          administered_by: vaxAdminBy.trim() || null,
          batch_number: vaxBatchNum.trim() || null,
          route_or_site: vaxSite || null,
          notes: vaxNotes.trim() || null,
        });
        showNotification(`Updated record for ${vaxVaccineName} Dose ${vaxDoseNumber}`);
      } else {
        await vaccinationApi.addRecord(selectedMember.id, {
          vaccine_code: vaxVaccineCode.toUpperCase().trim(),
          vaccine_name: vaxVaccineName.trim(),
          dose_number: Number(vaxDoseNumber),
          administered_date: vaxAdminDate,
          administered_by: vaxAdminBy.trim() || null,
          batch_number: vaxBatchNum.trim() || null,
          route_or_site: vaxSite || null,
          notes: vaxNotes.trim() || null,
        });
        showNotification(`Recorded ${vaxVaccineName} Dose ${vaxDoseNumber} for ${selectedMember.full_name}`);
      }

      setIsRecordModalOpen(false);
      fetchMemberVaccinationData(selectedMember.id);
    } catch (err) {
      setVaxFormError(err.message || 'Failed to save vaccination record');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete vaccination record
  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    setFormSubmitting(true);
    try {
      await vaccinationApi.deleteRecord(deletingRecord.id);
      showNotification(`Deleted record for ${deletingRecord.vaccine_name} Dose ${deletingRecord.dose_number}`);
      setDeletingRecord(null);
      fetchMemberVaccinationData(selectedMemberId);
    } catch (err) {
      setVaxError(err.message || 'Failed to delete record');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Helper styles
  const getRelationshipColor = (rel) => {
    switch (rel) {
      case 'CHILD':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SELF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SPOUSE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PARENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SIBLING':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Overdue</span>
          </span>
        );
      case 'DUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Due Now</span>
          </span>
        );
      case 'UPCOMING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Upcoming</span>
          </span>
        );
    }
  };

  // Filter schedule items
  const scheduleItems = scheduleData?.schedule_items || [];
  const filteredScheduleItems = scheduleItems.filter((item) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTION_NEEDED') return item.status === 'DUE' || item.status === 'OVERDUE';
    if (statusFilter === 'COMPLETED') return item.status === 'COMPLETED';
    if (statusFilter === 'UPCOMING') return item.status === 'UPCOMING';
    return true;
  });

  const summary = scheduleData?.summary || {
    total_doses: 0,
    completed_count: 0,
    due_count: 0,
    overdue_count: 0,
    upcoming_count: 0,
    completion_percentage: 0,
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchFamilyData}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: Family Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium backdrop-blur-xs text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
                <span>Family Care Household</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {family?.family_name || `${user?.name}'s Family`}
              </h1>
              <button
                onClick={() => setIsFamilyModalOpen(true)}
                className="rounded-full bg-white/10 hover:bg-white/20 p-1.5 text-white/80 hover:text-white transition"
                title="Edit family name or details"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              {family?.description || 'Manage family members whose digital immunization records, deterministic schedules, and reminders are tracked independently.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-md hover:bg-blue-50 transition transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Family Members Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Family Members</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any member card below to inspect their personalized vaccination schedule and history.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <span>Ages are dynamically calculated based on birth date</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center max-w-2xl mx-auto shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No family members registered yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Start building your family vaccination hub. Add your children, spouse, or yourself to activate deterministic immunization schedules and automated tracking.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Your First Family Member</span>
            </button>
          </div>
        ) : (
          /* Member Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map((member) => {
              const ageInfo = calculateAge(member.date_of_birth);
              const isSelected = member.id === selectedMemberId;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Active Member
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-base ${
                          member.gender === 'FEMALE'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : member.gender === 'MALE'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}>
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug">
                            {member.full_name}
                          </h3>
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border mt-1 ${getRelationshipColor(member.relationship)}`}>
                            {member.relationship}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          title="Edit member details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMember(member)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Vitals & Age Card */}
                    <div className="rounded-xl bg-slate-50 border border-slate-150 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Age / DOB:</span>
                        </span>
                        <span className="font-semibold text-slate-800">
                          {ageInfo.formatted}{' '}
                          <span className="text-slate-400 font-normal">
                            ({formatDate(member.date_of_birth)})
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Droplet className="h-3.5 w-3.5 text-slate-400" />
                          <span>Blood Group:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {member.blood_group || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Gender:</span>
                        <span className="capitalize font-medium text-slate-700">{member.gender.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Allergies tag list */}
                    {member.allergies && member.allergies.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Allergies:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.allergies.map((allergy, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>{isSelected ? 'Viewing Immunizations ↓' : 'Select to view schedule →'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: VACCINATION MANAGEMENT & SCHEDULE HUB (PHASE 4) */}
      {selectedMember && (
        <div className="space-y-6 pt-4 border-t border-slate-200 animate-in fade-in">
          {/* Member Header & Action Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Syringe className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {selectedMember.full_name}'s Immunization Hub
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRelationshipColor(selectedMember.relationship)}`}>
                    {selectedMember.relationship}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  DOB: <strong>{formatDate(selectedMember.date_of_birth)}</strong> · Current Age: <strong>{calculateAge(selectedMember.date_of_birth).formatted}</strong> · Pure deterministic schedule engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => fetchMemberVaccinationData(selectedMember.id)}
                disabled={vaxLoading}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Recalculate Schedule"
              >
                <RefreshCw className={`h-4 w-4 ${vaxLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={handleOpenGeneralRecordModal}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Record Vaccine Dose</span>
              </button>
            </div>
          </div>

          {/* Vaccination Error Alert */}
          {vaxError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{vaxError}</span>
            </div>
          )}

          {/* Metric Stats Cards Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Required */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog</span>
                <Layers className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{summary.total_doses}</span>
                <span className="text-[11px] text-slate-400">Doses</span>
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">{summary.completed_count}</span>
                <span className="text-[11px] text-emerald-600">({summary.completion_percentage}%)</span>
              </div>
            </div>

            {/* Overdue */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Overdue</span>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-700">{summary.overdue_count}</span>
                <span className="text-[11px] text-rose-600 font-medium">Needs Attention</span>
              </div>
            </div>

            {/* Due Now */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Due Now</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-700">{summary.due_count}</span>
                <span className="text-[11px] text-amber-600 font-medium">Ready</span>
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Upcoming</span>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700">{summary.upcoming_count}</span>
                <span className="text-[11px] text-blue-600">Future</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Immunization Completion Progress</span>
              <span className="font-extrabold text-blue-600">{summary.completion_percentage}% Completed</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${(summary.completed_count / (summary.total_doses || 1)) * 100}%` }}
                title={`Completed: ${summary.completed_count}`}
              ></div>
              <div
                className="h-full bg-rose-500 transition-all duration-500 ease-out"
                style={{ width: `${(summary.overdue_count / (summary.total_doses || 1)) * 100}%` }}
                title={`Overdue: ${summary.overdue_count}`}
              ></div>
              <div
                className="h-full bg-amber-400 transition-all duration-500 ease-out"
                style={{ width: `${(summary.due_count / (summary.total_doses || 1)) * 100}%` }}
                title={`Due Now: ${summary.due_count}`}
              ></div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Completed ({summary.completed_count})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                <span>Overdue ({summary.overdue_count})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                <span>Due Now ({summary.due_count})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-200"></div>
                <span>Upcoming ({summary.upcoming_count})</span>
              </div>
            </div>
          </div>

          {/* View Mode Toggle & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* View Mode: Schedule vs Administered Records */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start">
              <button
                onClick={() => setVaxViewTab('schedule')}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  vaxViewTab === 'schedule'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Deterministic Schedule ({scheduleItems.length})</span>
              </button>
              <button
                onClick={() => setVaxViewTab('history')}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  vaxViewTab === 'history'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Administered History ({records.length})</span>
              </button>
            </div>

            {/* Filter buttons (only active on Schedule tab) */}
            {vaxViewTab === 'schedule' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="h-3 w-3" />
                  <span>Filter:</span>
                </span>
                {[
                  { key: 'ALL', label: 'All', count: scheduleItems.length },
                  { key: 'ACTION_NEEDED', label: 'Due / Overdue', count: summary.due_count + summary.overdue_count },
                  { key: 'COMPLETED', label: 'Completed', count: summary.completed_count },
                  { key: 'UPCOMING', label: 'Upcoming', count: summary.upcoming_count },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                      statusFilter === f.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: SCHEDULE VIEW */}
          {vaxViewTab === 'schedule' && (
            <div>
              {vaxLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                  <p className="mt-3 text-xs text-slate-500 font-medium">Calculating schedule timeline...</p>
                </div>
              ) : filteredScheduleItems.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-base">No vaccinations match this filter</h4>
                  <p className="text-xs text-slate-500 mt-1">Try switching filters or view all schedule doses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScheduleItems.map((item, idx) => {
                    const isCompleted = item.status === 'COMPLETED';
                    const isOverdue = item.status === 'OVERDUE';
                    const isDue = item.status === 'DUE';

                    return (
                      <div
                        key={`${item.vaccine_code}-${item.dose_number}-${idx}`}
                        className={`rounded-2xl border p-5 bg-white shadow-xs transition flex flex-col justify-between ${
                          isOverdue
                            ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                            : isDue
                            ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20'
                            : isCompleted
                            ? 'border-emerald-200 bg-emerald-50/10'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  {item.vaccine_code}
                                </span>
                                <span className="text-xs font-semibold text-slate-600">
                                  Dose {item.dose_number} of {item.total_doses_in_series}
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">
                                {item.vaccine_name}
                              </h3>
                            </div>
                            <div>{getStatusBadge(item.status)}</div>
                          </div>

                          {/* Recommended Age & Disease */}
                          <div className="rounded-xl bg-slate-50 border border-slate-150 p-2.5 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Target Age:</span>
                              <span className="font-semibold text-slate-800">{item.recommended_age_display}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">
                                {isCompleted ? 'Administered On:' : 'Calculated Due Date:'}
                              </span>
                              <span className={`font-semibold ${
                                isCompleted
                                  ? 'text-emerald-700'
                                  : isOverdue
                                  ? 'text-rose-700'
                                  : 'text-slate-800'
                              }`}>
                                {formatDate(isCompleted ? item.administered_date : item.calculated_due_date)}
                              </span>
                            </div>

                            {item.target_diseases && item.target_diseases.length > 0 && (
                              <div className="pt-1 border-t border-slate-200/60">
                                <span className="text-[10px] text-slate-400 block mb-0.5">Protects Against:</span>
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {item.target_diseases.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Completed Record details if any */}
                          {isCompleted && item.record_id && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-200 space-y-0.5">
                              <div className="font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span>Verified on Record</span>
                              </div>
                              {item.administered_by && (
                                <div>Provider: <span className="font-medium">{item.administered_by}</span></div>
                              )}
                              {item.batch_number && (
                                <div>Batch: <span className="font-mono">{item.batch_number}</span></div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Action Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          {isCompleted ? (
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Immunity Acquired</span>
                              </span>
                              {item.record_id && (
                                <button
                                  onClick={() => {
                                    const rec = records.find((r) => r.id === item.record_id);
                                    if (rec) handleOpenEditRecordModal(rec);
                                  }}
                                  className="text-xs text-slate-500 hover:text-blue-600 font-medium underline"
                                >
                                  Edit Record
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRecordScheduleDose(item)}
                              className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                                isOverdue
                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                  : isDue
                                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Record Dose {item.dose_number}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADMINISTERED HISTORY VIEW */}
          {vaxViewTab === 'history' && (
            <div>
              {records.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
                    <FileText className="h-7 w-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">No vaccination records logged yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Log vaccines administered at a clinic or hospital to update {selectedMember.full_name}'s schedule.
                  </p>
                  <button
                    onClick={handleOpenGeneralRecordModal}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Record First Vaccine</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3.5">Vaccine & Dose</th>
                          <th className="px-5 py-3.5">Administered Date</th>
                          <th className="px-5 py-3.5">Provider / Clinic</th>
                          <th className="px-5 py-3.5">Batch / Site</th>
                          <th className="px-5 py-3.5">Notes</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {records.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 text-sm">{rec.vaccine_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {rec.vaccine_code} · Dose #{rec.dose_number}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {formatDate(rec.administered_date)}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {rec.administered_by || <span className="text-slate-400 italic">Not specified</span>}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {rec.batch_number && (
                                <div className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded inline-block text-slate-700">
                                  Lot: {rec.batch_number}
                                </div>
                              )}
                              {rec.route_or_site && (
                                <div className="text-[11px] text-slate-400 mt-0.5">{rec.route_or_site}</div>
                              )}
                              {!rec.batch_number && !rec.route_or_site && (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-600 max-w-xs truncate">
                              {rec.notes || <span className="text-slate-400 italic">—</span>}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditRecordModal(rec)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Edit Record"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingRecord(rec)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Delete Record"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT FAMILY MEMBER */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter personal details to configure their individual immunization profile.
                </p>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Leo Connor"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={todayString}
                    value={memberDob}
                    onChange={(e) => setMemberDob(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Must not be a future date</span>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={memberGender}
                    onChange={(e) => setMemberGender(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Relationship & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Relationship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={memberRelationship}
                    onChange={(e) => setMemberRelationship(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Blood Group (Optional)
                  </label>
                  <select
                    value={memberBloodGroup}
                    onChange={(e) => setMemberBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Known Allergies (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={memberAllergies}
                  onChange={(e) => setMemberAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Egg protein, Latex"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Medical Notes */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Medical Notes or Precautions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  placeholder="e.g. Born 4 weeks premature, history of asthma, etc."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingMember ? 'Save Changes' : 'Add Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FAMILY */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <h3 className="text-xl font-bold text-slate-900">Edit Family Profile</h3>
              <button
                onClick={() => setIsFamilyModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFamilyUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Family / Household Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                  placeholder="e.g. Connor Household"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Location (Optional)
                </label>
                <textarea
                  rows={3}
                  value={familyDescInput}
                  onChange={(e) => setFamilyDescInput(e.target.value)}
                  placeholder="e.g. Primary residence in Brooklyn, NY"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFamilyModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Family</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE MEMBER CONFIRMATION */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Remove Family Member?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove <strong>{deletingMember.full_name}</strong> from your family records? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteMember}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50 transition"
              >
                {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Yes, Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD / EDIT VACCINE DOSE (PHASE 4) */}
      {isRecordModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {recordModalMode === 'edit'
                    ? `Edit Record: ${vaxVaccineName} (Dose ${vaxDoseNumber})`
                    : selectedScheduleDose
                    ? `Record Dose: ${selectedScheduleDose.vaccine_name}`
                    : `Record Vaccine for ${selectedMember.full_name}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{selectedMember.full_name}</strong> (DOB: {formatDate(selectedMember.date_of_birth)})
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {vaxFormError && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{vaxFormError}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              {/* Vaccine Selection (if new record and not from specific dose) */}
              {recordModalMode === 'add' && !selectedScheduleDose && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Select Standard Vaccine Dose <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={`${vaxVaccineCode}-${vaxDoseNumber}`}
                    onChange={handleCatalogSelect}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    {catalog.map((c) => (
                      <option key={`${c.vaccine_code}-${c.dose_number}`} value={`${c.vaccine_code}-${c.dose_number}`}>
                        {c.vaccine_name} — Dose {c.dose_number} ({c.recommended_age_display})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vaccine Name & Code Display / Custom */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Vaccine Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={recordModalMode === 'edit' || selectedScheduleDose !== null}
                    value={vaxVaccineName}
                    onChange={(e) => setVaxVaccineName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white read-only:bg-slate-50 read-only:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Dose # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    readOnly={recordModalMode === 'edit' || selectedScheduleDose !== null}
                    value={vaxDoseNumber}
                    onChange={(e) => setVaxDoseNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white read-only:bg-slate-50 read-only:text-slate-600"
                  />
                </div>
              </div>

              {/* Administered Date */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Date Administered <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={selectedMember.date_of_birth}
                  max={todayString}
                  value={vaxAdminDate}
                  onChange={(e) => setVaxAdminDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
                <span className="text-[10px] text-slate-400">
                  Must be between {formatDate(selectedMember.date_of_birth)} and today
                </span>
              </div>

              {/* Administering Clinic / Provider & Lot # */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Administered By / Clinic (Optional)
                  </label>
                  <input
                    type="text"
                    value={vaxAdminBy}
                    onChange={(e) => setVaxAdminBy(e.target.value)}
                    placeholder="e.g. City Health Clinic, Dr. Smith"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Batch / Lot Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={vaxBatchNum}
                    onChange={(e) => setVaxBatchNum(e.target.value)}
                    placeholder="e.g. LOT-AB9872"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Route / Site */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Anatomical Site / Route (Optional)
                </label>
                <select
                  value={vaxSite}
                  onChange={(e) => setVaxSite(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="">Select injection site / route</option>
                  {INJECTION_SITES.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinical Notes / Adverse Reactions */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Observations or Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={vaxNotes}
                  onChange={(e) => setVaxNotes(e.target.value)}
                  placeholder="e.g. Well tolerated, mild fever reported evening of injection"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{recordModalMode === 'edit' ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE VACCINATION RECORD CONFIRMATION */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Vaccination Record?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete the record for <strong>{deletingRecord.vaccine_name} Dose {deletingRecord.dose_number}</strong> administered on {formatDate(deletingRecord.administered_date)}?
            </p>
            <p className="mt-1 text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
              The vaccination schedule will automatically recalculate this dose as due or upcoming.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteRecord}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50 transition"
              >
                {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
