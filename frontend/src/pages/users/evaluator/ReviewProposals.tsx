import { useState } from "react";
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Clock,
  Tag,
  Filter,
} from "lucide-react";
import ReviewModal from "./ReviewModal";

export default function EndorsedProposals() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  const endorsedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewDeadline: "Oct 25, 2025",
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
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      reviewDeadline: "Oct 28, 2025",
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
      classificationDetails: "Pilot Testing",
      modeOfImplementation: "Single Agency",
      priorityAreas: "Renewable Energy, Smart Agriculture",
      sector: "Agriculture and Fisheries",
      discipline: "Agricultural Engineering",
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
      projectFile: "Agriculture_IoT_Proposal.pdf",
    },
    {
      id: 3,
      title: "Blockchain-Based Energy Trading Platform",
      reviewDeadline: "Oct 22, 2025",
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
      sector: "Health and Wellness",
      discipline: "Health Information Technology",
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
      projectFile: "Blockchain_Healthcare_Proposal.pdf",
    },
    {
      id: 4,
      title: "Renewable Energy Storage Optimization",
      reviewDeadline: "Oct 30, 2025",
      proponent: "James Wilson",
      gender: "Male",
      projectType: "Energy",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(063) 221-4050",
      email: "j.wilson@msumain.edu.ph",
      cooperatingAgencies: "DOE RO9, NEDA RO9, Private Sector Partners",
      rdStation: "Renewable Energy Research Lab",
      classification: "Development",
      classificationDetails: "Pilot Testing",
      modeOfImplementation: "Single Year",
      priorityAreas: "Energy Efficiency, Renewable Energy",
      sector: "Energy and Power",
      discipline: "Electrical Engineering",
      duration: "24 months",
      schoolYear: "2024-2025",
      startDate: "April 2025",
      endDate: "March 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,200,000.00",
          mooe: "₱800,000.00",
          co: "₱300,000.00",
          total: "₱2,300,000.00",
        },
        {
          source: "DOE RO9",
          ps: "₱100,000.00",
          mooe: "₱100,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱2,500,000.00",
      projectFile: "Energy_Storage_Proposal.pdf",
    },
    {
      id: 5,
      title: "IoT Sensor Network for Energy Efficiency",
      reviewDeadline: "Nov 2, 2025",
      proponent: "Maria Santos",
      gender: "Female",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(062) 991-1771",
      email: "maria.santos@wmsu.edu.ph",
      cooperatingAgencies: "DENR RO9, BFAR RO9, LGU Coastal Areas",
      rdStation: "Marine Biology Research Center",
      classification: "Research",
      classificationDetails: "Applied",
      modeOfImplementation: "Multi Agency",
      priorityAreas: "Environmental Conservation, IoT",
      sector: "Environment and Natural Resources",
      discipline: "Marine Science",
      duration: "36 months",
      schoolYear: "2024-2025",
      startDate: "January 2025",
      endDate: "December 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱900,000.00",
          mooe: "₱750,000.00",
          co: "₱200,000.00",
          total: "₱1,850,000.00",
        },
        {
          source: "DENR RO9",
          ps: "₱50,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱100,000.00",
        },
      ],
      budgetTotal: "₱1,950,000.00",
      projectFile: "Marine_Conservation_Proposal.pdf",
    },
    {
      id: 6,
      title: "AI-Driven Smart Building Systems",
      reviewDeadline: "Oct 20, 2025",
      proponent: "Robert Kim",
      gender: "Male",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' }
      ],
      telephone: "(062) 991-0871",
      email: "r.kim@adzu.edu.ph",
      cooperatingAgencies: "DILG RO9, LTO RO9, PNP RO9",
      rdStation: "Urban Planning Research Institute",
      classification: "Development",
      classificationDetails: "Technology Promotion/Commercialization",
      modeOfImplementation: "Single Agency",
      priorityAreas: "Smart Cities, Public Safety",
      sector: "Public Safety and Security",
      discipline: "Civil Engineering and ICT",
      duration: "24 months",
      schoolYear: "2024-2025",
      startDate: "May 2025",
      endDate: "April 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,500,000.00",
          mooe: "₱1,200,000.00",
          co: "₱300,000.00",
          total: "₱3,000,000.00",
        },
        {
          source: "DILG RO9",
          ps: "₱100,000.00",
          mooe: "₱100,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱3,200,000.00",
      projectFile: "Smart_Traffic_Proposal.pdf",
    },
    {
      id: 7,
      title: "Microgrid Control System Development",
      reviewDeadline: "Nov 5, 2025",
      proponent: "Dr. Lisa Martinez",
      gender: "Female",
      projectType: "Energy",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(062) 955-0104",
      email: "l.martinez@zpmc.doh.gov.ph",
      cooperatingAgencies: "DOH RO9, DICT RO9, PhilHealth RO9",
      rdStation: "Telemedicine Research Unit",
      classification: "Development",
      classificationDetails: "Technology Promotion/Commercialization",
      modeOfImplementation: "Multi Agency",
      priorityAreas: "Digital Health, Rural Medicine",
      sector: "Health and Wellness",
      discipline: "Medical Technology and ICT",
      duration: "30 months",
      schoolYear: "2024-2025",
      startDate: "March 2025",
      endDate: "August 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,200,000.00",
          mooe: "₱1,050,000.00",
          co: "₱300,000.00",
          total: "₱2,550,000.00",
        },
        {
          source: "DOH RO9",
          ps: "₱150,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱2,750,000.00",
      projectFile: "Telemedicine_Proposal.pdf",
    },
    {
      id: 8,
      title: "Machine Learning for Energy Forecasting",
      reviewDeadline: "Oct 18, 2025",
      proponent: "Prof. Daniel Lee",
      gender: "Male",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      address: "Normal Road, Baliwasan",
      implementationSites: [
        { site: 'Main Campus', city: 'Zamboanga City' },
        { site: 'Satellite Campus', city: 'Pagadian City' }
      ],
      telephone: "(063) 221-4052",
      email: "d.lee@msumain.edu.ph",
      cooperatingAgencies: "PAGASA RO9, DENR RO9, NEDA RO9",
      rdStation: "Climate Science Research Center",
      classification: "Research",
      classificationDetails: "Basic",
      modeOfImplementation: "Multi Agency",
      priorityAreas: "Climate Change Adaptation, Data Science",
      sector: "Environment and Climate",
      discipline: "Atmospheric Science and Data Science",
      duration: "36 months",
      schoolYear: "2024-2025",
      startDate: "February 2025",
      endDate: "January 2028",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,100,000.00",
          mooe: "₱900,000.00",
          co: "₱200,000.00",
          total: "₱2,200,000.00",
        },
        {
          source: "PAGASA RO9",
          ps: "₱50,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱100,000.00",
        },
      ],
      budgetTotal: "₱2,300,000.00",
      projectFile: "Climate_Prediction_Proposal.pdf",
    },
  ];

  const filtered = endorsedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewDeadline).getTime();
    const dateB = new Date(b.reviewDeadline).getTime();
    return dateA - dateB;
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

  const handleReviewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
  };

  const handleSubmitReview = (data: { decision: string; comments: any }) => {
    console.log("[v0] Received submission from modal:", data);
    // Perform API calls here
    closeModal();
  };

  const proposal = endorsedProposals.find((p) => p.id === selectedProposal);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
              Review Proposals
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Track proposals that have been submitted for evaluation review.
            </p>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section
        className="flex-shrink-0"
        aria-label="Filter endorsed proposals"
      >
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Search endorsed proposals"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
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
            Showing {sortedFiltered.length} of {endorsedProposals.length}{" "}
            proposals for review
          </div>
        </div>
      </section>

      {/* Main Content Table */}
      <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C8102E]" />
              Review Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4" />
              <span>{endorsedProposals.length} total for review</span>
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
                          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>Review by: {proposal.reviewDeadline}</span>
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
                          onClick={() => handleReviewClick(proposal.id)}
                          className="inline-flex items-center justify-center gap-1 px-4 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 transition-all text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Review
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
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
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

      {/* Review Modal */}
      {proposal && (
        <ReviewModal
          isOpen={!!selectedProposal}
          proposal={proposal as any}
          onClose={closeModal}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}