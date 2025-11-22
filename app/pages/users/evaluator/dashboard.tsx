import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavBar from '../../../components/users/evaluator/navbar';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';

export default function EvaluatorDashboard() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    // Handle navigation based on route
    // You can add navigation logic here
    switch (route) {
      case 'Dashboard':
        // Already on dashboard
        break;
      case 'Proposals':
        // navigation.navigate('Proposals');
        break;
      case 'UnderReview':
        // navigation.navigate('UnderReview');
        break;
      case 'Completed':
        // navigation.navigate('Completed');
        break;
      case 'Notifications':
        // navigation.navigate('Notifications');
        break;
      default:
        break;
    }
  };

  // --- Data ---
  const stats = [
    {
      icon: Clock,
      label: "Pending",
      value: 100,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
    },
    {
      icon: XCircle,
      label: "Rejected",
      value: 12,
      color: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FECACA",
    },
    {
      icon: CheckCircle,
      label: "Reviewed",
      value: 45,
      color: "#10B981",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    },
  ];

  const proposals = [
    {
      id: 1,
      title: "AI Research on Education",
      proponent: "John Doe",
      date: "Sept 21, 2025",
      priority: "High",
    },
    {
      id: 2,
      title: "Sustainable Farming Proposal",
      proponent: "Jane Smith",
      date: "Sept 19, 2025",
      priority: "Medium",
    },
    {
      id: 3,
      title: "Blockchain in Healthcare",
      proponent: "Michael Lee",
      date: "Sept 15, 2025",
      priority: "Low",
    },
    {
      id: 4,
      title: "Renewable Energy Infrastructure",
      proponent: "Sarah Wilson",
      date: "Sept 12, 2025",
      priority: "High",
    },
    {
      id: 5,
      title: "Digital Transformation Initiative",
      proponent: "David Chen",
      date: "Sept 10, 2025",
      priority: "Medium",
    },
  ];

  // --- Helper Components ---

  const StatCard = ({ item }: { item: any }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        style={[
          styles.statCard,
          { backgroundColor: item.bgColor, borderColor: item.borderColor },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.statHeader}>
          <IconComponent color={item.color} size={24} />
        </View>
        <Text style={styles.statLabel}>{item.label}</Text>
        <Text style={styles.statValue}>{item.value}</Text>
      </TouchableOpacity>
    );
  };

  const ProposalCard = ({ item }: { item: any }) => (
    <View style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>#{item.id}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      
      <Text style={styles.proposalTitle} numberOfLines={2}>
        {item.title}
      </Text>
      
      <View style={styles.proposalFooter}>
        <Text style={styles.proponentText}>by {item.proponent}</Text>
        <View style={[styles.priorityBadge, 
          item.priority === 'High' ? styles.bgRed : 
          item.priority === 'Medium' ? styles.bgAmber : styles.bgBlue
        ]}>
          <Text style={[styles.priorityText,
             item.priority === 'High' ? styles.textRed : 
             item.priority === 'Medium' ? styles.textAmber : styles.textBlue
          ]}>{item.priority}</Text>
        </View>
      </View>
    </View>
  );

  const StatusRow = ({ icon: Icon, label, value, color, bg, border }: any) => (
    <View style={[styles.statusRow, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.statusRowLeft}>
        <Icon size={20} color={color} />
        <Text style={[styles.statusRowLabel, { color: color }]}>{label}</Text>
      </View>
      <Text style={[styles.statusRowValue, { color: color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Simple Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Evaluator Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Welcome Section */}
          <View style={styles.section}>
            <Text style={styles.welcomeTitle}>Evaluator Dashboard</Text>
            <Text style={styles.welcomeSub}>Welcome back! Heres an overview.</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.gridItem}>
                <StatCard item={stat} />
              </View>
            ))}
          </View>

          {/* Review Status Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#C8102E" />
              <Text style={styles.sectionTitle}>Review Status</Text>
            </View>
            
            <View style={styles.statusList}>
              <StatusRow 
                icon={Clock} label="Pending" value="28" 
                color="#B45309" bg="#FFFBEB" border="#FDE68A" 
              />
              <StatusRow 
                icon={AlertCircle} label="Under Review" value="15" 
                color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" 
              />
              <StatusRow 
                icon={CheckCircle} label="Reviewed" value="45" 
                color="#059669" bg="#ECFDF5" border="#A7F3D0" 
              />
            </View>

            <View style={styles.activitySummary}>
              <Text style={styles.activityTitle}>Daily Activity</Text>
              <View style={styles.activityRow}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.activityText}>8 reviewed today</Text>
              </View>
               <View style={styles.activityRow}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.activityText}>12 under review</Text>
              </View>
            </View>
          </View>

          {/* Recent Proposals Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#C8102E" />
              <Text style={styles.sectionTitle}>Recent Proposals</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{proposals.length}</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} item={proposal} />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                // Example navigation usage
                // navigation.navigate('ProposalsList'); 
              }}
            >
              <Text style={styles.viewAllText}>View All Proposals</Text>
              <ChevronRight size={16} color="#C8102E" />
            </TouchableOpacity>
          </View>

          {/* Bottom Stats */}
          <View style={styles.bottomStats}>
            <View style={styles.bottomStatItem}>
              <Text style={[styles.bottomStatValue, { color: '#059669' }]}>24</Text>
              <Text style={styles.bottomStatLabel}>Month</Text>
            </View>
            <View style={[styles.bottomStatItem, styles.borderSides]}>
              <Text style={[styles.bottomStatValue, { color: '#D97706' }]}>8</Text>
              <Text style={styles.bottomStatLabel}>Week</Text>
            </View>
            <View style={styles.bottomStatItem}>
              <Text style={[styles.bottomStatValue, { color: '#2563EB' }]}>3</Text>
              <Text style={styles.bottomStatLabel}>Today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar 
        activeRoute="Dashboard" 
        onNavigate={handleNavigate}
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
    flex: 1,
    padding: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C8102E',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#64748B',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
    minWidth: 150,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statHeader: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  // Section Containers
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  statusList: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activitySummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  activityText: {
    fontSize: 12,
    color: '#64748B',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  listContainer: {
    marginBottom: 12,
  },
  proposalCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  idText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  proposalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proponentText: {
    fontSize: 12,
    color: '#64748B',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bgRed: { backgroundColor: '#FEF2F2' },
  textRed: { color: '#EF4444' },
  bgAmber: { backgroundColor: '#FFFBEB' },
  textAmber: { color: '#F59E0B' },
  bgBlue: { backgroundColor: '#EFF6FF' },
  textBlue: { color: '#3B82F6' },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8102E',
  },
  bottomStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  borderSides: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bottomStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
});
