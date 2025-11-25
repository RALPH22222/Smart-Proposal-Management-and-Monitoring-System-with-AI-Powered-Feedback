import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import BottomNavBar from '../../../components/users/evaluator/navbar';
import {
  User,
  Shield,
  Bell,
  Settings,
  Camera,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

const PRIMARY = "#C8102E";

// --- Components ---

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={styles.card}>
    {title && <Text style={styles.cardTitle}>{title}</Text>}
    {children}
  </View>
);

const AvatarUpload = () => {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>IMG</Text>
      </View>
      <View style={styles.avatarActions}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
          <Camera size={16} color="#fff" />
          <Text style={styles.btnTextWhite}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]}>
          <Text style={styles.btnTextDark}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// === Profile Section ===
const ProfileSection = () => {
  const [form, setForm] = useState({
    firstName: "Robert",
    lastName: "William",
    email: "evaluator@example.com",
    phone: "+63 900 000 0000",
    organization: "WMSU",
    title: "Evaluator",
    address: "",
    city: "",
    zip: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.sectionContainer}>
      <Card title="Avatar">
        <AvatarUpload />
      </Card>

      <Card title="Personal Information">
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={form.firstName}
            onChangeText={(t) => handleChange('firstName', t)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(t) => handleChange('lastName', t)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            keyboardType="email-address"
            onChangeText={(t) => handleChange('email', t)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={(t) => handleChange('phone', t)}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Organization</Text>
            <TextInput
              style={styles.input}
              value={form.organization}
              onChangeText={(t) => handleChange('organization', t)}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => handleChange('title', t)}
            />
          </View>
        </View>
      </Card>

      <Card title="Contact & Address">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, Barangay"
            value={form.address}
            onChangeText={(t) => handleChange('address', t)}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(t) => handleChange('city', t)}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Zip</Text>
            <TextInput
              style={styles.input}
              value={form.zip}
              keyboardType="numeric"
              onChangeText={(t) => handleChange('zip', t)}
            />
          </View>
        </View>
      </Card>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
          <Text style={styles.btnTextWhite}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]}>
          <Text style={styles.btnTextDark}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// === Security Section ===
const SecuritySection = () => {
  return (
    <View style={styles.sectionContainer}>
      <Card title="Change Password">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter current password"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter new password"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm new password"
          />
        </View>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]}>
          <Text style={styles.btnTextWhite}>Update Password</Text>
        </TouchableOpacity>
      </Card>

      <Card title="Two-Factor Authentication">
        <Text style={styles.helperText}>
          Add an extra layer of security to your account.
        </Text>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]}>
          <Text style={styles.btnTextWhite}>Enable 2FA</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
};

// === Notifications Section ===
const NotificationsSection = () => {
  const [toggles, setToggles] = useState({
    accountUpdates: true,
    systemAlerts: true,
    marketing: false,
    newMessages: true,
    eventReminders: false,
    securityAlerts: true,
  });

  const toggleSwitch = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const SwitchRow = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        trackColor={{ false: "#E2E8F0", true: "#FECACA" }}
        thumbColor={value ? PRIMARY : "#f4f3f4"}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <Card title="Email Notifications">
        <SwitchRow 
          label="Account Updates" 
          value={toggles.accountUpdates} 
          onToggle={() => toggleSwitch('accountUpdates')} 
        />
        <SwitchRow 
          label="System Alerts" 
          value={toggles.systemAlerts} 
          onToggle={() => toggleSwitch('systemAlerts')} 
        />
        <SwitchRow 
          label="Marketing Messages" 
          value={toggles.marketing} 
          onToggle={() => toggleSwitch('marketing')} 
        />
      </Card>

      <Card title="Push Notifications">
        <SwitchRow 
          label="New Messages" 
          value={toggles.newMessages} 
          onToggle={() => toggleSwitch('newMessages')} 
        />
        <SwitchRow 
          label="Event Reminders" 
          value={toggles.eventReminders} 
          onToggle={() => toggleSwitch('eventReminders')} 
        />
        <SwitchRow 
          label="Security Alerts" 
          value={toggles.securityAlerts} 
          onToggle={() => toggleSwitch('securityAlerts')} 
        />
      </Card>
    </View>
  );
};

// === Preferences Section ===
const PreferencesSection = () => {
  return (
    <View style={styles.sectionContainer}>
      <Card title="App Preferences">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Theme</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>Light</Text>
            <ChevronRight size={20} color="#64748B" />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>English</Text>
            <ChevronRight size={20} color="#64748B" />
          </View>
        </View>
      </Card>
      
      <TouchableOpacity style={[styles.btn, styles.btnDestructive, { marginTop: 20 }]}>
        <LogOut size={18} color="#fff" />
        <Text style={styles.btnTextWhite}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

// === Main Screen ===
export default function EvaluatorSettings() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "preferences"
  >("profile");

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
        break;
      default:
        break;
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account preferences.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('EvaluatorNotifications')}
          >
            <Bell size={24} color="#C8102E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <Icon size={16} color={isActive ? PRIMARY : "#64748B"} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "preferences" && <PreferencesSection />}
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  // Tabs
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: PRIMARY,
  },
  // Content
  contentScroll: {
    padding: 16,
  },
  sectionContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  // Avatar
  avatarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Forms
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  // Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
  },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnDestructive: {
    backgroundColor: '#DC2626',
  },
  btnTextWhite: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  btnTextDark: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  // Other Elements
  helperText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 14,
    color: '#334155',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 14,
    color: '#1E293B',
  },
});

