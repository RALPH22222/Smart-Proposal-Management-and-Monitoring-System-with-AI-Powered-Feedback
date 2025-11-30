import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Eye,
  BarChart3,
  Target,
  DollarSign,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle // Added for Delayed status
} from 'lucide-react';
import { type Project, type ProjectStatus } from '../../../types/InterfaceProject'; // Removed ProjectPhase
import RnDProjectDetailModal from '../../../components/rnd-component/RnDProjectDetailModal';

// --- UPDATED MOCK DATA ---
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    projectId: 'PROJ-2025-001',
    title: 'AI-Based Crop Disease Detection System',
    description: 'Developing a mobile application using computer vision to detect early signs of diseases in local crops.',
    principalInvestigator: 'Dr. Maria Santos',
    department: 'College of Computer Studies',
    status: 'Active',
    startDate: '2025-01-15',
    endDate: '2025-12-15',
    budget: 500000,
    completionPercentage: 35,
    researchArea: 'Agriculture Technology',
    lastModified: '2025-02-01',
    fundRequests: [
       { id: 'fr1', amount: 50000, reason: 'Additional GPU Server costs', dateRequested: '2025-06-01', status: 'Pending'}
    ],
    milestones: [
      { id: 'm1', name: 'Data Collection', dueDate: '2025-03-15', status: 'Completed', completed: true },
      { 
        id: 'm2', 
        name: 'Model Training', 
        dueDate: '2025-06-30', 
        status: 'Review Required',
        submissionDate: '2025-06-28',
        submissionProof: 'Training logs and accuracy report attached. Model reached 95% accuracy.',
        completed: false
      },
      { id: 'm3', name: 'Beta Testing', dueDate: '2025-09-15', status: 'Pending', completed: false }
    ],
  },
  {
    id: '2',
    projectId: 'PROJ-2025-002',
    title: 'Renewable Energy Integration for Rural Schools',
    description: 'Assessment and implementation of solar energy solutions.',
    principalInvestigator: 'Engr. Robert Lee',
    department: 'College of Engineering',
    status: 'Planning',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    budget: 1200000,
    completionPercentage: 0,
    researchArea: 'Renewable Energy',
    lastModified: '2025-01-01',
    milestones: [
       { id: 'p1', name: 'Site Survey', dueDate: '2025-05-15', status: 'Proposed', description: 'Ocular inspection of 5 schools.', completed: false },
       { id: 'p2', name: 'System Design', dueDate: '2025-07-20', status: 'Proposed', description: 'Solar PV layout drafts.', completed: false }
    ]
  },
  {
    id: '3',
    projectId: 'PROJ-2024-015',
    title: 'Community-Based Disaster Risk Reduction',
    description: 'Integrated early warning system for flood-prone communities.',
    principalInvestigator: 'Dr. Elena Cruz',
    department: 'College of Science',
    status: 'On Hold',
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    budget: 750000,
    completionPercentage: 60,
    researchArea: 'Disaster Risk',
    lastModified: '2024-12-01',
    onHoldReason: 'Awaiting release of LGU counterpart funds.',
    fundRequests: [
         { id: 'fr2', amount: 20000, reason: 'Legal fees for MOA notarization', dateRequested: '2024-08-01', status: 'Pending'}
    ],
    milestones: []
  },
  {
    id: '4',
    projectId: 'PROJ-2023-089',
    title: 'Halal-Compliant Food Processing',
    description: 'New preservation methods for seafood products.',
    principalInvestigator: 'Prof. Abdul Malik',
    department: 'College of Home Economics',
    status: 'Completed',
    startDate: '2023-01-10',
    endDate: '2024-01-10',
    budget: 350000,
    completionPercentage: 100,
    researchArea: 'Food Technology',
    lastModified: '2024-01-10',
    milestones: [
      { id: 'c1', name: 'Literature Review', dueDate: '2023-02-28', status: 'Completed', completed: true },
      { id: 'c2', name: 'Final Report', dueDate: '2024-01-10', status: 'Completed', completed: true }
    ]
  },
  {
    id: '5',
    projectId: 'PROJ-2025-005',
    title: 'Marine Biodiversity Assessment',
    description: 'Comprehensive survey of coral reef health.',
    principalInvestigator: 'Dr. James Reid',
    department: 'Forestry',
    status: 'Delayed',
    startDate: '2025-02-01',
    endDate: '2026-02-01',
    budget: 850000,
    completionPercentage: 20,
    researchArea: 'Marine Biology',
    lastModified: '2025-03-10',
    milestones: [
       { 
         id: 'd1', 
         name: 'Equipment Procurement', 
         dueDate: '2025-03-01', 
         status: 'Delayed', 
         completed: false,
         extensionRequest: {
            newDate: '2025-04-15',
            reason: 'Supplier stocks unavailable due to shipping issues.',
            status: 'Pending'
         }
       }
    ]
  }
];

