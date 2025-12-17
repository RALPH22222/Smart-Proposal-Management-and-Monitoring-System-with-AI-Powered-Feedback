import React, { useState, useMemo, useEffect } from "react";
import { useLoading } from "../../../contexts/LoadingContext";
import { UserPlus, Edit2, Power, Search } from "lucide-react";

// Import Shared Type and Modals
import type { User } from "../../../types/admin";
import AddAccountModal from "./addAccountModal";
import EditAccountModal from "./editAccountModal";
import DisableAccountModal from "./disableAccountModal";

const STORAGE_KEY = "system_users_v1";

const DEFAULT_USERS: User[] = [
  { id: 1, firstName: "Hudhaifah", lastName: "Labang", email: "dap@example.com", role: "Admin", status: "Active", agency: "R&D Office" },
  { id: 2, firstName: "Chester", lastName: "Candido", email: "chex@example.com", role: "Evaluator", status: "Active", agency: "College of Computing Studies" },
  { id: 3, firstName: "Ace", lastName: "Nieva", email: "ace@example.com", role: "Evaluator", status: "Inactive", agency: "College of Engineering" },
];

const Accounts: React.FC = () => {
  const { setLoading } = useLoading();
  
  // --- DATABASE STATE ---
  const [users, setUsers] = useState<User[]>([]);
  
  // --- UI STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- LOCAL STORAGE LOGIC ---
  useEffect(() => {
    setLoading(true);
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setUsers(JSON.parse(savedData));
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [setLoading]);

  // Persist to local storage whenever users state changes
  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
  };

  // --- CRUD HANDLERS ---
  const handleAddSubmit = (formData: any) => {
    const newUser: User = {
      ...formData,
      id: Date.now(), // Generate unique ID
    };
    updateUsers([newUser, ...users]);
    setShowAddModal(false);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = (formData: any) => {
    const updated = users.map(u => u.id === selectedUser?.id ? { ...u, ...formData } : u);
    updateUsers(updated);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDisableClick = (user: User) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  const handleDisableConfirm = () => {
    if (selectedUser) {
      const updated = users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } 
          : u
      );
      updateUsers(updated);
      setShowDisableModal(false);
      setSelectedUser(null);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  // --- SEARCH & FILTER LOGIC ---
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

  const getFullName = (user: User) => `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 h-full">
      <header className="flex-shrink-0 pt-12 lg:pt-0">
        <h1 className="text-2xl font-bold text-red-700">Accounts</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and roles (Stored Locally)</p>
      </header>

      <section className="flex-shrink-0">
        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] w-full"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
              >
                <option value="All">All Roles</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            
            <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto">
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
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs mr-3">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{getFullName(user)}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{user.email}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(user)} className="text-[#C8102E] hover:underline flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDisableClick(user)} className="text-gray-500 hover:underline flex items-center gap-1">
                          <Power className="w-3 h-3" /> {user.status === "Active" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="px-4 py-4 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >Previous</button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >Next</button>
            </div>
        </div>
      </section>

      <AddAccountModal isOpen={showAddModal} onClose={handleCloseModal} onSubmit={handleAddSubmit} />
      <EditAccountModal isOpen={showEditModal} onClose={handleCloseModal} user={selectedUser} onSubmit={handleEditSubmit} />
      <DisableAccountModal isOpen={showDisableModal} onClose={handleCloseModal} user={selectedUser} onConfirm={handleDisableConfirm} />
    </div>
  );
};

export default Accounts;