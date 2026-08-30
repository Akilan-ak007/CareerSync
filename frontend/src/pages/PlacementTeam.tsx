import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  UserCheck,
  Plus,
  Mail,
  User,
  ShieldAlert,
  Edit2,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

export const PlacementTeam: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'PLACEMENT_TEAM',
  });

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await api.users.list();
      if (res.success) {
        setOfficers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleName: 'PLACEMENT_TEAM',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (officer: any) => {
    setEditingUserId(officer.id);
    setFormData({
      name: officer.name,
      email: officer.email,
      password: '', // Leave empty to keep unchanged
      roleName: officer.role,
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.users.update(editingUserId, formData);
      } else {
        await api.users.create(formData);
      }
      setShowFormModal(false);
      loadTeam();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === user?.id) {
      alert('You cannot delete your own session account!');
      return;
    }
    if (!window.confirm('Delete this staff user account? This will revoke all dashboard privileges.')) return;
    try {
      await api.users.delete(id);
      loadTeam();
    } catch (err: any) {
      alert(err.message || 'Delete user failed.');
    }
  };

  return (
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Placement Officers & Staff</h1>
          <p className="text-xs text-purple-800 uppercase tracking-wider font-extrabold mt-0.5">
            Manage administrative personnel and account clearances
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center space-x-2 transition-all shadow-md"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Staff Account</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-2 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Roster Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="w-8 h-8 border-3 border-purple-800 border-t-transparent rounded-full inline-block animate-spin" />
        </div>
      ) : officers.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-sm text-slate-500 font-medium">No personnel accounts logged.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officers.map((officer) => (
            <div
              key={officer.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-900 font-extrabold text-sm">
                    {officer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{officer.name}</h4>
                    <span className="text-[10px] text-purple-800 uppercase tracking-wider font-extrabold">
                      {officer.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-semibold">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-purple-700 shrink-0" />
                    <span className="truncate font-mono">{officer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Registered on {new Date(officer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-end space-x-3 mt-6 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(officer)}
                    className="p-1 text-slate-400 hover:text-purple-800 transition-all hover:bg-slate-100 rounded"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(officer.id)}
                    disabled={officer.id === user?.id}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-all disabled:opacity-30 hover:bg-slate-100 rounded"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Account form modal (Admin only) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {editingUserId ? 'Modify Staff Account' : 'Register New Personnel'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">
                  {editingUserId ? 'Password (Leave empty to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-extrabold">Role Profile *</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 font-extrabold focus:outline-none focus:border-purple-700"
                >
                  <option value="PLACEMENT_TEAM">Placement Team Member</option>
                  <option value="MANAGER">Manager / Dean</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-900 hover:bg-purple-950 text-white px-5 py-2.5 rounded-xl font-extrabold shadow-md"
                >
                  {editingUserId ? 'Save Account Edits' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