interface MonitoringPageProps {
  onStatsUpdate?: () => void;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ onStatsUpdate }) => {
  const [projects, setProjects] = useState<Project[]>([]);   
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  // Removed phaseFilter state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects based on status and search term (Removed Phase logic)
  useEffect(() => {
    let filtered = projects;

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [projects, statusFilter, searchTerm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setProjects(MOCK_PROJECTS as Project[]);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
  };

  // Statistics calculations
  const getStatusCount = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status).length;
  };

  const getTotalBudget = () => {
    return projects.reduce((sum, project) => sum + project.budget, 0);
  };

  const getAverageCompletion = () => {
    if (projects.length === 0) return 0;
    const totalCompletion = projects.reduce((sum, project) => sum + project.completionPercentage, 0);
    return Math.round(totalCompletion / projects.length);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  const statCards = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      trend: '+12%',
    },
    {
      title: 'Active Projects',
      value: getStatusCount('Active'),
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      trend: '+8%',
    },
    {
      title: 'Completed',
      value: getStatusCount('Completed'),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      trend: '+15%',
    },
    {
      title: 'Delayed',
      value: getStatusCount('Delayed'),
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      trend: '+2%',
    },
    {
      title: 'Total Budget',
      value: `₱${getTotalBudget().toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      trend: '+20%',
    },
    {
      title: 'Avg. Completion',
      value: `${getAverageCompletion()}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      trend: '+3%',
    }
  ];

  const getStatusBadge = (status: ProjectStatus) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';
    
    switch (status) {
      case 'Active':
        return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
      case 'Completed':
        return `${baseClasses} text-blue-600 bg-blue-50 border-blue-200`;
      case 'On Hold':
        return `${baseClasses} text-slate-600 bg-slate-100 border-slate-200`;
      case 'At Risk':
        return `${baseClasses} text-orange-600 bg-orange-50 border-orange-200`;
      case 'Delayed':
        return `${baseClasses} text-yellow-600 bg-yellow-50 border-yellow-200`;
      case 'Planning':
        return `${baseClasses} text-purple-600 bg-purple-50 border-purple-200`;
      default:
        return `${baseClasses} text-slate-600 bg-slate-50 border-slate-200`;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 w-full lg:h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                R&D Project Monitoring
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Track and monitor all research and development projects
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="flex-shrink-0" aria-label="Project statistics">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className={`${stat.bgColor} border border-slate-200 rounded-xl p-3 transition-all duration-300 hover:shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IconComponent className={`${stat.color} w-4 h-4`} />
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">{stat.trend}</span>
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-1 leading-tight line-clamp-1">
                      {stat.title}
                    </h3>
                    <p className="text-base font-bold text-slate-800 truncate">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="flex-shrink-0" aria-label="Filter projects">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects by title, ID, or PI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                  aria-label="Search projects"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'All')}
                  className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                  aria-label="Filter by status"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active ({getStatusCount('Active')})</option>
                  <option value="Completed">Completed ({getStatusCount('Completed')})</option>
                  <option value="Delayed">Delayed ({getStatusCount('Delayed')})</option>
                  <option value="Planning">Planning ({getStatusCount('Planning')})</option>
                  <option value="At Risk">At Risk ({getStatusCount('At Risk')})</option>
                  <option value="On Hold">On Hold ({getStatusCount('On Hold')})</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </div>
        </section>

        {/* Projects List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#C8102E]" />
                Research Projects
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Target className="w-4 h-4" />
                <span>{projects.length} total projects</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'All'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No projects have been added yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProjects.map((project) => {
                  const daysRemaining = getDaysRemaining(project.endDate);
                  // Adjusted overdue logic to check if not completed
                  const isOverdue = daysRemaining < 0 && project.status !== 'Completed';
                  
                  return (
                    <article
                      key={project.id}
                      className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                      aria-labelledby={`project-title-${project.id}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2
                            id={`project-title-${project.id}`}
                            className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
                          >
                            {project.title}
                          </h2>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" aria-hidden="true" />
                              <span>{project.principalInvestigator}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              <span>{project.department}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" aria-hidden="true" />
                              <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-500">ID: {project.projectId}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    project.status === 'Completed' ? 'bg-blue-600' : 
                                    project.status === 'At Risk' ? 'bg-orange-500' :
                                    project.status === 'Delayed' ? 'bg-yellow-500' :
                                    'bg-green-600'
                                }`}
                                style={{ width: project.status === 'Completed' ? '100%' : `${project.completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {project.status === 'Completed' ? 100 : project.completionPercentage}% Complete
                            </span>
                          </div>

                          {/* Timeline Status */}
                          <div className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {isOverdue ? (
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" />
                                {Math.abs(daysRemaining)} days overdue
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {daysRemaining} days remaining
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex flex-col gap-2 items-end">
                            <span className={getStatusBadge(project.status)}>
                              {project.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewProjectDetails(project)}
                              className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
                              aria-label={`View details for ${project.title}`}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredProjects.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
         {/* Project Detail Modal - Props Updated to match new Modal Architecture */}
         <RnDProjectDetailModal
           project={selectedProject}
           isOpen={isDetailModalOpen}
           onClose={handleCloseModal}
         />
      </div>
    </div>
  );
};

export default MonitoringPage;