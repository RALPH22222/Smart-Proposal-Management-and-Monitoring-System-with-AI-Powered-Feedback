import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavBar from '../../../components/users/evaluator/navbar';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  success: {
    icon: CheckCircle,
    bg: "#ECFDF5", // green-50
    color: "#16A34A", // green-600
    border: "#16A34A",
  },
  warning: {
    icon: AlertTriangle,
    bg: "#FEFCE8", // yellow-50
    color: "#CA8A04", // yellow-600
    border: "#CA8A04",
  },
};

const categoryIcons: Record<string, any> = {
  "Funding Accepted": DollarSign,
  "Funding Approved": Users,
  "Funding Rejected": Trash2,
};

export default function EvaluatorNotifications() {
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Slightly more items per page on mobile list

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "AI-Powered Educational Assessment System",
      time: "30m ago",
      type: "success",
      read: false,
      description: "Evaluator-endorsed proposal by Jasmine Anderson has been ACCEPTED for funding consideration.",
      category: "Funding Accepted",
    },
    {
      id: 2,
      text: "Sustainable Agriculture IoT Network",
      time: "1h ago",
      type: "success",
      read: false,
      description: "Evaluator-endorsed proposal by Michael Chen has been FUNDED and approved for implementation.",
      category: "Funding Approved",
    },
    {
      id: 3,
      text: "Blockchain Healthcare Records System",
      time: "2h ago",
      type: "warning",
      read: false,
      description: "Evaluator-endorsed proposal by Emily Rodriguez has been REJECTED. Reason: Security compliance concerns.",
      category: "Funding Rejected",
    },
    {
      id: 4,
      text: "Renewable Energy Storage Optimization",
      time: "4h ago",
      type: "success",
      read: true,
      description: "Evaluator-endorsed proposal by James Wilson has been ACCEPTED for funding consideration.",
      category: "Funding Accepted",
    },
    {
      id: 5,
      text: "Marine Biodiversity Conservation Platform",
      time: "6h ago",
      type: "success",
      read: true,
      description: "Evaluator-endorsed proposal by Maria Santos has been FUNDED and approved for implementation.",
      category: "Funding Approved",
    },
    {
      id: 6,
      text: "Smart Traffic Management System",
      time: "8h ago",
      type: "warning",
      read: false,
      description: "Evaluator-endorsed proposal by Robert Kim has been REJECTED. Reason: Budget allocation constraints.",
      category: "Funding Rejected",
    },
    {
      id: 7,
      text: "Advanced Materials Research",
      time: "1d ago",
      type: "warning",
      read: true,
      description: "Evaluator-endorsed proposal has been REJECTED. Reason: Overlapping with existing projects.",
      category: "Funding Rejected",
    },
    {
      id: 8,
      text: "Climate Change Modeling",
      time: "2d ago",
      type: "success",
      read: true,
      description: "Evaluator-endorsed proposal has been APPROVED for implementation.",
      category: "Funding Approved",
    },
  ]);

  // --- Logic ---
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => setNotifications((prev) => prev.filter((n) => n.id !== id)) 
      }
    ]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = notifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Bell size={24} color="#C8102E" />
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Updates on your reviewed proposals.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Quick Actions */}
        {unreadCount > 0 && (
          <View style={styles.quickActionCard}>
            <View style={styles.quickActionRow}>
              <View style={styles.quickActionInfo}>
                <TrendingUp size={16} color="#475569" />
                <Text style={styles.quickActionText}>
                  You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                <Text style={styles.markAllBtnText}>Mark all read</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <Info size={18} color="#C8102E" />
              <Text style={styles.listHeaderTitle}>Recent Updates</Text>
            </View>
            <Text style={styles.totalCount}>{notifications.length} total</Text>
          </View>

          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.success;
              const IconComponent = config.icon;
              const CategoryIcon = categoryIcons[notification.category] || Info;

              return (
                <View 
                  key={notification.id} 
                  style={[
                    styles.card, 
                    !notification.read && styles.cardUnread
                  ]}
                >
                  {/* Unread Indicator Dot */}
                  {!notification.read && <View style={styles.unreadDot} />}

                  <View style={styles.cardContent}>
                    {/* Icon Column */}
                    <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                      <IconComponent size={16} color={config.color} />
                    </View>

                    {/* Text Column */}
                    <View style={styles.textContent}>
                      <View style={styles.metaRow}>
                        <View style={[styles.categoryBadge, { borderColor: config.color + '40' }]}>
                           <CategoryIcon size={10} color={config.color} />
                           <Text style={[styles.categoryText, { color: config.color }]}>
                             {notification.category}
                           </Text>
                        </View>
                        <Text style={styles.timeText}>{notification.time}</Text>
                      </View>

                      <Text 
                        style={[
                          styles.notificationTitle,
                          !notification.read && styles.textBold
                        ]}
                      >
                        {notification.text}
                      </Text>
                      
                      <Text style={styles.notificationDesc} numberOfLines={3}>
                        {notification.description}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Footer */}
                  <View style={styles.cardActions}>
                    {!notification.read && (
                      <TouchableOpacity 
                        style={styles.actionBtn} 
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Eye size={16} color="#2563EB" />
                        <Text style={[styles.actionText, { color: '#2563EB' }]}>Mark Read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={16} color="#DC2626" />
                      <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Bell size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySub}>You&apos;re all caught up!</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
           <Text style={styles.pageInfo}>
             Page {currentPage} of {totalPages || 1}
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
               disabled={currentPage === totalPages || totalPages === 0}
               onPress={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
               style={[styles.pageBtn, (currentPage === totalPages || totalPages === 0) && styles.pageBtnDisabled]}
             >
               <ChevronRight size={20} color={(currentPage === totalPages || totalPages === 0) ? "#CBD5E1" : "#475569"} />
             </TouchableOpacity>
           </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C8102E',
  },
  badge: {
    backgroundColor: '#C8102E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 32, // Align with title text
  },
  scrollContent: {
    padding: 16,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#64748B',
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C8102E',
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
  },
  totalCount: {
    fontSize: 12,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 16,
  },
  cardUnread: {
    backgroundColor: '#EFF6FF', // blue-50 equivalent
    borderColor: '#BFDBFE',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8102E',
    zIndex: 10,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  textContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notificationTitle: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 4,
    fontWeight: '500',
  },
  textBold: {
    fontWeight: '700',
  },
  notificationDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  actionText: {
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
});

