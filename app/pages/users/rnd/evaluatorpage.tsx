import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavigation from '../../../components/users/rnd/BottomNavigation';
import RnDEvaluatorPageModal, { type EvaluatorOption as ModalEvaluatorOption } from '../../../components/users/rnd/RnDEvaluatorPageModal';
import {
  Clock,
  Edit2,
  User,
  FileText,
  Search,
  History,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react-native';

// --- Types ---
type StatusType = 'Pending' | 'Accepts' | 'Completed' | 'Overdue' | 'Rejected';

interface Assignment {
  id: string;
  proposalId: string;
  proposalTitle: string;
  evaluatorIds: string[];
  evaluatorNames: string[];
  department: string;
  deadline: string;
  status: StatusType;
}

interface HistoryRecord {
  id: string;
  evaluatorName: string;
  decision: 'Accept' | 'Reject';
  comment: string;
  date: string;
}

// EvaluatorOption type is imported from RnDEvaluatorPageModal

// --- Mock Data ---
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    proposalId: 'p1',
    proposalTitle: 'AI-driven Smart Proposal Management System',
    evaluatorIds: ['e1', 'e2'],
    evaluatorNames: ['Dr. Alice Santos', 'Prof. Ben Reyes'],
    department: 'Information Technology',
    deadline: '2025-10-20',
    status: 'Accepts'
  },
  {
    id: '2',
    proposalId: 'p2',
    proposalTitle: 'Blockchain-based Voting Application',
    evaluatorIds: ['e3'],
    evaluatorNames: ['Engr. Carla Lim'],
    department: 'Information Technology',
    deadline: '2025-10-25',
    status: 'Pending'
  },
  {
    id: '3',
    proposalId: 'p3',
    proposalTitle: 'IoT-based Waste Management',
    evaluatorIds: ['e4', 'e5'],
    evaluatorNames: ['Dr. John Cruz', 'Prof. Eva Martinez'],
    department: 'Engineering',
    deadline: '2025-10-30',
    status: 'Rejected'
  },
  {
    id: '4',
    proposalId: 'p4',
    proposalTitle: 'Machine Learning for Agri Optimization',
    evaluatorIds: ['e6', 'e7'],
    evaluatorNames: ['Dr. Maria Santos', 'Prof. Carlos Reyes'],
    department: 'Agriculture',
    deadline: '2025-11-05',
    status: 'Completed'
  },
  {
    id: '5',
    proposalId: 'p5',
    proposalTitle: 'Renewable Energy Microgrid Systems',
    evaluatorIds: ['e8'],
    evaluatorNames: ['Engr. David Tan'],
    department: 'Engineering',
    deadline: '2025-09-15',
    status: 'Overdue'
  }
];

const MOCK_HISTORY: Record<string, HistoryRecord[]> = {
  p1: [
    { id: 'h1', evaluatorName: 'Dr. Alice Santos', decision: 'Accept', comment: 'Excellent and feasible research idea.', date: '2025-10-02' },
    { id: 'h2', evaluatorName: 'Prof. Ben Reyes', decision: 'Reject', comment: 'Needs better scope definition.', date: '2025-10-03' }
  ]
};

const THEME_COLOR = '#C8102E';

