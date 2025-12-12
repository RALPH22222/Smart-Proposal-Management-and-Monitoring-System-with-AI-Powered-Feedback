import React, { useState, useEffect } from 'react';
import { 
  FaChartLine 
} from 'react-icons/fa';
import { 
  Search, Target, Clock, CheckCircle2, Play, Send, 
  FileText, Calendar, AlertTriangle, UploadCloud, 
  X, Banknote, ArrowLeft, CalendarClock, History, PieChart,
  Plus, Trash2, MessageSquare, User, ShieldAlert, Award,
  Users, CalendarCheck, ChevronLeft, ChevronRight, UserCheck, 
  CornerDownRight
} from 'lucide-react';

// --- Types ---
type ProjectStatus = 'active' | 'delayed' | 'completed';
type ReportStatus = 'locked' | 'due' | 'submitted' | 'approved' | 'overdue';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
}

interface Comment {
  id: string;
  author: 'Proponent' | 'R&D Officer';
  text: string;
  timestamp: string;
}

interface QuarterlyReport {
  id: number;
  quarter: string;
  dueDate: string;
  status: ReportStatus;
  progressPercentage: number;
  expenseItems: ExpenseItem[];
  comments: Comment[];
  proofFiles: string[];
  submittedBy?: string; 
  dateSubmitted?: string;
}

interface Project {
  id: string;
  title: string;
  agency: string;
  projectLeader: string;
  coProponent: string;
  status: ProjectStatus;
  totalBudget: number;
  startDate: string;
  endDate: string;
  reports: QuarterlyReport[];
}

const MonitoringPage: React.FC = () => {
  // --- State ---
  const [activeProjectId, setActiveProjectId] = useState<string>("2"); 
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  
  const [currentReportIndex, setCurrentReportIndex] = useState(0);

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundItems, setFundItems] = useState<ExpenseItem[]>([]);

  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionDate, setExtensionDate] = useState("");

  const [replyText, setReplyText] = useState("");

  // --- Mock Data ---
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "2",
      title: "AI-Based Crop Disease Detection",
      agency: "DOST-PCIEERD",
      projectLeader: "Dr. Sarah Mendez",
      coProponent: "Engr. John Doe",
      status: 'active',
      totalBudget: 1200000, 
      startDate: "Jan 15, 2025",
      endDate: "Jan 15, 2026",
      reports: [
        { 
          id: 1, quarter: "Q1", dueDate: "Apr 15, 2025", status: 'approved', 
          progressPercentage: 25, 
          expenseItems: [
            { id: '1', description: 'Nvidia Jetson Nano Units (x5)', amount: 150000 },
            { id: '2', description: 'Field Travel (Laguna)', amount: 20000 },
            { id: '3', description: 'Research Assistant Stipend', amount: 80000 } 
          ],
          comments: [], proofFiles: ['receipts_q1.pdf', 'site_visit_photos.jpg'],
          submittedBy: "Dr. Sarah Mendez", 
          dateSubmitted: "Apr 10, 2025"
        },
        { 
          id: 2, quarter: "Q2", dueDate: "Jul 15, 2025", status: 'submitted', 
          progressPercentage: 50, 
          expenseItems: [
            { id: '1', description: 'Cloud Server Hosting (AWS)', amount: 45000 },
            { id: '2', description: 'Dataset Labeling Service', amount: 30000 }
          ],
          comments: [
            { id: 'c1', author: 'R&D Officer', text: "We received your submission. However, the AWS cost seems a bit higher than the line item in the LIB. Can you clarify?", timestamp: "Jul 16, 2025 09:30 AM" },
            { id: 'c2', author: 'Proponent', text: "Hi, we had to upgrade the instance type to support the training model size.", timestamp: "Jul 16, 2025 10:15 AM" },
            { id: 'c3', author: 'R&D Officer', text: "Understood. Please upload the technical specs of the instance used so we can verify and approve.", timestamp: "Jul 16, 2025 01:00 PM" }
          ], 
          proofFiles: ['AWS_Invoice_July.pdf', 'Model_Training_Logs.csv'],
          submittedBy: "Dr. Sarah Mendez",
          dateSubmitted: "Jul 15, 2025" 
        },
        { 
          id: 3, quarter: "Q3", dueDate: "Oct 15, 2025", status: 'locked', 
          progressPercentage: 0, expenseItems: [], comments: [], proofFiles: [] 
        },
        { 
          id: 4, quarter: "Q4", dueDate: "Jan 15, 2026", status: 'locked', 
          progressPercentage: 0, expenseItems: [], comments: [], proofFiles: [] 
        },
      ]
    },
    {
      id: "3",
      title: "Community Waste Management",
      agency: "DENR",
      projectLeader: "Prof. Maria Santos",
      coProponent: "LGU San Jose",
      status: 'delayed', 
      totalBudget: 850000,
      startDate: "Nov 01, 2024",
      endDate: "Nov 01, 2025",
      reports: [
        { 
          id: 1, quarter: "Q1", dueDate: "Feb 01, 2025", status: 'approved', 
          progressPercentage: 20, 
          expenseItems: [{ id: '1', description: 'Survey Forms Printing', amount: 50000 }],
          comments: [], proofFiles: ['survey.pdf'],
          submittedBy: "LGU San Jose",
          dateSubmitted: "Jan 28, 2025"
        },
        { 
          id: 2, quarter: "Q2", dueDate: "May 01, 2025", status: 'overdue', 
          progressPercentage: 20, 
          expenseItems: [],
          comments: [
            { id: 'c1', author: 'R&D Officer', text: "This report is 15 days late. Please submit update immediately or request extension.", timestamp: "May 16, 2025 10:00 AM" }
          ], 
          proofFiles: [] 
        }
      ]
    },
    {
      id: "5",
      title: "Marine Biology Database",
      agency: "CHED",
      projectLeader: "Dr. Albert Einstein",
      coProponent: "Marine Lab Inc.",
      status: 'completed',
      totalBudget: 500000,
      startDate: "Jan 01, 2024",
      endDate: "Dec 31, 2024",
      reports: [
        { 
          id: 1, quarter: "Q1", dueDate: "Mar 31, 2024", status: 'approved', 
          progressPercentage: 25, 
          expenseItems: [{id:'1', description:'Phase 1', amount: 125000}], comments: [], proofFiles: ['proof.pdf'],
          submittedBy: "Dr. Albert Einstein", dateSubmitted: "Mar 30, 2024"
        },
        { 
          id: 2, quarter: "Q2", dueDate: "Jun 30, 2024", status: 'approved', 
          progressPercentage: 50, 
          expenseItems: [{id:'1', description:'Phase 2', amount: 125000}], comments: [], proofFiles: ['proof.pdf'],
          submittedBy: "Marine Lab Inc.", dateSubmitted: "Jun 28, 2024"
        },
        { 
          id: 3, quarter: "Q3", dueDate: "Sep 30, 2024", status: 'approved', 
          progressPercentage: 75, 
          expenseItems: [{id:'1', description:'Phase 3', amount: 125000}], comments: [], proofFiles: ['proof.pdf'],
          submittedBy: "Dr. Albert Einstein", dateSubmitted: "Sep 29, 2024"
        },
        { 
          id: 4, quarter: "Q4", dueDate: "Dec 31, 2024", status: 'approved', 
          progressPercentage: 100, 
          expenseItems: [{id:'1', description:'Phase 4', amount: 125000}], comments: [], proofFiles: ['proof.pdf'],
          submittedBy: "Dr. Albert Einstein", dateSubmitted: "Dec 30, 2024"
        }
      ]
    }
  ]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  useEffect(() => {
    if (activeProject?.id === "2") {
        setCurrentReportIndex(1); // Q2
    } else if (activeProject?.id === "3") {
        setCurrentReportIndex(1); // Q2
    } else {
        setCurrentReportIndex(0);
    }
  }, [activeProjectId, activeProject?.id]);

  // --- Helpers ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const calculateTotalExpenses = (items: ExpenseItem[]) => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const totalSpent = activeProject?.reports.reduce((acc, report) => {
    if (report.status === 'submitted' || report.status === 'approved') {
      return acc + calculateTotalExpenses(report.expenseItems);
    }
    return acc;
  }, 0) || 0;

  const remainingBudget = (activeProject?.totalBudget || 0) - totalSpent;
  const budgetProgress = activeProject ? (totalSpent / activeProject.totalBudget) * 100 : 0;

  // --- Handlers ---
  const handlePrevReport = () => {
    if (currentReportIndex > 0) setCurrentReportIndex(prev => prev - 1);
  };

  const handleNextReport = () => {
    if (activeProject && currentReportIndex < activeProject.reports.length - 1) {
      setCurrentReportIndex(prev => prev + 1);
    }
  };

  const addExpenseItem = (reportId: number) => {
    const newItem: ExpenseItem = { id: Date.now().toString(), description: '', amount: 0 };
    setProjects(prev => prev.map(p => {
      if(p.id !== activeProjectId) return p;
      return {
        ...p,
        reports: p.reports.map(r => r.id === reportId ? { ...r, expenseItems: [...r.expenseItems, newItem] } : r)
      };
    }));
  };

  const updateExpenseItem = (reportId: number, itemId: string, field: keyof ExpenseItem, value: any) => {
    setProjects(prev => prev.map(p => {
      if(p.id !== activeProjectId) return p;
      return {
        ...p,
        reports: p.reports.map(r => {
          if (r.id !== reportId) return r;
          return {
            ...r,
            expenseItems: r.expenseItems.map(item => item.id === itemId ? { ...item, [field]: value } : item)
          };
        })
      };
    }));
  };

  const removeExpenseItem = (reportId: number, itemId: string) => {
    setProjects(prev => prev.map(p => {
      if(p.id !== activeProjectId) return p;
      return {
        ...p,
        reports: p.reports.map(r => r.id === reportId ? { ...r, expenseItems: r.expenseItems.filter(i => i.id !== itemId) } : r)
      };
    }));
  };

  const addFundItem = () => setFundItems([...fundItems, { id: Date.now().toString(), description: '', amount: 0 }]);
  const updateFundItem = (itemId: string, field: keyof ExpenseItem, value: any) => setFundItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  const removeFundItem = (itemId: string) => setFundItems(prev => prev.filter(item => item.id !== itemId));
  const submitFundRequest = () => {
    setIsFundModalOpen(false);
    setFundItems([]);
    alert("Request Submitted");
  };

  const postReply = (reportId: number) => {
    if(!replyText.trim()) return;
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    const newComment: Comment = { 
        id: Date.now().toString(), 
        author: 'Proponent', 
        text: replyText, 
        timestamp: timestamp 
    };

    setProjects(prev => prev.map(p => {
      if(p.id !== activeProjectId) return p;
      return { ...p, reports: p.reports.map(r => r.id === reportId ? { ...r, comments: [...r.comments, newComment] } : r) };
    }));
    setReplyText("");
  };

  const submitReport = (reportId: number) => {
    const report = activeProject?.reports.find(r => r.id === reportId);
    if (!report || report.expenseItems.length === 0) return alert("Please add expense items.");
    
    const submitterName = activeProject?.projectLeader; 

    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { 
        ...p, 
        reports: p.reports.map(r => r.id === reportId ? { 
          ...r, 
          status: 'submitted' as ReportStatus,
          submittedBy: submitterName,
          dateSubmitted: new Date().toLocaleDateString()
        } : r) 
      };
    }));
    alert("Submitted for Verification!");
  };

  const updateReportField = (reportId: number, field: keyof QuarterlyReport, value: any) => {
    setProjects(prev => prev.map(p => {
      if(p.id !== activeProjectId) return p;
      return { ...p, reports: p.reports.map(r => r.id === reportId ? { ...r, [field]: value } : r) };
    }));
  };

  const filteredProjects = projects.filter(p => (filterStatus === 'all' || p.status === filterStatus) && p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const currentReport = activeProject ? activeProject.reports[currentReportIndex] : null;
  const isLocked = currentReport?.status === 'locked';
  const isEditable = currentReport?.status === 'due' || currentReport?.status === 'overdue';
  const isOverdue = currentReport?.status === 'overdue';
  const prevReportProgress = activeProject && currentReportIndex > 0 ? activeProject.reports[currentReportIndex - 1].progressPercentage : 0;
  const reportTotal = currentReport ? calculateTotalExpenses(currentReport.expenseItems) : 0;

  const renderChatSection = () => {
    if (!currentReport) return null;
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner mt-6">
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
            <MessageSquare className="w-4 h-4 text-slate-500"/>
            <h5 className="text-xs font-bold text-slate-700 uppercase">Feedback & Communication</h5>
            </div>
            
            <div className="p-4 bg-slate-50/50 max-h-64 overflow-y-auto space-y-4">
            {currentReport.comments.length === 0 && (
                <p className="text-center text-xs text-slate-400 italic py-2">No messages yet. Use the box below to update R&D on status.</p>
            )}
            {currentReport.comments.map(comment => {
                const isRD = comment.author === 'R&D Officer';
                return (
                    <div key={comment.id} className={`flex gap-3 ${isRD ? 'justify-start' : 'justify-end'}`}>
                        {isRD && (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200 shadow-sm">
                            <User className="w-4 h-4 text-amber-700"/>
                        </div>
                        )}
                        
                        <div className={`max-w-[85%]`}>
                        <div className={`flex items-center gap-2 mb-1 ${isRD ? 'justify-start' : 'justify-end'}`}>
                            <span className={`text-[10px] font-bold ${isRD ? 'text-amber-700' : 'text-blue-700'}`}>
                                {isRD ? 'R&D Officer' : 'You (Proponent)'}
                            </span>
                            <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isRD 
                            ? 'bg-white border border-amber-200 text-slate-700 rounded-tl-none' 
                            : 'bg-blue-600 text-white rounded-tr-none'
                        }`}>
                            <p>{comment.text}</p>
                        </div>
                        </div>
                        
                        {!isRD && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200 shadow-sm">
                            <UserCheck className="w-4 h-4 text-blue-700"/>
                        </div>
                        )}
                    </div>
                );
            })}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 flex-shrink-0">
                <CornerDownRight className="w-4 h-4"/>
            </div>
            <input 
                type="text" 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                placeholder="Type your reply to R&D..." 
                className="flex-1 text-xs p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && postReply(currentReport.id)}
            />
            <button 
                onClick={() => postReply(currentReport.id)} 
                disabled={!replyText.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
                <Send className="w-4 h-4"/>
            </button>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 font-sans bg-gray-50 min-h-screen">
      
      {/* --- HEADER --- */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl shadow-lg">
            <FaChartLine className="text-white text-xl lg:text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Project Monitoring</h1>
            <p className="text-gray-600 text-sm">Detailed financial breakdowns and progress tracking.</p>
          </div>
        </div>

       {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
             <div><p className="text-xs font-bold text-gray-500">Active Projects</p><p className="text-3xl font-bold text-emerald-600">{projects.filter(p=>p.status==='active').length}</p></div>
             <Play className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all relative overflow-hidden">
             <div><p className="text-xs font-bold text-gray-500">Delayed</p><p className="text-3xl font-bold text-amber-600">{projects.filter(p=>p.status==='delayed').length}</p></div>
             <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
             <div><p className="text-xs font-bold text-gray-500">Completed</p><p className="text-3xl font-bold text-blue-600">{projects.filter(p=>p.status==='completed').length}</p></div>
             <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <section className="flex flex-col lg:flex-row gap-6">
          
          {/* --- LEFT SIDEBAR (Projects List) --- */}
          <div className={`w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-auto lg:h-[calc(100vh-140px)] ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-[#C8102E]"/> Select Project</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Find project..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"/>
              </div>
              <div className="flex gap-2 flex-wrap">
                 {['all', 'active', 'delayed', 'completed'].map((status) => (
                   <button key={status} onClick={() => setFilterStatus(status as any)} className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${filterStatus === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{status}</button>
                 ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredProjects.map((project) => (
                <button key={project.id} onClick={() => { setActiveProjectId(project.id); setShowMobileDetail(true); }} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${activeProjectId === project.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold line-clamp-1 ${activeProjectId === project.id ? 'text-blue-800' : 'text-gray-700'}`}>{project.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{project.agency}</p>
                  </div>
                  {project.status === 'delayed' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {project.status === 'active' && <Play className="w-4 h-4 text-emerald-500" />}
                  {project.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* --- RIGHT PANEL (Detail View) --- */}
          <div className={`w-full lg:w-2/3 flex flex-col ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
            <div className="lg:hidden mb-4">
              <button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-gray-600 font-semibold hover:text-[#C8102E]"><ArrowLeft className="w-5 h-5" /> Back to Projects</button>
            </div>

            {activeProject ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
                
                {/* --- COMPLETED PROJECT SUCCESS CARD --- */}
                {activeProject.status === 'completed' ? (
                   <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 text-white p-6 sm:p-8 text-center shadow-xl">
                      <Award className="absolute top-0 right-0 w-64 h-64 text-white opacity-5 transform translate-x-10 -translate-y-10 rotate-12" />
                      <CheckCircle2 className="absolute bottom-0 left-0 w-48 h-48 text-white opacity-5 transform -translate-x-10 translate-y-10 -rotate-12" />
                      <div className="relative z-10 animate-in zoom-in duration-500">
                         <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
                            <Award className="w-8 h-8 sm:w-10 sm:h-10" />
                         </div>
                         <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Congratulations!</h1>
                         <p className="text-blue-100 text-base sm:text-lg mb-8">Project Successfully Completed & Verified</p>
                         <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 border-b border-blue-700 pb-4 inline-block px-8">{activeProject.title}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left max-w-2xl mx-auto mb-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                               <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase"><Users className="w-4 h-4"/> Project Proponents</div>
                               <div className="space-y-1">
                                  <p className="font-semibold text-white">Leader: {activeProject.projectLeader}</p>
                                  <p className="text-sm text-blue-100">Co-Proponent: {activeProject.coProponent}</p>
                               </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                               <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase"><Banknote className="w-4 h-4"/> Financials</div>
                               <p className="font-semibold text-white text-xl">{formatCurrency(totalSpent)}</p>
                               <p className="text-sm text-blue-100">Total Budget Utilized</p>
                            </div>
                         </div>
                         <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-blue-950/50 rounded-xl sm:rounded-full px-6 py-3 sm:py-2 border border-blue-500/30">
                            <CalendarCheck className="w-5 h-5 text-yellow-400" />
                            <span className="font-medium text-blue-100 text-sm">Duration: <span className="text-white font-bold">{activeProject.startDate}</span> to <span className="text-white font-bold">{activeProject.endDate}</span></span>
                         </div>
                      </div>
                   </div>
                ) : (
                  // --- ACTIVE/DELAYED HEADER ---
                  <div className="mb-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                         <div>
                           <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activeProject.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {activeProject.status}
                              </span>
                           </div>
                           <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{activeProject.title}</h2>
                           <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Ends: {activeProject.endDate}</span>
                           </div>
                         </div>
                         <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setIsExtensionModalOpen(true)} className="flex-1 sm:flex-none justify-center flex p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Request Extension"><CalendarClock className="w-5 h-5"/></button>
                            <button onClick={() => setIsFundModalOpen(true)} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm text-sm"><Banknote className="w-4 h-4"/> Request Funds</button>
                         </div>
                      </div>

                      {activeProject.status === 'delayed' && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                           <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                           <div>
                              <h4 className="font-bold text-red-800 text-sm">Action Required: Project Delayed</h4>
                              <p className="text-xs text-red-600 mt-1">You have an overdue report. Please submit your progress report immediately or reply to R&D comments below.</p>
                           </div>
                        </div>
                      )}

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-2 relative z-10 gap-2 sm:gap-0">
                            <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Grant</p><p className="text-xl font-bold text-slate-800">{formatCurrency(activeProject.totalBudget)}</p></div>
                            <div className="text-left sm:text-right"><p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Remaining</p><p className="text-2xl font-black text-emerald-700">{formatCurrency(remainingBudget)}</p></div>
                         </div>
                         <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-1"><div className={`h-full transition-all duration-1000 ${budgetProgress > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budgetProgress}%` }}></div></div>
                         <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>0%</span><span>{budgetProgress.toFixed(1)}% Utilized</span></div>
                         <PieChart className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-200 opacity-50 z-0" />
                      </div>
                  </div>
                )}

                {/* --- CAROUSEL REPORTS VIEW --- */}
                {currentReport && (
                  <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-gray-500"/> Quarterly Reports</h3>
                         
                         <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button onClick={handlePrevReport} disabled={currentReportIndex === 0} className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                            <span className="text-xs font-bold text-gray-600 px-2 min-w-[60px] text-center">{currentReport.quarter}</span>
                            <button onClick={handleNextReport} disabled={currentReportIndex === activeProject.reports.length - 1} className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                         </div>
                      </div>

                      <div className={`relative rounded-2xl border transition-all animate-in fade-in slide-in-from-right-4 duration-300 ${isEditable ? 'bg-white shadow-lg border-blue-200 ring-1 ring-blue-100 p-4 sm:p-6' : 'bg-white border-gray-200 p-4 sm:p-6'}`}>
                         {/* Status Badges */}
                         <div className="absolute top-4 right-4 flex gap-2">
                            {isOverdue && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Overdue</span>}
                            {currentReport.status === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
                            {currentReport.status === 'submitted' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Submitted</span>}
                            {isLocked && <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded uppercase">Locked</span>}
                         </div>

                         <div className="mb-6 pr-20">
                            <h4 className="font-bold text-gray-800 text-xl mb-1">{currentReport.quarter} Report</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Due: {currentReport.dueDate}</p>
                         </div>

                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 gap-4 sm:gap-0">
                            <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Completion</p><p className="text-2xl font-bold text-gray-800">{currentReport.progressPercentage}%</p></div>
                            <div className="text-left sm:text-right"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Expenses</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(reportTotal)}</p></div>
                         </div>

                         {/* EDITABLE CONTENT */}
                         {isEditable ? (
                            <div className="space-y-6">
                               <div className="bg-white p-4 rounded-xl border border-gray-200">
                                  <label className="text-xs font-bold text-gray-600 uppercase mb-3 flex justify-between"><span>Update Progress (Starts at {prevReportProgress}%)</span></label>
                                  <input type="range" min={prevReportProgress} max="100" value={currentReport.progressPercentage} onChange={(e) => updateReportField(currentReport.id, 'progressPercentage', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                               </div>

                               <div className="border border-gray-200 rounded-xl overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200"><span className="text-xs font-bold text-gray-600 uppercase">Expense Breakdown</span></div>
                                  <div className="p-4 space-y-3 bg-white">
                                     {currentReport.expenseItems.map((item, idx) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                           <span className="hidden sm:inline text-xs text-gray-400 font-mono w-4">{idx+1}.</span>
                                           <input type="text" placeholder="Description" value={item.description} onChange={(e) => updateExpenseItem(currentReport.id, item.id, 'description', e.target.value)} className="w-full sm:flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"/>
                                           <div className="flex w-full sm:w-auto gap-2">
                                            <input type="number" placeholder="Amount" value={item.amount || ''} onChange={(e) => updateExpenseItem(currentReport.id, item.id, 'amount', parseFloat(e.target.value))} className="flex-1 sm:w-24 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right"/>
                                            <button onClick={() => removeExpenseItem(currentReport.id, item.id)} className="text-gray-400 hover:text-red-500 p-2 sm:p-0"><Trash2 className="w-4 h-4"/></button>
                                           </div>
                                        </div>
                                     ))}
                                     <button onClick={() => addExpenseItem(currentReport.id)} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"><Plus className="w-3 h-3"/> Add Expense Item</button>
                                  </div>
                               </div>

                               <div className="bg-white p-4 rounded-xl border border-gray-200">
                                  <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-600 uppercase">Proof of Accomplishment</label><label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><UploadCloud className="w-3 h-3"/> Upload Files<input type="file" multiple className="hidden" onChange={(e) => { if(e.target.files) updateReportField(currentReport.id, 'proofFiles', [...currentReport.proofFiles, ...Array.from(e.target.files).map(f => f.name)]); }}/></label></div>
                                  {currentReport.proofFiles.length > 0 ? <div className="flex flex-wrap gap-2">{currentReport.proofFiles.map((file, i) => <span key={i} className="bg-gray-50 border border-gray-200 px-2 py-1 rounded text-xs text-gray-600 flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500"/> {file}</span>)}</div> : <p className="text-xs text-gray-400 italic">No files uploaded yet.</p>}
                               </div>

                               {/* --- FEEDBACK & COMMUNICATION SECTION (Editable Mode) --- */}
                               {(currentReport.comments.length > 0 || isOverdue) && renderChatSection()}

                               <button onClick={() => submitReport(currentReport.id)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">Submit Report</button>
                            </div>
                         ) : (
                            /* READ ONLY VIEW */
                            <div className="border-t border-gray-100 pt-4">
                               {currentReport.expenseItems.length > 0 ? (
                                  <div className="mb-4">
                                     <p className="text-xs font-bold text-gray-500 uppercase mb-2">Expense Breakdown</p>
                                     <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                                        {currentReport.expenseItems.map(item => (
                                           <div key={item.id} className="flex justify-between text-xs text-gray-600 border-b border-gray-200 last:border-0 pb-1 last:pb-0"><span>{item.description}</span><span className="font-mono">{formatCurrency(item.amount)}</span></div>
                                        ))}
                                     </div>
                                  </div>
                               ) : <p className="text-xs text-gray-400 italic mb-4">No expenses recorded for this quarter.</p>}
                               
                               <p className="text-xs font-bold text-gray-500 uppercase mb-2">Proof of Accomplishment</p>
                               {currentReport.proofFiles.length > 0 ? <div className="flex flex-wrap gap-2">{currentReport.proofFiles.map((file, i) => <div key={i} className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100"><FileText className="w-3 h-3"/> {file}</div>)}</div> : <p className="text-xs text-gray-400 italic">No files available.</p>}
                               
                               {/* --- NEW SECTION: SUBMITTED BY --- */}
                               {currentReport.submittedBy && (
                                 <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end text-xs text-gray-500">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                       <UserCheck className="w-3 h-3 text-emerald-600" />
                                       <span>Submitted by: <span className="font-bold text-gray-700">{currentReport.submittedBy}</span></span>
                                       <span className="text-gray-400">•</span>
                                       <span>{currentReport.dateSubmitted}</span>
                                    </div>
                                 </div>
                               )}

                               {/* --- RENDER CHAT IN READ-ONLY MODE (If Comments Exist) --- */}
                               {currentReport.comments.length > 0 && renderChatSection()}
                            </div>
                         )}
                      </div>

                      {/* Pagination Dots */}
                      <div className="flex justify-center gap-2 mt-4 pb-6 lg:pb-0">
                         {activeProject.reports.map((_, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentReportIndex ? 'bg-blue-600 w-4' : 'bg-gray-300'}`}></div>
                         ))}
                      </div>
                  </div>
                )}

              </div>
            ) : <div className="h-full flex items-center justify-center text-gray-400">Select a project</div>}
          </div>
      </section>

      {/* --- MODALS (Fund & Extension) --- */}
      {isFundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsFundModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3"><Banknote className="w-6 h-6" /></div>
                 <h3 className="text-xl font-bold text-gray-800">Request Fund Release</h3>
                 <p className="text-sm text-gray-500">Break down exactly where this money will be utilized.</p>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-center text-sm font-bold text-emerald-800 uppercase">Total Request Amount</p>
                    <p className="text-center text-3xl font-black text-emerald-600">{formatCurrency(calculateTotalExpenses(fundItems))}</p>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-500 uppercase">Utilization Breakdown</label><button onClick={addFundItem} className="text-xs flex items-center gap-1 text-emerald-600 font-bold hover:underline"><Plus className="w-3 h-3"/> Add Item</button></div>
                    <div className="space-y-2">
                       {fundItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4 italic border-2 border-dashed border-gray-200 rounded-lg">No items added yet.</p>}
                       {fundItems.map((item) => (<div key={item.id} className="flex gap-2 items-center"><input type="text" placeholder="Description" value={item.description} onChange={(e) => updateFundItem(item.id, 'description', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500 outline-none"/><input type="number" placeholder="Cost" value={item.amount || ''} onChange={(e) => updateFundItem(item.id, 'amount', parseFloat(e.target.value))} className="w-24 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-right"/><button onClick={() => removeFundItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>))}
                    </div>
                 </div>
              </div>
              <div className="mt-6"><button onClick={submitFundRequest} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all">Submit Request</button></div>
           </div>
        </div>
      )}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsExtensionModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              <div className="text-center mb-6"><div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3"><CalendarClock className="w-6 h-6" /></div><h3 className="text-xl font-bold text-gray-800">Request Extension</h3></div>
              <div className="space-y-4">
                 <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">New End Date</label><input type="date" value={extensionDate} onChange={(e) => setExtensionDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"/></div>
                 <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason</label><textarea value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)} placeholder="Reason for delay..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm h-24 resize-none"/></div>
                 <button onClick={() => { alert("Extension Requested"); setIsExtensionModalOpen(false); }} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg">Submit Request</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;