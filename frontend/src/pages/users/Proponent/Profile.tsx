import React, { useState } from "react";
import ProponentNavbar from "../../../components/proponent-component/Proponent-navbar";
import StatusStepper from "../../../components/proponent-component/StatusStepper";
import ProjectPortfolio from "./projectPortfolio";
import ShareModal from "../../../components/proponent-component/ShareModal";
import CommentsModal from "../../../components/proponent-component/CommentsModal";
import NotificationsDropdown from "../../../components/proponent-component/NotificationsDropdown";
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaFileAlt, 
  FaListAlt, 
  FaCalendarAlt,
  FaUser,
  FaChartLine,
  FaSearch,
  FaCheckCircle,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaUsers,
  FaClock,
  FaTablet,
  FaBell
} from 'react-icons/fa';

type Project = {
  id: string;
  title: string;
  currentIndex: number;
  submissionDate: string;
  lastUpdated: string;
  budget: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  evaluators: number;
};

const mockProjects: Project[] = [
  { 
    id: "p1", 
    title: "Community Health Outreach Program", 
    currentIndex: 2,
    submissionDate: "2024-01-15",
    lastUpdated: "2024-01-28",
    budget: "₱250,000",
    duration: "12 months",
    priority: 'high',
    evaluators: 3
  },
  { 
    id: "p2", 
    title: "AgriTech Digital Transformation", 
    currentIndex: 1,
    submissionDate: "2024-01-10",
    lastUpdated: "2024-01-25",
    budget: "₱500,000",
    duration: "18 months",
    priority: 'high',
    evaluators: 2
  },
  { 
    id: "p3", 
    title: "STEM Education Enhancement", 
    currentIndex: 4,
    submissionDate: "2024-01-05",
    lastUpdated: "2024-02-01",
    budget: "₱150,000",
    duration: "6 months",
    priority: 'medium',
    evaluators: 4
  },
  { 
    id: "p4", 
    title: "Digital Library Modernization", 
    currentIndex: 3,
    submissionDate: "2024-01-12",
    lastUpdated: "2024-01-30",
    budget: "₱300,000",
    duration: "9 months",
    priority: 'medium',
    evaluators: 3
  },
  { 
    id: "p5", 
    title: "Renewable Energy Research", 
    currentIndex: 0,
    submissionDate: "2024-02-01",
    lastUpdated: "2024-02-01",
    budget: "₱750,000",
    duration: "24 months",
    priority: 'high',
    evaluators: 5
  },
];

const stageLabels = [
  "R&D Evaluation",
  "Evaluators Assessment",
  "Endorsement",
  "Approval",
  "Completed"
];

const currentStageLabels = [
  "Submitted",
  "R&D Evaluation",
  "Evaluators Assessment",
  "Endorsement",
  "Project Approved"
];

const stageDescriptions = [
  "Proposal will be reviewed by the R&D staff",
  "Under review by the assigned evaluators.",
  "This will be reviewed to assess if it is eligible for endorsement.",
  "Financial review and budget allocation assessment",
  "Project has been approved and ready for implementation"
];

