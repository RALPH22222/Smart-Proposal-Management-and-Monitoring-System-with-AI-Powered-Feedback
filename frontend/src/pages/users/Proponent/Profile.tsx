import React, { useState } from "react";
import ProponentNavbar from "../../../components/proponent-component/Proponent-navbar";
import StatusStepper from "../../../components/proponent-component/StatusStepper";
import ShareModal from "../../../components/proponent-component/ShareModal";
import NotificationsDropdown from "../../../components/proponent-component/NotificationsDropdown";
import DetailedProposalModal from '../../../components/proponent-component/DetailedProposalModal'; 
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaFileAlt, 
  FaListAlt, 
  FaCalendarAlt,
  FaUser,
  FaChartLine,
  FaCheckCircle,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaUsers,
  FaClock,
  FaTablet,
  FaBell,
  FaShareAlt
} from 'react-icons/fa';

import type { Project, Proposal, Notification, BudgetSource } from '../../../types/proponentTypes';
import { 
  mockProjects, 
  stageLabels, 
  currentStageLabels, 
  stageDescriptions, 
  initialNotifications,
  stageLabelsList,
  commentsMap
} from '../../../types/mockData';
import { 
  getStatusColor, 
  getPriorityColor, 
  getStageIcon 
} from '../../../types/helpers';

