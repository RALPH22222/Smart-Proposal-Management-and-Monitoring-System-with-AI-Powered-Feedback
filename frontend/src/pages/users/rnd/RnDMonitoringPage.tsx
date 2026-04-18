import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  User,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Eye,
  BarChart3,
  Target,
  Play,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  Wallet,
  Download,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { exportToCsv, FUNDED_PROJECT_CSV_COLUMNS } from '../../../utils/csv-export';
import { type Project, type ProjectStatus } from '../../../types/InterfaceProject';
import { useAuthContext } from '../../../context/AuthContext';
import { fetchFundedProjects, transformToProject, updateProjectStatus } from '../../../services/ProjectMonitoringApi';
import RnDProjectDetailModal from '../../../components/rnd-component/RnDProjectDetailModal';
import { formatDate } from '../../../utils/date-formatter';
import BlockProjectModal from '../../../components/rnd-component/BlockProjectModal';
import PageLoader from '../../../components/shared/PageLoader';
import ProgressRing from '../../../components/shared/ProgressRing';

interface MonitoringPageProps {
  onStatsUpdate?: () => void;
}

const MonitoringPage: React.FC<MonitoringPageProps> = () => {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Block Modal State
  const [projectToBlock, setProjectToBlock] = useState<Project | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent-old');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (yearFilter !== 'All') {
      filtered = filtered.filter(project => {
        const year = project.startDate ? new Date(project.startDate).getFullYear().toString() : 'N/A';
        return year === yearFilter;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "a-z") return a.title.localeCompare(b.title);
      if (sortOrder === "z-a") return b.title.localeCompare(a.title);

      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();

      if (sortOrder === "recent-old") return dateB - dateA;
      if (sortOrder === "old-recent") return dateA - dateB;

      return 0;
    });

    setFilteredProjects(sorted);
    setCurrentPage(1);
  }, [projects, statusFilter, searchTerm, yearFilter, sortOrder]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchFundedProjects("rnd");
      const transformed = data.map(transformToProject);
      const sorted = transformed.sort((a: any, b: any) => Number(b.backendId || 0) - Number(a.backendId || 0));
      setProjects(sorted);
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

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
  };

  // --- BLOCKING HANDLERS ---
  const handleOpenBlockModal = (project: Project) => {
    setProjectToBlock(project);
    setIsBlockModalOpen(true);
  };

  const handleCloseBlockModal = () => {
    setIsBlockModalOpen(false);
    setProjectToBlock(null);
  };

  const handleConfirmBlock = async () => {
    if (!projectToBlock || !user) return;
    if (!projectToBlock.backendId) {
      Swal.fire('Error', 'Unable to identify project.', 'error');
      return;
    }

    Swal.fire({
      title: 'Blocking project...',
      text: 'Suspending co-leads and updating project status.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await updateProjectStatus(projectToBlock.backendId, 'blocked', user.id);
      handleCloseBlockModal();
      await Swal.fire('Blocked', `Project has been shut down and proponents blocked.`, 'success');
      loadProjects();
    } catch (error: any) {
      Swal.fire('Error', error?.response?.data?.message || 'Failed to block project.', 'error');
    }
  };

  // Statistics calculations
  const getStatusCount = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status).length;
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

  const overdueReportsCount = projects.reduce(
    (sum, p) => sum + (p.overdueReportsCount || 0),
    0,
  );
  const pendingFundRequestsCount = projects.reduce(
    (sum, p) => sum + (p.pendingFundRequestsCount || 0),
    0,
  );

  const statCards = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FileText,
      color: 'text-blue-800',
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Projects',
      value: getStatusCount('Active'),
      icon: Play,
      color: 'text-emerald-600',
      borderColor: 'border-emerald-300',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Pending Fund Requests',
      value: pendingFundRequestsCount,
      icon: Wallet,
      color: 'text-yellow-800',
      borderColor: 'border-yellow-400',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Delayed Projects',
      value: getStatusCount('Delayed'),
      icon: AlertTriangle,
      color: 'text-amber-600',
      borderColor: 'border-amber-300',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Overdue Reports',
      value: overdueReportsCount,
      icon: AlertCircle,
      color: 'text-red-600',
      borderColor: 'border-red-300',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Avg. Completion',
      value: `${getAverageCompletion()}%`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      borderColor: 'border-cyan-300',
      bgColor: 'bg-cyan-50',
    },
  ];

  const getStatusBadge = (status: ProjectStatus) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';

    switch (status) {
      case 'Active':
        return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
      case 'Completed':
        return `${baseClasses} text-blue-600 bg-blue-50 border-blue-200`;
      case 'On Hold':
        return `${baseClasses} text-purple-600 bg-purple-50 border-purple-200`;
      case 'Delayed':
        return `${baseClasses} text-yellow-600 bg-yellow-50 border-yellow-200`;
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

  if (loading) return <PageLoader mode="table" />;

  return (
    <>
      <div className="w-full min-h-screen overflow-x-hidden px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col lg:flex-row animate-fade-in">
        <div className="flex-1 flex flex-col gap-4 lg:gap-6">
          {/* Header */}
          <header className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                  Project Monitoring
                </h1>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Track and monitor all research and development projects
                </p>
              </div>
              <button
                onClick={() =>
                  exportToCsv('funded-projects', filteredProjects, FUNDED_PROJECT_CSV_COLUMNS)
                }
                disabled={filteredProjects.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm bg-white text-[#C8102E] border border-[#C8102E]/30 hover:bg-[#C8102E]/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={filteredProjects.length === 0 ? 'No rows to export' : 'Export visible rows to CSV'}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" aria-label="Project statistics">
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className={`${stat.bgColor} shadow-xl rounded-2xl border ${stat.borderColor} p-4 transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-2">{stat.title}</p>
                      <p className={`text-xl font-bold ${stat.color} tabular-nums`}>
                        {stat.value}
                      </p>
                    </div>
                    <IconComponent className={`${stat.color} w-6 h-6 opacity-80`} />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Search and Filters Section */}
          <section className="flex-shrink-0 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as ProjectStatus | 'All'); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active ({getStatusCount('Active')})</option>
                <option value="Completed">Completed ({getStatusCount('Completed')})</option>
                <option value="Delayed">Delayed ({getStatusCount('Delayed')})</option>
                <option value="On Hold">On Hold ({getStatusCount('On Hold')})</option>
              </select>
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm cursor-pointer"
              >
                <option value="All">All Years</option>
                {Array.from(new Set(projects.map(p => p.startDate ? new Date(p.startDate).getFullYear() : null).filter(Boolean))).sort((a: any, b: any) => b - a).map(year => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm cursor-pointer"
              >
                <option value="recent-old">Recent to Old</option>
                <option value="old-recent">Old to Recent</option>
                <option value="a-z">Title (A-Z)</option>
                <option value="z-a">Title (Z-A)</option>
              </select>
            </div>
          </section>

          {/* Projects List */}
          <main className="relative bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
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
                <div className="text-center py-12 px-4 mt-4">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No projects found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Projects will appear here once they are marked as active and ready for monitoring.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paginatedProjects.map((project) => {
                    const daysRemaining = getDaysRemaining(project.endDate);
                    const isOverdue = daysRemaining < 0 && project.status !== 'Completed';

                    return (
                      <article
                        key={project.id}
                        className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">
                              {project.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                <span>{project.principalInvestigator}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                <span>{project.department}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-3 mb-2">
                              <ProgressRing
                                size={36}
                                strokeWidth={3.5}
                                percentage={project.status === 'Completed' ? 100 : project.completionPercentage}
                                color={project.status === 'Completed' ? '#2563eb' : project.status === 'Delayed' ? '#eab308' : project.status === 'On Hold' ? '#8b5cf6' : '#16a34a'}
                              />
                              <span className="text-xs font-medium text-slate-700">
                                {project.status === 'Completed' ? 100 : project.completionPercentage}% Reported
                              </span>
                            </div>

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

                          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            <div className="flex flex-col gap-2 items-start sm:items-end">
                              <span className={getStatusBadge(project.status)}>
                                {project.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewProjectDetails(project)}
                                className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </button>
                              {/* Block Button */}
                              <button
                                onClick={() => handleOpenBlockModal(project)}
                                className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium border border-gray-200 hover:border-red-200"
                                title="Block Proponent & Shutdown Project"
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Block
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
        </div>
      </div>

      {/* Project Detail Modal */}
      <RnDProjectDetailModal
        project={selectedProject}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      {/* Block Project Modal */}
      <BlockProjectModal
        isOpen={isBlockModalOpen}
        project={projectToBlock}
        onClose={handleCloseBlockModal}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
};

export default MonitoringPage;