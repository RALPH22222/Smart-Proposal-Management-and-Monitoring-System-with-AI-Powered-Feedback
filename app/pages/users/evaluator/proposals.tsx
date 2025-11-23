import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavBar from '../../../components/users/evaluator/navbar';
import {
  FileText,
  Eye,
  User,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  X,
} from 'lucide-react-native';

export default function EvaluatorProposals() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard':
        navigation.navigate('EvaluatorDashboard');
        break;
      case 'Proposals':
        // Already on proposals
        break;
      case 'UnderReview':
        navigation.navigate('EvaluatorUnderReview');
        break;
      case 'Completed':
        navigation.navigate('EvaluatorCompleted');
        break;
      case 'Settings':
        navigation.navigate('EvaluatorSettings');
        break;
      default:
        break;
    }
  };
  
  // --- State ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  
  const itemsPerPage = 5;

  // --- Data ---
  const proposals = [
    {
      id: 1,
      title: "AI Research on Education",
      proponent: "John Doe",
      status: "accepted",
      deadline: "Oct 15, 2025",
      description: "Comprehensive study on AI applications in educational systems",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      cooperatingAgencies: "DepEd RO9, CHED RO9, DICT RO9",
      rdStation: "College of Computing Studies",
      classification: "Applied Research",
      sector: "Education Technology",
      discipline: "Information and Communication Technology",
      duration: "24 months",
      startDate: "January 2025",
      endDate: "December 2026",
      budgetTotal: "₱1,250,000.00",
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      proponent: "Jane Smith",
      status: "pending",
      deadline: "Oct 20, 2025",
      description: "Advanced energy management system for smart grid optimization",
      projectType: "Energy",
      agency: "Zamboanga State College of Marine Sciences",
      cooperatingAgencies: "DA RO9, DTI RO9, LGU Zamboanga",
      rdStation: "Agricultural Research Center",
      classification: "Development",
      sector: "Agriculture and Fisheries",
      discipline: "Agricultural Engineering",
      duration: "36 months",
      startDate: "March 2025",
      endDate: "February 2028",
      budgetTotal: "₱2,100,000.00",
    },
    {
      id: 3,
      title: "IoT-Based Energy Monitoring",
      proponent: "Michael Lee",
      status: "rejected",
      deadline: "Oct 10, 2025",
      description: "IoT sensors for real-time energy consumption monitoring",
      projectType: "Energy",
      agency: "Zamboanga City Medical Center",
      cooperatingAgencies: "DOH RO9, PhilHealth RO9, DICT RO9",
      rdStation: "Medical Informatics Department",
      classification: "Applied Research",
      sector: "Health and Wellness",
      discipline: "Health Information Technology",
      duration: "30 months",
      startDate: "February 2025",
      endDate: "July 2027",
      budgetTotal: "₱1,800,000.00",
    },
    {
      id: 4,
      title: "Quantum Computing Research",
      proponent: "Dr. Sarah Chen",
      status: "pending",
      deadline: "Oct 25, 2025",
      description: "Advanced quantum computing algorithms for cryptography",
      projectType: "ICT",
      agency: "Mindanao State University",
      cooperatingAgencies: "DOST RO9, DICT RO9, Private Sector",
      rdStation: "Computer Science Research Lab",
      classification: "Basic Research",
      sector: "Information Technology",
      discipline: "Computer Science",
      duration: "24 months",
      startDate: "April 2025",
      endDate: "March 2027",
      budgetTotal: "₱2,500,000.00",
    },
    {
      id: 5,
      title: "Renewable Energy Storage Optimization",
      proponent: "David Wilson",
      status: "accepted",
      deadline: "Oct 18, 2025",
      description: "Next-generation battery technology for renewable energy",
      projectType: "Energy",
      agency: "Mindanao State University",
      cooperatingAgencies: "DOE RO9, NEDA RO9, Private Sector Partners",
      rdStation: "Renewable Energy Research Lab",
      classification: "Development",
      sector: "Energy and Power",
      discipline: "Electrical Engineering",
      duration: "24 months",
      startDate: "April 2025",
      endDate: "March 2027",
      budgetTotal: "₱2,500,000.00",
    },
    {
      id: 6,
      title: "Neural Network Optimization",
      proponent: "Lisa Park",
      status: "pending",
      deadline: "Oct 22, 2025",
      description: "Optimization techniques for deep neural networks",
      projectType: "ICT",
      agency: "Ateneo de Zamboanga University",
      cooperatingAgencies: "DOST RO9, DICT RO9",
      rdStation: "AI Research Center",
      classification: "Applied Research",
      sector: "Artificial Intelligence",
      discipline: "Computer Science and Mathematics",
      duration: "18 months",
      startDate: "May 2025",
      endDate: "October 2026",
      budgetTotal: "₱1,500,000.00",
    },
    {
      id: 7,
      title: "Smart Energy Distribution Network",
      proponent: "Alex Johnson",
      status: "pending",
      deadline: "Oct 28, 2025",
      description: "AI-powered energy distribution optimization for urban areas",
      projectType: "Energy",
      agency: "Ateneo de Zamboanga University",
      cooperatingAgencies: "DILG RO9, LTO RO9, PNP RO9",
      rdStation: "Urban Planning Research Institute",
      classification: "Development",
      sector: "Public Safety and Security",
      discipline: "Civil Engineering and ICT",
      duration: "24 months",
      startDate: "May 2025",
      endDate: "April 2027",
      budgetTotal: "₱3,200,000.00",
    },
    {
      id: 8,
      title: "Machine Learning for Power Systems",
      proponent: "Dr. Emma White",
      status: "rejected",
      deadline: "Oct 12, 2025",
      description: "ML-powered predictive maintenance for power generation systems",
      projectType: "ICT",
      agency: "Zamboanga Peninsula Medical Center",
      cooperatingAgencies: "DOH RO9, DICT RO9, PhilHealth RO9",
      rdStation: "Medical AI Research Unit",
      classification: "Applied Research",
      sector: "Health and Wellness",
      discipline: "Medical Technology and ICT",
      duration: "30 months",
      startDate: "March 2025",
      endDate: "August 2027",
      budgetTotal: "₱2,750,000.00",
    },
  ];

  // --- Logic ---
  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.proponent.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOrder: Record<string, number> = { pending: 0, accepted: 1, rejected: 2 };
  const sortedFiltered = [...filtered].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 3;
    const orderB = statusOrder[b.status] ?? 3;
    return orderA - orderB;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  // --- Styles Helper ---
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "accepted":
        return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", icon: CheckCircle };
      case "pending":
        return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", icon: Clock };
      case "rejected":
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", icon: XCircle };
      default:
        return { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", icon: null };
    }
  };

  const getProjectTypeStyle = (type: string) => {
    switch (type) {
      case "ICT": return { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" };
      case "Healthcare": return { bg: "#FCE7F3", text: "#BE185D", border: "#FBCFE8" };
      case "Agriculture": return { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" };
      case "Energy": return { bg: "#FEF9C3", text: "#A16207", border: "#FEF08A" };
      case "Public Safety": return { bg: "#F3E8FF", text: "#7E22CE", border: "#E9D5FF" };
      default: return { bg: "#F1F5F9", text: "#334155", border: "#E2E8F0" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evaluator Proposals</Text>
        <Text style={styles.headerSubtitle}>
          Manage and review submitted research proposals.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search & Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search proposals..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filters Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Status Filters */}
            {["All", "pending", "accepted", "rejected"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.verticalDivider} />

            {/* Type Filters */}
            {["All", "ICT", "Energy", "Healthcare"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setTypeFilter(type)}
                style={[
                  styles.filterChip,
                  typeFilter === type && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  typeFilter === type && styles.filterChipTextActive
                ]}>
                  {type === "All" ? "All Types" : type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.resultsCount}>
            Showing {sortedFiltered.length} proposals
          </Text>
        </View>

        {/* Proposals List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={20} color="#C8102E" />
              <Text style={styles.listHeaderTitle}>Research Proposals</Text>
            </View>
            <Text style={styles.totalCount}>{proposals.length} total</Text>
          </View>

          {paginatedProposals.length > 0 ? (
            paginatedProposals.map((proposal) => {
              const statusStyle = getStatusStyle(proposal.status);
              const typeStyle = getProjectTypeStyle(proposal.projectType);
              const StatusIcon = statusStyle.icon;

              return (
                <View key={proposal.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{proposal.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {proposal.description}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <User size={14} color="#64748B" />
                      <Text style={styles.metaText}>{proposal.proponent}</Text>
                    </View>
                    {proposal.status === 'pending' && (
                      <View style={styles.metaItem}>
                        <Calendar size={14} color="#DC2626" />
                        <Text style={[styles.metaText, { color: '#DC2626' }]}>
                          Due: {proposal.deadline}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.tagsRow}>
                     <View style={[styles.tag, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border, borderWidth: 1 }]}>
                        <Tag size={12} color={typeStyle.text} />
                        <Text style={[styles.tagText, { color: typeStyle.text }]}>{proposal.projectType}</Text>
                     </View>
                     
                     <View style={[styles.tag, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, borderWidth: 1 }]}>
                        {StatusIcon && <StatusIcon size={12} color={statusStyle.text} />}
                        <Text style={[styles.tagText, { color: statusStyle.text }]}>
                           {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Text>
                     </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => setSelectedProposalId(proposal.id)}
                    >
                      <Eye size={16} color="#2563EB" />
                    </TouchableOpacity>

                    {proposal.status === 'pending' && (
                      <>
                        <TouchableOpacity style={styles.acceptButton}>
                          <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectButton}>
                          <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
             <View style={styles.emptyState}>
                <FileText size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No proposals found</Text>
                <Text style={styles.emptySub}>Try adjusting your filters.</Text>
             </View>
          )}
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
           <Text style={styles.pageInfo}>
             Page {currentPage} of {totalPages}
           </Text>
           <View style={styles.pageButtons}>
             <TouchableOpacity 
               disabled={currentPage === 1}
               onPress={() => setCurrentPage(c => Math.max(1, c - 1))}
               style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
             >
               <ChevronLeft size={20} color={currentPage === 1 ? "#CBD5E1" : "#475569"} />
             </TouchableOpacity>
             <TouchableOpacity 
               disabled={currentPage === totalPages}
               onPress={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
               style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
             >
               <ChevronRight size={20} color={currentPage === totalPages ? "#CBD5E1" : "#475569"} />
             </TouchableOpacity>
           </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedProposalId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedProposalId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proposal Details</Text>
              <TouchableOpacity onPress={() => setSelectedProposalId(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedProposal && (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.detailTitle}>{selectedProposal.title}</Text>
                
                <View style={styles.detailSection}>
                   <Text style={styles.detailLabel}>Description</Text>
                   <Text style={styles.detailText}>{selectedProposal.description}</Text>
                </View>

                <View style={styles.detailRow}>
                   <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Proponent</Text>
                      <Text style={styles.detailText}>{selectedProposal.proponent}</Text>
                   </View>
                   <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Agency</Text>
                      <Text style={styles.detailText}>{selectedProposal.agency}</Text>
                   </View>
                </View>

                <View style={styles.detailRow}>
                   <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailText}>{selectedProposal.duration}</Text>
                   </View>
                   <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Total Budget</Text>
                      <Text style={styles.detailText}>{selectedProposal.budgetTotal}</Text>
                   </View>
                </View>
                
                <View style={styles.detailSection}>
                   <Text style={styles.detailLabel}>Cooperating Agencies</Text>
                   <Text style={styles.detailText}>{selectedProposal.cooperatingAgencies}</Text>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
               <TouchableOpacity 
                 style={styles.closeModalButton}
                 onPress={() => setSelectedProposalId(null)}
               >
                 <Text style={styles.closeModalText}>Close</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <BottomNavBar onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
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
  scrollContent: {
    padding: 16,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#1E293B',
    fontSize: 14,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#C8102E',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#C8102E',
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  totalCount: {
    fontSize: 12,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
  },
  acceptText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
  },
  rejectText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
     alignItems: 'center',
     padding: 40,
  },
  emptyTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1E293B',
     marginTop: 12,
  },
  emptySub: {
     fontSize: 14,
     color: '#64748B',
  },
  pagination: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingVertical: 16,
     borderTopWidth: 1,
     borderTopColor: '#E2E8F0',
     marginTop: 8,
  },
  pageInfo: {
     fontSize: 12,
     color: '#64748B',
  },
  pageButtons: {
     flexDirection: 'row',
     gap: 8,
  },
  pageBtn: {
     padding: 8,
     borderRadius: 8,
     backgroundColor: '#fff',
     borderWidth: 1,
     borderColor: '#E2E8F0',
  },
  pageBtnDisabled: {
     backgroundColor: '#F1F5F9',
     borderColor: '#E2E8F0',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalScroll: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailHalf: {
    flex: 1,
    paddingRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  closeModalButton: {
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
