import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavigation from '../../../components/users/rnd/BottomNavigation';
import RnDProposalModal, { type Proposal as ModalProposal, type Decision } from '../../../components/users/rnd/RnDProposalModal';
import RndViewModal, { type Proposal as ViewModalProposal } from '../../../components/users/rnd/RndViewModal';
import {
  FileText,
  Calendar,
  User,
  Eye,
  Gavel,
  Search,
  Tag,
  Clock,
  Send,
  XCircle,
  RefreshCw,
  GitBranch,
  Check
} from 'lucide-react-native';

// --- Types ---
type ProposalStatus = 
  | 'Pending' 
  | 'Revised Proposal' 
  | 'Revision Required' 
  | 'Sent to Evaluators' 
  | 'Rejected Proposal' 
  | 'Approved';

interface Proposal {
  id: string;
  title: string;
  submittedBy: string;
  submittedDate: string;
  status: ProposalStatus;
  description: string; // Added for detail view
  projectType: string; // Added for badges
}

// --- Mock Data Service ---
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'PROP-001',
    title: 'AI-Driven Traffic Management System for Zamboanga City',
    submittedBy: 'Dr. John Doe',
    submittedDate: '2025-10-15',
    status: 'Revised Proposal',
    description: 'A comprehensive study on using computer vision and AI to optimize traffic light intervals in major intersections.',
    projectType: 'ICT'
  },
  {
    id: 'PROP-002',
    title: 'Sustainable Aqua-farming Practices',
    submittedBy: 'Prof. Maria Clara',
    submittedDate: '2025-10-18',
    status: 'Revision Required',
    description: 'Research into low-cost, high-yield shrimp farming techniques minimizing environmental impact.',
    projectType: 'Agriculture'
  },
  {
    id: 'PROP-003',
    title: 'Solar Powered Irrigation Systems',
    submittedBy: 'Engr. Juan Dela Cruz',
    submittedDate: '2025-10-20',
    status: 'Sent to Evaluators',
    description: 'Design and implementation of off-grid solar irrigation for remote farming communities.',
    projectType: 'Energy'
  },
  {
    id: 'PROP-004',
    title: 'Community Health Monitoring App',
    submittedBy: 'Dr. Jose Rizal',
    submittedDate: '2025-10-25',
    status: 'Pending',
    description: 'Mobile application for tracking prevalent diseases in barangays for early warning.',
    projectType: 'Healthcare'
  },
  {
    id: 'PROP-005',
    title: 'Crime Prediction using Historical Data',
    submittedBy: 'Prof. Antonio Luna',
    submittedDate: '2025-10-28',
    status: 'Pending',
    description: 'Using data analytics to predict crime hotspots.',
    projectType: 'Public Safety'
  }
];

const THEME_COLOR = '#C8102E';

