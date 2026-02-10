import {
  type Proposal,
  type Decision,
  type ProposalStatus,
  type Statistics,
  type Activity,
  type BudgetSource
} from '../../types/InterfaceProposal';
import {
  getProposals,
  forwardProposalToRnd,
  forwardProposalToEvaluators,
  requestRevision,
  rejectProposal
} from '../../services/proposal.api';

// Used for manual lookups if the join doesn't return the name
import { fetchDepartments, type LookupItem } from '../../services/proposal.api';

// Admin-specific API service
export const adminProposalApi = {
  // Fetch all proposals for Admin review
  fetchProposals: async (): Promise<Proposal[]> => {
    try {
      console.log('Fetching ADMIN proposals from Real API...');
      const [data, departments] = await Promise.all([
        getProposals(),
        fetchDepartments()
      ]);

      return data.map(item => mapToProposal(item, departments));
    } catch (error) {
      console.error("Failed to fetch admin proposals:", error);
      return [];
    }
  },

  // Submit decision (Admin override/assignment)
  submitDecision: async (decision: Decision): Promise<void> => {
    try {
      console.log('Admin submitting decision:', decision);

      const proposalId = parseInt(decision.proposalId, 10);
      const deadlineTimestamp = decision.evaluationDeadline ? new Date(decision.evaluationDeadline).getTime() : 0;

      // Map DecisionType to specific API calls
      if (decision.decision === 'Assign to RnD') {
        if (decision.assignedRdStaffId) {
          await forwardProposalToRnd(proposalId, [decision.assignedRdStaffId]);
        } else {
          console.warn("No R&D staff ID provided for assignment");
        }
      } else if (decision.decision === 'Sent to Evaluators') {
        if (decision.assignedEvaluators && decision.assignedEvaluators.length > 0) {
          await forwardProposalToEvaluators({
            proposal_id: proposalId,
            evaluator_id: decision.assignedEvaluators,
            deadline_at: deadlineTimestamp,
            commentsForEvaluators: decision.structuredComments?.objectives?.content // Using 'objectives' content field as general comment container from Modal
          });
        }
      } else if (decision.decision === 'Rejected Proposal') {
        await rejectProposal({
          proposal_id: proposalId,
          comment: decision.structuredComments?.overall?.content
        });
      } else if (decision.decision === 'Revision Required') {
        await requestRevision({
          proposal_id: proposalId,
          deadline: deadlineTimestamp,
          objective_comment: decision.structuredComments?.objectives?.content,
          methodology_comment: decision.structuredComments?.methodology?.content,
          budget_comment: decision.structuredComments?.budget?.content,
          timeline_comment: decision.structuredComments?.timeline?.content,
          overall_comment: decision.structuredComments?.overall?.content
        });
      }

    } catch (error) {
      console.error("Error submitting decision", error);
      throw error;
    }
  },

  // Update proposal status
  updateProposalStatus: async (
    proposalId: string,
    status: ProposalStatus
  ): Promise<void> => {
    // Calls the generic update status if available, or implies it was handled by the specific action
    console.log(`Admin updating proposal ${proposalId} status to ${status}`);

    // If status is "Assigned to RnD", we might want to trigger `forwardProposalToRnd` if we knew real parameters.
    // However, we lack the "rnd_id" here.
  },

  // Fetch Admin statistics
  fetchStatistics: async (): Promise<Statistics> => {
    // TODO: Connect to real stats API if available
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getAdminDummyStatistics();
  },

  // Fetch Admin recent activity
  fetchRecentActivity: async (): Promise<Activity[]> => {
    // TODO: Connect to real activity API
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getAdminDummyActivity();
  }
};

// --- DATA MAPPING HELPER ---

const mapStatus = (status: string): ProposalStatus => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'Pending';
    case 'review_rnd': return 'Under R&D Review';
    case 'revision_rnd': return 'Revision Required'; // Based on enum
    case 'rejected_rnd': return 'Rejected Proposal';
    case 'under_evaluation': return 'Under Evaluators Assessment';
    case 'endorsed_for_funding': return 'Endorsed';
    case 'funded': return 'Funded';
    // 'revised_proposal' logic might be complex if backend doesn't have explicit status for it
    // But let's check if 'revision_rnd' means "Revision Submitted" or "Revision Requested"
    // Usually 'revision_rnd' = Revision Requested by RnD.
    // If proponent submits revision, status might change back to 'review_rnd' or similar.
    // Let's assume for now:
    case 'revised': return 'Revised Proposal'; // Hypothetical
    default: return 'Pending'; // Fallback
  }
};

