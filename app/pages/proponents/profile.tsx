import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  SafeAreaView, // Import SafeAreaView
  StatusBar,    // Import StatusBar for better android handling
  Platform
} from 'react-native';
import { 
  Microscope, FileText, ClipboardCheck, RefreshCw, Award, Search, Filter, Tag, Bell, List, Grid, Share2, X
} from 'lucide-react-native';

// --- 1. TYPE DEFINITIONS ---
interface Project {
  id: string | number;
  title: string;
  status: string;
  priority: string;
  budget: string;
  duration: string;
  currentIndex: number;
  lastUpdated: string;
}

interface Proposal {
  id: string | number;
  title: string;
  status: string;
  budgetTotal: string;
  [key: string]: any; 
}

interface Notification {
  id: string;
  read: boolean;
  message: string;
}

// --- 2. MOCK DATA & HELPERS ---
const mockProjects: Project[] = [
  { id: 1, title: "AI-Powered Traffic System", status: "Ongoing", priority: "high", budget: "₱500,000", duration: "12 Mos", currentIndex: 1, lastUpdated: "2024-01-01" },
  { id: 2, title: "Sustainable Rice Farming", status: "Funded", priority: "medium", budget: "₱1,200,000", duration: "24 Mos", currentIndex: 4, lastUpdated: "2024-02-15" },
  { id: 3, title: "Renewable Energy Grid", status: "Revision", priority: "high", budget: "₱3,000,000", duration: "36 Mos", currentIndex: 3, lastUpdated: "2024-03-10" },
  { id: 4, title: "Laguna Lake Water Quality", status: "Evaluation", priority: "high", budget: "₱800,000", duration: "18 Mos", currentIndex: 2, lastUpdated: "2024-03-20" },
  { id: 5, title: "Cacao Pest Control AI", status: "Draft", priority: "low", budget: "₱250,000", duration: "6 Mos", currentIndex: 0, lastUpdated: "2024-04-05" },
];

const getPriorityColor = (priority: string) => {
  switch(priority.toLowerCase()) {
    case 'high': return '#fee2e2'; // Light Red
    case 'medium': return '#fef3c7'; // Light Yellow
    default: return '#e2e8f0'; // Gray
  }
};

const getStatusLabelByIndex = (index: number) => {
  const stages = ['Draft', 'Evaluation', 'Assessment', 'Revision', 'Funded', 'Rejected'];
  return stages[index] || 'Unknown';
};

const getProgressPercentageByIndex = (index: number) => {
  return Math.min(Math.round((index / 5) * 100), 100);
};

// --- 3. COMPONENT ---

