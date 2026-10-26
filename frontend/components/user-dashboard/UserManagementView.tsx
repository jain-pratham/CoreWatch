'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  CheckCircle2, 
  MoreVertical, 
  X, 
  Lock,
  UserCheck
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Security Lead' | 'Surveillance Operator' | 'Viewer';
  department: string;
  status: 'Active' | 'Invited';
  avatar: string;
}

export default function UserManagementView({ user }: { user: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Surveillance Operator',
    department: 'Site Security',
  });

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'usr-1',
      name: user?.name || 'Asha Roya',
      email: user?.email || 'asha.roya@corewatch.ai',
      role: 'Administrator',
      department: 'Corporate Safety & Ops',
      status: 'Active',
      avatar: '/uploads/avatar_asha.jpg'
    },
    {
      id: 'usr-2',
      name: 'Sarah Khan',
      email: 'sarah.khan@corewatch.ai',
      role: 'Security Lead',
      department: 'Warehouse Operations',
      status: 'Active',
      avatar: '/uploads/avatar_asha.jpg'
    },
    {
      id: 'usr-3',
      name: 'Vikram Mehta',
      email: 'vikram.mehta@enterprise.org',
      role: 'Surveillance Operator',
      department: 'Building Safety Team',
      status: 'Active',
      avatar: '/uploads/avatar_asha.jpg'
    },
    {
      id: 'usr-4',
      name: 'David Chen',
      email: 'david.chen@enterprise.org',
      role: 'Viewer',
      department: 'Compliance Audit',
      status: 'Invited',
      avatar: '/uploads/avatar_asha.jpg'
    }
  ]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      role: inviteForm.role as any,
      department: inviteForm.department.trim() || 'General Operations',
      status: 'Invited',
      avatar: '/uploads/avatar_asha.jpg'
    };

    setMembers([newMember, ...members]);
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteModalOpen(false);
      setInviteForm({
        name: '',
        email: '',
        role: 'Surveillance Operator',
        department: 'Site Security',
      });
    }, 1500);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, assign CCTV surveillance privileges, and grant camera inspection permissions.
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md shadow-orange-950/30 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search members by name, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 placeholder:text-slate-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#27293d] text-slate-400 uppercase font-mono text-[10px] bg-[#131524]">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27293d]/60 font-medium">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-orange-500/30"
                      />
                      <span className="font-bold text-white">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                    {m.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#202742] text-[#4d7cfe] border border-[#2e375c]">
                      <Shield className="w-3 h-3" />
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {m.department}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#161826] border border-[#2b304c] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2b304c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Invitation Sent!</h4>
                <p className="text-xs text-slate-400">An onboarding link has been dispatched to {inviteForm.email}.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 pt-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica Taylor"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Security Lead">Security Lead</option>
                      <option value="Surveillance Operator">Operator</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="Security Ops"
                      value={inviteForm.department}
                      onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
