import React, { useState, useEffect } from "react";
import { Search, Target, Clock, CheckCircle2, Play, AlertTriangle, ArrowLeft } from "lucide-react";
import { api } from "../../../utils/axios";
import { useAuthContext } from "../../../context/AuthContext";
import TeamMembersSection from "../../../components/proponent-component/TeamMembersSection";

interface FundedProject {
  id: number;
  status: string;
  funded_date: string | null;
  created_at: string;
  project_lead_id: string;
  proposal: {
    id: number;
    project_title: string;
    program_title: string | null;
    plan_start_date: string | null;
    plan_end_date: string | null;
    department: { id: number; name: string } | null;
    sector: { id: number; name: string } | null;
  } | null;
  project_lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  completion_percentage: number;
  reports_count: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  on_going: { label: "On Going", color: "bg-blue-100 text-blue-700", icon: <Play size={14} /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  on_hold: { label: "On Hold", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={14} /> },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700", icon: <AlertTriangle size={14} /> },
};

const CoLeadProjects: React.FC = () => {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<FundedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<FundedProject | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data } = await api.get<{ data: FundedProject[] }>("/project/funded", {
          params: { user_id: user.id, role: "lead_proponent" },
          withCredentials: true,
        });
        setProjects(data.data || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const filtered = projects.filter((p) =>
    p.proposal?.project_title?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedProject) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#C8102E] mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div className="space-y-6">
          {/* Project Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProject.proposal?.project_title}</h2>
                {selectedProject.proposal?.program_title && (
                  <p className="text-sm text-gray-500 mt-1">{selectedProject.proposal.program_title}</p>
                )}
              </div>
              {statusConfig[selectedProject.status] && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[selectedProject.status].color}`}>
                  {statusConfig[selectedProject.status].icon}
                  {statusConfig[selectedProject.status].label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Lead</span>
                <p className="font-medium text-gray-900">
                  {selectedProject.project_lead?.first_name} {selectedProject.project_lead?.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Department</span>
                <p className="font-medium text-gray-900">{selectedProject.proposal?.department?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-gray-500">Reports</span>
                <p className="font-medium text-gray-900">{selectedProject.reports_count}</p>
              </div>
              <div>
                <span className="text-gray-500">Completion</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C8102E] rounded-full transition-all"
                      style={{ width: `${selectedProject.completion_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{selectedProject.completion_percentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <TeamMembersSection
            fundedProjectId={selectedProject.id}
            isProjectLead={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Projects where you are a team member</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm"
        />
      </div>

      {/* Project Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">You haven't been added to any projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project) => {
            const cfg = statusConfig[project.status] || statusConfig.on_going;
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-[#C8102E]/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {project.proposal?.project_title || "Untitled Project"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Lead: {project.project_lead?.first_name} {project.project_lead?.last_name}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ml-3 ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{project.proposal?.department?.name || "No department"}</span>
                  <span>{project.reports_count} report{project.reports_count !== 1 ? "s" : ""}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C8102E] rounded-full" style={{ width: `${project.completion_percentage}%` }} />
                    </div>
                    <span className="font-semibold">{project.completion_percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoLeadProjects;
