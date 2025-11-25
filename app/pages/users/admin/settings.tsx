import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar'; // Adjust path
import { 
  User, 
  Shield, 
  Bell, 
  Settings, 
  CheckSquare, 
  Square, 
  Camera 
} from 'lucide-react-native';

const PRIMARY = '#C8102E';
const COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  subText: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F1F5F9'
};

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Settings }
] as const;

const NOTIF_STATUS = [
  { key: 'proposalSubmitted', label: 'New proposal submitted' },
  { key: 'proposalReviewed', label: 'My proposal is reviewed' },
  { key: 'proposalApproved', label: 'Proposal approved/rejected' },
  { key: 'weeklyDigest', label: 'Weekly activity digest' }
] as const;

// --- Reusable Components ---

const Card = ({ title, children }: { title?: string, children: React.ReactNode }) => (
  <View style={styles.card}>
    {title && <Text style={styles.cardTitle}>{title}</Text>}
    {children}
  </View>
);

const InputGroup = ({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

// --- Sub-Sections ---

const AvatarUpload = () => (
  <View style={{ alignItems: 'center', marginBottom: 16 }}>
    <View style={styles.avatarContainer}>
      <Text style={styles.avatarPlaceholderText}>IMG</Text>
      <View style={styles.cameraIconBadge}>
        <Camera size={14} color="white" />
      </View>
    </View>
    <View style={styles.avatarActions}>
      <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
        <Text style={styles.btnTextPrimary}>Upload</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnOutline]}>
        <Text style={styles.btnTextOutline}>Remove</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ProfileSection = () => {
  const [form, setForm] = useState({
    firstName: 'Robert',
    lastName: 'William',
    email: 'admin@example.com',
    phone: '+63 900 000 0000',
    organization: 'WMSU',
    title: 'System Administrator',
    address: '',
    city: '',
    zip: ''
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <View style={{ gap: 16 }}>
      <Card title="Avatar">
        <AvatarUpload />
      </Card>

      <Card title="Personal Information">
        <InputGroup label="First Name" value={form.firstName} onChangeText={(t: string) => updateForm('firstName', t)} />
        <InputGroup label="Last Name" value={form.lastName} onChangeText={(t: string) => updateForm('lastName', t)} />
        <InputGroup label="Email" value={form.email} onChangeText={(t: string) => updateForm('email', t)} keyboardType="email-address" />
        <InputGroup label="Phone" value={form.phone} onChangeText={(t: string) => updateForm('phone', t)} keyboardType="phone-pad" />
        <InputGroup label="Organization" value={form.organization} onChangeText={(t: string) => updateForm('organization', t)} />
        <InputGroup label="Title" value={form.title} onChangeText={(t: string) => updateForm('title', t)} />
        
        <View style={styles.formActions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnTextPrimary}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card title="Contact & Address">
        <InputGroup label="Address" value={form.address} onChangeText={(t: string) => updateForm('address', t)} placeholder="Street, Barangay" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InputGroup label="City" value={form.city} onChangeText={(t: string) => updateForm('city', t)} />
          </View>
          <View style={{ width: 100 }}>
            <InputGroup label="Zip" value={form.zip} onChangeText={(t: string) => updateForm('zip', t)} keyboardType="numeric" />
          </View>
        </View>
      </Card>
    </View>
  );
};

const SecuritySection = () => {
  const [twoFA, setTwoFA] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  return (
    <View style={{ gap: 16 }}>
      <Card title="Password">
        <InputGroup 
          label="Current Password" 
          value={pwd.current} 
          onChangeText={(t: string) => setPwd(p => ({...p, current: t}))} 
          secureTextEntry 
        />
        <InputGroup 
          label="New Password" 
          value={pwd.next} 
          onChangeText={(t: string) => setPwd(p => ({...p, next: t}))} 
          secureTextEntry 
        />
        <InputGroup 
          label="Confirm Password" 
          value={pwd.confirm} 
          onChangeText={(t: string) => setPwd(p => ({...p, confirm: t}))} 
          secureTextEntry 
        />
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]}>
          <Text style={styles.btnTextPrimary}>Update Password</Text>
        </TouchableOpacity>
      </Card>

      <Card title="Two-Factor Authentication (2FA)">
        <View style={styles.rowBetween}>
          <Text style={[styles.subText, { flex: 1, marginRight: 16 }]}>
            Protect your account by requiring a code when signing in.
          </Text>
          <Switch 
            value={twoFA} 
            onValueChange={setTwoFA}
            trackColor={{ false: '#E2E8F0', true: PRIMARY }}
            thumbColor={'#fff'}
          />
        </View>
      </Card>
    </View>
  );
};