const Profile: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
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

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentProject, setCommentProject] = useState<Project | null>(null);

  const notifRef = React.useRef<HTMLDivElement | null>(null);

  // Close notifications when clicking outside
  React.useEffect(() => {
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

  const current = mockProjects[activeIndex];

  // Filter projects by status
  const draftProjects = mockProjects.filter(p => p.currentIndex === 0);
  const reviewProjects = mockProjects.filter(p => p.currentIndex === 1);
  const evaluationProjects = mockProjects.filter(p => p.currentIndex === 2);
  const budgetProjects = mockProjects.filter(p => p.currentIndex === 3);
  const approvalProjects = mockProjects.filter(p => p.currentIndex === 4);
  const fundedProjects = mockProjects.filter(p => p.currentIndex === 5);

  // Navigation functions
  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(mockProjects.length - 1, i + 1));

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
    const getRandomStatus = (): 'r&D Evaluation' | 'revise' | 'funded' | 'reject' => {
      const statuses = ['r&D Evaluation', 'revise', 'funded', 'reject'] as const;
      return statuses[Math.floor(Math.random() * statuses.length)];
    };

    const proposal: Proposal = {
      id: project.id,
      title: project.title,
      status: getRandomStatus(),
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
      duration: "12 months",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      budgetSources: [{
        source: "DOST Grant",
        ps: "₱500,000",
        mooe: "₱300,000",
        co: "₱200,000",
        total: "₱1,000,000"
      }],
      budgetTotal: "₱1,000,000",
      uploadedFile: "/sample-proposal.pdf",
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setSelectedProject(proposal);
    setDetailedModalOpen(true);
  };

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    console.log('Updated proposal:', updatedProposal);
    setDetailedModalOpen(false);
  };

  const openComments = (project: Project) => {
    setCommentProject(project);
    setCommentsOpen(true);
  };

  const closeComments = () => {
    setCommentsOpen(false);
    setCommentProject(null);
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
  const projectsToShow = projectTab === 'all' ? mockProjects : budgetProjects;
  const currentComments = commentProject ? commentsMap[commentProject.id] || [] : [];

  // Project Portfolio rendering functions
  const renderGridView = () => (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {projectsToShow.map((project) => (
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
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Evaluators:</span>
                <span className="font-semibold">{project.evaluators}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span className="text-xs text-gray-600 font-medium hidden sm:inline">
                  {project.currentIndex === 4 ? 100 : Math.round((project.currentIndex / (stageLabelsList.length - 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${project.currentIndex === 4 ? 100 : (project.currentIndex / (stageLabelsList.length - 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.currentIndex)}`}>
                  {project.currentIndex === 4 ? "Funded" : stageLabelsList[project.currentIndex]}
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
        ))}
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
          {projectsToShow.map((project) => (
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.currentIndex)}`}>
                  {stageLabelsList[project.currentIndex]}
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
                        style={{ width: `${project.currentIndex === 4 ? 100 : (project.currentIndex / (stageLabelsList.length - 1)) * 100}%` }}
                      ></div>
                    </div>
                   <span className="font-semibold">
                     {project.currentIndex === 4 ? 100 : Math.round((project.currentIndex / (stageLabelsList.length - 1)) * 100)}%
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
          ))}
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
              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-3">
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-gray-100 rounded-lg">
                  <FaFileAlt className="text-gray-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">
                    {mockProjects.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Total Projects</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-blue-100 rounded-lg">
                  <FaUsers className="text-blue-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">
                    {evaluationProjects.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Evaluated by R&D</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-purple-100 rounded-lg">
                  <FaClipboardCheck className="text-purple-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">
                    {approvalProjects.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Assessed by Evaluator</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-orange-100 rounded-lg">
                  <FaMoneyBillWave className="text-orange-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">
                    {fundedProjects.length}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">Funded Project</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Project Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#C8102E] to-[#E03A52] px-4 lg:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                  <FaFileAlt className="text-white" />
                  Active Project Overview
                </h2>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <span className="bg-white/20 px-2 py-1 rounded-lg">
                    {activeIndex + 1} of {mockProjects.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Project Details */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                        {current.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 lg:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="hidden sm:inline">Submitted:</span>
                          {new Date(current.submissionDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaChartLine className="text-gray-400" />
                          {current.budget}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="text-gray-400" />
                          {current.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaUsers className="text-gray-400" />
                          {current.evaluators} evaluators
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(current.currentIndex)}`}>
                        {currentStageLabels[current.currentIndex]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(current.priority)}`}>
                        {current.priority.toLowerCase()} Priority
                      </span>
                    </div>
                  </div>
                  
                  {/* Next Stage Description */}
                  <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
                    <div className="flex items-start gap-3">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">
                          {current.currentIndex === stageLabels.length - 1 
                            ? "Stage: " 
                            : "Next Stage: "}
                          {stageLabels[current.currentIndex]}
                        </h4>
                        <p className="text-red-800 text-sm">
                          {stageDescriptions[current.currentIndex]}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Stepper */}
                  <div className="mt-4">
                    <StatusStepper currentIndex={current.currentIndex} />
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="xl:w-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 lg:p-6 border border-gray-300">
                  <div className="text-center mb-4">
                    <div className="text-2xl lg:text-3xl font-bold text-[#C8102E] mb-1">
                      {Math.round((current.currentIndex / (stageLabels.length - 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Overall Progress
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-xs lg:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stage Progress:</span>
                      <span className="font-semibold text-gray-800">
                        {current.currentIndex + 1}/{stageLabels.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(current.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Evaluators:</span>
                      <span className="font-semibold text-gray-800">
                        {current.evaluators}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-800">
                        {current.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <button
                    onClick={prev}
                    disabled={activeIndex === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium flex-1 sm:flex-none"
                  >
                    <FaChevronLeft className="text-sm" />
                    <span className="hidden sm:inline">Previous Project</span>
                    <span className="sm:hidden">Previous</span>
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 order-first sm:order-none">
                    <span className="font-semibold text-gray-800">{activeIndex + 1}</span>
                    <span>of</span>
                    <span className="font-semibold text-gray-800">{mockProjects.length}</span>
                    <span className="hidden sm:inline">Projects</span>
                  </div>
                  
                  <button
                    onClick={next}
                    disabled={activeIndex === mockProjects.length - 1}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium flex-1 sm:flex-none"
                  >
                    <span className="hidden sm:inline">Next Project</span>
                    <span className="sm:hidden">Next</span>
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  Funded Project ({budgetProjects.length})
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