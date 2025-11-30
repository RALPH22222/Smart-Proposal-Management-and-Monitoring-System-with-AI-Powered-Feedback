import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TouchableWithoutFeedback,
  Platform,
  SafeAreaView
} from 'react-native';
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckCircle,
  BarChart3,
  Settings,
  LogOut,
  MoreHorizontal,
  X
} from 'lucide-react-native';

// --- Types ---
interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  statistics?: Statistics; 
}

// --- Constants ---
const ACCENT_COLOR = "#C10003";
const ICON_SIZE = 24;

const BottomNavigation: React.FC<BottomNavProps> = ({ 
  currentPage, 
  onPageChange 
}) => {
  const [isMoreMenuVisible, setMoreMenuVisible] = useState(false);

  // All available navigation items
  const allItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'evaluators', label: 'Evaluators', icon: Users },
    { id: 'endorsements', label: 'Endorsements', icon: CheckCircle },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  // Logic: Show first 4 items directly, put the rest in "More"
  const VISIBLE_COUNT = 4;
  const primaryItems = allItems.slice(0, VISIBLE_COUNT);
  const secondaryItems = allItems.slice(VISIBLE_COUNT);

  const handleNavigation = (id: string) => {
    onPageChange(id);
    setMoreMenuVisible(false);
  };

  const isMoreActive = secondaryItems.some(item => item.id === currentPage);

  // Helper to render a single tab button
  const renderTabItem = (item: typeof allItems[0], isSelected: boolean) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.tabItem}
        onPress={() => handleNavigation(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, isSelected && styles.activeIconContainer]}>
          <Icon 
            size={ICON_SIZE} 
            color={isSelected ? ACCENT_COLOR : '#9CA3AF'} 
            strokeWidth={isSelected ? 2.5 : 2}
          />
        </View>
        <Text style={[styles.tabLabel, isSelected && styles.activeTabLabel]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* --- MORE MENU MODAL --- */}
      <Modal
        transparent={true}
        visible={isMoreMenuVisible}
        animationType="fade"
        onRequestClose={() => setMoreMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMoreMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>More Options</Text>
                  <TouchableOpacity 
                    onPress={() => setMoreMenuVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.menuGrid}>
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const isLogout = item.id === 'logout';
                    
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.menuItem, 
                          isActive && styles.activeMenuItem,
                          isLogout && styles.logoutItem
                        ]}
                        onPress={() => handleNavigation(item.id)}
                      >
                        <View style={[
                          styles.menuIconBadge, 
                          isActive && { backgroundColor: '#FEF2F2' },
                          isLogout && { backgroundColor: '#FEF2F2' }
                        ]}>
                          <Icon 
                            size={24} 
                            color={isLogout ? '#DC2626' : (isActive ? ACCENT_COLOR : '#4B5563')} 
                          />
                        </View>
                        <Text style={[
                          styles.menuItemText, 
                          isActive && styles.activeMenuText,
                          isLogout && styles.logoutText
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- BOTTOM BAR --- */}
      <SafeAreaView style={styles.barContainer}>
        <View style={styles.barContent}>
          
          {/* Render Primary 4 Items */}
          {primaryItems.map((item) => renderTabItem(item, currentPage === item.id))}

          {/* Render "More" Button */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setMoreMenuVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, (isMoreActive || isMoreMenuVisible) && styles.activeIconContainer]}>
              <MoreHorizontal 
                size={ICON_SIZE} 
                color={(isMoreActive || isMoreMenuVisible) ? ACCENT_COLOR : '#9CA3AF'} 
                strokeWidth={(isMoreActive || isMoreMenuVisible) ? 2.5 : 2}
              />
            </View>
            <Text style={[styles.tabLabel, (isMoreActive || isMoreMenuVisible) && styles.activeTabLabel]}>
              More
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container wrapper
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 50,
  },
  
  // The Main Bottom Bar
  barContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  barContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 12, 
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: '#FEF2F2',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabLabel: {
    color: ACCENT_COLOR,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeMenuItem: {
    backgroundColor: 'white',
    borderColor: '#FECACA',
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutItem: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  menuIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  activeMenuText: {
    color: ACCENT_COLOR,
  },
  logoutText: {
    color: '#DC2626',
  },
});

export default BottomNavigation;