const NotificationsSection = () => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    proposalSubmitted: true,
    proposalReviewed: true,
    proposalApproved: true,
    weeklyDigest: false,
    smsAlerts: false
  });

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <View style={{ gap: 16 }}>
      <Card title="Email Notifications">
        {NOTIF_STATUS.map((row) => (
          <TouchableOpacity 
            key={row.key} 
            style={styles.checkboxRow}
            onPress={() => toggle(row.key)}
          >
            {prefs[row.key] ? (
              <CheckSquare size={20} color={PRIMARY} />
            ) : (
              <Square size={20} color={COLORS.subText} />
            )}
            <Text style={styles.checkboxLabel}>{row.label}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card title="SMS Alerts">
        <View style={styles.rowBetween}>
          <View>
             <Text style={styles.checkboxLabel}>Enable important SMS alerts</Text>
             <Text style={styles.subTextSmall}>Carrier rates may apply.</Text>
          </View>
          <Switch 
            value={prefs.smsAlerts} 
            onValueChange={() => toggle('smsAlerts')}
            trackColor={{ false: '#E2E8F0', true: PRIMARY }}
            thumbColor={'#fff'}
          />
        </View>
      </Card>
    </View>
  );
};

const PreferencesSection = () => {
  const [pref, setPref] = useState({ density: 'comfortable', theme: 'light' });

  // Custom Selector Component for Mobile
  const SelectGroup = ({ label, value, options, onSelect }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        {options.map((opt: any) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.selectOption,
              value === opt.value && styles.selectOptionActive
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[
              styles.selectText,
              value === opt.value && styles.selectTextActive
            ]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      <Card title="Appearance">
        <SelectGroup 
          label="Theme"
          value={pref.theme}
          onSelect={(v: string) => setPref(p => ({ ...p, theme: v }))}
          options={[
            { label: 'Light', value: 'light' },
            { label: 'System', value: 'system' }
          ]}
        />
        <SelectGroup 
          label="Density"
          value={pref.density}
          onSelect={(v: string) => setPref(p => ({ ...p, density: v }))}
          options={[
            { label: 'Comfortable', value: 'comfortable' },
            { label: 'Compact', value: 'compact' }
          ]}
        />
      </Card>

      <Card title="Session">
        <View style={{ gap: 8 }}>
          <Text style={styles.subText}>Last login: 2 hours ago</Text>
          <Text style={styles.subText}>Active sessions: 2 devices</Text>
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, { marginTop: 8 }]}
            onPress={() => Alert.alert('Sign Out', 'Signed out of all devices')}
          >
            <Text style={styles.btnTextPrimary}>Sign out of all devices</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
};

// --- Main Screen ---

export default function AdminSettings() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('profile');
  const [loading, setLoading] = useState(false);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [activeTab]);

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
          <Text style={styles.pageTitle}>Admin Settings</Text>
          <Text style={styles.pageSubtitle}>Manage your account, security and preferences.</Text>
        </View>

        {/* Horizontal Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActiveTab(t.id)}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                >
                  <Icon size={16} color={isActive ? PRIMARY : COLORS.subText} style={{marginRight: 6}} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Area */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'security' && <SecuritySection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'preferences' && <PreferencesSection />}
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AdminNavBar 
        activeRoute="System" // Assuming Settings falls under System or add 'Settings' to Sidebar
        onNavigate={handleNavigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.subText,
  },
  
  // Tabs
  tabsContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsScroll: {
    paddingBottom: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.subText,
  },
  tabTextActive: {
    color: PRIMARY,
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Inputs
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },

  // Buttons
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextOutline: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  // Avatar
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // General Utils
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subText: {
    fontSize: 13,
    color: COLORS.subText,
    lineHeight: 18,
  },
  subTextSmall: {
    fontSize: 12,
    color: '#94A3B8',
  },
  
  // Notifications
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
  },

  // Custom Select
  selectContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    padding: 4,
    borderRadius: 8,
  },
  selectOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectOptionActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectText: {
    fontSize: 13,
    color: COLORS.subText,
    fontWeight: '500',
  },
  selectTextActive: {
    color: PRIMARY,
    fontWeight: '600',
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  contentContainer: {
    //
  },
});