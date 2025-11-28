import React, { useState, useEffect } from "react";
import ProponentNavbar from "../../../components/proponent-component/Proponent-navbar";
import ShareModal from "../../../components/proponent-component/ShareModal";
import NotificationsDropdown from "../../../components/proponent-component/NotificationsDropdown";
import DetailedProposalModal from '../../../components/proponent-component/DetailedProposalModal'; 
import { 
  FaListAlt, 
  FaUser,
  FaBell,
  FaTablet,
  FaShareAlt,
  FaUsers
} from 'react-icons/fa';
import { 
  Microscope, FileText, ClipboardCheck, RefreshCw, Award
} from 'lucide-react';

import type { Project, Proposal, Notification } from '../../../types/proponentTypes';
import { 
  mockProjects, 
  initialNotifications,
  getStatusFromIndex,
  getStatusLabel // FIXED: Changed from getStatusLabelByIndex
} from '../../../types/mockData';
import { 
  getStatusColorByIndex, 
  getPriorityColor, 
  getStageIcon,
  getProgressPercentageByIndex,
  filterProjectsByStatus
} from '../../../types/helpers';

const Profile: React.FC = () => {
  // Removed unused activeIndex state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectTab, setProjectTab] = useState<'all' | 'budget'>('all');
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proposal | null>(null);
  
  // Modal states
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Removed unused comments state

  const notifRef = React.useRef<HTMLDivElement | null>(null);

  // Close notifications when clicking outside
  useEffect(() => { // Fixed: Using the imported useEffect
    const onDocClick = (e: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    
    if (notificationsOpen) {
      document.addEventListener('mousedown', onDocClick);
    }
    
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notificationsOpen]);

  // Filter projects by status using helper function
  const { 
    rdEvaluation, 
    evaluatorsAssessment, 
    revision, 
    funded, 
  } = filterProjectsByStatus(mockProjects);

  // Event handlers
  const openShare = (project: Project) => {
    setShareProject(project);
    setShareOpen(true);
    setCopied(false);
    setShareEmail("");
  };

  const closeShare = () => {
    setShareOpen(false);
    setShareProject(null);
    setShareEmail("");
    setCopied(false);
  };

  const handleCardClick = (project: Project) => {
    const proposal: Proposal = {
      id: project.id,
      title: project.title,
      status: getStatusFromIndex(project.currentIndex),
      proponent: "Dr. Maria Santos",
      gender: "Female",
      agency: "University of the Philippines",
      address: "Quezon City, Philippines",
      telephone: "+63 2 1234 5678",
      email: "maria.santos@up.edu.ph",
      cooperatingAgencies: "DOST, CHED, DepEd",
      rdStation: "UP Research Station",
      classification: "Applied Research",
      classificationDetails: "Technology Development",
      modeOfImplementation: "In-house",
      priorityAreas: "Education, Technology",
      sector: "Education",
      discipline: "Computer Science",
      duration: project.duration,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      budgetSources: [{
        source: "DOST Grant",
        ps: project.budget.replace('₱', '₱').split('₱')[1] ? `₱${parseInt(project.budget.replace('₱', '').replace(',', '')) * 0.5}` : "₱500,000",
        mooe: project.budget.replace('₱', '₱').split('₱')[1] ? `₱${parseInt(project.budget.replace('₱', '').replace(',', '')) * 0.3}` : "₱300,000",
        co: project.budget.replace('₱', '₱').split('₱')[1] ? `₱${parseInt(project.budget.replace('₱', '').replace(',', '')) * 0.2}` : "₱200,000",
        total: project.budget
      }],
      budgetTotal: project.budget,
      uploadedFile: "/sample-proposal.pdf",
      lastUpdated: project.lastUpdated,
      deadline: getStatusFromIndex(project.currentIndex) === 'revise' ? '2024-12-31 23:59' : undefined
    };
    
    setSelectedProject(proposal);
    setDetailedModalOpen(true);
  };

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    console.log('Updated proposal:', updatedProposal);
    setDetailedModalOpen(false);
  };

  const toggleNotifications = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotificationsOpen(v => !v);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const copyLink = async () => {
    if (!shareProject) return;
    const url = `${window.location.origin}/projects/${shareProject.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const inviteEmail = () => {
    if (!shareEmail || !shareProject) return;
    setShareEmail("");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const projectsToShow = projectTab === 'all' ? mockProjects : funded;

  // Project Portfolio rendering functions
  const renderGridView = () => (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {projectsToShow.map((project) => {
          const progress = getProgressPercentageByIndex(project.currentIndex);
          // FIXED: Using correct function name
          const statusLabel = getStatusLabel(project.currentIndex); 
          
          return (
            <div
              key={project.id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 lg:p-6 border-2 border-gray-200 hover:border-[#C8102E] hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleCardClick(project)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm lg:text-base group-hover:text-[#C8102E] transition-colors line-clamp-2">
                    {project.title}
                  </h4>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Budget:</span>
                  <span className="font-semibold">{project.budget}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Duration:</span>
                  <span className="font-semibold">{project.duration}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="text-xs text-gray-600 font-medium hidden sm:inline">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorByIndex(project.currentIndex)}`}>
                    {statusLabel}
                  </span>
                  {project.currentIndex === 4 && (
                    <span className="text-xs px-2 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full">
                      Approved: {project.budget}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      openShare(project); 
                    }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-[#fff5f6] hover:border-[#C8102E] transition-colors text-xs"
                    title="Share project"
                  >
                    <FaShareAlt className="text-sm text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Project Title</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Status</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm hidden lg:table-cell">Budget</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm hidden md:table-cell">Duration</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm hidden xl:table-cell">Evaluators</th>
            {projectTab === 'budget' && (
              <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Approved Amount</th>
            )}
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {projectsToShow.map((project) => {
            const progress = getProgressPercentageByIndex(project.currentIndex);
            // FIXED: Using correct function name
            const statusLabel = getStatusLabel(project.currentIndex);
            
            return (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => handleCardClick(project)}
              >
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                      {getStageIcon(project.currentIndex)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 group-hover:text-[#C8102E] transition-colors text-sm lg:text-base">
                        {project.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(project.priority)}`}>
                          {project.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          {new Date(project.submissionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColorByIndex(project.currentIndex)}`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 text-gray-600 font-medium hidden lg:table-cell">
                  {project.budget}
                </td>
                <td className="px-4 lg:px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
                  {project.duration}
                </td>
                <td className="px-4 lg:px-6 py-4 text-gray-600 text-sm hidden xl:table-cell">
                  <div className="flex items-center gap-1">
                    <FaUsers className="text-gray-400" />
                    {project.evaluators}
                  </div>
                </td>
                {projectTab === 'budget' && (
                  <td className="px-4 lg:px-6 py-4 text-green-700 font-semibold">
                    {project.budget}
                  </td>
                )}
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 lg:w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">
                        {progress}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openShare(project); }}
                        className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-[#fff5f6] hover:border-[#C8102E] transition-colors text-xs"
                        title="Share project"
                      >
                        <FaShareAlt className="text-sm text-gray-600" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <ProponentNavbar />
      <div className="h-16" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl shadow-lg">
                <FaUser className="text-white text-xl lg:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Project Portfolio
                </h1>
                <p className="text-gray-600 mt-1 text-sm lg:text-base">
                  Monitor your research proposals through the entire lifecycle
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification bell - Added z-50 to fix mobile display */}
              <div className="relative z-50" ref={notifRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  title="Notifications"
                >
                  <FaBell className="text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <NotificationsDropdown
                  isOpen={notificationsOpen}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={() => setNotificationsOpen(false)}
                  onMarkAllRead={markAllRead}
                  onMarkRead={markRead}
                  onViewAll={() => setNotificationsOpen(false)}
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-[#C8102E] text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaTablet className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-[#C8102E] text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaListAlt className="text-sm" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4">
            {/* Total Projects Card */}
            <div className="bg-slate-50 shadow-xl rounded-2xl border border-slate-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Total Projects</p>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">
                    {mockProjects.length}
                  </p>
                </div>
                <FileText className="w-6 h-6 text-slate-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            
            {/* R&D Evaluation Card */}
            <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">R&D Evaluation</p>
                  <p className="text-xl font-bold text-blue-600 tabular-nums">
                    {rdEvaluation.length}
                  </p>
                </div>
                <Microscope className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Evaluators Assessment Card */}
            <div className="bg-purple-50 shadow-xl rounded-2xl border border-purple-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Evaluators Assessment</p>
                  <p className="text-xl font-bold text-purple-600 tabular-nums">
                    {evaluatorsAssessment.length}
                  </p>
                </div>
                <ClipboardCheck className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Revision Required Card */}
            <div className="bg-orange-50 shadow-xl rounded-2xl border border-orange-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Revision Required</p>
                  <p className="text-xl font-bold text-orange-600 tabular-nums">
                    {revision.length}
                  </p>
                </div>
                <RefreshCw className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Funded Card */}
            <div className="bg-green-50 shadow-xl rounded-2xl border border-green-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Funded</p>
                  <p className="text-xl font-bold text-green-600 tabular-nums">
                    {funded.length}
                  </p>
                </div>
                <Award className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </header>

        {/* All Projects Section */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaListAlt className="text-[#C8102E]" />
                    Project Portfolio
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete overview of all your research proposals
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Funded</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>High Priority</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs: All / Budget Approval */}
            <div className="px-4 lg:px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectTab('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    projectTab === 'all' 
                      ? 'bg-[#C8102E] text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setProjectTab('budget')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    projectTab === 'budget' 
                      ? 'bg-[#C8102E] text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Funded Project ({funded.length})
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Toggle view and browse projects
              </div>
            </div>

            {/* Project Portfolio View */}
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>
        </section>
      </main>

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        project={shareProject}
        shareEmail={shareEmail}
        copied={copied}
        onClose={closeShare}
        onEmailChange={setShareEmail}
        onCopyLink={copyLink}
        onInviteEmail={inviteEmail}
      />

      <DetailedProposalModal
        isOpen={detailedModalOpen}
        onClose={() => setDetailedModalOpen(false)}
        proposal={selectedProject}
        onUpdateProposal={handleUpdateProposal}
      />
    </div>
  );
};

export default Profile;