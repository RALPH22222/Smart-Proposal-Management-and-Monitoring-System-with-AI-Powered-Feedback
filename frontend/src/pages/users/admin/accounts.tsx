import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "../../../components/admin-component/sidebar";
import { useLoading } from "../../../contexts/LoadingContext";
import { UserPlus, Edit2, Power, Search } from "lucide-react";

// Import Shared Type and Modals
import type { User } from "../../../types/admin";
import AddAccountModal from "../../../components/admin-component/addAccountModal";
import EditAccountModal from "../../../components/admin-component/editAccountModal";
import DisableAccountModal from "../../../components/admin-component/disableAccountModal";

const mockUsers: User[] = [
  { id: 1, firstName: "Hudhaifah", lastName: "Labang", email: "dap@example.com", role: "Admin", status: "Active", agency: "R&D Office" },
  { id: 2, firstName: "Chester", lastName: "Candido", email: "chex@example.com", role: "Evaluator", status: "Active", agency: "College of Computing Studies", specialties: ["IT", "Software Engineering"] },
  { id: 3, firstName: "Ace", lastName: "Nieva", email: "ace@example.com", role: "Evaluator", status: "Inactive", agency: "College of Engineering", specialties: ["Civil Engineering", "Construction"] },
  { id: 4, firstName: "Diana", lastName: "Castillon", email: "diana@example.com", role: "R&D Staff", status: "Active", agency: "R&D Office" },
  { id: 5, firstName: "Andre Lee", lastName: "Cuyugan", email: "hellopo@example.com", role: "Proponent", status: "Active", agency: "External Researcher" },
  { id: 6, firstName: "Carlos", lastName: "Rodriguez", email: "carlos@example.com", role: "Proponent", status: "Active", agency: "University of Manila" },
  { id: 7, firstName: "Sofia", lastName: "Hernandez", email: "sofia@example.com", role: "Proponent", status: "Inactive", agency: "Private Institution" },
];

const Accounts: React.FC = () => {
  const { setLoading } = useLoading();
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // page-level loading
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 450);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [setLoading]);

  // Derived State
  const uniqueRoles = useMemo(() => Array.from(new Set(mockUsers.map(user => user.role))).sort(), []);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.agency && user.agency.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.specialties && user.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredUsers]);

  // Handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAddSubmit = (formData: any) => {
    console.log("New account data:", formData);
    setShowAddModal(false);
    alert("Account created successfully!");
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = (formData: any) => {
    console.log("Updated account data:", formData);
    setShowEditModal(false);
    setSelectedUser(null);
    alert("Account updated successfully!");
  };

  const handleDisableClick = (user: User) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  const handleDisableConfirm = () => {
    if (selectedUser) {
      console.log(`Setting user ${selectedUser.id} status to ${selectedUser.status === "Active" ? "Inactive" : "Active"}`);
      setShowDisableModal(false);
      setSelectedUser(null);
      alert(`Account ${selectedUser.status === "Active" ? "disabled" : "enabled"} successfully!`);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  const getFullName = (user: User) => `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          <header className="pt-10 sm:pt-0 pb-4 sm:pb-6">
            <h1 className="text-2xl font-bold text-red-700">Accounts</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
          </header>

          <section className="mb-6">
            <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users, email, agency, or specialties"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full min-w-0"
                />
              </div>
              
              {/* Filters and Add Button */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
                <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
                  >
                    <option value="All">All Roles</option>
                    {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                
                <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap">
                  <UserPlus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            </div>
          </section>

          {/* Users Table */}
          <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell min-w-[160px]">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Role</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">Agency</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell min-w-[150px]">Specialties</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => {
                      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center min-w-0">
                              <img src={avatarUrl} alt={getFullName(user)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 object-cover flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{getFullName(user)}</div>
                                <div className="text-xs text-gray-500 sm:hidden truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell"><div className="truncate max-w-[160px]">{user.email}</div></td>
                          <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm text-gray-600">{user.role}</div></td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell"><div className="truncate max-w-[120px]">{user.agency || "N/A"}</div></td>
                          <td className="px-3 py-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-600">
                              {user.specialties && user.specialties.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.specialties.slice(0, 2).map((specialty) => (
                                    <span key={specialty} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 truncate max-w-[100px]">{specialty}</span>
                                  ))}
                                  {user.specialties.length > 2 && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">+{user.specialties.length - 2} more</span>}
                                </div>
                              ) : "N/A"}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col xs:flex-row gap-1 xs:gap-2">
                              <button onClick={() => handleEditClick(user)} className="flex items-center gap-1 text-[#C8102E] hover:text-[#A00D26] font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-200 transition-colors whitespace-nowrap">
                                <Edit2 className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                <span>Edit</span>
                              </button>
                              <button onClick={() => handleDisableClick(user)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap">
                                <Power className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                <span>{user.status === "Active" ? "Disable" : "Enable"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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

          {/* Modals */}
          <AddAccountModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            onSubmit={handleAddSubmit}
          />

          <EditAccountModal
            isOpen={showEditModal}
            onClose={handleCloseModal}
            user={selectedUser}
            onSubmit={handleEditSubmit}
          />

          <DisableAccountModal
            isOpen={showDisableModal}
            onClose={handleCloseModal}
            user={selectedUser}
            onConfirm={handleDisableConfirm}
          />

        </div>
      </div>
    </div>
  );
};

export default Accounts;