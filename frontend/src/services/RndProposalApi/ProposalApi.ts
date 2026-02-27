import {
    type Proposal,
    type Decision,
    type ProposalStatus,
    type Statistics,
    type Activity
} from '../../types/InterfaceProposal';
import { getRndProposals } from '../../services/proposal.api';
import { api } from '../../utils/axios';

// Create Proposal object from raw API data
const transformProposal = (raw: any): Proposal => {
    // Check if raw is a wrapper or the data itself
    const p = (raw.proposal_id && (raw.proposal_id.project_title || raw.proposal_id.title)) ? raw.proposal_id : raw;

    // Helper to extract budget total string
    const getBudgetTotal = () => {
        if (p.total_budget) return `₱${parseFloat(p.total_budget).toLocaleString()}`;
        if (p.budget) {
            try {
                const budgetItems = JSON.parse(p.budget);
                if (Array.isArray(budgetItems)) {
                    const total = budgetItems.reduce((acc: number, item: any) => acc + (parseFloat(item.total) || 0), 0);
                    return `₱${total.toLocaleString()}`;
                }
            } catch (e) { }
        }
        return '₱0.00';
    };

    return {
        id: p.id,
        title: p.project_title || p.title || "Untitled",
        documentUrl: p.file_url || "",
        status: mapBackendStatusToFrontend(p.status),
        submittedBy: p.proponent_id ? `${p.proponent_id.first_name} ${p.proponent_id.last_name}` : "Unknown",
        submittedDate: p.created_at,
        lastModified: p.updated_at || p.created_at,
        proponent: p.proponent_id ? `${p.proponent_id.first_name} ${p.proponent_id.last_name}` : "Unknown",
        gender: p.proponent_id?.sex || "N/A",
        telephone: p.phone || "N/A",
        fax: "N/A",
        email: p.email || "",
        projectType: p.sector?.name || "N/A",
        agency: p.agency?.name || "WMSU",
        address: "N/A",
        cooperatingAgencies: p.cooperating_agencies ? JSON.stringify(p.cooperating_agencies) : "",
        rdStation: p.rnd_station?.name || "N/A",
        classification: p.classification_type || "Research",
        classificationDetails: p.class_input || "",
        modeOfImplementation: p.implementation_mode || "Single Agency",
        implementationSites: p.implementation_site || [],
        priorityAreas: p.priorities_id ? JSON.stringify(p.priorities_id) : "",
        sector: p.sector?.name || "N/A",
        discipline: p.discipline?.name || "N/A",
        duration: p.duration || "0",
        startDate: p.plan_start_date || "",
        endDate: p.plan_end_date || "",
        budgetSources: [],
        budgetTotal: getBudgetTotal(),
        assignedEvaluators: p.proposal_evaluator ? p.proposal_evaluator.map((e: any) => `${e.evaluator_id.first_name} ${e.evaluator_id.last_name}`) : [],
        evaluatorInstruction: p.evaluator_instruction || "",
        endorsementJustification: "",
        rdStaffReviewer: raw.users
            ? `${raw.users.first_name} ${raw.users.last_name}`
            : p.proposal_rnd?.[0]?.users
                ? `${Array.isArray(p.proposal_rnd[0].users) ? p.proposal_rnd[0].users[0]?.first_name : p.proposal_rnd[0].users?.first_name} ${Array.isArray(p.proposal_rnd[0].users) ? p.proposal_rnd[0].users[0]?.last_name : p.proposal_rnd[0].users?.last_name}`
                : undefined
    };
};

const mapBackendStatusToFrontend = (status: string): ProposalStatus => {
    switch (status) {
        case 'review_rnd': return 'Pending';
        case 'under_evaluation': return 'Sent to Evaluators'; // Or 'Under Evaluators Assessment'
        case 'revision_rnd': return 'Revision Required';
        case 'rejected_rnd': return 'Rejected Proposal';
        case 'endorsed_for_funding': return 'Endorsed';
        case 'funded': return 'Funded';
        case 'revision_funding': return 'Funding Revision';
        case 'rejected_funding': return 'Funding Rejected';
        default: return 'Pending';
    }
};