export default function ProponentsDashboard() {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectTab, setProjectTab] = useState<'all' | 'budget'>('all');
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proposal | null>(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal states
  const [shareOpen, setShareOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Mock Notifications
  const notifications: Notification[] = [
    { id: '1', read: false, message: "Project Approved" }
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter Logic
  const fundedProjects = mockProjects.filter(p => p.currentIndex === 4);
  const baseProjects = projectTab === 'all' ? mockProjects : fundedProjects;
  
  const filteredProjects = baseProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || true; 
    return matchesSearch && matchesType;
  });

  // Helper for Tag Colors
  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'ICT': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Agriculture': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'Energy': return { bg: '#fefce8', text: '#a16207', border: '#fef08a' };
      case 'Health': return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' };
      default: return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };
    }
  };

  const openShare = () => {
    setShareOpen(true);
  };

  const handleCardPress = (project: Project) => {
    setSelectedProject({
      ...project,
      budgetTotal: project.budget,
    });
    setDetailedModalOpen(true);
  };

  // UI Helper Components
  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
  );

  type ColorTheme = 'blue' | 'purple' | 'orange' | 'green' | 'slate';

  const StatCard = ({ title, count, icon, colorTheme }: { title: string, count: number, icon: React.ReactNode, colorTheme: ColorTheme }) => {
    const themeStyles: Record<ColorTheme, { bg: string; text: string; border: string }> = {
      blue: { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
      purple: { bg: '#faf5ff', text: '#9333ea', border: '#d8b4fe' },
      orange: { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' },
      green: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
      slate: { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' },
    };

    const currentTheme = themeStyles[colorTheme] || themeStyles.slate;

    return (
      <TouchableOpacity style={[styles.statCard, { backgroundColor: currentTheme.bg, borderColor: currentTheme.border }]}>
        <View style={styles.statContent}>
          <View>
            <Text style={styles.statLabel}>{title}</Text>
            <Text style={[styles.statCount, { color: currentTheme.text }]}>{count}</Text>
          </View>
          {icon}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false} // Prevents iOS overscroll
          overScrollMode="never" // Prevents Android overscroll/glow
        >
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconBg}>
                  <Filter color="#fff" size={24} /> 
                </View>
                <View>
                  <Text style={styles.title}>Project Portfolio</Text>
                  <Text style={styles.subtitle}>Track research lifecycle</Text>
                </View>
              </View>
              
              {/* Notification Bell */}
              <TouchableOpacity onPress={() => setNotificationsOpen(!notificationsOpen)} style={styles.iconButton}>
                <Bell size={24} color="#475569" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* View Mode & Stats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
              <StatCard 
                title="Total Projects" 
                count={mockProjects.length} 
                colorTheme="slate" 
                icon={<FileText color="#475569" size={20} />} 
              />
              <StatCard 
                title="Funded" 
                count={fundedProjects.length} 
                colorTheme="green" 
                icon={<Award color="#16a34a" size={20} />} 
              />
              <StatCard 
                title="Revision" 
                count={1} 
                colorTheme="orange" 
                icon={<RefreshCw color="#ea580c" size={20} />} 
              />
              <StatCard 
                title="Assessment" 
                count={2} 
                colorTheme="purple" 
                icon={<ClipboardCheck color="#9333ea" size={20} />} 
              />
              <StatCard 
                title="R&D Eval" 
                count={3} 
                colorTheme="blue" 
                icon={<Microscope color="#2563eb" size={20} />} 
              />
            </ScrollView>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
              {/* Tabs */}
              <View style={styles.tabContainer}>
                  <TouchableOpacity 
                      style={[styles.tabButton, projectTab === 'all' && styles.tabActive]}
                      onPress={() => setProjectTab('all')}
                  >
                      <Text style={[styles.tabText, projectTab === 'all' && styles.tabTextActive]}>All Projects</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                      style={[styles.tabButton, projectTab === 'budget' && styles.tabActive]}
                      onPress={() => setProjectTab('budget')}
                  >
                      <Text style={[styles.tabText, projectTab === 'budget' && styles.tabTextActive]}>Funded ({fundedProjects.length})</Text>
                  </TouchableOpacity>
              </View>

              {/* Search and Filters */}
              <View style={styles.filterSection}>
                  <View style={styles.searchContainer}>
                      <Search size={16} color="#94a3b8" />
                      <TextInput 
                          style={styles.searchInput}
                          placeholder="Search projects..."
                          value={searchTerm}
                          onChangeText={setSearchTerm}
                          placeholderTextColor="#94a3b8"
                      />
                  </View>

                  {/* Horizontal Filter Chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                      {['All', 'ICT', 'Agriculture', 'Energy', 'Health'].map((type) => (
                          <TouchableOpacity 
                              key={type} 
                              style={[styles.filterChip, typeFilter === type && styles.filterChipActive]}
                              onPress={() => setTypeFilter(type)}
                          >
                              <Text style={[styles.filterChipText, typeFilter === type && styles.filterChipTextActive]}>{type}</Text>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              </View>

              {/* View Toggle */}
              <View style={styles.viewToggleContainer}>
                  <Text style={styles.resultsText}>
                      Showing {filteredProjects.length} results
                  </Text>
                  <View style={styles.toggleButtons}>
                      <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}>
                          <Grid size={16} color={viewMode === 'grid' ? '#fff' : '#64748b'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}>
                          <List size={16} color={viewMode === 'list' ? '#fff' : '#64748b'} />
                      </TouchableOpacity>
                  </View>
              </View>

              {/* Projects List/Grid */}
              <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                  {filteredProjects.length === 0 ? (
                      <Text style={styles.emptyText}>No projects found matching criteria.</Text>
                  ) : (
                      filteredProjects.map((project: Project) => {
                          const progress = getProgressPercentageByIndex(project.currentIndex);
                          const statusLabel = getStatusLabelByIndex(project.currentIndex);
                          const tags = ['ICT', 'Research']; // Dummy tags for fix

                          return (
                              <TouchableOpacity 
                                  key={project.id} 
                                  style={styles.projectCard}
                                  onPress={() => handleCardPress(project)}
                              >
                                  <View style={styles.cardHeader}>
                                      <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
                                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) }]}>
                                          <Text style={styles.priorityText}>{project.priority.charAt(0).toUpperCase()}</Text>
                                      </View>
                                  </View>

                                  {/* Tags */}
                                  <View style={styles.tagsRow}>
                                      {tags.map((tag, idx) => {
                                          const tStyle = getTagStyle(tag);
                                          return (
                                              <View key={idx} style={[styles.tag, { backgroundColor: tStyle.bg, borderColor: tStyle.border }]}>
                                                  <Tag size={10} color={tStyle.text} />
                                                  <Text style={[styles.tagText, { color: tStyle.text }]}>{tag}</Text>
                                              </View>
                                          )
                                      })}
                                  </View>

                                  {/* Details */}
                                  <View style={styles.cardDetails}>
                                      <View style={styles.detailRow}>
                                          <Text style={styles.detailLabel}>Budget:</Text>
                                          <Text style={styles.detailValue}>{project.budget}</Text>
                                      </View>
                                      <View style={styles.detailRow}>
                                          <Text style={styles.detailLabel}>Duration:</Text>
                                          <Text style={styles.detailValue}>{project.duration}</Text>
                                      </View>
                                  </View>

                                  {/* Progress */}
                                  <View style={styles.progressContainer}>
                                      <View style={styles.progressHeader}>
                                          <Text style={styles.detailLabel}>Progress</Text>
                                          <Text style={styles.progressPercent}>{progress}%</Text>
                                      </View>
                                      <ProgressBar progress={progress} />
                                  </View>

                                  <View style={styles.cardFooter}>
                                      <View style={styles.statusBadge}>
                                          <Text style={styles.statusText}>{statusLabel}</Text>
                                      </View>
                                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); openShare(); }}>
                                          <Share2 size={18} color="#64748b" />
                                      </TouchableOpacity>
                                  </View>
                              </TouchableOpacity>
                          );
                      })
                  )}
              </View>
          </View>
        </ScrollView>

        {/* --- MODALS --- */}
        
        {/* Share Modal */}
        <Modal transparent visible={shareOpen} animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Share Project</Text>
                  <Text style={styles.modalText}>Share this project link with others.</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShareOpen(false)}>
                      <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
              </View>
          </View>
        </Modal>

        {/* Detailed Project Modal */}
        <Modal visible={detailedModalOpen} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.fullScreenModal}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProject?.title}</Text>
                  <TouchableOpacity onPress={() => setDetailedModalOpen(false)}>
                      <X size={24} color="#333" />
                  </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                  <Text style={styles.sectionTitle}>Project Details</Text>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{selectedProject?.status}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Budget</Text>
                    <Text style={styles.detailValue}>{selectedProject?.budgetTotal}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{selectedProject?.duration}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Priority</Text>
                    <Text style={styles.detailValue}>{selectedProject?.priority?.toUpperCase()}</Text>
                  </View>

                  <Text style={styles.sectionTitle}>Timeline</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Last Updated</Text>
                    <Text style={styles.detailValue}>{selectedProject?.lastUpdated}</Text>
                  </View>
                  
              </ScrollView>
            </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Ensures status bar area is white
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBg: {
    padding: 10,
    backgroundColor: '#C8102E',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Stats
  statsScroll: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  statCard: {
    width: 140,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: '#fff',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Content Area
  contentSection: {
    padding: 16,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabActive: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Search & Filter
  filterSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#C8102E',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#C8102E',
    fontWeight: '600',
  },

  // View Toggle Area
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748b',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: 8,
    backgroundColor: '#fff',
  },
  toggleBtnActive: {
    backgroundColor: '#C8102E',
  },

  // Lists & Cards
  gridContainer: {
    gap: 16,
  },
  listContainer: {
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Details
  cardDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  detailItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C8102E',
    borderRadius: 4,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
    color: '#C8102E',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#C8102E',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});