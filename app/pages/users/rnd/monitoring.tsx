import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavigation from '../../../components/users/rnd/BottomNavigation';
import RnDProjectDetailModal, { type Project as ModalProject, type ProjectStatus as ModalProjectStatus, type ProjectPhase as ModalProjectPhase } from '../../../components/users/rnd/RnDProjectDetailModal';
import {
  TrendingUp,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  BarChart3,
  Target,
  DollarSign,
  MapPin
} from 'lucide-react-native';

// --- Types ---
type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'At Risk' | 'Planning';
type ProjectPhase = 'Conceptualization' | 'Planning' | 'Execution' | 'Monitoring' | 'Closing';

interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  principalInvestigator: string;
  department: string;
  status: ProjectStatus;
  currentPhase: ProjectPhase;
  startDate: string;
  endDate: string;
  budget: number;
  completionPercentage: number;
  // ... add other fields as needed
}

// --- MOCK DATA ---
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    projectId: 'PROJ-2025-001',
    title: 'AI-Based Crop Disease Detection System',
    description: 'Developing a mobile application using computer vision.',
    principalInvestigator: 'Dr. Maria Santos',
    department: 'College of Computer Studies',
    status: 'Active',
    currentPhase: 'Execution',
    startDate: '2025-01-15',
    endDate: '2025-12-15',
    budget: 500000,
    completionPercentage: 35,
  },
  {
    id: '2',
    projectId: 'PROJ-2025-002',
    title: 'Renewable Energy Integration',
    description: 'Assessment and implementation of solar energy solutions.',
    principalInvestigator: 'Engr. Robert Lee',
    department: 'College of Engineering',
    status: 'Planning',
    currentPhase: 'Planning',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    budget: 1200000,
    completionPercentage: 10,
  },
  {
    id: '3',
    projectId: 'PROJ-2024-015',
    title: 'Disaster Risk Reduction System',
    description: 'IoT sensors and SMS alerts for flood-prone areas.',
    principalInvestigator: 'Dr. Elena Cruz',
    department: 'College of Science',
    status: 'On Hold',
    currentPhase: 'Monitoring',
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    budget: 750000,
    completionPercentage: 60,
  },
  {
    id: '4',
    projectId: 'PROJ-2023-089',
    title: 'Halal-Compliant Food Processing',
    description: 'Researching new preservation methods.',
    principalInvestigator: 'Prof. Abdul Malik',
    department: 'College of Home Economics',
    status: 'Completed',
    currentPhase: 'Closing',
    startDate: '2023-01-10',
    endDate: '2024-01-10',
    budget: 350000,
    completionPercentage: 100,
  },
  {
    id: '5',
    projectId: 'PROJ-2025-005',
    title: 'Marine Biodiversity Assessment',
    description: 'Survey of coral reef health.',
    principalInvestigator: 'Dr. James Reid',
    department: 'College of Forestry',
    status: 'Active',
    currentPhase: 'Execution',
    startDate: '2025-02-01',
    endDate: '2026-02-01',
    budget: 850000,
    completionPercentage: 20,
  }
];

const THEME_COLOR = '#C8102E';