export default function EvaluatorAssignmentScreen() {
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
    return routeMap[routeName] || 'evaluators';
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

  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modal States
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord[]>([]);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // --- Filtering Logic ---
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.evaluatorNames.join(', ').toLowerCase().includes(search.toLowerCase()) ||
      a.proposalTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Actions ---
  const handleViewHistory = (proposalId: string) => {
    setSelectedHistory(MOCK_HISTORY[proposalId] || []);
    setHistoryModalVisible(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditModalVisible(true);
  };

  const handleReassign = (newEvaluators: ModalEvaluatorOption[]) => {
    if (!selectedAssignment) return;
    
    // Update the assignment with new evaluators
    const updatedAssignment: Assignment = {
      ...selectedAssignment,
      evaluatorIds: newEvaluators.map(ev => ev.id),
      evaluatorNames: newEvaluators.map(ev => ev.name),
    };
    
    // Update the assignments list
    setAssignments(prev => prev.map(a => 
      a.id === selectedAssignment.id ? updatedAssignment : a
    ));
    
    // In a real app, you would update the backend here
    Alert.alert('Success', 'Evaluator assignments updated.');
    setEditModalVisible(false);
    setSelectedAssignment(null);
  };

  // Convert assignment data to modal's EvaluatorOption format
  const getCurrentEvaluators = (): ModalEvaluatorOption[] => {
    if (!selectedAssignment) return [];
    
    return selectedAssignment.evaluatorNames.map((name, idx) => {
      const status = selectedAssignment.status === 'Rejected' 
        ? 'Rejected' 
        : selectedAssignment.status === 'Accepts' 
        ? 'Accepts' 
        : 'Pending';
      
      return {
        id: selectedAssignment.evaluatorIds[idx] || `temp-${idx}`,
        name: name,
        department: selectedAssignment.department,
        status: status as 'Accepts' | 'Rejected' | 'Pending'
      };
    });
  };

  // --- Render Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepts': return '#10b981'; // Emerald
      case 'Pending': return '#f59e0b'; // Amber
      case 'Completed': return '#3b82f6'; // Blue
      case 'Overdue': return '#ef4444'; // Red
      case 'Rejected': return '#64748b'; // Slate
      default: return '#64748b';
    }
  };

  const renderAssignmentCard = ({ item }: { item: Assignment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.proposalTitle} numberOfLines={2}>{item.proposalTitle}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <User size={14} color="#64748b" />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.evaluatorNames.join(', ')}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.metaText}>Deadline: {item.deadline}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => handleViewHistory(item.proposalId)}
        >
          <History size={16} color="#2563eb" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Edit2 size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evaluator Tracker</Text>
        <Text style={styles.headerSubtitle}>Manage assignments & deadlines</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Evaluators</Text>
          <Text style={styles.statValue}>
             {new Set(assignments.flatMap(a => a.evaluatorIds)).size}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Proposals</Text>
          <Text style={styles.statValue}>
             {new Set(assignments.map(a => a.proposalId)).size}
          </Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.controlsSection}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94a3b8" />
          <TextInput 
            style={styles.input}
            placeholder="Search proposals or evaluators..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['All', 'Pending', 'Accepts', 'Completed', 'Overdue', 'Rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.activeChip
              ]}
              onPress={() => setStatusFilter(status)}
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

      {/* Main List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={item => item.id}
        renderItem={renderAssignmentCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No assignments found</Text>
          </View>
        }
      />

      {/* --- HISTORY MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Evaluation History</Text>
                <Text style={styles.modalSubtitle}>Recent decisions</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                   <Text style={styles.emptyText}>No history records.</Text>
                </View>
              ) : (
                selectedHistory.map((record) => (
                  <View key={record.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyName}>{record.evaluatorName}</Text>
                      <View style={[
                        styles.decisionBadge, 
                        record.decision === 'Accept' ? styles.badgeSuccess : styles.badgeError
                      ]}>
                        {record.decision === 'Accept' ? <CheckCircle size={12} color="#15803d" /> : <XCircle size={12} color="#b91c1c" />}
                        <Text style={[
                          styles.decisionText,
                          record.decision === 'Accept' ? {color: '#15803d'} : {color: '#b91c1c'}
                        ]}> {record.decision}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyComment}>{record.comment}</Text>
                    <Text style={styles.historyDate}>{record.date}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EDIT / REASSIGN MODAL --- */}
      <RnDEvaluatorPageModal
        isOpen={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedAssignment(null);
        }}
        currentEvaluators={getCurrentEvaluators()}
        onReassign={handleReassign}
        proposalTitle={selectedAssignment?.proposalTitle || 'Untitled Proposal'}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLOR,
    marginTop: 4,
  },
  controlsSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
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
    marginBottom: 12,
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
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  // Card Styles
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
    marginBottom: 12,
  },
  proposalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 12,
  },
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_COLOR,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  modalBody: {
    padding: 20,
  },
  closeButton: {
    marginHorizontal: 20,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // History Items
  historyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyName: {
    fontWeight: '600',
    color: '#334155',
  },
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeError: { backgroundColor: '#fee2e2' },
  decisionText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  historyComment: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
});