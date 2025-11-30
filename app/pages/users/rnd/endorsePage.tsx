import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavigation from '../../../components/users/rnd/BottomNavigation';
import EvaluatorDecisionModal, { type EvaluatorDecision as EvaluatorDecisionType } from '../../../components/users/rnd/RnDEvaluatorDecision';
import EndorsementDecisionModal, { type EndorsementProposal as EndorsementProposalType } from '../../../components/users/rnd/EndorsementDecisionModal';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  User,
  Gavel,
} from 'lucide-react-native';

// --- Types ---
interface EvaluatorDecision {
  evaluatorId: string;
  evaluatorName: string;
  decision: 'Approve' | 'Revise' | 'Reject';
  comments: string;
  submittedDate: string;
  ratings: {
    objectives: number;
    methodology: number;
    budget: number;
    timeline: number;
  };
}

interface EndorsementProposal {
  id: string;
  title: string;
  submittedBy: string;
  evaluatorDecisions: EvaluatorDecision[];
  overallRecommendation: 'Approve' | 'Revise' | 'Reject';
  readyForEndorsement: boolean;
}

// --- Mock Data ---
const MOCK_PROPOSALS: EndorsementProposal[] = [
  {
    id: 'PROP-2025-001',
    title: 'Development of AI-Powered Student Learning Analytics Platform',
    submittedBy: 'Dr. Maria Santos',
    evaluatorDecisions: [
      {
        evaluatorId: 'eval-1',
        evaluatorName: 'Dr. Sarah Johnson',
        decision: 'Approve',
        comments: 'Excellent methodology and clear objectives. The AI implementation is well-structured.',
        submittedDate: '2025-01-20T14:30:00Z',
        ratings: { objectives: 5, methodology: 2, budget: 4, timeline: 5 }
      },
      {
        evaluatorId: 'eval-2',
        evaluatorName: 'Dr. Michael Chen',
        decision: 'Approve',
        comments: 'Strong technical foundation. Recommend minor adjustments to the data privacy section.',
        submittedDate: '2025-01-21T09:15:00Z',
        ratings: { objectives: 4, methodology: 5, budget: 3, timeline: 4 }
      }
    ],
    overallRecommendation: 'Approve',
    readyForEndorsement: true
  },
  {
    id: 'PROP-2025-003',
    title: 'Blockchain-Based Academic Credential Verification System',
    submittedBy: 'Dr. Angela Rivera',
    evaluatorDecisions: [
      {
        evaluatorId: 'eval-4',
        evaluatorName: 'Dr. Robert Kim',
        decision: 'Approve',
        comments: 'Innovative approach to credential verification. Security measures are comprehensive.',
        submittedDate: '2025-01-19T16:45:00Z',
        ratings: { objectives: 4, methodology: 3, budget: 4, timeline: 3 }
      },
      {
        evaluatorId: 'eval-3',
        evaluatorName: 'Dr. Lisa Rodriguez',
        decision: 'Revise',
        comments: 'Good concept but needs clearer user interface design and accessibility considerations.',
        submittedDate: '2025-01-20T11:20:00Z',
        ratings: { objectives: 3, methodology: 2, budget: 4, timeline: 3 }
      }
    ],
    overallRecommendation: 'Revise',
    readyForEndorsement: true
  },
  {
    id: 'PROP-2025-006',
    title: 'Virtual Reality Learning Environment for STEM Education',
    submittedBy: 'Dr. Roberto Fernandez',
    evaluatorDecisions: [
      {
        evaluatorId: 'eval-5',
        evaluatorName: 'Dr. Amanda Foster',
        decision: 'Approve',
        comments: 'Outstanding educational technology proposal. VR implementation is cutting-edge.',
        submittedDate: '2025-01-18T13:00:00Z',
        ratings: { objectives: 5, methodology: 5, budget: 4, timeline: 4 }
      }
    ],
    overallRecommendation: 'Approve',
    readyForEndorsement: false // Missing second evaluator
  }
];

