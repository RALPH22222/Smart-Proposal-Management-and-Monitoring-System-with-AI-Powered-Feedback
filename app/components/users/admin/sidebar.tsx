import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
} from 'react-native';
import {
  LayoutDashboard, 
  Users,          
  FileText,        
  Bell, 
  Server,        
} from 'lucide-react-native';
const ACCENT_COLOR = '#C10003'; 
const INACTIVE_COLOR = '#687684';
const ACTIVE_STROKE_WIDTH = 3;  
const INACTIVE_STROKE_WIDTH = 2; 

interface NavItem {
  route: string;
  icon: any;
  badge?: string;
}

const AdminNavBar = ({ activeRoute = 'Dashboard', onNavigate }: { activeRoute?: string, onNavigate?: (route: string) => void }) => {
  const [currentRoute, setCurrentRoute] = useState(activeRoute);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    if (onNavigate) onNavigate(route);
  };

  const navLinks: NavItem[] = [
    { route: 'Dashboard', icon: LayoutDashboard },
    { route: 'Accounts', icon: Users },
    { route: 'Contents', icon: FileText },
    { route: 'Reports', icon: Bell, badge: '5' },
    { route: 'System', icon: Server },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={styles.tabButton}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7} // Subtle touch feedback
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  size={26} // Standard X icon size
                  color={isActive ? ACCENT_COLOR : INACTIVE_COLOR}
                  strokeWidth={isActive ? ACTIVE_STROKE_WIDTH : INACTIVE_STROKE_WIDTH}
                />
                
                {/* Notification Badge - X Style (Pill shaped) */}
                {item.badge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* iOS Home Indicator Safe Area - White background to blend */}
      <SafeAreaView style={styles.safeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#ffffff',
    // X Style: No shadow, just a hairline border
    borderTopWidth: 0.5,
    borderTopColor: '#EFF3F4', 
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Spread icons evenly
    alignItems: 'center',
    height: 52, // Compact height typical of modern social apps
    paddingHorizontal: 24, // Side padding to prevent icons from touching edges
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    position: 'relative',
    padding: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff', // White ring makes the badge pop
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: '#ffffff',
  },
});

export default AdminNavBar;