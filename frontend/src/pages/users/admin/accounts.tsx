import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { useLoading } from "../../../contexts/LoadingContext";
import { UserPlus, Edit2, Power, Search } from "lucide-react";

import type { User } from "../../../types/admin";
import { AccountApi } from "../../../services/admin/AccountApi";
import AddAccountModal from "../../../components/admin-component/addAccountModal";
import EditAccountModal from "../../../components/admin-component/editAccountModal";
import DisableAccountModal from "../../../components/admin-component/disableAccountModal";

const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  evaluator: "Evaluator",
  rnd: "R&D Staff",
  proponent: "Proponent",
};

const Accounts: React.FC = () => {
  const { setLoading } = useLoading();

  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AccountApi.getAccounts();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to fetch accounts:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to fetch accounts", "error");
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const uniqueRoles = useMemo(() => {
    const allRoles = new Set<string>();
    users.forEach(u => (u.roles || []).forEach(r => allRoles.add(r)));
    return Array.from(allRoles).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.middle_ini || ''} ${user.last_name}`.toLowerCase();
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
  }, [searchTerm, statusFilter, roleFilter, users]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredUsers]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAddSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      await AccountApi.createAccount(formData);
      setShowAddModal(false);
      Swal.fire("Success", "Account created successfully!", "success");
      fetchAccounts();
    } catch (err: any) {
      console.error("Failed to create account:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to create account", "error");
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

  const handleDisableConfirm = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      const newDisabledState = !selectedUser.is_disabled;
      await AccountApi.toggleAccountStatus(selectedUser.id, newDisabledState);
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

  const getFullName = (user: User) => `${user.first_name} ${user.middle_ini ? user.middle_ini + ' ' : ''}${user.last_name}`;

  const getRoleDisplay = (roles: string[]) => (roles || []).map(r => ROLE_DISPLAY[r] || r).join(", ");

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 h-full">
      <header className="flex-shrink-0 pt-12 lg:pt-0">
        <h1 className="text-2xl font-bold text-red-700">Accounts</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
      </header>

      <section className="flex-shrink-0">
        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users, email, department..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full min-w-0"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
              >
                <option value="All">All Roles</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{ROLE_DISPLAY[role] || role}</option>)}
              </select>
            </div>

            <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap">
              <UserPlus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
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
                  const avatarUrl = user.photo_profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`;
                  const isDisabled = user.is_disabled;
                  return (
                    <tr key={user.id} className={`transition-colors ${isDisabled ? 'bg-gray-100 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center min-w-0">
                          <img src={avatarUrl} alt={getFullName(user)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 object-cover flex-shrink-0 ${isDisabled ? 'grayscale' : ''}`} />
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !isDisabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                        }`}>
                          {isDisabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col xs:flex-row gap-1 xs:gap-2">
                          <button onClick={() => handleEditClick(user)} disabled={isDisabled} className="flex items-center gap-1 text-[#C8102E] hover:text-[#A00D26] font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <Edit2 className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDisableClick(user)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap">
                            <Power className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
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

      <AddAccountModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleAddSubmit}
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
    </div>
  );
};

export default Accounts;
