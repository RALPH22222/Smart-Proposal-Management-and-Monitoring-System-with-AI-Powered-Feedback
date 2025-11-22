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
  FileText,
  CheckCircle,
  RefreshCw,
  Bell,
} from 'lucide-react-native';

// NOTE: 'Settings' and 'Logout' are typically moved to a side drawer 
// (accessed via a top-left avatar) in this layout style, so they are excluded 
// from the bottom bar to prevent overcrowding.

const ACCENT_COLOR = '#C10003';
const INACTIVE_COLOR = '#657786'; // X (Twitter) uses a slate grey for inactive

interface NavItem {
  route: string;
  icon: any;
  badge?: string;
}

const BottomNavBar = ({ activeRoute = 'Dashboard', onNavigate }: { activeRoute?: string, onNavigate?: (route: string) => void }) => {
  const [currentRoute, setCurrentRoute] = useState(activeRoute);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    if (onNavigate) onNavigate(route);
  };

  const navLinks: NavItem[] = [
    { route: 'Dashboard', icon: LayoutDashboard }, // Home equivalent
    { route: 'Proposals', icon: FileText },        // Search/Explore equivalent
    { route: 'UnderReview', icon: RefreshCw },     // Grok/Communities equivalent
    { route: 'Completed', icon: CheckCircle },     // Spaces/Lists equivalent
    { route: 'Notifications', icon: Bell, badge: '4' }, // Notifications
  ];

  return (
    <View style={styles.wrapper}>
      {/* In a real implementation, this component sits inside a navigation container.
        For this demo, we wrap it in a View that positions it at the bottom.
      */}
      
      <View style={styles.container}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={styles.tabButton}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={26}
                  color={isActive ? ACCENT_COLOR : INACTIVE_COLOR}
                  // X makes active icons slightly bolder or filled
                  strokeWidth={isActive ? 3 : 2} 
                />
                
                {/* Notification Dot / Badge */}
                {item.badge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* X does not use labels in the bottom bar, but if you wanted them: */}
              {/* <Text style={styles.label}>{item.route}</Text> */}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Handle iOS Home Indicator Area */}
      <SafeAreaView style={{ backgroundColor: '#fff' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // In a real app, this wrapper might not be needed if the TabNavigator handles positioning
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#EFF3F4', // Light grey border like X
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 4,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Evenly space the 5 icons
    alignItems: 'center',
    height: 56, // Standard mobile navbar height
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    padding: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff', // White ring around badge for contrast
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BottomNavBar;