export default function MonitoringScreen() {
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
    return routeMap[routeName] || 'monitoring';
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API Load
    setTimeout(() => {
      setProjects(MOCK_PROJECTS);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(lowerTerm) ||
        p.projectId.toLowerCase().includes(lowerTerm) ||
        p.principalInvestigator.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredProjects(filtered);
  }, [projects, statusFilter, searchTerm]);

  // --- Calculations ---
  const getTotalBudget = () => projects.reduce((sum, p) => sum + p.budget, 0);
  const getAverageCompletion = () => {
    if (projects.length === 0) return 0;
    const total = projects.reduce((sum, p) => sum + p.completionPercentage, 0);
    return Math.round(total / projects.length);
  };
  
  const getStatusCount = (status: ProjectStatus) => projects.filter(p => p.status === status).length;

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Map local Project to ModalProject format
  const mapProjectToModal = (project: Project): ModalProject => {
    // Map status: 'Active' -> 'Ongoing', 'Completed' -> 'Completed', 'On Hold' -> 'Pending', 'At Risk' -> 'Pending', 'Planning' -> 'Pending'
    const statusMap: Record<ProjectStatus, ModalProjectStatus> = {
      'Active': 'Ongoing',
      'Completed': 'Completed',
      'On Hold': 'Pending',
      'At Risk': 'Pending',
      'Planning': 'Pending'
    };

    // Map phase: 'Conceptualization' -> 'Planning', 'Planning' -> 'Planning', 'Execution' -> 'Implementation', 'Monitoring' -> 'Review', 'Closing' -> 'Closure'
    const phaseMap: Record<ProjectPhase, ModalProjectPhase> = {
      'Conceptualization': 'Planning',
      'Planning': 'Planning',
      'Execution': 'Implementation',
      'Monitoring': 'Review',
      'Closing': 'Closure'
    };

    return {
      id: project.id,
      projectId: project.projectId,
      title: project.title,
      status: statusMap[project.status],
      currentPhase: phaseMap[project.currentPhase],
      completionPercentage: project.completionPercentage,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      principalInvestigator: project.principalInvestigator,
      department: project.department,
    };
  };

  // --- Render Helpers ---
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return '#10b981'; // Emerald
      case 'Completed': return '#2563eb'; // Blue
      case 'On Hold': return '#d97706'; // Amber
      case 'At Risk': return '#dc2626'; // Red
      case 'Planning': return '#9333ea'; // Purple
      default: return '#64748b';
    }
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const renderStatCard = (title: string, value: string | number, Icon: any, color: string, trend: string) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.trendText}>{trend}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderProjectItem = ({ item }: { item: Project }) => {
    const days = getDaysRemaining(item.endDate);
    const isOverdue = days < 0 && item.completionPercentage < 100;

    return (
      <TouchableOpacity 
        style={styles.projectCard} 
        onPress={() => openProject(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.projectTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <User size={14} color="#64748b" />
          <Text style={styles.metaText}>{item.principalInvestigator}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.metaText}>{item.department}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${item.completionPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{item.completionPercentage}%</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dateInfo}>
            {isOverdue ? (
              <AlertCircle size={14} color="#dc2626" />
            ) : (
              <Clock size={14} color="#64748b" />
            )}
            <Text style={[
              styles.dateText, 
              isOverdue && { color: '#dc2626' }
            ]}>
              {Math.abs(days)} days {isOverdue ? 'overdue' : 'left'}
            </Text>
          </View>
          <Text style={styles.idText}>{item.projectId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>R&D Project Monitoring</Text>
        <Text style={styles.headerSubtitle}>Track research & development</Text>
      </View>

      <ScrollView 
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Stats Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={styles.statsRow}>
            {renderStatCard('Total Projects', projects.length, FileText, '#3b82f6', '+12%')}
            {renderStatCard('Active', getStatusCount('Active'), Target, '#10b981', '+8%')}
            {renderStatCard('Budget', `₱${(getTotalBudget()/1000000).toFixed(1)}M`, DollarSign, '#a855f7', '+20%')}
            {renderStatCard('Avg Comp.', `${getAverageCompletion()}%`, TrendingUp, '#06b6d4', '+3%')}
          </View>
        </ScrollView>

        {/* Search & Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Search size={20} color="#94a3b8" />
            <TextInput 
              style={styles.input}
              placeholder="Search projects..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {['All', 'Active', 'Completed', 'On Hold', 'At Risk', 'Planning'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.activeChip
                ]}
                onPress={() => setStatusFilter(status as ProjectStatus | 'All')}
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

        {/* List Header */}
        <View style={styles.listHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BarChart3 size={20} color={THEME_COLOR} />
            <Text style={styles.listTitle}> Projects List</Text>
          </View>
          <Text style={styles.countText}>{filteredProjects.length} found</Text>
        </View>

        {/* Projects List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading projects...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={item => item.id}
            renderItem={renderProjectItem}
            scrollEnabled={false} // Since we are inside a ScrollView
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FileText size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No projects found</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Detail Modal */}
      <RnDProjectDetailModal
        project={selectedProject ? mapProjectToModal(selectedProject) : null}
        isOpen={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedProject(null);
        }}
        getDaysRemaining={getDaysRemaining}
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
    backgroundColor: '#f8fafc', // slate-50
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
  // Stats
  statsScroll: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 32, 
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  // Filters
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  // List
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
  // Project Card
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  idText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
});