const Profile: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectTab, setProjectTab] = useState<'all' | 'budget'>('all');
  
  // Modal states
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => [
    { id: 'n1', title: 'New comment on "AgriTech Digital Transformation"', time: '2h', read: false },
    { id: 'n2', title: 'Budget review requested for "Digital Library Modernization"', time: '1d', read: false },
    { id: 'n3', title: 'Proposal "Renewable Energy Research" moved to Draft', time: '3d', read: true }
  ]);

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
    if (notificationsOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notificationsOpen]);

  const current = mockProjects[activeIndex];

  // Filter projects by status
  const draftProjects = mockProjects.filter(p => p.currentIndex === 0);
  const reviewProjects = mockProjects.filter(p => p.currentIndex === 1);
  const evaluationProjects = mockProjects.filter(p => p.currentIndex === 2);
  const budgetProjects = mockProjects.filter(p => p.currentIndex === 3);
  const approvalProjects = mockProjects.filter(p => p.currentIndex === 4);
  const completedProjects = mockProjects.filter(p => p.currentIndex === 5);

  // Navigation functions
  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(mockProjects.length - 1, i + 1));

  // Helper functions
  const getStatusColor = (index: number) => {
    const colors = [
      "bg-gray-100 text-gray-800 border border-gray-300",
      "bg-blue-100 text-blue-800 border border-blue-300",
      "bg-purple-100 text-purple-800 border border-purple-300",
      "bg-orange-100 text-orange-800 border border-orange-300",
      "bg-green-100 text-green-800 border border-green-300",
    ];
    return colors[index] || colors[0];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 border border-red-300",
      medium: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      low: "bg-green-100 text-green-800 border border-green-300"
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStageIcon = (index: number) => {
    const icons = [
      <FaFileAlt className="text-gray-600" />,
      <FaSearch className="text-blue-600" />,
      <FaUsers className="text-purple-600" />,
      <FaMoneyBillWave className="text-orange-600" />,
      <FaClipboardCheck className="text-yellow-600" />,
      <FaCheckCircle className="text-green-600" />
    ];
    return icons[index] || icons[0];
  };

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
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
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

  // Comments data
  const commentsMap: Record<string, { id: string; text: string; author?: string; time: string }[]> = {
    p2: [{ id: 'c1', text: 'Please clarify the methodology section.', author: 'Evaluator A', time: '2d' }],
    p3: [{ id: 'c2', text: 'Budget needs revision.', author: 'Evaluator B', time: '1d' }]
  };

  const currentComments = commentProject ? commentsMap[commentProject.id] || [] : [];

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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Project Portfolio</h1>
                <p className="text-gray-600 mt-1 text-sm lg:text-base">Monitor your research proposals through the entire lifecycle</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-3">
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-gray-100 rounded-lg">
                  <FaFileAlt className="text-gray-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">{mockProjects.length}</p>
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
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">{evaluationProjects.length}</p>
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
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">{approvalProjects.length}</p>
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
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">{budgetProjects.length}</p>
                  <p className="text-xs lg:text-sm text-gray-600">Endorsed Project</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1 lg:p-2 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-sm lg:text-base" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-gray-800">{completedProjects.length}</p>
                  <p className="text-xs lg:text-sm text-gray-600">Completed</p>
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
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">{current.title}</h3>
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
                          {current.currentIndex === stageLabels.length - 1 ? "Stage: " : "Next Stage: "}
                          {stageLabels[current.currentIndex]}
                        </h4>
                        <p className="text-red-800 text-sm">{stageDescriptions[current.currentIndex]}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Stepper */}
                  <div className="mt-4">
                    <StatusStepper 
                      currentIndex={current.currentIndex}
                    />
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="xl:w-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 lg:p-6 border border-gray-300">
                  <div className="text-center mb-4">
                    <div className="text-2xl lg:text-3xl font-bold text-[#C8102E] mb-1">
                      {Math.round((current.currentIndex / (stageLabels.length - 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Overall Progress</div>
                  </div>
                  
                  <div className="space-y-3 text-xs lg:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stage Progress:</span>
                      <span className="font-semibold text-gray-800">{current.currentIndex + 1}/{stageLabels.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-semibold text-gray-800">{new Date(current.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Evaluators:</span>
                      <span className="font-semibold text-gray-800">{current.evaluators}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-800">{current.duration}</span>
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
                  <p className="text-sm text-gray-600 mt-1">Complete overview of all your research proposals</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Completed</span>
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
                  className={`px-3 py-1 rounded-md text-sm font-medium ${projectTab === 'all' ? 'bg-[#C8102E] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setProjectTab('budget')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${projectTab === 'budget' ? 'bg-[#C8102E] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Project Approved ({budgetProjects.length})
                </button>
              </div>
              <div className="text-xs text-gray-500">Toggle view and browse projects</div>
            </div>

             {/* Project Portfolio Component */}
             <ProjectPortfolio
               projects={mockProjects}
               viewMode={viewMode}
               projectTab={projectTab}
               onShareClick={openShare}
               onCommentsClick={openComments}
               budgetProjects={budgetProjects}
             />
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

      <CommentsModal
        isOpen={commentsOpen}
        project={commentProject}
        onClose={closeComments}
      />
    </div>
  );
};

export default Profile;