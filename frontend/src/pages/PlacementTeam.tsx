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
    <div className="h-full p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-xs text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Placement Officers & Staff</h1>
          <p className="text-[10px] text-brand-rosy uppercase tracking-widest font-semibold mt-1">
            Manage administrative personnel and account clearances
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all shadow-md"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Staff Account</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Roster Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="w-8 h-8 border-3 border-brand-rosy border-t-transparent rounded-full inline-block animate-spin" />
        </div>
      ) : officers.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-sm text-gray-400">No personnel accounts logged.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officers.map((officer) => (
            <div
              key={officer.id}
              className="glass-panel p-5 border border-brand-cocoa border-opacity-30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-cocoa bg-opacity-25 flex items-center justify-center text-white font-bold">
                    {officer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{officer.name}</h4>
                    <span className="text-[9px] text-brand-rosy uppercase tracking-wider font-bold">
                      {officer.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-[10px] text-gray-400 font-medium">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-brand-rosy" />
                    <span className="truncate">{officer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-brand-rosy" />
                    <span>Registered on {new Date(officer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-end space-x-3 mt-6 pt-3 border-t border-brand-cocoa border-opacity-20">
                  <button
                    onClick={() => handleOpenEdit(officer)}
                    className="p-1 text-gray-500 hover:text-brand-rosy transition-all"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(officer.id)}
                    disabled={officer.id === user?.id}
                    className="p-1 text-gray-500 hover:text-red-400 transition-all disabled:opacity-30"
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
        <div className="fixed inset-0 bg-brand-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl p-6 text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-brand-cocoa border-opacity-20 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingUserId ? 'Modify Staff Account' : 'Register New Personnel'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">
                  {editingUserId ? 'Password (Leave empty to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Role Profile *</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full bg-brand-dark border border-brand-cocoa border-opacity-40 rounded py-2 px-3 text-gray-300 focus:outline-none"
                >
                  <option value="PLACEMENT_TEAM">Placement Team Member</option>
                  <option value="MANAGER">Manager / Dean</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-cocoa border-opacity-20">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-brand-card hover:bg-brand-dark border border-brand-cocoa border-opacity-30 text-gray-300 px-4 py-2.5 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-5 py-2.5 rounded-lg font-bold shadow-lg"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
