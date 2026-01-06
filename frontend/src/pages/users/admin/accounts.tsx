import React, { useState, useMemo, useEffect } from "react";
import { useLoading } from "../../../contexts/LoadingContext";
import { UserPlus, Edit2, Power, Search } from "lucide-react";

// Import Shared Type and Modals
import type { User } from "../../../types/admin";
import AddAccountModal from "../../../components/admin-component/addAccountModal";
import EditAccountModal from "../../../components/admin-component/editAccountModal";

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
  
  const [users, setUsers] = useState<User[]>(mockUsers); // Converted to state for optimistic updates
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const uniqueRoles = useMemo(() => Array.from(new Set(users.map(user => user.role))).sort(), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.agency && user.agency.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      
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

  const handleBlockClick = (user: User) => {
    setSelectedUser(user);
    setBlockReason("No Progress"); // Default
    setShowBlockModal(true);
  };

  const handleBlockConfirm = () => {
    if (selectedUser) {
      // Optimistic Update
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'Blocked' } : u
      ));
      
      console.log(`Blocking user ${selectedUser.id} for reason: ${blockReason}`);
      setShowBlockModal(false);
      setSelectedUser(null);
      alert(`User blocked successfully! (Reason: ${blockReason})`);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowBlockModal(false);
    setSelectedUser(null);
  };

  const getFullName = (user: User) => `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;

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
              placeholder="Search users, email, agency..."
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
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
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

      <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell min-w-[160px]">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Role</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">Agency</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => {
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`;
                  const isBlocked = user.status === 'Blocked';
                  return (
                    <tr key={user.id} className={`transition-colors ${isBlocked ? 'bg-gray-100 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center min-w-0">
                          <img src={avatarUrl} alt={getFullName(user)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 object-cover flex-shrink-0 ${isBlocked ? 'grayscale' : ''}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{getFullName(user)}</div>
                            <div className="text-xs text-gray-500 sm:hidden truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell"><div className="truncate max-w-[160px]">{user.email}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm text-gray-600">{user.role}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell"><div className="truncate max-w-[120px]">{user.agency || "N/A"}</div></td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "Active" ? "bg-green-100 text-green-800" : 
                            user.status === "Blocked" ? "bg-gray-200 text-gray-600" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col xs:flex-row gap-1 xs:gap-2">
                          <button onClick={() => handleEditClick(user)} disabled={isBlocked} className="flex items-center gap-1 text-[#C8102E] hover:text-[#A00D26] font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <Edit2 className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleBlockClick(user)} disabled={isBlocked} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <Power className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                            <span>{isBlocked ? "Blocked" : "Block/Suspend"}</span>
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
      />

      <EditAccountModal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        user={selectedUser}
        onSubmit={handleEditSubmit}
      />

      {/* Block/Suspend Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Block User</h3>
              <p className="text-sm text-gray-600 mb-4">Reason for blocking <span className="font-bold">{selectedUser && getFullName(selectedUser)}</span>?</p>
              
              <div className="space-y-3 mb-6">
                 <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="reason" value="No Progress" checked={blockReason === "No Progress"} onChange={(e) => setBlockReason(e.target.value)} className="text-red-600 focus:ring-red-500"/>
                    <span className="text-sm font-medium text-gray-700">No Progress</span>
                 </label>
                 <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="reason" value="Project Dropped" checked={blockReason === "Project Dropped"} onChange={(e) => setBlockReason(e.target.value)} className="text-red-600 focus:ring-red-500"/>
                    <span className="text-sm font-medium text-gray-700">Project Dropped</span>
                 </label>
              </div>

              <div className="flex gap-3">
                 <button onClick={handleCloseModal} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                 <button onClick={handleBlockConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors">Block User</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;