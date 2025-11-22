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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavBar from '../../../components/users/evaluator/navbar';
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Tag,
  X,
  BookOpen,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react-native';

// --- Mock Rubrics Modal ---
const RubricsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal visible={isOpen} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Evaluation Rubrics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.rubricText}>
            • Innovation (25%){'\n'}
            • Technical Merit (25%){'\n'}
            • Methodology (20%){'\n'}
            • Budget & Timeline (15%){'\n'}
            • Impact (15%)
          </Text>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// --- Mock Review Modal ---
const ReviewModal = ({ 
  isOpen, 
  onClose, 
  proposal, 
  onViewRubrics, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  proposal: any; 
  onViewRubrics: () => void; 
  onSubmit: (data: any) => void; 
}) => {
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | "revise" | null>(null);

  const handleSubmit = () => {
    if (!decision) {
      Alert.alert("Required", "Please select a decision.");
      return;
    }
    onSubmit({ decision, comments, proposalId: proposal?.id });
    setComments("");
    setDecision(null);
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { height: '85%' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Submit Review</Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>{proposal?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Quick Info */}
            <View style={styles.reviewInfoCard}>
               <View style={styles.infoRow}>
                  <Clock size={14} color="#DC2626" />
                  <Text style={styles.deadlineText}>Deadline: {proposal?.reviewDeadline}</Text>
               </View>
               <TouchableOpacity onPress={onViewRubrics} style={styles.linkBtn}>
                  <BookOpen size={14} color="#2563EB" />
                  <Text style={styles.linkBtnText}>View Rubrics</Text>
               </TouchableOpacity>
            </View>

            {/* Decision Selection */}
            <Text style={styles.sectionLabel}>Decision</Text>
            <View style={styles.decisionContainer}>
              <TouchableOpacity 
                style={[styles.decisionBtn, decision === 'approve' && styles.decisionBtnActiveApprove]} 
                onPress={() => setDecision('approve')}
              >
                <ThumbsUp size={20} color={decision === 'approve' ? "#fff" : "#059669"} />
                <Text style={[styles.decisionText, decision === 'approve' && styles.textWhite]}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.decisionBtn, decision === 'revise' && styles.decisionBtnActiveRevise]} 
                onPress={() => setDecision('revise')}
              >
                <AlertCircle size={20} color={decision === 'revise' ? "#fff" : "#D97706"} />
                <Text style={[styles.decisionText, decision === 'revise' && styles.textWhite]}>Revise</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.decisionBtn, decision === 'reject' && styles.decisionBtnActiveReject]} 
                onPress={() => setDecision('reject')}
              >
                <ThumbsDown size={20} color={decision === 'reject' ? "#fff" : "#DC2626"} />
                <Text style={[styles.decisionText, decision === 'reject' && styles.textWhite]}>Reject</Text>
              </TouchableOpacity>
            </View>

            {/* Comments */}
            <Text style={styles.sectionLabel}>Evaluator Comments</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={6}
              placeholder="Enter your detailed assessment here..."
              placeholderTextColor="#94A3B8"
              value={comments}
              onChangeText={setComments}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function EvaluatorEndorsedProposals() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard':
        navigation.navigate('EvaluatorDashboard');
        break;
      case 'Proposals':
        navigation.navigate('EvaluatorProposals');
        break;
      case 'UnderReview':
        // Already on under review
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
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [showRubrics, setShowRubrics] = useState(false);
  
  const itemsPerPage = 5;

  // --- Data ---
  const endorsedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewDeadline: "Oct 25, 2025",
      description: "Development of AI system for automated assessment and personalized learning recommendations",
      proponent: "Jasmine Anderson",
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
      projectFile: "AI_Educational_Assessment_Proposal.pdf",
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      reviewDeadline: "Oct 28, 2025",
      description: "Advanced energy management system for smart grid optimization and efficiency",
      proponent: "Michael Chen",
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
      projectFile: "Agriculture_IoT_Proposal.pdf",
    },
    {
      id: 3,
      title: "Blockchain-Based Energy Trading Platform",
      reviewDeadline: "Oct 22, 2025",
      description: "Secure blockchain system for peer-to-peer energy trading and management",
      proponent: "Emily Rodriguez",
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
      projectFile: "Blockchain_Healthcare_Proposal.pdf",
    },
    {
      id: 4,
      title: "Renewable Energy Storage Optimization",
      reviewDeadline: "Oct 30, 2025",
      description: "Advanced battery management system for solar and wind energy storage facilities",
      proponent: "James Wilson",
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
      projectFile: "Energy_Storage_Proposal.pdf",
    },
    {
      id: 5,
      title: "IoT Sensor Network for Energy Efficiency",
      reviewDeadline: "Nov 2, 2025",
      description: "Distributed IoT network for real-time energy consumption monitoring and optimization",
      proponent: "Maria Santos",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      cooperatingAgencies: "DENR RO9, BFAR RO9, LGU Coastal Areas",
      rdStation: "Marine Biology Research Center",
      classification: "Applied Research",
      sector: "Environment and Natural Resources",
      discipline: "Marine Science",
      duration: "36 months",
      startDate: "January 2025",
      endDate: "December 2027",
      budgetTotal: "₱1,950,000.00",
      projectFile: "Marine_Conservation_Proposal.pdf",
    },
    {
      id: 6,
      title: "AI-Driven Smart Building Systems",
      reviewDeadline: "Oct 20, 2025",
      description: "Intelligent building management system using AI for energy optimization",
      proponent: "Robert Kim",
      projectType: "ICT",
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
      projectFile: "Smart_Traffic_Proposal.pdf",
    },
    {
      id: 7,
      title: "Microgrid Control System Development",
      reviewDeadline: "Nov 5, 2025",
      description: "Advanced control system for autonomous microgrid operations",
      proponent: "Dr. Lisa Martinez",
      projectType: "Energy",
      agency: "Zamboanga Peninsula Medical Center",
      cooperatingAgencies: "DOH RO9, DICT RO9, PhilHealth RO9",
      rdStation: "Telemedicine Research Unit",
      classification: "Development",
      sector: "Health and Wellness",
      discipline: "Medical Technology and ICT",
      duration: "30 months",
      startDate: "March 2025",
      endDate: "August 2027",
      budgetTotal: "₱2,750,000.00",
      projectFile: "Telemedicine_Proposal.pdf",
    },
    {
      id: 8,
      title: "Machine Learning for Energy Forecasting",
      reviewDeadline: "Oct 18, 2025",
      description: "ML-based predictive model for renewable energy generation forecasting",
      proponent: "Prof. Daniel Lee",
      projectType: "ICT",
      agency: "Mindanao State University",
      cooperatingAgencies: "PAGASA RO9, DENR RO9, NEDA RO9",
      rdStation: "Climate Science Research Center",
      classification: "Basic Research",
      sector: "Environment and Climate",
      discipline: "Atmospheric Science and Data Science",
      duration: "36 months",
      startDate: "February 2025",
      endDate: "January 2028",
      budgetTotal: "₱2,300,000.00",
      projectFile: "Climate_Prediction_Proposal.pdf",
    },
  ];

  // --- Logic ---
  const filtered = endorsedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewDeadline).getTime();
    const dateB = new Date(b.reviewDeadline).getTime();
    return dateA - dateB; // Earliest deadline first
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const selectedProposal = endorsedProposals.find(p => p.id === selectedProposalId);

  const handleSubmitReview = (data: any) => {
    Alert.alert("Success", "Review submitted successfully!");
    console.log("Review Submitted:", data);
    setSelectedProposalId(null);
  };

  const getProjectTypeStyle = (type: string) => {
    switch (type) {
      case "ICT": return { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" };
      case "Healthcare": return { bg: "#FCE7F3", text: "#BE185D", border: "#FBCFE8" };
      case "Agriculture": return { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" };
      case "Energy": return { bg: "#FEF9C3", text: "#A16207", border: "#FEF08A" };
      default: return { bg: "#F1F5F9", text: "#334155", border: "#E2E8F0" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Review Proposals</Text>
          <TouchableOpacity 
            style={styles.rubricsBtn}
            onPress={() => setShowRubrics(true)}
          >
            <BookOpen size={16} color="#2563EB" />
            <Text style={styles.rubricsBtnText}>Rubrics</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Track proposals submitted for your review.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search & Filter */}
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
             {["All", "ICT", "Energy", "Healthcare", "Agriculture"].map((type) => (
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
            {endorsedProposals.length} proposals pending review
          </Text>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {paginatedProposals.length > 0 ? (
            paginatedProposals.map((proposal) => {
              const typeStyle = getProjectTypeStyle(proposal.projectType);
              return (
                <View key={proposal.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{proposal.title}</Text>
                    <View style={styles.deadlineBadge}>
                       <Clock size={12} color="#DC2626" />
                       <Text style={styles.deadlineTextList}>Due {proposal.reviewDeadline}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {proposal.description}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <User size={14} color="#64748B" />
                      <Text style={styles.metaText}>{proposal.proponent}</Text>
                    </View>
                  </View>

                   <View style={styles.tagsRow}>
                     <View style={[styles.tag, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border, borderWidth: 1 }]}>
                        <Tag size={12} color={typeStyle.text} />
                        <Text style={[styles.tagText, { color: typeStyle.text }]}>{proposal.projectType}</Text>
                     </View>
                   </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.reviewButton}
                      onPress={() => setSelectedProposalId(proposal.id)}
                    >
                      <Eye size={16} color="#fff" />
                      <Text style={styles.reviewButtonText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
             <View style={styles.emptyState}>
                <FileText size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No proposals found</Text>
             </View>
          )}
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
           <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
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

      {/* Modals */}
      {selectedProposal && (
        <ReviewModal
          isOpen={!!selectedProposal}
          proposal={selectedProposal}
          onClose={() => setSelectedProposalId(null)}
          onViewRubrics={() => setShowRubrics(true)}
          onSubmit={handleSubmitReview}
        />
      )}

      <RubricsModal isOpen={showRubrics} onClose={() => setShowRubrics(false)} />

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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C8102E',
  },
  rubricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rubricsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  headerSubtitle: {
    fontSize: 13,
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
  resultsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineTextList: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  tag: {
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
    justifyContent: 'flex-end',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#C8102E',
    gap: 6,
  },
  reviewButtonText: {
    color: '#fff',
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
  pagination: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingVertical: 16,
     borderTopWidth: 1,
     borderTopColor: '#E2E8F0',
     marginTop: 8,
  },
  pageInfo: { fontSize: 12, color: '#64748B' },
  pageButtons: { flexDirection: 'row', gap: 8 },
  pageBtn: {
     padding: 8,
     borderRadius: 8,
     backgroundColor: '#fff',
     borderWidth: 1,
     borderColor: '#E2E8F0',
  },
  pageBtnDisabled: { backgroundColor: '#F1F5F9' },
  
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    paddingRight: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalScroll: { flex: 1 },
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
  closeIconBtn: { padding: 4 },
  rubricText: { fontSize: 14, color: '#334155', lineHeight: 24 },

  // Review Modal Specifics
  reviewInfoCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deadlineText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkBtnText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  decisionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  decisionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 6,
  },
  decisionBtnActiveApprove: { backgroundColor: '#059669', borderColor: '#059669' },
  decisionBtnActiveRevise: { backgroundColor: '#D97706', borderColor: '#D97706' },
  decisionBtnActiveReject: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  decisionText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  textWhite: { color: '#fff' },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#C8102E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

