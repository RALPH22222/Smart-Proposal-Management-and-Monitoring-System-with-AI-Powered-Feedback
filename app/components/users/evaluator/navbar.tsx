import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Animated,
} from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  RefreshCw,
  User,
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

// Map navigation route names to navbar route names
const routeMap: Record<string, string> = {
  'EvaluatorDashboard': 'Dashboard',
  'EvaluatorProposals': 'Proposals',
  'EvaluatorUnderReview': 'UnderReview',
  'EvaluatorCompleted': 'Completed',
  'EvaluatorSettings': 'Settings',
};

// Define nav links outside component for animation initialization
const navLinks: NavItem[] = [
  { route: 'Dashboard', icon: LayoutDashboard }, // Home equivalent
  { route: 'Proposals', icon: FileText },        // Search/Explore equivalent
  { route: 'UnderReview', icon: RefreshCw },     // Grok/Communities equivalent
  { route: 'Completed', icon: CheckCircle },     // Spaces/Lists equivalent
  { route: 'Settings', icon: User }, // Notifications
];

const BottomNavBar = ({ onNavigate }: { onNavigate?: (route: string) => void }) => {
  // Get current route from navigation state
  const currentRouteName = useNavigationState(state => {
    if (!state) return 'Dashboard';
    const route = state.routes[state.index];
    return route.name;
  });

  // Map navigation route to navbar route
  const currentRoute = routeMap[currentRouteName] || 'Dashboard';

  // Animation values for each tab - initialize with known routes
  const scaleAnims = React.useRef<Record<string, Animated.Value>>({
    'Dashboard': new Animated.Value(1),
    'Proposals': new Animated.Value(1),
    'UnderReview': new Animated.Value(1),
    'Completed': new Animated.Value(1),
    'Settings': new Animated.Value(1),
  }).current;

  // Reset animation when route changes
  useEffect(() => {
    Object.keys(scaleAnims).forEach((route) => {
      if (route !== currentRoute) {
        Animated.spring(scaleAnims[route], {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start();
      }
    });
  }, [currentRoute]);

  const handleNavigate = (route: string) => {
    // Animate button press
    Animated.sequence([
      Animated.spring(scaleAnims[route], {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scaleAnims[route], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();

    // Navigate after a brief delay for better UX
    setTimeout(() => {
      if (onNavigate) onNavigate(route);
    }, 100);
  };

  return (
    <View style={styles.wrapper}>
      {/* In a real implementation, this component sits inside a navigation container.
        For this demo, we wrap it in a View that positions it at the bottom.
      */}
      
      <View style={styles.container}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route || (item.route === 'Dashboard' && currentRouteName === 'EvaluatorDashboard');
          const scaleAnim = scaleAnims[item.route];

          return (
            <TouchableOpacity
              key={item.route}
              style={styles.tabButton}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
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
              </Animated.View>
              
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