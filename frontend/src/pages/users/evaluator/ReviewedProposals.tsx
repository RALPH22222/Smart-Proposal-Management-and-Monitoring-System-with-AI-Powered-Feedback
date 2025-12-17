import { useState } from "react";
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Tag,
  Filter,
} from "lucide-react";
import ProposalDetailsModal from "./ProposalDetailsModal";

export default function ReviewedProposals() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  // ... (Keep the reviewedProposals data array exactly as provided)
  const reviewedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewedDate: "Sept 20, 2025",
      proponent: "Jasmine Anderson",
      gender: "Female",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(062) 991-1771",
      email: "jasmine.anderson@wmsu.edu.ph",
      cooperatingAgencies: "DepEd RO9, CHED RO9, DICT RO9",
      rdStation: "College of Computing Studies",
      classification: "Research",
      classificationDetails: "Applied",
      modeOfImplementation: "Multi Agency",
      priorityAreas: "Education 4.0, Artificial Intelligence",
      sector: "Education Technology",
      discipline: "Information and Communication Technology",
      duration: "24 months",
      schoolYear: "2024-2025",
      startDate: "January 2025",
      endDate: "December 2026",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱600,000.00",
          mooe: "₱500,000.00",
          co: "₱150,000.00",
          total: "₱1,250,000.00",
        },
      ],
      budgetTotal: "₱1,250,000.00",
      projectFile: "AI_Educational_Assessment_Proposal.pdf",
      ratings: {
        objectives: 5,
        methodology: 4,
        budget: 5,
        timeline: 4,
      },
      decision: "Approve",
      comment:
        "This is a strong proposal with clear objectives, solid methodology, and appropriate budget. Recommended for approval with minor revisions to the data collection timeline.",
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      reviewedDate: "Sept 22, 2025",
      proponent: "Michael Chen",
      gender: "Male",
      projectType: "Energy",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' }
      ],
      telephone: "(062) 991-2345",
      email: "m.chen@zscms.edu.ph",
      cooperatingAgencies: "DA RO9, DTI RO9, LGU Zamboanga",
      rdStation: "Agricultural Research Center",
      classification: "Development",
      classificationDetails: "Technology Promotion/Commercialization",
      modeOfImplementation: "Single Agency",
      priorityAreas: "Renewable Energy, Smart Agriculture",
      sector: "Energy and Utilities",
      discipline: "Electrical Engineering",
      duration: "36 months",
      schoolYear: "2024-2025",
      startDate: "March 2025",
      endDate: "February 2028",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱800,000.00",
          mooe: "₱700,000.00",
          co: "₱100,000.00",
          total: "₱1,600,000.00",
        },
        {
          source: "DA RO9",
          ps: "₱300,000.00",
          mooe: "₱200,000.00",
          co: "₱0.00",
          total: "₱500,000.00",
        },
      ],
      budgetTotal: "₱2,100,000.00",
      projectFile: "Energy_Management_Proposal.pdf",
      ratings: {
        objectives: 5,
        methodology: 5,
        budget: 3,
        timeline: 5,
      },
      decision: "Approve",
      comment:
        "Excellent proposal with strong potential for significant impact on sustainable farming practices. Highly recommended for funding.",
    },
    {
      id: 3,
      title: "Blockchain-Based Energy Trading Platform",
      reviewedDate: "Sept 18, 2025",
      proponent: "Emily Rodriguez",
      gender: "Female",
      projectType: "Energy",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(062) 991-2934",
      email: "e.rodriguez@zcmc.doh.gov.ph",
      cooperatingAgencies: "DOH RO9, PhilHealth RO9, DICT RO9",
      rdStation: "Medical Informatics Department",
      classification: "Research",
      classificationDetails: "Applied",
      modeOfImplementation: "Multi Agency",
      priorityAreas: "Health Information Systems, Data Security",
      sector: "Energy and Utilities",
      discipline: "Energy Systems Engineering",
      duration: "30 months",
      schoolYear: "2024-2025",
      startDate: "February 2025",
      endDate: "July 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱700,000.00",
          mooe: "₱800,000.00",
          co: "₱300,000.00",
          total: "₱1,800,000.00",
        },
      ],

      budgetTotal: "₱1,800,000.00",
      projectFile: "Energy_Trading_Proposal.pdf",
      ratings: {
        objectives: 5,
        methodology: 2,
        budget: 2,
        timeline: 3,
      },
      decision: "Revise",
      comment:
        "Strong proposal addressing critical healthcare data management needs. Recommended for approval with emphasis on data privacy compliance.",
    },
  ];

  // ... (Keep filtering logic)
  const filtered = reviewedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewedDate).getTime();
    const dateB = new Date(b.reviewedDate).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "ICT":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Healthcare":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Agriculture":
        return "bg-green-100 text-green-700 border-green-200";
      case "Energy":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Public Safety":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Environment":
        return "bg-teal-100 text-teal-700 border-teal-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleViewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
  };

  const proposal = reviewedProposals.find((p) => p.id === selectedProposal);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
              Reviewed Proposals
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              View proposals that have been reviewed and forwarded for final
              decision.
            </p>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="flex-shrink-0" aria-label="Filter reviewed proposals">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Search reviewed proposals"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Filter by project type"
              >
                <option value="All">All Types</option>
                <option value="ICT">ICT</option>
                <option value="Energy">Energy</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-600">
            Showing {sortedFiltered.length} of {reviewedProposals.length}{" "}
            reviewed proposals
          </div>
        </div>
      </section>

      {/* Main Content Table */}
      <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C8102E]" />
              Reviewed Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4" />
              <span>{reviewedProposals.length} total reviewed</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {paginatedProposals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">
                          {proposal.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{proposal.proponent}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Reviewed: {proposal.reviewedDate}</span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getProjectTypeColor(
                              proposal.projectType
                            )}`}
                          >
                            <Tag className="w-3 h-3" />
                            {proposal.projectType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewClick(proposal.id)}
                          className="inline-flex items-center justify-center gap-1 px-4 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No proposals found
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {search
                  ? "Try adjusting your search criteria."
                  : "No proposals have been reviewed yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, sortedFiltered.length)} of{" "}
              {sortedFiltered.length} proposals
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Render the updated modal */}
      {proposal && (
        <ProposalDetailsModal
          proposal={proposal as any}
          isOpen={!!selectedProposal}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
