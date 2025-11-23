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
  CheckCircle,
  User,
  Tag,
  X,
  Building2,
  DollarSign,
  Calendar,
  MessageSquare,
  BookOpen,
  Download,
} from 'lucide-react-native';

// --- Mock Rubrics Modal Component ---
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

export default function EvaluatorReviewedProposals() {
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
        navigation.navigate('EvaluatorUnderReview');
        break;
      case 'Completed':
        // Already on completed
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
  const reviewedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewedDate: "Sept 20, 2025",
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
      budgetSources: [
        {
          source: "DOST",
          ps: "₱600,000.00",
          mooe: "₱500,000.00",
          co: "₱150,000.00",
          total: "₱1,250,000.00",
        },
      ],
      budgetTotal: "₱1,250,000.00",
      projectFile: "AI_Educational_Assessment_Proposal.pdf",
      comments: {
        objectives: "The objectives are well-defined and align with current educational needs. The focus on personalized learning is particularly relevant.",
        methodology: "The proposed methodology is sound and follows established research practices. The use of machine learning algorithms is appropriate for this study.",
        budget: "Budget allocation appears reasonable and well-justified. Equipment costs are within acceptable ranges for this type of research.",
        timeline: "The 24-month timeline is realistic given the scope of work. Milestones are clearly defined and achievable.",
        overall: "This is a strong proposal with clear objectives, solid methodology, and appropriate budget. Recommended for approval with minor revisions to the data collection timeline.",
      },
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      reviewedDate: "Sept 22, 2025",
      description: "Advanced energy management system for smart grid optimization and efficiency",
      proponent: "Michael Chen",
      projectType: "Energy",
      agency: "Zamboanga State College of Marine Sciences",
      cooperatingAgencies: "DA RO9, DTI RO9, LGU Zamboanga",
      rdStation: "Agricultural Research Center",
      classification: "Development",
      sector: "Energy and Utilities",
      discipline: "Electrical Engineering",
      duration: "36 months",
      startDate: "March 2025",
      endDate: "February 2028",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱800,000.00",
          mooe: "₱700,000.00",
          co: "₱100,000.00",
          total: "₱1,600,000.00",
        },
        {
          source: "DA RO9",
          ps: "₱300,000.00",
          mooe: "₱200,000.00",
          co: "₱0.00",
          total: "₱500,000.00",
        },
      ],
      budgetTotal: "₱2,100,000.00",
      projectFile: "Energy_Management_Proposal.pdf",
      comments: {
        objectives: "Objectives are comprehensive and address critical needs in sustainable agriculture. The focus on rural communities is commendable.",
        methodology: "The IoT implementation strategy is well-planned. Field testing protocols are thorough and appropriate for agricultural settings.",
        budget: "Budget is well-structured with clear allocation for hardware, software, and field operations. Costs are justified and competitive.",
        timeline: "The 36-month timeline allows for proper development, testing, and deployment phases. Seasonal considerations are well-integrated.",
        overall: "Excellent proposal with strong potential for significant impact on sustainable farming practices. Highly recommended for funding.",
      },
    },
    {
      id: 3,
      title: "Blockchain-Based Energy Trading Platform",
      reviewedDate: "Sept 18, 2025",
      description: "Secure blockchain system for peer-to-peer energy trading and management",
      proponent: "Emily Rodriguez",
      projectType: "Energy",
      agency: "Zamboanga City Medical Center",
      cooperatingAgencies: "DOH RO9, PhilHealth RO9, DICT RO9",
      rdStation: "Medical Informatics Department",
      classification: "Applied Research",
      sector: "Energy and Utilities",
      discipline: "Energy Systems Engineering",
      duration: "30 months",
      startDate: "February 2025",
      endDate: "July 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱700,000.00",
          mooe: "₱800,000.00",
          co: "₱300,000.00",
          total: "₱1,800,000.00",
        },
      ],
      budgetTotal: "₱1,800,000.00",
      projectFile: "Energy_Trading_Proposal.pdf",
      comments: {
        objectives: "The objectives clearly address data security and interoperability challenges in healthcare. Privacy considerations are well-articulated.",
        methodology: "Blockchain implementation approach is technically sound. Security protocols meet healthcare data protection standards.",
        budget: "Budget allocation is appropriate for blockchain development and healthcare system integration. Security infrastructure costs are justified.",
        timeline: "Timeline accounts for regulatory compliance and pilot testing phases. Implementation schedule is realistic.",
        overall: "Strong proposal addressing critical healthcare data management needs. Recommended for approval with emphasis on data privacy compliance.",
      },
    },
  ];

  // --- Logic ---
  const filtered = reviewedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewedDate).getTime();
    const dateB = new Date(b.reviewedDate).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const selectedProposal = reviewedProposals.find(p => p.id === selectedProposalId);

  const handleDownload = (fileName: string) => {
    Alert.alert("Downloading", `Downloading ${fileName}`);
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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Reviewed Proposals</Text>
          <TouchableOpacity 
            style={styles.rubricsBtn}
            onPress={() => setShowRubrics(true)}
          >
            <BookOpen size={16} color="#2563EB" />
            <Text style={styles.rubricsBtnText}>Rubrics</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          View proposals forwarded for final decision.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reviewed proposals..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
             {/* Type Filters */}
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
            Showing {sortedFiltered.length} reviewed proposals
          </Text>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.listHeaderTitle}>Proposals List</Text>
             </View>
             <Text style={styles.totalCount}>{reviewedProposals.length} reviewed</Text>
          </View>

          {paginatedProposals.length > 0 ? (
            paginatedProposals.map((proposal) => {
              const typeStyle = getProjectTypeStyle(proposal.projectType);
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
                    <View style={styles.metaItem}>
                      <CheckCircle size={14} color="#059669" />
                      <Text style={[styles.metaText, {color: '#059669'}]}>
                        Reviewed: {proposal.reviewedDate}
                      </Text>
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
                      style={styles.viewButton}
                      onPress={() => setSelectedProposalId(proposal.id)}
                    >
                      <Eye size={16} color="#2563EB" />
                      <Text style={styles.viewButtonText}>View Details</Text>
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
              <View style={{flex: 1}}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedProposal?.title}
                </Text>
                <Text style={styles.modalSubtitle}>Completed Review</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={() => setShowRubrics(true)} style={styles.iconBtn}>
                  <BookOpen size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedProposalId(null)} style={styles.iconBtn}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedProposal && (
              <ScrollView style={styles.modalScroll}>
                
                {/* Download Section */}
                <View style={styles.downloadCard}>
                   <View style={styles.downloadLeft}>
                      <View style={styles.fileIconBox}>
                         <FileText size={20} color="#2563EB" />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.downloadTitle}>Project Proposal Document</Text>
                        <Text style={styles.downloadSub} numberOfLines={1}>{selectedProposal.projectFile}</Text>
                      </View>
                   </View>
                   <TouchableOpacity 
                     style={styles.downloadBtn}
                     onPress={() => handleDownload(selectedProposal.projectFile)}
                   >
                     <Download size={16} color="#fff" />
                   </TouchableOpacity>
                </View>

                {/* Project Info */}
                <View style={styles.detailSection}>
                   <View style={styles.sectionTitleRow}>
                      <Building2 size={16} color="#C8102E" />
                      <Text style={styles.sectionTitleText}>Project Information</Text>
                   </View>
                   <View style={styles.infoGrid}>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>Leader</Text>
                         <Text style={styles.infoValue}>{selectedProposal.proponent}</Text>
                      </View>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>Agency</Text>
                         <Text style={styles.infoValue}>{selectedProposal.agency}</Text>
                      </View>
                   </View>
                   
                   <View style={[styles.infoGrid, {marginTop: 12}]}>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>R&D Station</Text>
                         <Text style={styles.infoValue}>{selectedProposal.rdStation}</Text>
                      </View>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>Classification</Text>
                         <Text style={styles.infoValue}>{selectedProposal.classification}</Text>
                      </View>
                   </View>

                   <View style={[styles.infoGrid, {marginTop: 12}]}>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>Sector</Text>
                         <Text style={styles.infoValue}>{selectedProposal.sector}</Text>
                      </View>
                      <View style={styles.infoCol}>
                         <Text style={styles.infoLabel}>Discipline</Text>
                         <Text style={styles.infoValue}>{selectedProposal.discipline}</Text>
                      </View>
                   </View>
                </View>

                {/* Schedule */}
                <View style={styles.detailSection}>
                   <View style={styles.sectionTitleRow}>
                      <Calendar size={16} color="#C8102E" />
                      <Text style={styles.sectionTitleText}>Implementing Schedule</Text>
                   </View>
                   <View style={styles.scheduleRow}>
                      <View style={styles.scheduleItem}>
                        <Text style={styles.infoLabel}>Duration</Text>
                        <Text style={styles.infoValue}>{selectedProposal.duration}</Text>
                      </View>
                      <View style={styles.scheduleItem}>
                        <Text style={styles.infoLabel}>Start</Text>
                        <Text style={styles.infoValue}>{selectedProposal.startDate}</Text>
                      </View>
                      <View style={styles.scheduleItem}>
                        <Text style={styles.infoLabel}>End</Text>
                        <Text style={styles.infoValue}>{selectedProposal.endDate}</Text>
                      </View>
                   </View>
                </View>

                {/* Budget */}
                <View style={styles.detailSection}>
                   <View style={styles.sectionTitleRow}>
                      <DollarSign size={16} color="#C8102E" />
                      <Text style={styles.sectionTitleText}>Estimated Budget</Text>
                   </View>
                   {selectedProposal.budgetSources.map((source, idx) => (
                     <View key={idx} style={styles.budgetCard}>
                        <Text style={styles.budgetSourceTitle}>{source.source}</Text>
                        <View style={styles.budgetRow}>
                          <Text style={styles.budgetLabel}>PS</Text>
                          <Text style={styles.budgetVal}>{source.ps}</Text>
                        </View>
                        <View style={styles.budgetRow}>
                          <Text style={styles.budgetLabel}>MOOE</Text>
                          <Text style={styles.budgetVal}>{source.mooe}</Text>
                        </View>
                        <View style={styles.budgetRow}>
                          <Text style={styles.budgetLabel}>CO</Text>
                          <Text style={styles.budgetVal}>{source.co}</Text>
                        </View>
                        <View style={[styles.budgetRow, styles.budgetTotalRow]}>
                          <Text style={styles.budgetTotalLabel}>Total</Text>
                          <Text style={styles.budgetTotalVal}>{source.total}</Text>
                        </View>
                     </View>
                   ))}
                   <View style={styles.grandTotalBox}>
                      <Text style={styles.grandTotalLabel}>Grand Total</Text>
                      <Text style={styles.grandTotalVal}>{selectedProposal.budgetTotal}</Text>
                   </View>
                </View>

                {/* Evaluator Comments */}
                <View style={[styles.detailSection, {borderBottomWidth: 0}]}>
                   <View style={styles.sectionTitleRow}>
                      <MessageSquare size={16} color="#C8102E" />
                      <Text style={styles.sectionTitleText}>Evaluator Comments</Text>
                   </View>
                   
                   <View style={styles.commentBox}>
                      <Text style={styles.commentLabel}>Objectives Assessment</Text>
                      <Text style={styles.commentText}>{selectedProposal.comments.objectives}</Text>
                   </View>
                   <View style={styles.commentBox}>
                      <Text style={styles.commentLabel}>Methodology Assessment</Text>
                      <Text style={styles.commentText}>{selectedProposal.comments.methodology}</Text>
                   </View>
                   <View style={styles.commentBox}>
                      <Text style={styles.commentLabel}>Budget Assessment</Text>
                      <Text style={styles.commentText}>{selectedProposal.comments.budget}</Text>
                   </View>
                   <View style={styles.commentBox}>
                      <Text style={styles.commentLabel}>Overall Assessment</Text>
                      <Text style={styles.commentText}>{selectedProposal.comments.overall}</Text>
                   </View>
                </View>

                <View style={{height: 20}} />
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

      {/* Render Rubrics Modal */}
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
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  viewButtonText: {
    color: '#2563EB',
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
    height: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
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

  // Detail Components
  downloadCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  downloadLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  fileIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  downloadTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  downloadSub: { fontSize: 11, color: '#64748B' },
  downloadBtn: { backgroundColor: '#2563EB', padding: 8, borderRadius: 8 },

  detailSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  infoGrid: { flexDirection: 'row' },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scheduleItem: { flex: 1 },

  budgetCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  budgetSourceTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  budgetLabel: { fontSize: 12, color: '#64748B' },
  budgetVal: { fontSize: 12, color: '#334155', fontFamily: 'System' }, // Monospace if possible
  budgetTotalRow: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  budgetTotalLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  budgetTotalVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  grandTotalBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8 },
  grandTotalLabel: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  grandTotalVal: { fontSize: 14, fontWeight: '800', color: '#C8102E' },

  commentBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  commentLabel: { fontSize: 12, fontWeight: '700', color: '#1E40AF', marginBottom: 4 },
  commentText: { fontSize: 13, color: '#334155', lineHeight: 20 },
  detailText: { fontSize: 14, color: '#334155' },
});
