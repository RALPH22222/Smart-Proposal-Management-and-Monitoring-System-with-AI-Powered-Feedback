import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar';
import { Server } from 'lucide-react-native';

export default function AdminSystem() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard':
        navigation.navigate('AdminDashboard' as any);
        break;
      case 'Accounts':
        navigation.navigate('AdminAccounts' as any);
        break;
      case 'Contents':
        navigation.navigate('AdminContents' as any);
        break;
      case 'Reports':
        navigation.navigate('AdminReports' as any);
        break;
      case 'System':
        navigation.navigate('AdminSystem' as any);
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Server size={24} color="#C8102E" />
            <Text style={styles.title}>System</Text>
          </View>
          <Text style={styles.subtitle}>System configuration and settings</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.placeholderText}>System management page coming soon...</Text>
        </View>

        <View style={{ height: 20 }} /> 
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

