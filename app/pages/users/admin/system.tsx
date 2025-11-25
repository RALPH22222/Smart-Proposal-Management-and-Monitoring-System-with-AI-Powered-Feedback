import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar'; // Adjust path if needed
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  MemoryStick,
} from "lucide-react-native";

// Helper for dynamic colors
const COLORS = {
  emerald: { bg: '#ECFDF5', text: '#047857', main: '#10B981', border: '#D1FAE5' },
  amber: { bg: '#FFFBEB', text: '#B45309', main: '#F59E0B', border: '#FEF3C7' },
  red: { bg: '#FEF2F2', text: '#B91C1C', main: '#EF4444', border: '#FEE2E2' },
  slate: { bg: '#F1F5F9', text: '#475569', main: '#64748B', border: '#E2E8F0' },
  blue: { main: '#3B82F6' },
  purple: { main: '#A855F7' },
  orange: { main: '#F97316' },
  white: '#FFFFFF',
  primary: '#C8102E'
};

export default function AdminSystem() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy',
    lastUpdated: new Date().toISOString(),
    isRefreshing: false
  });

  const serverMetrics = [
    { id: 1, name: "Web Server", status: "running", cpu: 45, memory: 62, uptime: "15d 8h", responseTime: "120ms", color: "emerald" },
    { id: 2, name: "DB Server", status: "running", cpu: 28, memory: 45, uptime: "15d 8h", responseTime: "45ms", color: "emerald" },
    { id: 3, name: "File Storage", status: "warning", cpu: 15, memory: 78, uptime: "12d 3h", responseTime: "280ms", color: "amber" },
    { id: 4, name: "Cache Server", status: "running", cpu: 32, memory: 34, uptime: "8d 16h", responseTime: "15ms", color: "emerald" }
  ];

  const systemResources = [
    { id: 1, name: "CPU Usage", current: 45, max: 100, unit: "%", trend: "stable", icon: Cpu, color: "blue" },
    { id: 2, name: "Memory", current: 62, max: 100, unit: "%", trend: "increasing", icon: MemoryStick, color: "purple" },
    { id: 3, name: "Disk Space", current: 78, max: 100, unit: "%", trend: "stable", icon: HardDrive, color: "emerald" },
    { id: 4, name: "Network", current: 245, max: 1000, unit: "MB/s", trend: "decreasing", icon: Network, color: "orange" }
  ];

  const databaseMetrics = [
    { id: 1, metric: "Active Connections", value: "48", max: "100", status: "healthy" },
    { id: 2, metric: "Query Rate", value: "1,245", unit: "q/s", status: "healthy" },
    { id: 3, metric: "Cache Hit Rate", value: "94.2%", status: "excellent" },
    { id: 4, metric: "Replication Lag", value: "0.8s", status: "healthy" }
  ];

  const securityStatus = [
    { id: 1, check: "SSL Cert", status: "valid", expires: "2025-12-31", icon: Shield },
    { id: 2, check: "Firewall", status: "active", details: "All rules enforced", icon: Shield },
    { id: 3, check: "Rate Limit", status: "enabled", details: "1000 req/min", icon: Activity },
    { id: 4, check: "Backups", status: "active", details: "2 hours ago", icon: HardDrive }
  ];

  const recentEvents = [
    { id: 1, timestamp: "14:30", type: "info", message: "Backup completed", service: "Backup" },
    { id: 2, timestamp: "13:45", type: "warning", message: "High memory usage", service: "Monitor" },
    { id: 3, timestamp: "12:15", type: "info", message: "DB optimization done", service: "Database" },
    { id: 4, timestamp: "10:20", type: "info", message: "Security scan clear", service: "Security" }
  ];

  const refreshData = async () => {
    setSystemStatus(prev => ({ ...prev, isRefreshing: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSystemStatus({
      overall: 'healthy',
      lastUpdated: new Date().toISOString(),
      isRefreshing: false
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': case 'healthy': case 'valid': case 'active': case 'enabled': case 'excellent': return COLORS.emerald;
      case 'warning': return COLORS.amber;
      case 'error': case 'critical': return COLORS.red;
      default: return COLORS.slate;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': case 'healthy': case 'valid': case 'active': case 'enabled': case 'excellent': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': case 'critical': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard': navigation.navigate('AdminDashboard' as any); break;
      case 'Accounts': navigation.navigate('AdminAccounts' as any); break;
      case 'Contents': navigation.navigate('AdminContents' as any); break;
      case 'Reports': navigation.navigate('AdminReports' as any); break;
      case 'System': navigation.navigate('AdminSystem' as any); break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.titleRow}>
                 <Server size={24} color="#C8102E" />
                 <Text style={styles.title}>System Details</Text>
              </View>
              <Text style={styles.subtitle}>Monitoring & performance metrics</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshData}
              disabled={systemStatus.isRefreshing}
            >
              {systemStatus.isRefreshing ? (
                <ActivityIndicator size="small" color="#64748B" />
              ) : (
                <RefreshCw size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={[styles.statusBadge, { 
            backgroundColor: systemStatus.overall === 'healthy' ? COLORS.emerald.bg : COLORS.amber.bg,
            borderColor: systemStatus.overall === 'healthy' ? COLORS.emerald.border : COLORS.amber.border,
          }]}>
            <View style={[styles.statusDot, { 
              backgroundColor: systemStatus.overall === 'healthy' ? COLORS.emerald.main : COLORS.amber.main 
            }]} />
            <Text style={[styles.statusText, { 
              color: systemStatus.overall === 'healthy' ? COLORS.emerald.text : COLORS.amber.text 
            }]}>
              System {systemStatus.overall}
            </Text>
          </View>
        </View>

        {/* Server Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Server size={18} color="#C8102E" style={{ marginRight: 8 }} /> Server Status
          </Text>
          <View style={styles.gridContainer}>
            {serverMetrics.map((server) => {
              const StatusIcon = getStatusIcon(server.status);
              const colors = getStatusColor(server.status);
              return (
                <View key={server.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{server.name}</Text>
                    <StatusIcon size={16} color={colors.main} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.metricRow}><Text style={styles.metricLabel}>CPU</Text><Text style={styles.metricValue}>{server.cpu}%</Text></View>
                    <View style={styles.metricRow}><Text style={styles.metricLabel}>Mem</Text><Text style={styles.metricValue}>{server.memory}%</Text></View>
                    <View style={styles.metricRow}><Text style={styles.metricLabel}>Up</Text><Text style={styles.metricValue}>{server.uptime}</Text></View>
                    <View style={styles.metricRow}><Text style={styles.metricLabel}>Resp</Text><Text style={styles.metricValue}>{server.responseTime}</Text></View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Resources & Database Grid */}
        <View style={styles.twoColumnSection}>
            {/* System Resources */}
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                <Activity size={18} color="#C8102E" style={{ marginRight: 8 }} /> System Resources
              </Text>
              {systemResources.map((res) => {
                const Icon = res.icon;
                const progress = (res.current / res.max) * 100;
                // @ts-ignore - Indexing by string for simple demo
                const color = COLORS[res.color]?.main || COLORS.slate.main;
                return (
                  <View key={res.id} style={styles.resourceItem}>
                    <View style={styles.resourceHeader}>
                      <View style={styles.resourceLabel}>
                        <Icon size={14} color="#64748B" />
                        <Text style={styles.resourceName}>{res.name}</Text>
                      </View>
                      <Text style={styles.resourceValue}>{res.current}{res.unit}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Database Metrics */}
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                <Database size={18} color="#C8102E" style={{ marginRight: 8 }} /> Database
              </Text>
              {databaseMetrics.map((m) => {
                const colors = getStatusColor(m.status);
                return (
                  <View key={m.id} style={styles.dbRow}>
                    <Text style={styles.dbMetric}>{m.metric}</Text>
                    <View style={styles.dbValueContainer}>
                      <Text style={styles.dbValue}>{m.value} <Text style={styles.dbUnit}>{m.unit}</Text></Text>
                      <View style={[styles.statusDotSmall, { backgroundColor: colors.main }]} />
                    </View>
                  </View>
                );
              })}
            </View>
        </View>

        {/* Security & Events Grid */}
        <View style={styles.twoColumnSection}>
           {/* Security */}
           <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                <Shield size={18} color="#C8102E" style={{ marginRight: 8 }} /> Security
              </Text>
              {securityStatus.map((item) => {
                 const Icon = item.icon;
                 const StatusIcon = getStatusIcon(item.status);
                 const colors = getStatusColor(item.status);
                 return (
                   <View key={item.id} style={styles.securityRow}>
                     <View style={styles.securityLeft}>
                       <Icon size={16} color="#64748B" />
                       <View style={{marginLeft: 8}}>
                         <Text style={styles.securityCheck}>{item.check}</Text>
                         {item.details && <Text style={styles.securityDetails}>{item.details}</Text>}
                         {item.expires && <Text style={styles.securityDetails}>Exp: {item.expires}</Text>}
                       </View>
                     </View>
                     <StatusIcon size={16} color={colors.main} />
                   </View>
                 )
              })}
           </View>

           {/* Recent Events */}
           <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                <Activity size={18} color="#C8102E" style={{ marginRight: 8 }} /> Events
              </Text>
              {recentEvents.map((event) => {
                 const dotColor = event.type === 'info' ? COLORS.blue.main : event.type === 'warning' ? COLORS.amber.main : COLORS.red.main;
                 return (
                   <View key={event.id} style={styles.eventRow}>
                     <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                     <View style={{flex: 1}}>
                       <Text style={styles.eventMsg}>{event.message}</Text>
                       <View style={styles.eventMeta}>
                         <Text style={styles.eventTime}>{event.timestamp}</Text>
                         <Text style={styles.eventDotSep}>•</Text>
                         <Text style={styles.eventService}>{event.service}</Text>
                       </View>
                     </View>
                   </View>
                 )
              })}
           </View>
        </View>

        <Text style={styles.footerText}>
           Last updated: {new Date(systemStatus.lastUpdated).toLocaleTimeString()}
        </Text>
        
        {/* Spacer for Bottom Nav */}
        <View style={{ height: 80 }} /> 

      </ScrollView>

      <AdminNavBar 
        activeRoute="System"
        onNavigate={handleNavigate}
      />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Section Styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%', // roughly half width
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardBody: {
    gap: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },

  // Panels (Resources, DB, Security)
  twoColumnSection: {
    gap: 16,
    marginBottom: 16,
  },
  panel: {
    backgroundColor: 'white',
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
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  
  // Resources Items
  resourceItem: {
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resourceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  resourceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Database Items
  dbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dbMetric: {
    fontSize: 13,
    color: '#334155',
  },
  dbValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dbValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dbUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Security Items
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityCheck: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  securityDetails: {
    fontSize: 11,
    color: '#64748B',
  },

  // Events
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  eventMsg: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 11,
    color: '#64748B',
  },
  eventDotSep: {
    fontSize: 11,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  eventService: {
    fontSize: 11,
    color: '#64748B',
  },

  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },
});