import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const COLORS = {
  brand: "#C8102E",
  brandLight: "#E03A52",
  white: "#FFFFFF",
  charcoal: "#333333",
};

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("Home");
  const navigation = useNavigation();

  const navItems = [
    { name: "Home", icon: "home-outline", route: "Home" },
    { name: "About", icon: "information-circle-outline", route: "About" },
    { name: "Contacts", icon: "mail-outline", route: "Contacts" },
    { name: "FAQ", icon: "help-circle-outline", route: "FAQ" },
  ];

  const handleNavClick = (item: string) => {
    setActiveLink(item);
    // Navigate to the screen with the same name (route)
    // @ts-ignore
    navigation.navigate(item);
  };

  return (
    <View style={styles.container}>
      {/* Top bar with logo */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/IMAGES/LOGO.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoTitle}>WMSU Project Proposal</Text>
            <Text style={styles.logoSubtitle}>Research Oversight Committee</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={() => navigation.navigate("Login" as never)}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navbar */}
      <View style={styles.bottomNav}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => handleNavClick(item.name)}
            style={[
              styles.navItem,
              activeLink === item.name && styles.activeNavItem,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={activeLink === item.name ? COLORS.white : "#FFD9D9"}
            />
            <Text
              style={[
                styles.navText,
                activeLink === item.name && styles.activeNavText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  topBar: {
    backgroundColor: COLORS.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoTitle: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  logoSubtitle: {
    color: "#FFF8",
    fontSize: 10,
  },
  getStartedBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  getStartedText: {
    color: COLORS.brand,
    fontWeight: "bold",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.brand,
    paddingVertical: 8,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 6,
  },
  navText: {
    fontSize: 12,
    color: "#FFF9",
    marginTop: 2,
  },
  activeNavItem: {
    backgroundColor: COLORS.brandLight,
    borderRadius: 10,
  },
  activeNavText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});