// API service functions
export const proposalApi = {
    // Fetch all proposals for R&D staff review
    fetchProposals: async (): Promise<Proposal[]> => {
        try {
            const data = await getRndProposals();
            return data.map(transformProposal);
        } catch (error) {
            console.error("Failed to fetch proposals", error);
            return [];
        }
    },

    // Submit decision for a proposal
    submitDecision: async (_decision: Decision): Promise<void> => {
        // This uses the other API services directly in the components, 
        // but keeping this stub for interface compatibility if needed.
        console.warn("submitDecision in ProposalApi is deprecated. Use direct API calls.");
    },

    // Update proposal status
    updateProposalStatus: async (
        proposalId: string,
        status: ProposalStatus
    ): Promise<void> => {
        const backendStatusMap: Record<string, string> = {
            'Funded': 'funded',
            'Funding Rejected': 'rejected_funding',
            'Funding Revision': 'revision_funding'
        };

        const backendStatus = backendStatusMap[status] || status;

        try {
            await api.post("/proposal/update-status", {
                proposal_id: parseInt(proposalId),
                status: backendStatus
            }, {
                withCredentials: true
            });
        } catch (error: any) {
            console.error("Failed to update status. Backend response:", error.response?.data);
            throw error;
        }
    },

    // Fetch statistics
    fetchStatistics: async (): Promise<Statistics> => {
        try {
            const rawProposals = await getRndProposals();

            const stats: Statistics = {
                totalProposals: rawProposals.length,
                pendingProposals: 0,
                acceptedProposals: 0, // Maps to 'under_evaluation' (Forwarded)
                rejectedProposals: 0,
                revisionRequiredProposals: 0,
                monthlySubmissions: []
            };

            const monthCounts: Record<string, number> = {};

            rawProposals.forEach(raw => {
                // Normalize using the same logic as transformProposal
                const p = (raw.proposal_id && (raw.proposal_id.project_title || raw.proposal_id.title)) ? raw.proposal_id : raw;
                const status = p.status;

                console.log(`[Stats Debug] Proposal: ${p.id}, Status: ${status}`);

                if (status === 'review_rnd' || status === 'under_rnd_review') stats.pendingProposals++;
                else if (status === 'under_evaluation' || status === 'under_evaluator_assessment') stats.acceptedProposals++;
                else if (status === 'rejected_rnd') stats.rejectedProposals++;
                else if (status === 'revision_rnd') stats.revisionRequiredProposals++;

                // Monthly Submissions
                const date = new Date(p.created_at);
                const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
            });

            // Convert monthCounts to array and sort
            stats.monthlySubmissions = Object.entries(monthCounts)
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

            // If empty, provide default
            if (stats.monthlySubmissions.length === 0) {
                const today = new Date();
                const monthYear = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                stats.monthlySubmissions.push({ month: monthYear, count: 0 });
            }

            return stats;

        } catch (error) {
            console.error("Failed to fetch statistics", error);
            return {
                totalProposals: 0,
                pendingProposals: 0,
                acceptedProposals: 0,
                rejectedProposals: 0,
                revisionRequiredProposals: 0,
                monthlySubmissions: []
            };
        }
    },

    // Fetch recent activity
    fetchRecentActivity: async (): Promise<Activity[]> => {
        try {
            const rawProposals = await getRndProposals();
            const activities: Activity[] = [];

            rawProposals.forEach(p => {
                const proposal = transformProposal(p);
                const userName = proposal.submittedBy;

                // 1. Submission Activity
                activities.push({
                    id: `sub-${p.id}`,
                    type: 'submission',
                    proposalId: proposal.id,
                    proposalTitle: proposal.title,
                    action: 'New proposal submitted',
                    timestamp: proposal.submittedDate,
                    user: userName
                });

                // 2. Status Change Activities (Approximation based on status and updated_at)
                // In a real event-sourced system, we'd query an events table. 
                // Here we infer from current status if updated_at > created_at
                const created = new Date(proposal.submittedDate).getTime();
                const updated = new Date(proposal.lastModified).getTime();

                if (updated > created + 60000) { // If updated more than 1 min after creation
                    let action = '';
                    let type: Activity['type'] = 'review'; // Default

                    if (p.status === 'under_evaluation') {
                        action = 'Forwarded to Evaluators';
                        type = 'review';
                    } else if (p.status === 'revision_rnd') {
                        action = 'Revision requested';
                        type = 'revision';
                    } else if (p.status === 'rejected_rnd') {
                        action = 'Proposal rejected';
                        type = 'review';
                    }

                    if (action) {
                        activities.push({
                            id: `act-${p.id}`,
                            type: type,
                            proposalId: proposal.id,
                            proposalTitle: proposal.title,
                            action: action,
                            timestamp: proposal.lastModified,
                            user: 'R&D Staff' // We don't have the actor ID easily here without more data
                        });
                    }
                }
            });

            // Sort by timestamp descending and take top 10
            return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

        } catch (error) {
            console.error("Failed to fetch recent activities", error);
            return [];
        }
    }
};