export default function EndorseProposals() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  
  // Map route names to page IDs for BottomNavigation
  const getCurrentPage = (): string => {
    const routeName = route.name;
    const routeMap: Record<string, string> = {
      'RndDashboard': 'dashboard',
      'RndProposals': 'proposals',
      'RndEvaluators': 'evaluators',
      'RndEndorsements': 'endorsements',
      'RndMonitoring': 'monitoring',
      'RndSettings': 'settings',
    };
    return routeMap[routeName] || 'endorsements';
  };

  const [currentPage, setCurrentPage] = useState(getCurrentPage());

  // Update current page when route changes
  useEffect(() => {
    setCurrentPage(getCurrentPage());
  }, [route.name]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    
    switch (page) {
      case 'dashboard':
        navigation.navigate('RndDashboard');
        break;
      case 'proposals':
        navigation.navigate('RndProposals');
        break;
      case 'evaluators':
        navigation.navigate('RndEvaluators');
        break;
      case 'endorsements':
        navigation.navigate('RndEndorsements');
        break;
      case 'monitoring':
        navigation.navigate('RndMonitoring');
        break;
      case 'settings':
        Alert.alert('Settings', 'Settings page coming soon!');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: () => {
                navigation.navigate('Login');
              },
            },
          ]
        );
        break;
      default:
        break;
    }
  };

  const [proposals, setProposals] = useState<EndorsementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [evaluatorModalVisible, setEvaluatorModalVisible] = useState(false);
  const [selectedEvaluatorDecision, setSelectedEvaluatorDecision] = useState<EvaluatorDecision | null>(null);
  const [selectedProposalForEvaluator, setSelectedProposalForEvaluator] = useState<EndorsementProposal | null>(null);
  
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<EndorsementProposal | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProposals(MOCK_PROPOSALS);
      setLoading(false);
    }, 1000);
  };

  // --- Actions ---
  const handleOpenEvaluatorModal = (decision: EvaluatorDecision, proposal: EndorsementProposal) => {
    setSelectedEvaluatorDecision(decision);
    setSelectedProposalForEvaluator(proposal);
    setEvaluatorModalVisible(true);
  };

  const handleOpenDecisionModal = (proposal: EndorsementProposal) => {
    setSelectedProposal(proposal);
    setDecisionModalVisible(true);
  };

  const handleFinalDecision = (status: 'endorsed' | 'revised' | 'rejected', remarks: string) => {
    if (!selectedProposal) return;
    
    // Simulate backend update
    setProposals(prev => prev.filter(p => p.id !== selectedProposal.id));
    setDecisionModalVisible(false);
    setSelectedProposal(null);
    Alert.alert("Success", `Proposal ${status} successfully.`);
  };

  // --- UI Helpers ---
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Approve': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', icon: CheckCircle };
      case 'Revise': return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: RotateCcw };
      case 'Reject': return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle };
      default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: FileText };
    }
  };

  // --- Render Components ---
  
  // 1. Stats Card Component
  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <View style={[styles.statCard, { backgroundColor: colorClass.bg, borderColor: colorClass.border }]}>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: colorClass.text }]}>{value}</Text>
      </View>
      <Icon size={24} color={colorClass.text} style={{ opacity: 0.8 }} />
    </View>
  );

  // Convert EvaluatorDecision to EvaluatorDecisionType format
  const convertToEvaluatorDecisionType = (decision: EvaluatorDecision): EvaluatorDecisionType => {
    return {
      evaluatorId: decision.evaluatorId,
      evaluatorName: decision.evaluatorName,
      decision: decision.decision,
      comments: decision.comments,
      submittedDate: decision.submittedDate,
      ratings: decision.ratings,
    };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.loadingText}>Loading proposals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Modals */}
      {selectedEvaluatorDecision && selectedProposalForEvaluator && (
        <EvaluatorDecisionModal
          isOpen={evaluatorModalVisible}
          onClose={() => {
            setEvaluatorModalVisible(false);
            setSelectedProposalForEvaluator(null);
          }}
          decision={convertToEvaluatorDecisionType(selectedEvaluatorDecision)}
          proposalTitle={selectedProposalForEvaluator.title}
          proposalId={selectedProposalForEvaluator.id}
        />
      )}
      
      <EndorsementDecisionModal
        isOpen={decisionModalVisible}
        onClose={() => setDecisionModalVisible(false)}
        proposal={selectedProposal ? { id: selectedProposal.id, title: selectedProposal.title } : null}
        onConfirm={handleFinalDecision}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Endorsement</Text>
          <Text style={styles.headerSubtitle}>Review and finalize proposals</Text>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          <StatCard 
            label="Ready" 
            value={proposals.filter(p => p.readyForEndorsement).length} 
            icon={CheckCircle}
            colorClass={{ bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' }}
          />
          <StatCard 
            label="Pending" 
            value={proposals.filter(p => !p.readyForEndorsement).length} 
            icon={User}
            colorClass={{ bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' }}
          />
          <StatCard 
            label="Approved" 
            value={proposals.filter(p => p.overallRecommendation === 'Approve').length} 
            icon={CheckCircle}
            colorClass={{ bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' }}
          />
          <View style={{ width: 16 }} />
        </ScrollView>

        {/* List Section */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <FileText size={20} color="#C8102E" />
            <Text style={styles.listHeaderTitle}>Proposals for Review</Text>
          </View>

          {proposals.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No proposals to endorse</Text>
            </View>
          ) : (
            proposals.map((proposal) => (
              <View key={proposal.id} style={styles.proposalCard}>
                
                {/* Card Header */}
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{proposal.title}</Text>
                    <View style={styles.cardMeta}>
                      <User size={12} color="#64748B" />
                      <Text style={styles.metaText}>{proposal.submittedBy}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.metaText}>{proposal.id}</Text>
                    </View>
                  </View>
                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getDecisionColor(proposal.overallRecommendation).bg }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getDecisionColor(proposal.overallRecommendation).text }
                    ]}>
                      {proposal.overallRecommendation}
                    </Text>
                  </View>
                </View>

                {/* Warning if not ready */}
                {!proposal.readyForEndorsement && (
                  <View style={styles.warningBox}>
                    <User size={14} color="#D97706" />
                    <Text style={styles.warningText}>Waiting for 2nd evaluator</Text>
                  </View>
                )}

                {/* Evaluator Decisions List */}
                <View style={styles.evaluatorList}>
                  <Text style={styles.subHeader}>Evaluator Reviews</Text>
                  {proposal.evaluatorDecisions.map((decision) => {
                    const style = getDecisionColor(decision.decision);
                    const Icon = style.icon;
                    return (
                      <TouchableOpacity 
                        key={decision.evaluatorId}
                        style={[styles.miniEvaluatorCard, { borderColor: style.border, backgroundColor: style.bg }]}
                        onPress={() => handleOpenEvaluatorModal(decision, proposal)}
                      >
                        <View style={styles.miniCardHeader}>
                          <Icon size={14} color={style.text} />
                          <Text style={styles.miniCardName}>{decision.evaluatorName}</Text>
                        </View>
                        <Text style={[styles.miniCardDecision, { color: style.text }]}>{decision.decision}</Text>
                        <Text numberOfLines={1} style={styles.miniCardComment}>{decision.comments}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Action Button */}
                {proposal.readyForEndorsement && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleOpenDecisionModal(proposal)}
                  >
                    <Gavel size={16} color="#FFF" />
                    <Text style={styles.actionButtonText}>Finalize Decision</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigation 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C8102E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  // Stats
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    width: 140,
    height: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statContent: {
    justifyContent: 'space-between',
    height: '100%',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // List
  listContainer: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
  },
  // Proposal Card
  proposalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    paddingRight: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  dot: {
    marginHorizontal: 6,
    color: '#CBD5E1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  evaluatorList: {
    marginTop: 8,
    gap: 8,
  },
  subHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  miniEvaluatorCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  miniCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  miniCardDecision: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  miniCardComment: {
    fontSize: 11,
    color: '#64748B',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: '#C8102E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
});