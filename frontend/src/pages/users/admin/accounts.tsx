import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
// import { useLoading } from "../../../contexts/LoadingContext";
import { Mail, Edit2, Power, Search, ChevronUp, ChevronDown, ShieldCheck, GraduationCap, LayoutGrid, Microscope, Users } from "lucide-react";

import type { User } from "../../../types/admin";
import { AccountApi, type ReassignmentPayload } from "../../../services/admin/AccountApi";
import AddAccountModal from "../../../components/admin-component/addAccountModal";
import EditAccountModal from "../../../components/admin-component/editAccountModal";
import DisableAccountModal from "../../../components/admin-component/disableAccountModal";
import PageLoader from "../../../components/shared/PageLoader";
import SecureImage from "../../../components/shared/SecureImage";

const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  evaluator: "Evaluator",
  rnd: "R&D Staff",
  proponent: "Proponent",
};

const Accounts: React.FC = () => {
  // const { setLoading } = useLoading();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"created_at" | "name">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getFullName = useCallback((user: User) => {
    if (!user.first_name && !user.last_name) return user.email;
    return `${user.first_name || ''} ${user.middle_ini ? user.middle_ini + ' ' : ''}${user.last_name || ''}`.trim();
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AccountApi.getAccounts();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to fetch accounts:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to fetch accounts", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredUsers = useMemo(() => {
    const result = users.filter(user => {
      const fullName = getFullName(user).toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department_name && user.department_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && !user.is_disabled) ||
        (statusFilter === "Disabled" && user.is_disabled);

      const matchesRole = roleFilter === "All" || (user.roles || []).includes(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = getFullName(a).localeCompare(getFullName(b));
      } else if (sortField === "created_at") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = timeA - timeB; // ascending by default
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [searchTerm, statusFilter, roleFilter, sortField, sortDirection, users, getFullName]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredUsers]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleInviteSubmit = async (formData: { emails: string[]; roles: string[] }) => {
    try {
      setIsSubmitting(true);
      await Promise.all(formData.emails.map(email => 
        AccountApi.inviteUser({ email, roles: formData.roles })
      ));
      setShowAddModal(false);
      Swal.fire("Success", "Invitations sent successfully!", "success");
      fetchAccounts();
    } catch (err: any) {
      console.error("Failed to send invitations:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to send some or all invitations", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      await AccountApi.updateAccount(formData);
      setShowEditModal(false);
      setSelectedUser(null);
      Swal.fire("Success", "Account updated successfully!", "success");
      fetchAccounts();
    } catch (err: any) {
      console.error("Failed to update account:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to update account", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableClick = (user: User) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  const handleDisableConfirm = async (reassignments?: ReassignmentPayload) => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      const newDisabledState = !selectedUser.is_disabled;
      await AccountApi.toggleAccountStatus(selectedUser.id, newDisabledState, reassignments);
      setShowDisableModal(false);
      setSelectedUser(null);
      const action = newDisabledState ? "disabled" : "enabled";
      Swal.fire("Success", `Account ${action} successfully!`, "success");
      fetchAccounts();
    } catch (err: any) {
      console.error("Failed to toggle account status:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to update account status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  const handleSort = (field: "created_at" | "name") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const getRoleDisplay = (roles: string[]) => (roles || []).map(r => ROLE_DISPLAY[r] || r).join(", ");

  const getRoleCount = (role: string) => {
    if (role === 'All') return users.length;
    return users.filter(u => (u.roles || []).includes(role)).length;
  };

  const tabs = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'rnd', label: 'R&D Staff', icon: Microscope },
    { id: 'evaluator', label: 'Evaluator', icon: Users },
    { id: 'proponent', label: 'Proponent', icon: GraduationCap },
  ];

  if (isLoading) {
    return <PageLoader mode="table" />;
  }

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 h-full animate-fade-in">
      <header className="flex-shrink-0 pt-12 lg:pt-0">
        <h1 className="text-2xl font-bold text-[#C8102E]">Accounts</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
      </header>

      {/* Role Tabs */}
      <section className="flex-shrink-0 overflow-x-auto pb-2">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const isActive = roleFilter === tab.id;
            const count = getRoleCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => { setRoleFilter(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${isActive
                  ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
                  }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
          <div className="relative flex-1 min-w-0 w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users, email, department..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full min-w-0"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full sm:w-auto bg-white min-w-[140px]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>

            <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto">
              <Mail className="w-4 h-4" />
              Invite User
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] cursor-pointer hover:bg-gray-200 group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Name
                    <div className="flex flex-col -space-y-1">
                      <ChevronUp className={`w-3 h-3 ${sortField === "name" && sortDirection === "asc" ? "text-[#C8102E]" : "text-gray-400"}`} />
                      <ChevronDown className={`w-3 h-3 ${sortField === "name" && sortDirection === "desc" ? "text-[#C8102E]" : "text-gray-400"}`} />
                    </div>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell min-w-[160px]">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Role</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">Department</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => {
                  const isDisabled = user.is_disabled;
                  return (
                    <tr key={user.id} className={`transition-colors ${isDisabled ? 'bg-gray-100 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center min-w-0">
                          <SecureImage src={user.photo_profile_url} fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`} alt={getFullName(user)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 object-cover flex-shrink-0 ${isDisabled ? 'grayscale' : ''}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{getFullName(user)}</div>
                            <div className="text-xs text-gray-500 sm:hidden truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell"><div className="truncate max-w-[160px]">{user.email}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm text-gray-600">{getRoleDisplay(user.roles)}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell"><div className="truncate max-w-[120px]">{user.department_name || "N/A"}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!isDisabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                          }`}>
                          {isDisabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button onClick={() => handleEditClick(user)} disabled={isDisabled} className="flex items-center gap-1 text-[#C8102E] hover:text-[#A00D26] font-medium text-xs sm:text-sm p-1 rounded hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDisableClick(user)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-xs sm:text-sm p-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap">
                            <Power className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{isDisabled ? "Enable" : "Disable"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 whitespace-nowrap">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}
      </section>

      </div>
      <AddAccountModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleInviteSubmit}
        isSubmitting={isSubmitting}
      />

      <EditAccountModal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        user={selectedUser}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      <DisableAccountModal
        isOpen={showDisableModal}
        onClose={handleCloseModal}
        user={selectedUser}
        onConfirm={handleDisableConfirm}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default Accounts;
