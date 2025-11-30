import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavigation from '../../../components/users/rnd/BottomNavigation';
import { 
  TrendingUp, 
  FileText, 
  Clock, 
  Send, 
  XCircle, 
  RotateCcw, 
  CheckCircle, 
  User,
  Bell
} from 'lucide-react-native';

// Mock Data Interfaces
interface Activity {
  id: string;
  type: 'review' | 'submission' | 'revision';
  action: string;
  proposalTitle: string;
  user: string;
  timestamp: string;
}

interface MonthlySubmission {
  month: string;
  count: number;
}

interface Statistics {
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  revisionRequiredProposals: number;
  monthlySubmissions: MonthlySubmission[];
}

export default function RndDashboard() {
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
    return routeMap[routeName] || 'dashboard';
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
        // TODO: Create RndSettings page or navigate to a placeholder
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
                // TODO: Clear auth state/tokens here
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

  // Mock Data
  const statistics: Statistics = {
    totalProposals: 142,
    pendingProposals: 28,
    acceptedProposals: 85,
    rejectedProposals: 12,
    revisionRequiredProposals: 17,
    monthlySubmissions: [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 38 },
      { month: 'Apr', count: 65 },
      { month: 'May', count: 48 },
      { month: 'Jun', count: 60 },
    ]
  };

  const recentActivity: Activity[] = [
    { id: '1', type: 'submission', action: 'New Proposal', proposalTitle: 'AI Integration in workflows', user: 'Dr. Smith', timestamp: new Date().toISOString() },
    { id: '2', type: 'review', action: 'Review Completed', proposalTitle: 'Sustainable Energy Project', user: 'Jane Doe', timestamp: new Date().toISOString() },
    { id: '3', type: 'revision', action: 'Revision Requested', proposalTitle: 'Quantum Computing Study', user: 'Admin', timestamp: new Date().toISOString() },
    { id: '4', type: 'submission', action: 'New Proposal', proposalTitle: 'Cloud Infrastructure Upgrade', user: 'John Lee', timestamp: new Date().toISOString() },
    { id: '5', type: 'review', action: 'Review Completed', proposalTitle: 'Mobile App Refactor', user: 'Sarah Connor', timestamp: new Date().toISOString() },
  ];

  // Helper Configuration
  const statCards = [
    { title: 'Total Proposals', value: statistics.totalProposals, icon: FileText, color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe', trend: '+5%' },
    { title: 'Pending Review', value: statistics.pendingProposals, icon: Clock, color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7', trend: '+12%' },
    { title: 'Forwarded', value: statistics.acceptedProposals, icon: Send, color: '#10b981', bg: '#ecfdf5', border: '#d1fae5', trend: '+8%' },
    { title: 'Rejected', value: statistics.rejectedProposals, icon: XCircle, color: '#ef4444', bg: '#fef2f2', border: '#fee2e2', trend: '-3%' },
    { title: 'Need Revision', value: statistics.revisionRequiredProposals, icon: RotateCcw, color: '#f97316', bg: '#fff7ed', border: '#ffedd5', trend: '+2%' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'review': return CheckCircle;
      case 'submission': return FileText;
      case 'revision': return RotateCcw;
      default: return FileText;
    }
  };

  const getActivityStyles = (type: string) => {
    switch (type) {
      case 'review': return { icon: '#10b981', bg: '#d1fae5' };
      case 'submission': return { icon: '#3b82f6', bg: '#dbeafe' };
      case 'revision': return { icon: '#f97316', bg: '#ffedd5' };
      default: return { icon: '#64748b', bg: '#f1f5f9' };
    }
  };

  const maxChartValue = Math.max(...statistics.monthlySubmissions.map((m) => m.count));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          {/* Header - Placed inside ScrollView so it scrolls with the content */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>R&D Dashboard</Text>
              <Text style={styles.headerSubtitle}>Proposal Management</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.statCard, { backgroundColor: stat.bg, borderColor: stat.border }]}
                  activeOpacity={0.7}
                >
                  <View style={styles.statHeader}>
                    <IconComponent size={20} color={stat.color} />
                    <View style={styles.trendBadge}>
                      <TrendingUp size={12} color="#64748b" />
                      <Text style={styles.trendText}>{stat.trend}</Text>
                    </View>
                  </View>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chart Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color="#C8102E" />
              <Text style={styles.sectionTitle}>Monthly Submissions</Text>
            </View>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartArea}>
                {/* Grid Lines */}
                <View style={styles.gridLines}>
                  {[...Array(4)].map((_, i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>

                {/* Bars */}
                <View style={styles.barsContainer}>
                  {statistics.monthlySubmissions.map((month) => {
                    const heightPercentage = maxChartValue > 0 ? (month.count / maxChartValue) * 100 : 0;
                    return (
                      <View key={month.month} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View 
                            style={[styles.barFill, { height: `${heightPercentage}%` }]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{month.month}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <Text style={styles.chartStatLabel}>TOTAL</Text>
                <Text style={styles.chartStatValue}>
                  {statistics.monthlySubmissions.reduce((a, b) => a + b.count, 0)}
                </Text>
              </View>
              <View style={[styles.chartStatItem, styles.borderLeft]}>
                 <Text style={styles.chartStatLabel}>PEAK</Text>
                 <Text style={styles.chartStatValue}>{maxChartValue}</Text>
              </View>
              <View style={[styles.chartStatItem, styles.borderLeft]}>
                 <Text style={styles.chartStatLabel}>AVG</Text>
                 <Text style={styles.chartStatValue}>
                   {Math.round(statistics.monthlySubmissions.reduce((a, b) => a + b.count, 0) / statistics.monthlySubmissions.length)}
                 </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={[styles.sectionCard, styles.lastSection]}>
             <View style={styles.sectionHeader}>
              <CheckCircle size={18} color="#C8102E" />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>

            <View style={styles.activityList}>
              {recentActivity.slice(0, 5).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const theme = getActivityStyles(activity.type);
                
                return (
                  <TouchableOpacity key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityIconBox, { backgroundColor: theme.bg }]}>
                      <Icon size={16} color={theme.icon} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityAction} numberOfLines={1}>{activity.action}</Text>
                      <Text style={styles.activityProposal} numberOfLines={1}>{activity.proposalTitle}</Text>
                      <View style={styles.activityMeta}>
                        <User size={12} color="#94a3b8" />
                        <Text style={styles.activityMetaText}>{activity.user}</Text>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.activityMetaText}>
                          {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
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
  iconButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },

  // Chart
  chartContainer: {
    padding: 16,
    height: 220,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    bottom: 24,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    height: '85%',
    width: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#C8102E',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
  },
  chartStats: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chartStatItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  chartStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  chartStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Recent Activity
  activityList: {
    padding: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 12,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityProposal: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  bullet: {
    fontSize: 11,
    color: '#94a3b8',
  },
});