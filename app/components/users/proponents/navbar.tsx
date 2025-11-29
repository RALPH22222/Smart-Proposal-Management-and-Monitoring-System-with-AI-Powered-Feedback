import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Note: Ensure you have this asset or replace with a generic URI for testing
// import Logo from "../../assets/IMAGES/LOGO.png";
const Logo = { uri: 'https://via.placeholder.com/150/FFFFFF/C8102E?text=LOGO' }; 

const COLORS = {
  brand: "#C8102E",
  brandLight: "#E03A52",
  white: "#FFFFFF",
  charcoal: "#333333",
  lightGray: "#f8f9fa",
};

// --- Icons ---
interface IconProps {
  isActive: boolean;
  color?: string;
}

const SubmissionIcon = ({ isActive, color }: IconProps) => (
  <Svg width={24} height={24} fill="none" stroke={color || (isActive ? COLORS.white : COLORS.white)} viewBox="0 0 24 24">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </Svg>
);

const ProfileIcon = ({ isActive, color }: IconProps) => (
  <Svg width={24} height={24} fill="none" stroke={color || (isActive ? COLORS.white : COLORS.white)} viewBox="0 0 24 24">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </Svg>
);

const SettingsIcon = ({ isActive, color }: IconProps) => (
  <Svg width={24} height={24} fill="none" stroke={color || (isActive ? COLORS.white : COLORS.white)} viewBox="0 0 24 24">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </Svg>
);

const LogoutIcon = ({ isActive, color }: IconProps) => (
  <Svg width={24} height={24} fill="none" stroke={color || (isActive ? COLORS.white : '#991B1B')} viewBox="0 0 24 24">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </Svg>
);

const ProponentNavbar: React.FC = () => {
  const [activeLink, setActiveLink] = useState("submission");
  const [pageSubtitle, setPageSubtitle] = useState("Proponent Submission");
  
  // Use window dimensions to handle responsive layout (Tablet/Desktop vs Phone)
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Tailwind 'md' breakpoint

  const navItems = [
    { name: "Submission", icon: SubmissionIcon, id: "submission" },
    { name: "Profile", icon: ProfileIcon, id: "profile" },
    { name: "Settings", icon: SettingsIcon, id: "settings" },
  ];

  const handleNavClick = (id: string, name: string) => {
    setActiveLink(id);
    setPageSubtitle(`Proponent ${name}`);
    // Navigation logic would go here (e.g., navigation.navigate(id))
  };

  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <>
      <StatusBar backgroundColor={COLORS.brand} barStyle="light-content" />
      
      {/* --- Top Header --- */}
      <SafeAreaView style={styles.safeAreaTop}>
        <View style={[styles.headerContainer, isDesktop ? styles.headerDesktop : styles.headerMobile]}>
          <View style={styles.headerContent}>
            
            {/* Logo Section */}
            <TouchableOpacity 
              style={styles.logoSection}
              onPress={() => handleNavClick("submission", "Submission")}
            >
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
              <View style={styles.titleContainer}>
                <Text style={styles.brandTitle}>
                  {isDesktop ? "WMSU Project Proposal" : "WMSU ProjProp"}
                </Text>
                {isDesktop && (
                  <Text style={styles.pageSubtitle}>{pageSubtitle}</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Desktop Navigation */}
            {isDesktop && (
              <View style={styles.desktopNav}>
                {navItems.map((item) => {
                  const isActive = activeLink === item.id;
                  const IconComponent = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.desktopNavItem}
                      onPress={() => handleNavClick(item.id, item.name)}
                    >
                      <Text style={[styles.desktopNavText, isActive && styles.desktopNavTextActive]}>
                        {item.name}
                      </Text>
                      {isActive && <View style={styles.activeUnderline} />}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity 
                  style={styles.desktopLogoutBtn} 
                  onPress={handleLogout}
                >
                  <LogoutIcon isActive={false} color={COLORS.charcoal} />
                  <Text style={styles.desktopLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mobile Logout (Small) */}
            {!isDesktop && (
              <TouchableOpacity style={styles.mobileLogoutBtn} onPress={handleLogout}>
                <LogoutIcon isActive={false} color={COLORS.charcoal} />
                <Text style={styles.mobileLogoutText}>Logout</Text>
              </TouchableOpacity>
            )}
            
          </View>
        </View>
      </SafeAreaView>

      {/* --- Mobile Bottom Navigation --- */}
      {!isDesktop && (
        <View style={styles.bottomNavContainer}>
          <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
            <View style={styles.bottomNavContent}>
              {navItems.map((item) => {
                const isActive = activeLink === item.id;
                const IconComponent = item.icon;
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.bottomNavItem, 
                      isActive && styles.bottomNavItemActive
                    ]}
                    onPress={() => handleNavClick(item.id, item.name)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                      <IconComponent isActive={isActive} />
                    </View>
                    <Text style={[
                      styles.bottomNavText, 
                      isActive && styles.bottomNavTextActive
                    ]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Safe Area
  safeAreaTop: {
    backgroundColor: COLORS.brand,
    zIndex: 50,
  },
  safeAreaBottom: {
    backgroundColor: COLORS.brand,
  },

  // Header
  headerContainer: {
    backgroundColor: COLORS.brand,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 50,
  },
  headerDesktop: {
    height: 80,
    justifyContent: 'center',
  },
  headerMobile: {
    height: 64,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },

  // Logo Section
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  pageSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },

  // Desktop Nav
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 4,
    position: 'relative',
  },
  desktopNavText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopNavTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  desktopLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  desktopLogoutText: {
    color: COLORS.charcoal,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Mobile Logout
  mobileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mobileLogoutText: {
    color: COLORS.charcoal,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Mobile Bottom Nav
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.brand,
    borderTopWidth: 1,
    borderTopColor: '#991B1B', // Red-800 equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 20,
    zIndex: 100,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    height: '100%',
  },
  bottomNavItemActive: {
    backgroundColor: '#991B1B', // Red-800
  },
  iconWrapper: {
    marginBottom: 4,
    transform: [{ scale: 1 }],
  },
  iconWrapperActive: {
    transform: [{ scale: 1.1 }],
  },
  bottomNavText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '500',
  },
  bottomNavTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ProponentNavbar;