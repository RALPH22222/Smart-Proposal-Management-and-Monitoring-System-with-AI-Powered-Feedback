import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Cpu,
  Shield,
  ArrowRight,
  UserCircle2
} from "lucide-react-native";

export default function AdminDashboard() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard':
        navigation.navigate('AdminDashboard' as any);
        break;
      case 'Accounts':
        navigation.navigate('AdminAccounts' as any);
        break;
      case 'Contents':
        navigation.navigate('AdminContents' as any);
        break;
      case 'Reports':
        navigation.navigate('AdminReports' as any);
        break;
      case 'System':
        navigation.navigate('AdminSystem' as any);
        break;
      default:
        break;
    }
  };

  // Helper to map tailwind color names to hex codes for RN
  const getThemeColors = (colorType: string) => {
    switch (colorType) {
      case 'blue': return { text: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'purple': return { text: '#A855F7', bg: '#FAF5FF', border: '#E9D5FF' };
      case 'emerald': return { text: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'amber': return { text: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' };
      case 'red': return { text: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
      default: return { text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
    }
  };

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: 1284,
      theme: "blue",
    },
    {
      icon: FileText,
      label: "Total Proposals",
      value: 1560,
      theme: "purple",
    },
    {
      icon: Cpu,
      label: "System Uptime",
      value: "99.8%",
      theme: "emerald",
    },
  ];

  const systemMetrics = [
    { id: 1, metric: "Active Sessions", value: "284", trend: "+12%", status: "up" },
    { id: 2, metric: "Avg Response", value: "2.3 days", trend: "-0.5d", status: "up" },
    { id: 3, metric: "Server Load", value: "45%", trend: "+8%", status: "warning" },
    { id: 4, metric: "DB Queries", value: "1.2k/min", trend: "Stable", status: "stable" },
  ];

  const userActivity = [
    { id: 1, role: "Proponents", active: 450, total: 650, percentage: "69%" },
    { id: 2, role: "Evaluators", active: 38, total: 45, percentage: "84%" },
    { id: 3, role: "R&D Staff", active: 12, total: 15, percentage: "80%" },
    { id: 4, role: "Admins", active: 3, total: 5, percentage: "60%" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>System overview and performance metrics</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('AdminSettings')}
            accessibilityRole="button"
            accessibilityLabel="Open admin settings"
          >
            <UserCircle2 size={32} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const colors = getThemeColors(stat.theme);
              const IconComponent = stat.icon;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.statCard, 
                    { backgroundColor: colors.bg, borderColor: colors.border }
                  ]}
                >
                  <View style={styles.statHeader}>
                    <IconComponent size={24} color={colors.text} />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* System Metrics List (Replaces Table) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Activity size={20} color="#C8102E" />
              <Text style={styles.cardTitle}>Performance Metrics</Text>
            </View>
            <View style={styles.badge}>
              <BarChart3 size={12} color="#64748B" />
              <Text style={styles.badgeText}>Real-time</Text>
            </View>
          </View>

          <View style={styles.listContainer}>
            {systemMetrics.map((metric) => {
               const statusColor = metric.status === 'up' ? '#10B981' : metric.status === 'warning' ? '#F59E0B' : '#3B82F6';
               const statusBg = metric.status === 'up' ? '#ECFDF5' : metric.status === 'warning' ? '#FFFBEB' : '#EFF6FF';
               
               return (
                <View key={metric.id} style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricName}>{metric.metric}</Text>
                  </View>
                  <View style={styles.metricValues}>
                    <Text style={styles.metricValueText}>{metric.value}</Text>
                    <View style={[styles.trendBadge, { backgroundColor: statusBg, borderColor: statusColor + '40' }]}>
                      <Text style={[styles.trendText, { color: statusColor }]}>{metric.trend}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Quick Action Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('SystemDetails' as any)} // Adjust route name as needed
          >
            <Text style={styles.actionButtonText}>System Details</Text>
            <ArrowRight size={16} color="#C8102E" />
          </TouchableOpacity>

          {/* Performance Summary Grid */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>99.8%</Text>
              <Text style={styles.summaryLabel}>Uptime</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryBorder]}>
              <Text style={[styles.summaryValue, { color: '#D97706' }]}>45%</Text>
              <Text style={styles.summaryLabel}>Load Avg</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#2563EB' }]}>2.3s</Text>
              <Text style={styles.summaryLabel}>Response</Text>
            </View>
          </View>
        </View>

        {/* System Status Section */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Shield size={20} color="#C8102E" />
              <Text style={styles.cardTitle}>System Status</Text>
            </View>
          </View>

          <View style={styles.statusList}>
             {/* Active Users */}
             <View style={[styles.statusItem, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={styles.statusItemLeft}>
                  <Users size={20} color="#3B82F6" />
                  <Text style={[styles.statusLabel, { color: '#1D4ED8' }]}>Active Users</Text>
                </View>
                <Text style={[styles.statusValue, { color: '#1D4ED8' }]}>284</Text>
             </View>

             {/* System Health */}
             <View style={[styles.statusItem, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <View style={styles.statusItemLeft}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={[styles.statusLabel, { color: '#047857' }]}>Health</Text>
                </View>
                <Text style={[styles.statusValue, { color: '#047857' }]}>99.8%</Text>
             </View>

             {/* Pending Tasks */}
             <View style={[styles.statusItem, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <View style={styles.statusItemLeft}>
                  <Clock size={20} color="#F59E0B" />
                  <Text style={[styles.statusLabel, { color: '#B45309' }]}>Pending</Text>
                </View>
                <Text style={[styles.statusValue, { color: '#B45309' }]}>12</Text>
             </View>
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.activityHeader}>User Activity by Role</Text>
            {userActivity.map((user) => {
              const pct = parseInt(user.percentage);
              const badgeBg = pct > 80 ? '#D1FAE5' : pct > 60 ? '#FEF3C7' : '#FEE2E2';
              const badgeText = pct > 80 ? '#065F46' : pct > 60 ? '#92400E' : '#991B1B';
              
              return (
                <View key={user.id} style={styles.activityRow}>
                  <Text style={styles.activityRole}>{user.role}</Text>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityCount}>{user.active}/{user.total}</Text>
                    <View style={[styles.pctBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.pctText, { color: badgeText }]}>{user.percentage}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 20 }} /> 
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <AdminNavBar 
        activeRoute="Dashboard"
        onNavigate={handleNavigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // slate-50
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  profileButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // slate-600
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 1, 
    height: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '100%', // Mobile vertical stack or use '48%' for grid
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B', // slate-800
  },
  
  // Card Container (used for Metrics and System Status)
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Metrics List Styles
  listContainer: {
    paddingHorizontal: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricValues: {
    alignItems: 'flex-end',
  },
  metricValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Action Button
  actionButton: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C8102E',
  },

  // Performance Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8FAFC', // approximating gradient
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
  },

  // System Status Styles
  statusList: {
    padding: 16,
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Activity Section
  activitySection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  activityHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityRole: {
    fontSize: 12,
    color: '#475569',
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '700',
  },
});