const mapToProposal = (data: any, departments: LookupItem[] = []): Proposal => {
  // Helper to safely get array buffer
  const budgetSources: BudgetSource[] = Array.isArray(data.estimated_budget)
    ? data.estimated_budget.map((b: any) => ({
      source: b.source || 'Unknown',
      ps: b.amount || '0', // Adjust mapping based on actual structure
      mooe: '0',
      co: '0',
      total: b.amount || '0'
    }))
    : [];

  // Calculate generic total if possible
  const budgetTotal = budgetSources.reduce((acc, curr) => acc + parseFloat(curr.total || '0'), 0).toString();

  const proponentName = data.proponent_id
    ? `${data.proponent_id.first_name} ${data.proponent_id.last_name}`.trim()
    : 'Unknown Proponent';

  const mappedStatus = mapStatus(data.status);

  // Map Department / R&D Station
  // First try the joined object, then try manual lookup by ID
  let rdStationName = data.rnd_station?.name || '';
  if (!rdStationName && data.department_id && departments.length > 0) {
    const found = departments.find(d => d.id === Number(data.department_id));
    if (found) rdStationName = found.name;
  }
  if (!rdStationName) rdStationName = 'N/A'; // Default if still not found

  return {
    id: data.id?.toString() || '',
    title: data.project_title || 'Untitled Proposal',
    documentUrl: data.proposal_version?.[0]?.file_url || '#',
    status: mappedStatus,
    submittedBy: proponentName,
    submittedDate: data.created_at || new Date().toISOString(),
    lastModified: data.updated_at || new Date().toISOString(),
    proponent: proponentName,
    gender: 'N/A', // Not in main query?
    agency: data.agency?.name || 'WMSU',
    // Fallback: use proponent's department ID if available 
    department: data.proponent_id?.department_id?.toString() || undefined,
    address: data.agency_address ? `${data.agency_address.street || ''} ${data.agency_address.city || ''}` : '',
    telephone: data.telephone || '', // map if available
    fax: data.fax || '',
    email: data.email || '',
    modeOfImplementation: data.implementation_mode || '',
    implementationSites: Array.isArray(data.implementation_site)
      ? data.implementation_site.map((s: any) => ({ site: s.site_name, city: s.city }))
      : [],
    priorityAreas: data.proposal_priorities?.map((p: any) => p.priorities?.name).join(', ') || '',
    projectType: data.proposal_tags?.map((t: any) => t.tags?.name).join(', ') || '', // Using tags as type?
    cooperatingAgencies: data.cooperating_agencies?.map((c: any) => c.agencies?.name).join(', ') || '',
    rdStation: rdStationName,
    classification: data.classification_type || '', // map "research_class" etc
    classificationDetails: data.class_input || '',
    sector: data.sector?.name || '',
    discipline: data.discipline?.name || '',
    duration: data.duration?.toString() || '',
    startDate: data.plan_start_date || '',
    endDate: data.plan_end_date || '',
    budgetSources: budgetSources,
    budgetTotal: `₱${budgetTotal}`,
    projectFile: data.proposal_version?.[0]?.file_url || undefined,
    assignedRdStaff: (() => {
      // Debug R&D mapping
      if (data.status === 'review_rnd' || data.status === 'under_evaluation') {
        console.log(`[DEBUG Proposal ${data.id}] Status: ${data.status}`, data.proposal_rnd);
      }

      if (data.proposal_rnd?.[0]?.users) {
        const u = data.proposal_rnd[0].users;
        // Check if u is an array (unexpected) or object
        const userObj = Array.isArray(u) ? u[0] : u;
        if (!userObj) return undefined;

        return `${userObj.first_name} ${userObj.last_name} (${userObj.department?.name || 'No Dept'}) - ${userObj.email}`;
      }
      return undefined;
    })(),
    assignedEvaluators: [], // Fetched via tracker usually
    evaluatorInstruction: '',
    tags: data.proposal_tags?.map((t: any) => t.tags?.name) || [] // Add tags array
  };
};


// --- KEEPING OTHER MOCKS TEMPORARILY FOR STATS/ACTIVITY ---
// (Until real APIs for these are confirmed)

const getAdminDummyStatistics = (): Statistics => ({
  totalProposals: 125,
  pendingProposals: 15,
  acceptedProposals: 45,
  rejectedProposals: 10,
  revisionRequiredProposals: 8,
  monthlySubmissions: [
    { month: 'Jan 2025', count: 20 },
    { month: 'Dec 2024', count: 15 },
    { month: 'Nov 2024', count: 18 },
    { month: 'Oct 2024', count: 22 },
    { month: 'Sep 2024', count: 12 }
  ]
});

const getAdminDummyActivity = (): Activity[] => [
  {
    id: 'ACT-ADMIN-001',
    type: 'review',
    proposalId: 'PROP-2025-ADMIN-03',
    proposalTitle: 'Hydroponics Automation for Urban Farming',
    action: 'Manually Assigned to Prof. Ben Reyes',
    timestamp: '2025-02-06T09:30:00Z',
    user: 'Admin User'
  },
  {
    id: 'ACT-ADMIN-002',
    type: 'submission',
    proposalId: 'PROP-2025-ADMIN-04',
    proposalTitle: 'Solar-Powered Water Filtration',
    action: 'Auto-assigned to Engr. Carla Lim',
    timestamp: '2025-02-14T09:00:00Z',
    user: 'System Bot'
  }
];
