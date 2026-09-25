import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { familyApi } from '../../services/api';
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
  AlertTriangle
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

export default function PatientDashboard() {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals & form states
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

  const todayString = new Date().toISOString().split('T')[0];

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
        setMembers(membersRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load family information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Open modal for adding a new member
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

  // Open modal for editing an existing member
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

  // Submit Add or Edit member
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
        await familyApi.addMember(payload);
        showNotification(`Added ${payload.full_name} to your family`);
      }
      setIsMemberModalOpen(false);
      fetchFamilyData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete member handler
  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setFormSubmitting(true);
    try {
      await familyApi.deleteMember(deletingMember.id);
      showNotification(`Removed ${deletingMember.full_name} from family`);
      setDeletingMember(null);
      fetchFamilyData();
    } catch (err) {
      setError(err.message || 'Failed to delete member');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update Family details
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
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

      {/* Family Overview Banner */}
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
              {family?.description || 'Manage family members whose digital immunization records and reminders are tracked independently.'}
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

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Family Members</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each member maintains their own independent vaccination schedule and timeline.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <span>Ages are dynamically calculated based on date of birth</span>
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
              Start building your family vaccination hub. Add your children, spouse, or yourself to enable personalized schedule calculations, overdue alerts, and care recommendations.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => {
              const ageInfo = calculateAge(member.date_of_birth);
              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
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

                      <div className="flex items-center gap-1">
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
                    <div className="rounded-xl bg-slate-50 border border-slate-150 p-3.5 space-y-2 text-xs">
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

                    {/* Notes */}
                    {member.notes && (
                      <div className="rounded-lg bg-amber-50/70 border border-amber-200/70 p-2.5 text-[11px] text-amber-900 leading-relaxed">
                        <span className="font-semibold">Notes: </span>
                        {member.notes}
                      </div>
                    )}
                  </div>

                  {/* Phase 4 Integration Placeholder */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Sparkles className="h-3 w-3" />
                      <span>Vaccine records attach in Phase 4</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Family Member Modal */}
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

      {/* Edit Family Modal */}
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

      {/* Delete Member Confirmation Modal */}
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
    </div>
  );
}