export default function ProposalReviewScreen() {
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
    return routeMap[routeName] || 'proposals';
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

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>('All');

  // Modal State
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // --- Load Data ---
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProposals(MOCK_PROPOSALS);
      setLoading(false);
    }, 1000);
  }, []);

  // --- Filtering Logic ---
  useEffect(() => {
    let result = proposals;

    // Filter by Status
    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) || 
        p.submittedBy.toLowerCase().includes(lowerTerm) ||
        p.id.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredProposals(result);
  }, [proposals, statusFilter, searchTerm]);

  // --- Actions ---
  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setViewModalVisible(true);
  };

  const handleOpenAction = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setActionModalVisible(true);
  };

  const submitDecision = (decision: ProposalStatus) => {
    if (!selectedProposal) return;

    setProposals(prev => prev.map(p => 
      p.id === selectedProposal.id ? { ...p, status: decision } : p
    ));
    
    setActionModalVisible(false);
    Alert.alert('Success', `Proposal marked as ${decision}`);
  };

  // Handle decision from RnDProposalModal
  const handleDecisionSubmit = (decision: Decision) => {
    if (!selectedProposal) return;

    // Map decision.decision to ProposalStatus
    const newStatus = decision.decision as ProposalStatus;
    
    setProposals(prev => prev.map(p => 
      p.id === selectedProposal.id ? { ...p, status: newStatus } : p
    ));
    
    setActionModalVisible(false);
    setSelectedProposal(null);
    Alert.alert('Success', `Proposal decision submitted successfully`);
  };

  // Map local Proposal to ViewModalProposal format
  const mapToViewModal = (proposal: Proposal): ViewModalProposal => {
    return {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      proponent: proposal.submittedBy,
      // Add mock/default values for optional fields
      agency: 'WMSU',
      address: 'Normal Road, Baliwasan, Zamboanga City',
      telephone: '+63 955 123 4567',
      email: `${proposal.submittedBy.toLowerCase().replace(/\s+/g, '.')}@wmsu.edu.ph`,
      cooperatingAgencies: 'None',
      rdStation: proposal.projectType,
      classification: 'Research',
      classificationDetails: proposal.description,
      modeOfImplementation: 'In-house',
      priorityAreas: proposal.projectType,
      sector: proposal.projectType,
      discipline: proposal.projectType,
      duration: '12 months',
      startDate: proposal.submittedDate,
      endDate: new Date(new Date(proposal.submittedDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revisionDeadline: proposal.status === 'Revision Required' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };
  };

  // Map local Proposal to ModalProposal format
  const mapToModalProposal = (proposal: Proposal): ModalProposal => {
    return {
      id: proposal.id,
      title: proposal.title,
      submittedBy: proposal.submittedBy,
      submittedDate: proposal.submittedDate,
      rdStaffReviewer: 'R&D Staff',
      documentUrl: '#',
      evaluationDeadline: proposal.status === 'Sent to Evaluators' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };
  };

  // --- Helpers ---
  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'Pending': return { bg: '#fff7ed', text: '#d97706', border: '#ffedd5', icon: Clock };
      case 'Revised Proposal': return { bg: '#faf5ff', text: '#9333ea', border: '#f3e8ff', icon: GitBranch };
      case 'Sent to Evaluators': return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5', icon: Send };
      case 'Rejected Proposal': return { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2', icon: XCircle };
      case 'Revision Required': return { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', icon: RefreshCw };
      case 'Approved': return { bg: '#f0fdf4', text: '#16a34a', border: '#dcfce7', icon: Check };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', icon: FileText };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ICT': return { bg: '#eff6ff', text: '#2563eb' };
      case 'Healthcare': return { bg: '#fce7f3', text: '#be185d' };
      case 'Agriculture': return { bg: '#dcfce7', text: '#15803d' };
      case 'Energy': return { bg: '#fef9c3', text: '#a16207' };
      case 'Public Safety': return { bg: '#f3e8ff', text: '#7e22ce' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const renderProposalCard = ({ item }: { item: Proposal }) => {
    const statusStyle = getStatusColor(item.status);
    const StatusIcon = statusStyle.icon;
    const typeStyle = getTypeColor(item.projectType);
    const canAction = item.status === 'Pending' || item.status === 'Revised Proposal';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
             <Text style={[styles.typeText, { color: typeStyle.text }]}>{item.projectType}</Text>
          </View>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <User size={14} color="#64748b" />
            <Text style={styles.metaText}>{item.submittedBy}</Text>
          </View>
          <View style={[styles.metaRow, item.status === 'Pending' && {marginTop: 4}]}>
            <Calendar size={14} color={item.status === 'Pending' ? THEME_COLOR : "#64748b"} />
            <Text style={[styles.metaText, item.status === 'Pending' && {color: THEME_COLOR, fontWeight:'600'}]}>
               {item.submittedDate}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
             <StatusIcon size={12} color={statusStyle.text} />
             <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>

          <View style={styles.actionButtons}>
             <TouchableOpacity 
               style={styles.iconBtn} 
               onPress={() => handleViewDetails(item)}
             >
                <Eye size={20} color="#2563eb" />
             </TouchableOpacity>

             {canAction && (
               <TouchableOpacity 
                 style={styles.actionBtn}
                 onPress={() => handleOpenAction(item)}
               >
                 <Gavel size={14} color="#fff" />
                 <Text style={styles.actionBtnText}>Action</Text>
               </TouchableOpacity>
             )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Proposal Review</Text>
        <Text style={styles.headerSubtitle}>Evaluate research submissions</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94a3b8" />
          <TextInput 
            style={styles.input}
            placeholder="Search proposals..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['All', 'Pending', 'Revised Proposal', 'Sent to Evaluators', 'Revision Required', 'Rejected Proposal'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.activeChip
              ]}
              onPress={() => setStatusFilter(status as ProposalStatus | 'All')}
            >
              <Text style={[
                styles.chipText,
                statusFilter === status && styles.activeChipText
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading proposals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProposals}
          keyExtractor={item => item.id}
          renderItem={renderProposalCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No proposals found</Text>
            </View>
          }
        />
      )}

      {/* --- DETAIL MODAL --- */}
      <RndViewModal
        isOpen={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal ? mapToViewModal(selectedProposal) : null}
      />

      {/* --- ACTION MODAL --- */}
      <RnDProposalModal
        proposal={selectedProposal ? mapToModalProposal(selectedProposal) : null}
        isOpen={actionModalVisible}
        onClose={() => {
          setActionModalVisible(false);
          setSelectedProposal(null);
        }}
        onSubmitDecision={handleDecisionSubmit}
        userRole="R&D Staff"
        currentUser={{
          id: '1',
          name: 'R&D Staff',
          role: 'R&D Staff'
        }}
      />

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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLOR,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  controlsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#334155',
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR,
  },
  chipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 8,
    lineHeight: 22,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaContainer: {
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});