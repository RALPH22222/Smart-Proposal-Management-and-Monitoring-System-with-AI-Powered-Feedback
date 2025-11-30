import React, { useState, useEffect } from 'react';
import { 
  FaChartLine 
} from 'react-icons/fa';
import { 
  Search, 
  Target, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  Play, 
  Send, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Building2, 
  Flag,
  AlertTriangle,
  PauseCircle,
  UploadCloud,
  X,
  Banknote,
  Edit3,
  Save,
  ArrowRight,
  ArrowLeft, // Used for Mobile "Back" button
  Award,
  Menu
} from 'lucide-react';

// --- Types ---
type ProjectStatus = 'planning' | 'active' | 'delayed' | 'on-hold' | 'completed';

interface MilestoneData {
  id: number;
  title: string;
  duration: string;
  budget: string;
  status: 'idle' | 'ongoing' | 'submitted' | 'approved';
  proofFiles?: string[];
}

interface Project {
  id: string;
  title: string;
  agency: string;
  status: ProjectStatus;
  totalBudget: string;
  startDate: string;
  endDate?: string;
  currentPhase: number;
  milestones: MilestoneData[];
}

const MonitoringPage: React.FC = () => {
  // --- State ---
  const [activeProjectId, setActiveProjectId] = useState<string>("1");
  const [showMobileDetail, setShowMobileDetail] = useState(false); // Mobile Navigation State
  const [editingMilestoneId, setEditingMilestoneId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");

  // --- Mock Data ---
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Smart Hydroponics System",
      agency: "DOST-PCAARRD",
      status: 'planning',
      totalBudget: "₱1,500,000.00",
      startDate: "TBD",
      currentPhase: 1,
      milestones: [
        { id: 1, title: "", duration: "", budget: "", status: 'idle' },
        { id: 2, title: "", duration: "", budget: "", status: 'idle' },
        { id: 3, title: "", duration: "", budget: "", status: 'idle' },
        { id: 4, title: "", duration: "", budget: "", status: 'idle' },
      ]
    },
    {
      id: "2",
      title: "AI-Based Crop Disease Detection",
      agency: "DOST-PCIEERD",
      status: 'active',
      totalBudget: "₱1,200,000.00",
      startDate: "Jan 15, 2025",
      currentPhase: 2,
      milestones: [
        { id: 1, title: "Requirement Gathering", duration: "1 Month", budget: "₱100,000", status: 'approved', proofFiles: ['report.pdf'] },
        { id: 2, title: "Model Training", duration: "3 Months", budget: "₱200,000", status: 'ongoing', proofFiles: [] },
        { id: 3, title: "Field Testing", duration: "2 Months", budget: "₱150,000", status: 'idle' },
        { id: 4, title: "Deployment", duration: "1 Month", budget: "₱50,000", status: 'idle' },
      ]
    },
    {
      id: "3",
      title: "Community Waste Management",
      agency: "DENR",
      status: 'delayed',
      totalBudget: "₱850,000.00",
      startDate: "Nov 01, 2024",
      currentPhase: 2,
      milestones: [
        { id: 1, title: "Initial Survey", duration: "1 Month", budget: "₱100,000", status: 'approved' },
        { id: 2, title: "Implementation", duration: "2 Months", budget: "₱300,000", status: 'ongoing' },
        { id: 3, title: "Evaluation", duration: "1 Month", budget: "₱50,000", status: 'idle' },
        { id: 4, title: "Final Report", duration: "1 Month", budget: "₱50,000", status: 'idle' },
      ]
    },
    {
      id: "4",
      title: "Solar Irrigation Research",
      agency: "DA",
      status: 'on-hold',
      totalBudget: "₱2,500,000.00",
      startDate: "Dec 10, 2024",
      currentPhase: 2,
      milestones: [
        { id: 1, title: "Site Inspection", duration: "1 Month", budget: "₱100,000", status: 'approved' },
        { id: 2, title: "Procurement", duration: "2 Months", budget: "₱1,000,000", status: 'ongoing' },
        { id: 3, title: "Installation", duration: "3 Months", budget: "₱500,000", status: 'idle' },
        { id: 4, title: "Testing", duration: "1 Month", budget: "₱100,000", status: 'idle' },
      ]
    },
    {
      id: "5",
      title: "Marine Biology Database",
      agency: "CHED",
      status: 'completed',
      totalBudget: "₱500,000.00",
      startDate: "Jan 01, 2024",
      endDate: "Dec 31, 2024",
      currentPhase: 4,
      milestones: [
        { id: 1, title: "Design", duration: "1 Month", budget: "₱100,000", status: 'approved' },
        { id: 2, title: "Development", duration: "2 Months", budget: "₱200,000", status: 'approved' },
        { id: 3, title: "Testing", duration: "1 Month", budget: "₱100,000", status: 'approved' },
        { id: 4, title: "Deployment", duration: "1 Month", budget: "₱100,000", status: 'approved' },
      ]
    }
  ]);

  useEffect(() => {
    setEditingMilestoneId(1);
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const viewMilestoneId = activeProject?.status === 'planning' ? editingMilestoneId : activeProject?.currentPhase || 1;
  const currentMilestone = activeProject?.milestones.find(m => m.id === viewMilestoneId);

  const isCurrentStepComplete = currentMilestone 
    ? currentMilestone.title.trim() !== '' && currentMilestone.duration.trim() !== '' && currentMilestone.budget.trim() !== ''
    : false;

  // --- Theme Helpers ---
  const getThemeColors = (status: ProjectStatus) => {
    switch(status) {
      case 'active':
        return {
          bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
          gradient: 'from-emerald-600 to-emerald-800', bar: 'bg-emerald-500'
        };
      case 'planning':
        return {
          bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700',
          gradient: 'from-purple-600 to-purple-800', bar: 'bg-purple-500'
        };
      case 'on-hold':
        return {
          bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700',
          gradient: 'from-slate-600 to-slate-800', bar: 'bg-slate-500'
        };
      case 'delayed':
        return {
          bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
          gradient: 'from-amber-500 to-amber-700', bar: 'bg-amber-500'
        };
      case 'completed':
        return {
          bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
          gradient: 'from-blue-600 to-blue-800', bar: 'bg-blue-500'
        };
      default: return {
          bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700',
          gradient: 'from-gray-600 to-gray-800', bar: 'bg-gray-500'
      };
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch(status) {
      case 'active': return <Play className="w-5 h-5 text-emerald-600"/>;
      case 'planning': return <Edit3 className="w-5 h-5 text-purple-600"/>;
      case 'delayed': return <AlertTriangle className="w-5 h-5 text-amber-600"/>;
      case 'on-hold': return <PauseCircle className="w-5 h-5 text-slate-600"/>;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-blue-600"/>;
      default: return null;
    }
  };

  // --- Handlers ---
  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
    setShowMobileDetail(true); // Switch to detail view on mobile
  };

  const updateProjectStatus = (newStatus: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, status: newStatus } : p));
  };

  const updateMilestone = (field: keyof MilestoneData, value: any) => {
    if (!activeProject) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      const updatedMilestones = p.milestones.map(m => 
        m.id === viewMilestoneId ? { ...m, [field]: value } : m
      );
      return { ...p, milestones: updatedMilestones };
    }));
  };

  const handleNextStep = () => { if (editingMilestoneId < 4) setEditingMilestoneId(prev => prev + 1); };
  const handlePrevStep = () => { if (editingMilestoneId > 1) setEditingMilestoneId(prev => prev - 1); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentMilestone) {
      const fileName = e.target.files[0].name;
      const currentFiles = currentMilestone.proofFiles || [];
      updateMilestone('proofFiles', [...currentFiles, fileName]);
    }
  };

  const handleRequestFund = () => {
    if (activeProject?.status === 'planning' || activeProject?.status === 'completed') return;
    setIsFundModalOpen(true);
  };

  const submitFundRequest = () => {
    alert(`Request for ₱${requestAmount} submitted to agency.`);
    setIsFundModalOpen(false);
    setRequestAmount("");
  };

  const handleSubmitPlan = () => {
    if (!activeProject) return;
    updateProjectStatus('active');
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, startDate: new Date().toLocaleDateString() } : p));
    alert("Project Plan Finalized and Submitted to R&D!");
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const theme = activeProject ? getThemeColors(activeProject.status) : getThemeColors('active');
  const deadlineOptions = ["1 Month", "2 Months", "3 Months", "6 Months", "1 Year", "1.5 Years", "2 Years"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      
      {/* --- HEADER --- */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl shadow-lg">
              <FaChartLine className="text-white text-xl lg:text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Project Monitoring</h1>
              <p className="text-gray-600 mt-1 text-sm lg:text-base">Track milestones, plan budgets, and submit proof.</p>
            </div>
          </div>
        </div>

        {/* --- STATS CARDS (Responsive Grid) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between hover:scale-105 items-center hover:shadow-md transition-all duration-300">
             <div><p className="text-xs font-semibold text-slate-600">Total Projects</p><p className="text-2xl font-bold text-slate-700">{projects.length}</p></div>
             <FileText className="w-6 h-6 text-slate-500" />
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex justify-between hover:scale-105 items-center shadow-sm hover:shadow-md transition-all duration-300">
             <div><p className="text-xs font-semibold text-purple-600">Planning</p><p className="text-2xl font-bold text-purple-700">{projects.filter(p=>p.status==='planning').length}</p></div>
             <Edit3 className="w-6 h-6 text-purple-500" />
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between hover:scale-105 items-center shadow-sm hover:shadow-md transition-all duration-300">
             <div><p className="text-xs font-semibold text-emerald-600">Active</p><p className="text-2xl font-bold text-emerald-700">{projects.filter(p=>p.status==='active').length}</p></div>
             <Play className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between hover:scale-105 items-center shadow-sm hover:shadow-md transition-all duration-300">
             <div><p className="text-xs font-semibold text-amber-600">Delayed</p><p className="text-2xl font-bold text-amber-700">{projects.filter(p=>p.status==='delayed').length}</p></div>
             <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between hover:scale-105 items-center shadow-sm hover:shadow-md transition-all duration-300">
             <div><p className="text-xs font-semibold text-blue-600">Completed</p><p className="text-2xl font-bold text-blue-700">{projects.filter(p=>p.status==='completed').length}</p></div>
             <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <section>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
          
          {/* --- SIDEBAR (Hidden on mobile when Detail is active) --- */}
          <div className={`w-full lg:w-1/3 border-r border-gray-200 bg-gray-50 flex-col ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#C8102E]"/> Projects List
              </h3>
              
              {/* Status Filter Tabs - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
                 {['all', 'planning', 'active', 'delayed', 'on-hold', 'completed'].map((status) => (
                   <button
                     key={status}
                     onClick={() => setFilterStatus(status as any)}
                     className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                       filterStatus === status ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     {status.replace('-', ' ')}
                   </button>
                 ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredProjects.map((project) => {
                const colors = getThemeColors(project.status);
                return (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group shadow-sm hover:shadow-md flex items-center justify-between ${
                    activeProjectId === project.id 
                    ? `${colors.bg} ${colors.border} ring-1 ring-opacity-50`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  style={activeProjectId === project.id ? { borderColor: 'currentColor', color: 'inherit' } : {}}
                >
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold line-clamp-1 mb-1 ${activeProjectId === project.id ? colors.text : 'text-gray-900'}`}>{project.title}</h4>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/> {project.agency}</span>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">{getStatusIcon(project.status)}</div>
                </button>
              )})}
            </div>
          </div>

          {/* --- RIGHT PANEL (Hidden on mobile unless selected) --- */}
          <div className={`w-full lg:w-2/3 bg-white p-4 sm:p-6 lg:p-8 flex-col relative ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-4">
              <button 
                onClick={() => setShowMobileDetail(false)}
                className="flex items-center gap-2 text-gray-600 font-semibold hover:text-[#C8102E] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Projects
              </button>
            </div>

            {activeProject ? (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 leading-tight">{activeProject.title}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Start: {activeProject.startDate}</span>
                        <span className="flex items-center gap-1"><Wallet className="w-4 h-4"/> Grant: {activeProject.totalBudget}</span>
                      </div>
                   </div>
                   
                   {/* Request Funds Button - Hidden in Planning/Completed */}
                   {activeProject.status !== 'planning' && activeProject.status !== 'completed' && (
                     <button 
                       onClick={handleRequestFund}
                       className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow hover:-translate-y-0.5 transition-all"
                     >
                       <Banknote className="w-4 h-4" /> Request Funds
                     </button>
                   )}
                </div>

                {/* --- COMPLETED STATE BANNER --- */}
                {activeProject.status === 'completed' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 lg:p-8 mb-8 text-center relative overflow-hidden shadow-sm transition-all duration-300">
                    <Award className="absolute top-0 right-0 w-32 h-32 lg:w-40 lg:h-40 text-blue-200 opacity-20 transform translate-x-10 -translate-y-10 rotate-12" />
                    <div className="relative z-10">
                       <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white">
                          <CheckCircle2 className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600" />
                       </div>
                       <h2 className="text-2xl lg:text-3xl font-bold text-blue-900 mb-2">Project Successfully Completed!</h2>
                       <p className="text-blue-700 max-w-md mx-auto mb-6 text-sm lg:text-base">
                          All milestones have been delivered, reviewed, and approved by R&D.
                       </p>
                    </div>
                  </div>
                )}

                {/* --- PLANNING WIZARD ALERT --- */}
                {activeProject.status === 'planning' && (
                   <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300">
                     <div className="flex items-start gap-3">
                       <Edit3 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                       <div>
                         <h4 className="font-bold text-purple-800">Planning Wizard</h4>
                         <p className="text-sm text-purple-700 leading-relaxed">
                           Step {editingMilestoneId} of 4: Please fill out the details for this milestone to proceed.
                         </p>
                       </div>
                     </div>
                   </div>
                )}

                {/* --- MILESTONE TRACKER --- */}
                {currentMilestone && (
                  <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex-1 flex flex-col ${theme.border} transition-all duration-300`}>
                    
                    {/* Banner */}
                    <div className={`p-6 text-white relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                       <Flag className="absolute right-0 top-0 w-32 h-32 text-white opacity-10 transform translate-x-6 -translate-y-6" />
                       <div className="relative z-10">
                          <h3 className="font-bold flex items-center gap-2 text-lg">
                             <LayoutDashboard className="w-5 h-5"/> 
                             {activeProject.status === 'planning' ? 'Milestone Planning' : 
                              activeProject.status === 'completed' ? 'Project Summary' :
                              `Phase ${activeProject.currentPhase} Implementation`}
                          </h3>
                       </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Stepper (Shows Current View) */}
                      <div className="flex items-center justify-between relative mb-10 px-2 sm:px-4 mt-4">
                         <div className={`absolute left-0 top-3 sm:top-4 w-full h-1 rounded-full -z-0 bg-gray-100`}></div>
                         <div 
                           className={`absolute left-0 top-3 sm:top-4 h-1 rounded-full -z-0 transition-all duration-700 ease-out ${theme.bar}`}
                           style={{ width: activeProject.status === 'completed' ? '100%' : `${((viewMilestoneId - 1) / 3) * 100}%` }}
                         ></div>

                         {[1, 2, 3, 4].map((step) => {
                           const isActive = step === viewMilestoneId && activeProject.status !== 'completed';
                           const isCompleted = step < viewMilestoneId || activeProject.status === 'completed';
                           
                           let circleClass = 'bg-white text-gray-300 border-gray-100';
                           if (isCompleted) circleClass = `bg-emerald-100 text-emerald-700 border-white`;
                           else if (isActive) circleClass = `${theme.bar} text-white ${theme.border} scale-110 shadow-md`;

                           return (
                             <div key={step} className="flex flex-col items-center gap-2 z-10 relative transition-all duration-300">
                               <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-4 transition-all ${circleClass}`}>
                                 {isCompleted ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> : step}
                               </div>
                               <span className={`text-[10px] sm:text-xs font-semibold ${isActive ? theme.text : 'text-gray-400'}`}>Milestone {step}</span>
                             </div>
                           )
                         })}
                      </div>

                      {/* Details & Inputs */}
                      {activeProject.status !== 'completed' && (
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                           
                           <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                              <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                                <Target className="w-4 h-4" /> 
                                {activeProject.status === 'planning' ? `Setup Milestone ${editingMilestoneId}` : currentMilestone.title}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                currentMilestone.status === 'idle' ? 'bg-gray-200 text-gray-600' :
                                currentMilestone.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                currentMilestone.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {currentMilestone.status}
                              </span>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                              <div className="md:col-span-2">
                                 <label className="text-xs font-semibold text-gray-500 block mb-1">Milestone Title <span className="text-red-500">*</span></label>
                                 <input 
                                   type="text" 
                                   value={currentMilestone.title}
                                   onChange={(e) => updateMilestone('title', e.target.value)}
                                   disabled={activeProject.status !== 'planning'}
                                   className={`w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all ${activeProject.status !== 'planning' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                   placeholder="e.g. Data Analysis Phase"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs font-semibold text-gray-500 block mb-1">Budget Allocation <span className="text-red-500">*</span></label>
                                 <div className="relative">
                                    <Wallet className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input 
                                      type="text" 
                                      value={currentMilestone.budget}
                                      onChange={(e) => updateMilestone('budget', e.target.value)}
                                      disabled={activeProject.status !== 'planning'}
                                      className={`w-full pl-10 p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all ${activeProject.status !== 'planning' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                      placeholder="₱0.00"
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-xs font-semibold text-gray-500 block mb-1">Duration / Deadline <span className="text-red-500">*</span></label>
                                 <div className="relative">
                                    <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <select 
                                      value={currentMilestone.duration}
                                      onChange={(e) => updateMilestone('duration', e.target.value)}
                                      disabled={activeProject.status !== 'planning'}
                                      className={`w-full pl-10 p-2.5 border border-gray-300 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-purple-500 outline-none transition-all ${activeProject.status !== 'planning' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    >
                                      <option value="" disabled>Select Duration</option>
                                      {deadlineOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                 </div>
                              </div>
                           </div>
                           
                           {/* --- SEQUENTIAL PLANNING NAVIGATION --- */}
                           {activeProject.status === 'planning' && (
                             <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 border-t border-gray-200 gap-3">
                                <button 
                                  onClick={handlePrevStep}
                                  disabled={editingMilestoneId === 1}
                                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                    editingMilestoneId === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <ArrowLeft className="w-4 h-4" /> Previous
                                </button>

                                {editingMilestoneId < 4 ? (
                                  <button 
                                    onClick={handleNextStep}
                                    disabled={!isCurrentStepComplete}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md ${
                                      isCurrentStepComplete ? 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg' : 'bg-purple-300 cursor-not-allowed'
                                    }`}
                                  >
                                    Next Milestone <ArrowRight className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={handleSubmitPlan}
                                    disabled={!isCurrentStepComplete}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-md ${
                                      isCurrentStepComplete ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg' : 'bg-emerald-300 cursor-not-allowed'
                                    }`}
                                  >
                                    <Save className="w-4 h-4" /> Submit Plan to R&D
                                  </button>
                                )}
                             </div>
                           )}

                           {/* --- ACTIVE PROJECT ACTIONS --- */}
                           {activeProject.status !== 'planning' && (
                             <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                   {/* Upload Proof (Ongoing/Approved) */}
                                   {(currentMilestone.status === 'ongoing' || currentMilestone.status === 'approved') && activeProject.status !== 'on-hold' && (
                                       <label className="w-full sm:w-auto cursor-pointer px-4 py-2.5 bg-white border border-purple-200 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                                          <UploadCloud className="w-4 h-4" /> Upload Proof
                                          <input type="file" className="hidden" onChange={handleFileUpload} />
                                       </label>
                                   )}
                                   
                                   {/* Submit Proof (Ongoing) */}
                                   {currentMilestone.status === 'ongoing' && activeProject.status !== 'on-hold' && (
                                      <button 
                                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md"
                                      >
                                        Submit <Send className="w-3 h-3"/>
                                      </button>
                                   )}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Select a project</div>
            )}
          </div>
        </div>
      </section>

      {/* --- FUND REQUEST MODAL --- */}
      {isFundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setIsFundModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                 <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Banknote className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800">Request Fund Release</h3>
                 <p className="text-sm text-gray-500">Project: {activeProject?.title}</p>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Amount to Request (₱)</label>
                    <input 
                      type="number" 
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-semibold"
                    />
                 </div>
                 <button 
                   onClick={submitFundRequest}
                   className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all"
                 >
                    Submit Request
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;