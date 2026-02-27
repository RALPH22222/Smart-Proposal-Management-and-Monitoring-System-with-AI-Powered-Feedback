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
import { api } from '../../utils/axios';

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
          console.log(`Forwarding proposal ${proposalId} to R&D Staff ID: ${decision.assignedRdStaffId}`);
          await forwardProposalToRnd(proposalId, [decision.assignedRdStaffId]);
        } else {
          console.warn("No R&D staff ID provided for assignment");
          throw new Error("Please select an R&D staff member.");
        }
      } else if (decision.decision === 'Sent to Evaluators') {
        if (decision.assignedEvaluators && decision.assignedEvaluators.length > 0) {
          const daysUntilDeadline = deadlineTimestamp > Date.now()
            ? Math.ceil((deadlineTimestamp - Date.now()) / (1000 * 60 * 60 * 24))
            : 14;

          await forwardProposalToEvaluators({
            proposal_id: proposalId,
            evaluators: (decision.assignedEvaluators || []).map((e: any) =>
              typeof e === 'string' ? { id: e, visibility: 'both' } : e
            ),
            deadline_at: daysUntilDeadline,
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
    console.log(`Admin updating proposal ${proposalId} status to ${status}`);

    const backendStatusMap: Record<string, string> = {
      'Funded': 'funded',
      'Funding Rejected': 'rejected_funding',
      'Funding Revision': 'revision_funding'
    };

    const backendStatus = backendStatusMap[status] || status;

    await api.post("/proposal/update-status", {
      proposal_id: parseInt(proposalId),
      status: backendStatus
    }, {
      withCredentials: true
    });
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
    case 'rejected_funding': return 'Funding Rejected';
    case 'revision_funding': return 'Funding Revision';
    case 'revised': return 'Revised Proposal'; // Hypothetical
    default: return 'Pending'; // Fallback
  }
};

const mapToProposal = (data: any, departments: LookupItem[] = []): Proposal => {
  // Group budget items by source and category
  const budgetSources: BudgetSource[] = [];

  if (Array.isArray(data.estimated_budget) && data.estimated_budget.length > 0) {
    // Group by source
    const sourceMap = new Map<string, { ps: any[], mooe: any[], co: any[] }>();

    data.estimated_budget.forEach((item: any) => {
      const source = item.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { ps: [], mooe: [], co: [] });
      }

      const group = sourceMap.get(source)!;
      const budgetItem = { item: item.item || '', amount: parseFloat(item.amount || '0') };

      // Group by budget category (ps, mooe, co)
      const category = (item.budget || '').toLowerCase();
      if (category === 'ps') {
        group.ps.push(budgetItem);
      } else if (category === 'mooe') {
        group.mooe.push(budgetItem);
      } else if (category === 'co') {
        group.co.push(budgetItem);
      }
    });

    // Convert map to array with totals
    sourceMap.forEach((categories, source) => {
      const psTotal = categories.ps.reduce((sum, item) => sum + item.amount, 0);
      const mooeTotal = categories.mooe.reduce((sum, item) => sum + item.amount, 0);
      const coTotal = categories.co.reduce((sum, item) => sum + item.amount, 0);
      const total = psTotal + mooeTotal + coTotal;

      budgetSources.push({
        source,
        ps: `₱${psTotal.toLocaleString()}`,
        mooe: `₱${mooeTotal.toLocaleString()}`,
        co: `₱${coTotal.toLocaleString()}`,
        total: `₱${total.toLocaleString()}`,
        breakdown: {
          ps: categories.ps,
          mooe: categories.mooe,
          co: categories.co
        }
      } as any);
    });
  }

  // Calculate grand total
  const budgetTotal = budgetSources.reduce((acc, curr) => {
    const total = curr.total.replace(/[₱,]/g, '');
    return acc + parseFloat(total || '0');
  }, 0);

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
    telephone: data.phone || '', // Backend uses 'phone' field
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
    rdStaffReviewer: data.proposal_rnd?.[0]?.users
      ? `${Array.isArray(data.proposal_rnd[0].users) ? data.proposal_rnd[0].users[0]?.first_name : data.proposal_rnd[0].users?.first_name} ${Array.isArray(data.proposal_rnd[0].users) ? data.proposal_rnd[0].users[0]?.last_name : data.proposal_rnd[0].users?.last_name}`
      : undefined,
    endorsementJustification: "",
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
