import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "../../../components/sidebar";
import { useLoading } from "../../../contexts/LoadingContext";
import { X, UserPlus, ChevronDown, ChevronUp, Edit2, Power, Search, Menu } from "lucide-react";

type User = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  agency?: string;
  specialties?: string[];
};

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSpecialties, setShowSpecialties] = useState(false);
  const itemsPerPage = 5;

  // Form state for add account
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "Proponent",
    agency: "",
    status: "Active" as "Active" | "Inactive",
    specialties: [] as string[]
  });

  // Agencies list
  const agencies = [
    "R&D Office",
    "College of Computing Studies",
    "College of Engineering",
    "College of Science",
    "College of Education",
    "Research Department",
    "External Researcher",
    "University of Manila",
    "Private Institution",
    "Government Agency",
    "Industry Partner"
  ];

  // Roles list (RDEC removed)
  const roles = ["Admin", "Evaluator", "R&D Staff", "Proponent"];

  // Specialties list for Evaluators
  const allSpecialties = [
    "Information Technology",
    "Software Engineering",
    "Computer Science",
    "Data Science",
    "Artificial Intelligence",
    "Cybersecurity",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Chemical Engineering",
    "Industrial Engineering",
    "Biomedical Engineering",
    "Environmental Engineering",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Biotechnology",
    "Agriculture",
    "Food Technology",
    "Medicine",
    "Public Health",
    "Psychology",
    "Sociology",
    "Economics",
    "Business Administration",
    "Education",
    "Linguistics",
    "Architecture",
    "Urban Planning"
  ];

  // Grouped specialties for better organization
  const groupedSpecialties = {
    "Technology & Computing": [
      "Information Technology",
      "Software Engineering",
      "Computer Science",
      "Data Science",
      "Artificial Intelligence",
      "Cybersecurity"
    ],
    "Engineering": [
      "Civil Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Chemical Engineering",
      "Industrial Engineering",
      "Biomedical Engineering",
      "Environmental Engineering"
    ],
    "Sciences": [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Biotechnology"
    ],
    "Agriculture & Food": [
      "Agriculture",
      "Food Technology"
    ],
    "Health & Medicine": [
      "Medicine",
      "Public Health",
      "Psychology"
    ],
    "Social Sciences": [
      "Sociology",
      "Economics",
      "Business Administration",
      "Education",
      "Linguistics"
    ],
    "Design & Planning": [
      "Architecture",
      "Urban Planning"
    ]
  };

  // page-level loading: show overlay until data is ready
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

  // Get unique roles from mockUsers
  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(mockUsers.map(user => user.role)));
    return roles.sort();
  }, []);

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.agency && user.agency.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.specialties && user.specialties.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [searchTerm, statusFilter, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredUsers]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset specialties when role changes from Evaluator to something else
    if (name === "role" && value !== "Evaluator") {
      setFormData(prev => ({
        ...prev,
        specialties: []
      }));
      setShowSpecialties(false);
    }
  };

  // Handle specialty selection
  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  // Handle form submission for new account
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Evaluator has at least one specialty
    if (formData.role === "Evaluator" && formData.specialties.length === 0) {
      alert("Please select at least one specialty for Evaluator role.");
      return;
    }
    
    // Here you would typically send the data to your backend
    console.log("New account data:", formData);
    
    // Reset form and close modal
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      role: "Proponent",
      agency: "",
      status: "Active",
      specialties: []
    });
    setShowSpecialties(false);
    setShowAddModal(false);
    
    // Show success message
    alert("Account created successfully!");
  };

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      middleName: user.middleName || "",
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      agency: user.agency || "",
      status: user.status,
      specialties: user.specialties || []
    });
    setShowEditModal(true);
  };

  // Handle disable/enable button click
  const handleDisableClick = (user: User) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Evaluator has at least one specialty
    if (formData.role === "Evaluator" && formData.specialties.length === 0) {
      alert("Please select at least one specialty for Evaluator role.");
      return;
    }
    
    // Here you would typically send the updated data to your backend
    console.log("Updated account data:", formData);
    
    // Close modal
    setShowEditModal(false);
    setSelectedUser(null);
    
    // Show success message
    alert("Account updated successfully!");
  };

  // Handle disable/enable confirmation
  const handleDisableConfirm = () => {
    if (selectedUser) {
      // Here you would typically send the status update to your backend
      console.log(`Setting user ${selectedUser.id} status to ${selectedUser.status === "Active" ? "Inactive" : "Active"}`);
      
      // Close modal
      setShowDisableModal(false);
      setSelectedUser(null);
      
      // Show success message
      alert(`Account ${selectedUser.status === "Active" ? "disabled" : "enabled"} successfully!`);
    }
  };

  // Reset form when modal closes
  const handleCloseModal = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      role: "Proponent",
      agency: "",
      status: "Active",
      specialties: []
    });
    setShowSpecialties(false);
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  // Get full name for display
  const getFullName = (user: User) => {
    return `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
  };

  // Custom styles for hiding scrollbars in modals
  const modalScrollStyles = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    '&::-webkit-scrollbar': {
      display: 'none'
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">

          {/* Desktop Header */}
          <header className="pt-10 sm:pt-0 pb-4 sm:pb-6">
            <h1 className="text-2xl font-bold text-red-700">Accounts</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
          </header>

          {/* Search and Filters Section */}
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full min-w-0"
                />
              </div>
              
              {/* Filters and Add Button Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
                <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] w-full xs:w-auto bg-white min-w-[140px]"
                  >
                    <option value="All">All Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            </div>
          </section>

          {/* Users Table Section */}
          <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell min-w-[160px]">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">
                      Agency
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell min-w-[150px]">
                      Specialties
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => {
                      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        getFullName(user)
                      )}&background=C8102E&color=fff&size=128`;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center min-w-0">
                              <img
                                src={avatarUrl}
                                alt={getFullName(user)}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 object-cover flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {getFullName(user)}
                                </div>
                                <div className="text-xs text-gray-500 sm:hidden truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                            <div className="truncate max-w-[160px]">{user.email}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{user.role}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                            <div className="truncate max-w-[120px]">{user.agency || "N/A"}</div>
                          </td>
                          <td className="px-3 py-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-600">
                              {user.specialties && user.specialties.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.specialties.slice(0, 2).map((specialty, index) => (
                                    <span
                                      key={specialty}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 truncate max-w-[100px]"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                  {user.specialties.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{user.specialties.length - 2} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col xs:flex-row gap-1 xs:gap-2">
                           <button 
                              onClick={() => handleEditClick(user)}
                              className="flex items-center gap-1 text-[#C8102E] hover:text-[#A00D26] font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                            >
                              <Edit2 className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                              <span>Edit</span>
                            </button>

                              <button 
                                onClick={() => handleDisableClick(user)}
                                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-xs xs:text-sm p-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                              >
                                <Power className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                                <span>{user.status === "Active" ? "Disable" : "Enable"}</span>
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-gray-400 mb-2">No users found</div>
                          <div className="text-xs text-gray-500">Try adjusting your search or filters</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 whitespace-nowrap">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span> of{" "}
                  <span className="font-medium">{filteredUsers.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Add Account Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto"
                style={modalScrollStyles}
              >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#C8102E]" />
                    Add New Account
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter middle name (optional)"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="md:col-span-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Agency */}
                    <div>
                      <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
                        Agency / Department *
                      </label>
                      <select
                        id="agency"
                        name="agency"
                        value={formData.agency}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        <option value="">Select Agency</option>
                        {agencies.map(agency => (
                          <option key={agency} value={agency}>{agency}</option>
                        ))}
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Specialties Section - Only show for Evaluator role */}
                  {formData.role === "Evaluator" && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <button
                        type="button"
                        onClick={() => setShowSpecialties(!showSpecialties)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specialties *
                          </label>
                          <p className="text-sm text-gray-500">
                            {formData.specialties.length > 0 
                              ? `${formData.specialties.length} specialty(ies) selected`
                              : "Select areas of expertise"
                            }
                          </p>
                        </div>
                        {showSpecialties ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {showSpecialties && (
                        <div className="mt-4 max-h-60 overflow-y-auto" style={modalScrollStyles}>
                          <div className="space-y-4">
                            {Object.entries(groupedSpecialties).map(([category, specialties]) => (
                              <div key={category}>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {specialties.map(specialty => (
                                    <label key={specialty} className="flex items-center space-x-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={formData.specialties.includes(specialty)}
                                        onChange={() => handleSpecialtyToggle(specialty)}
                                        className="rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]"
                                      />
                                      <span className="text-gray-700">{specialty}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Specialties Preview */}
                  {formData.role === "Evaluator" && formData.specialties.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Specialties:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.map(specialty => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {specialty}
                            <button
                              type="button"
                              onClick={() => handleSpecialtyToggle(specialty)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-md transition-colors font-medium"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Account Modal */}
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto"
                style={modalScrollStyles}
              >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-[#C8102E]" />
                    Edit Account
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="edit-firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label htmlFor="edit-middleName" className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        id="edit-middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="md:col-span-2">
                      <label htmlFor="edit-lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="edit-lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>

                    {/* Agency */}
                    <div>
                      <label htmlFor="edit-agency" className="block text-sm font-medium text-gray-700 mb-1">
                        Agency / Department *
                      </label>
                      <select
                        id="edit-agency"
                        name="agency"
                        value={formData.agency}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        <option value="">Select Agency</option>
                        {agencies.map(agency => (
                          <option key={agency} value={agency}>{agency}</option>
                        ))}
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        id="edit-role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Specialties Section - Only show for Evaluator role */}
                  {formData.role === "Evaluator" && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <button
                        type="button"
                        onClick={() => setShowSpecialties(!showSpecialties)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specialties *
                          </label>
                          <p className="text-sm text-gray-500">
                            {formData.specialties.length > 0 
                              ? `${formData.specialties.length} specialty(ies) selected`
                              : "Select areas of expertise"
                            }
                          </p>
                        </div>
                        {showSpecialties ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {showSpecialties && (
                        <div className="mt-4 max-h-60 overflow-y-auto" style={modalScrollStyles}>
                          <div className="space-y-4">
                            {Object.entries(groupedSpecialties).map(([category, specialties]) => (
                              <div key={category}>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {specialties.map(specialty => (
                                    <label key={specialty} className="flex items-center space-x-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={formData.specialties.includes(specialty)}
                                        onChange={() => handleSpecialtyToggle(specialty)}
                                        className="rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]"
                                      />
                                      <span className="text-gray-700">{specialty}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Specialties Preview */}
                  {formData.role === "Evaluator" && formData.specialties.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Specialties:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.map(specialty => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {specialty}
                            <button
                              type="button"
                              onClick={() => handleSpecialtyToggle(specialty)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-md transition-colors font-medium"
                    >
                      Update Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Disable/Enable Confirmation Modal */}
          {showDisableModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Power className="w-5 h-5 text-[#C8102E]" />
                    {selectedUser.status === "Active" ? "Disable Account" : "Enable Account"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(selectedUser))}&background=C8102E&color=fff&size=128`}
                      alt={getFullName(selectedUser)}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{getFullName(selectedUser)}</h3>
                      <p className="text-sm text-gray-600 truncate">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500">{selectedUser.role}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6 text-sm sm:text-base">
                    Are you sure you want to {selectedUser.status === "Active" ? "disable" : "enable"} this account? 
                    {selectedUser.status === "Active" ? " The user will no longer be able to access the system." : " The user will regain access to the system."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisableConfirm}
                      className={`flex-1 px-4 py-2 rounded-md transition-colors font-medium ${
                        selectedUser.status === "Active" 
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {selectedUser.status === "Active" ? "Disable Account" : "Enable Account"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounts;