import React, { useState } from "react";
import { 
  FaShareAlt, 
  FaUsers,
  FaMoneyBillWave,
  FaClipboardCheck,
  FaCheckCircle,
  FaFileAlt
} from 'react-icons/fa';
import DetailedProposalModal from '../../../components/proponent-component/DetailedProposalModal'; 
import type { Proposal } from '../../../types/InterfaceProp'; 

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

interface ProjectPortfolioProps {
  projects: Project[];
  viewMode: 'grid' | 'list';
  projectTab: 'all' | 'budget';
  onShareClick: (project: Project) => void;
  budgetProjects: Project[];
}

const ProjectPortfolio: React.FC<ProjectPortfolioProps> = ({
  projects,
  viewMode,
  projectTab,
  onShareClick,
  budgetProjects
}) => {
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proposal | null>(null);

  const getStatusColor = (index: number) => {
    const colors = [
      "bg-gray-100 text-gray-800 border border-gray-300",
      "bg-blue-100 text-blue-800 border border-blue-300",
      "bg-purple-100 text-purple-800 border border-purple-300",
      "bg-orange-100 text-orange-800 border border-orange-300",
      // "bg-yellow-100 text-yellow-800 border border-yellow-300",
      "bg-green-100 text-green-800 border border-green-300"
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
      <FaUsers className="text-blue-600" />,
      <FaUsers className="text-purple-600" />,
      <FaMoneyBillWave className="text-orange-600" />,
      <FaClipboardCheck className="text-yellow-600" />,
      <FaCheckCircle className="text-green-600" />
    ];
    return icons[index] || icons[0];
  };

  const stageLabels = [
    "Submitted",
    "R&D Evaluation", 
    "Evaluators Assessment",
    "Endorsement",
    "Funded"
  ];

const handleCardClick = (project: Project) => {
  // Generate random status for demo with proper typing
  const getRandomStatus = (): 'r&D Evaluation' | 'revise' | 'funded' | 'reject' => {
    const statuses = ['r&D Evaluation', 'revise', 'funded', 'reject'] as const;
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Convert Project to Proposal type with random status
  const proposal: Proposal = {
    id: project.id,
    title: project.title,
    status: getRandomStatus(), // This now returns the correct type
    proponent: "Dr. Maria Santos",
    gender: "Female",
    agency: "University of the Philippines",
    address: "Quezon City, Philippines",
    telephone: "+63 2 1234 5678",
    fax: "+63 2 1234 5679",
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
    budgetSources: [
      {
        source: "DOST Grant",
        ps: "₱500,000",
        mooe: "₱300,000",
        co: "₱200,000",
        total: "₱1,000,000"
      }
    ],
    budgetTotal: "₱1,000,000",
    uploadedFile: "/sample-proposal.pdf",
    lastUpdated: new Date().toISOString().split('T')[0]
  };
  
  setSelectedProject(proposal);
  setDetailedModalOpen(true);
};

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    // Handle the updated proposal data
    console.log('Updated proposal:', updatedProposal);
    // You can update your projects state here
    setDetailedModalOpen(false);
  };

  const projectsToShow = projectTab === 'all' ? projects : budgetProjects;

  if (viewMode === 'grid') {
    return (
      <>
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
                      {project.currentIndex === 4 ? 100 : Math.round((project.currentIndex / (stageLabels.length - 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.currentIndex === 4 ? 100 : (project.currentIndex / (stageLabels.length - 1)) * 100}%` }}                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.currentIndex)}`}>
                      {project.currentIndex === 4 ? "Funded" : stageLabels[project.currentIndex]}
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
                      onClick={(e) => { e.stopPropagation(); onShareClick(project); }}
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

        <DetailedProposalModal
          isOpen={detailedModalOpen}
          onClose={() => setDetailedModalOpen(false)}
          proposal={selectedProject}
          onUpdateProposal={handleUpdateProposal}
        />
      </>
    );
  }

  // List view
  return (
    <>
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
                    {stageLabels[project.currentIndex]}
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
                          style={{ width: `${project.currentIndex === 4 ? 100 : (project.currentIndex / (stageLabels.length - 1)) * 100}%` }}                        ></div>
                      </div>
                     <span className="font-semibold">
                       {project.currentIndex === 4 ? 100 : Math.round((project.currentIndex / (stageLabels.length - 1)) * 100)}%
                     </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onShareClick(project); }}
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

      <DetailedProposalModal
        isOpen={detailedModalOpen}
        onClose={() => setDetailedModalOpen(false)}
        proposal={selectedProject}
        onUpdateProposal={handleUpdateProposal}
      />
    </>
  );
};

export default ProjectPortfolio;