import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar';
import { 
  AlertCircle, 
  Search, 
  Plus, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from 'lucide-react-native';

// --- Types & Mock Data ---

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

type Issue = {
  id: string;
  title: string;
  module: string;
  status: IssueStatus;
  severity: IssueSeverity;
  createdAt: string;
  assignee?: string;
};

const mockIssues: Issue[] = [
  { id: 'ISS-1042', title: 'Approvals page fails to load', module: 'Admin/Dashboard', status: 'open', severity: 'critical', createdAt: '2025-09-15', assignee: 'H. Labang' },
  { id: 'ISS-1037', title: 'Search results pagination error', module: 'Public/Search', status: 'in_progress', severity: 'high', createdAt: '2025-09-12', assignee: 'C. Candido' },
  { id: 'ISS-1028', title: 'Tooltip position overlaps', module: 'UI/Components', status: 'resolved', severity: 'medium', createdAt: '2025-09-08', assignee: 'A. Nieva' },
  { id: 'ISS-1019', title: 'Email notifications not sent', module: 'Notifications', status: 'open', severity: 'high', createdAt: '2025-09-03', assignee: 'Unassigned' },
  { id: 'ISS-1003', title: 'Minor spacing inconsistency', module: 'Proposals', status: 'closed', severity: 'low', createdAt: '2025-08-21', assignee: 'D. Castillon' }
];

const statusLabel: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const severityLabel: Record<IssueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export default function AdminReports() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // State
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');
  const [showModal, setShowModal] = useState(false);

  // Stats Calculation
  const stats = useMemo(() => {
    const open = mockIssues.filter((i) => i.status === 'open').length;
    const resolvedThisWeek = 7; 
    const avgResolution = '1.8d';
    const criticalOpen = mockIssues.filter((i) => i.severity === 'critical' && i.status !== 'closed').length;
    return { open, resolvedThisWeek, avgResolution, criticalOpen };
  }, []);

  // Filtering
  const filteredIssues = useMemo(() => {
    return mockIssues.filter((issue) => {
      const matchQuery = query
        ? `${issue.id} ${issue.title} ${issue.module}`.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchStatus = statusFilter === 'all' ? true : issue.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [query, statusFilter]);

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard': navigation.navigate('AdminDashboard' as any); break;
      case 'Accounts': navigation.navigate('AdminAccounts' as any); break;
      case 'Contents': navigation.navigate('AdminContents' as any); break;
      case 'Reports': navigation.navigate('AdminReports' as any); break;
      case 'System': navigation.navigate('AdminSystem' as any); break;
      default: break;
    }
  };

  const handleCreateReport = () => {
    setShowModal(false);
    Alert.alert("Success", "Report submitted successfully.");
  };

  // Helper for Badges
  const getStatusColor = (status: IssueStatus) => {
    switch(status) {
      case 'open': return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
      case 'in_progress': return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      case 'resolved': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'closed': return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch(severity) {
      case 'low': return { bg: '#F1F5F9', text: '#475569' };
      case 'medium': return { bg: '#EFF6FF', text: '#1D4ED8' };
      case 'high': return { bg: '#FFF7ED', text: '#C2410C' };
      case 'critical': return { bg: '#FEF2F2', text: '#991B1B' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <AlertCircle size={24} color="#C8102E" />
            <Text style={styles.title}>Reports</Text>
          </View>
          <Text style={styles.subtitle}>Track bugs and operational issues</Text>
        </View>

        {/* Stats Row - FIXED: Removed Wrapper View, Applied styles directly to ScrollView */}
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll} // Position: pulled to edges
          contentContainerStyle={styles.statsScrollContent} // Padding: internal spacing
        >
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Open Issues</Text>
            <Text style={styles.statValue}>{stats.open}</Text>
            <View style={styles.statFooter}>
              <AlertCircle size={12} color="#F59E0B" />
              <Text style={styles.statSub}>Attention needed</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Resolved (7d)</Text>
            <Text style={styles.statValue}>{stats.resolvedThisWeek}</Text>
            <View style={styles.statFooter}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.statSub}>Good progress</Text>
            </View>
          </View>
        </ScrollView>

        {/* Controls: Search & Add */}
        <View style={styles.controlsSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollContent}>
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
              <TouchableOpacity 
                key={s}
                style={[
                  styles.chip, 
                  statusFilter === s && styles.chipActive
                ]}
                onPress={() => setStatusFilter(s as any)}
              >
                <Text style={[
                  styles.chipText, 
                  statusFilter === s && styles.chipTextActive
                ]}>
                  {s === 'all' ? 'All' : statusLabel[s as IssueStatus]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Issues List */}
        <View style={styles.listContainer}>
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => {
              const statusStyle = getStatusColor(issue.status);
              const severityStyle = getSeverityColor(issue.severity);
              
              return (
                <View key={issue.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.issueId}>{issue.id}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg }]}>
                      <Text style={[styles.severityText, { color: severityStyle.text }]}>
                        {severityLabel[issue.severity]}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueModule}>Module: {issue.module}</Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {statusLabel[issue.status]}
                      </Text>
                    </View>
                    <Text style={styles.assignee}>
                      {issue.assignee || 'Unassigned'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.placeholderText}>No reports found matching your criteria.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} /> 
      </ScrollView>

      <AdminNavBar 
        activeRoute="Reports"
        onNavigate={handleNavigate}
      />

      {/* New Report Modal */}
      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Report</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} placeholder="Issue title" />
              
              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Describe the issue..." 
                multiline 
                textAlignVertical="top"
              />

              <Text style={styles.label}>Module</Text>
              <TextInput style={styles.input} placeholder="e.g. Admin/Dashboard" />

              <Text style={styles.label}>Severity</Text>
              <View style={styles.chipRow}>
                {['low', 'medium', 'high', 'critical'].map((sev) => (
                  <TouchableOpacity key={sev} style={styles.modalChip}>
                     <Text style={styles.modalChipText}>{severityLabel[sev as IssueSeverity]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateReport}>
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  // --- Stats Styles (Updated) ---
  statsScroll: {
    marginBottom: 20,
    marginHorizontal: -16,
    flexGrow: 0, 
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 16, 
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0, 
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statSub: {
    fontSize: 10,
    color: '#64748B',
  },
  // Controls
  controlsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#C8102E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chips
  chipsSection: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#C8102E',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
  },
  chipTextActive: {
    color: '#C8102E',
    fontWeight: '600',
  },
  // List
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  issueModule: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assignee: {
    fontSize: 12,
    color: '#475569',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  modalChipText: {
    fontSize: 12,
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#C8102E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});