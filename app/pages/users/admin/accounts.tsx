import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../types/navigation";
import AdminNavBar from "../../../components/users/admin/sidebar";
import {
  Users,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
  Power,
  Filter,
} from "lucide-react-native";
type User = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  agency?: string;
  specialties?: string[];
};

const mockUsers: User[] = [
  { id: 1, firstName: "Hudhaifah", lastName: "Labang", email: "dap@example.com", role: "Admin", status: "Active", agency: "R&D Office" },
  { id: 2, firstName: "Chester", lastName: "Candido", email: "chex@example.com", role: "Evaluator", status: "Active", agency: "College of Computing Studies", specialties: ["IT", "Software Engineering"] },
  { id: 3, firstName: "Ace", lastName: "Nieva", email: "ace@example.com", role: "Evaluator", status: "Inactive", agency: "College of Engineering", specialties: ["Civil Engineering", "Construction"] },
  { id: 4, firstName: "Diana", lastName: "Castillon", email: "diana@example.com", role: "R&D Staff", status: "Active", agency: "R&D Office" },
  { id: 5, firstName: "Andre Lee", lastName: "Cuyugan", email: "hellopo@example.com", role: "Proponent", status: "Active", agency: "External Researcher" },
  { id: 6, firstName: "Carlos", lastName: "Rodriguez", email: "carlos@example.com", role: "Proponent", status: "Active", agency: "University of Manila" },
  { id: 7, firstName: "Sofia", lastName: "Hernandez", email: "sofia@example.com", role: "Proponent", status: "Inactive", agency: "Private Institution" },
];

const agencies = [
  "R&D Office",
  "College of Computing Studies",
  "College of Engineering",
  "Research Department",
  "External Researcher",
  "University of Manila",
  "Private Institution",
];

const roles = ["Admin", "Evaluator", "R&D Staff", "Proponent"];

// Grouped specialties (Simplified for mobile view)
const groupedSpecialties = {
  "Technology": ["Information Technology", "Software Engineering", "Computer Science", "Data Science"],
  "Engineering": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
  "Sciences": ["Mathematics", "Physics", "Chemistry", "Biology"],
};

export default function AdminAccounts() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Navigation Handler
  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard': navigation.navigate('AdminDashboard' as any); break;
      case 'Accounts': navigation.navigate('AdminAccounts' as any); break;
      case 'Contents': navigation.navigate('AdminContents' as any); break;
      case 'Reports': navigation.navigate('AdminReports' as any); break;
      case 'System': navigation.navigate('AdminSystem' as any); break;
      default: break;
    }
  };

  // State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "Proponent",
    agency: "",
    status: "Active" as "Active" | "Inactive",
    specialties: [] as string[]
  });

  // Get unique roles
  const uniqueRoles = useMemo(() => {
    const r = Array.from(new Set(mockUsers.map(user => user.role)));
    return r.sort();
  }, []);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.agency && user.agency.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [searchTerm, statusFilter, roleFilter]);

  // Form Handlers
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "role" && value !== "Evaluator") {
      setFormData(prev => ({ ...prev, specialties: [] }));
      setShowSpecialties(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      firstName: "", middleName: "", lastName: "", email: "",
      role: "Proponent", agency: "", status: "Active", specialties: []
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      middleName: user.middleName || "",
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      agency: user.agency || "",
      status: user.status,
      specialties: user.specialties || []
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (formData.role === "Evaluator" && formData.specialties.length === 0) {
      Alert.alert("Error", "Please select at least one specialty for Evaluator role.");
      return;
    }
    console.log(isEditMode ? "Updating:" : "Creating:", formData);
    Alert.alert("Success", `Account ${isEditMode ? "updated" : "created"} successfully!`);
    setShowModal(false);
  };

  const handleDisableConfirm = () => {
    if (selectedUser) {
      console.log(`Toggling status for ${selectedUser.id}`);
      Alert.alert("Success", `Account ${selectedUser.status === "Active" ? "disabled" : "enabled"} successfully!`);
      setShowDisableModal(false);
      setSelectedUser(null);
    }
  };

  const getFullName = (user: User) => {
    return `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
  };

  // --- Render Components ---

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#94A3B8"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Filter size={20} color={showFilters ? "#C8102E" : "#64748B"} />
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          <TouchableOpacity 
            style={[styles.chip, statusFilter === "All" && styles.activeChip]} 
            onPress={() => setStatusFilter("All")}
          >
            <Text style={[styles.chipText, statusFilter === "All" && styles.activeChipText]}>All Status</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chip, statusFilter === "Active" && styles.activeChip]} 
            onPress={() => setStatusFilter("Active")}
          >
            <Text style={[styles.chipText, statusFilter === "Active" && styles.activeChipText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chip, statusFilter === "Inactive" && styles.activeChip]} 
            onPress={() => setStatusFilter("Inactive")}
          >
            <Text style={[styles.chipText, statusFilter === "Inactive" && styles.activeChipText]}>Inactive</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  const renderUserCard = (user: User) => {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`;
    
    return (
      <View key={user.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{getFullName(user)}</Text>
            <Text style={styles.cardEmail}>{user.email}</Text>
          </View>
          <View style={[styles.statusBadge, user.status === "Active" ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, user.status === "Active" ? styles.statusTextActive : styles.statusTextInactive]}>
              {user.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role:</Text>
            <Text style={styles.detailValue}>{user.role}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agency:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{user.agency || "N/A"}</Text>
          </View>
          {user.specialties && user.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              {user.specialties.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
              {user.specialties.length > 3 && (
                <Text style={styles.moreSpecialties}>+{user.specialties.length - 3}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtnEdit} onPress={() => openEditModal(user)}>
            <Edit2 size={16} color="#C8102E" />
            <Text style={styles.actionTextEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnPower} onPress={() => { setSelectedUser(user); setShowDisableModal(true); }}>
            <Power size={16} color="#64748B" />
            <Text style={styles.actionTextPower}>{user.status === "Active" ? "Disable" : "Enable"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main Return
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Users size={24} color="#C8102E" />
            <Text style={styles.title}>Accounts</Text>
          </View>
          <Text style={styles.subtitle}>Manage user accounts and permissions</Text>
        </View>

        {/* Filters & Add Button */}
        {renderFilterSection()}
        
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add New Account</Text>
        </TouchableOpacity>

        {/* List */}
        <View style={styles.listContainer}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(renderUserCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} /> 
      </ScrollView>

      <AdminNavBar 
        activeRoute="Accounts"
        onNavigate={handleNavigate}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? "Edit Account" : "Add Account"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput style={styles.input} value={formData.firstName} onChangeText={(t) => handleInputChange("firstName", t)} placeholder="Enter first name" />
              
              <Text style={styles.label}>Last Name *</Text>
              <TextInput style={styles.input} value={formData.lastName} onChangeText={(t) => handleInputChange("lastName", t)} placeholder="Enter last name" />
              
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(t) => handleInputChange("email", t)} keyboardType="email-address" placeholder="Enter email" />

              <Text style={styles.label}>Role *</Text>
              <View style={styles.selectionRow}>
                {roles.map(r => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.selectChip, formData.role === r && styles.selectChipActive]}
                    onPress={() => handleInputChange("role", r)}
                  >
                    <Text style={[styles.selectChipText, formData.role === r && styles.selectChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Agency *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
                {agencies.map(a => (
                  <TouchableOpacity 
                    key={a} 
                    style={[styles.selectChip, formData.agency === a && styles.selectChipActive]}
                    onPress={() => handleInputChange("agency", a)}
                  >
                    <Text style={[styles.selectChipText, formData.agency === a && styles.selectChipTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Specialties Section (Only for Evaluator) */}
              {formData.role === "Evaluator" && (
                <View style={styles.specialtiesSection}>
                  <TouchableOpacity 
                    style={styles.accordionHeader} 
                    onPress={() => setShowSpecialties(!showSpecialties)}
                  >
                    <Text style={styles.label}>Specialties ({formData.specialties.length})</Text>
                    {showSpecialties ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                  </TouchableOpacity>
                  
                  {showSpecialties && (
                    <View style={styles.specialtiesList}>
                      {Object.entries(groupedSpecialties).map(([cat, specs]) => (
                        <View key={cat} style={{ marginBottom: 10 }}>
                          <Text style={styles.categoryTitle}>{cat}</Text>
                          <View style={styles.checkboxGrid}>
                            {specs.map(s => (
                              <TouchableOpacity 
                                key={s}
                                style={[styles.checkboxItem, formData.specialties.includes(s) && styles.checkboxItemActive]}
                                onPress={() => handleSpecialtyToggle(s)}
                              >
                                <Text style={[styles.checkboxText, formData.specialties.includes(s) && styles.checkboxTextActive]}>{s}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>{isEditMode ? "Update Account" : "Create Account"}</Text>
              </TouchableOpacity>
              <View style={{height: 40}}/>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Disable Confirmation Modal */}
      <Modal visible={showDisableModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 250 }]}>
             <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Action</Text>
              <TouchableOpacity onPress={() => setShowDisableModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.confirmText}>
                Are you sure you want to {selectedUser?.status === "Active" ? "disable" : "enable"} this account?
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDisableModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmBtn, selectedUser?.status === "Active" ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#10B981' }]} 
                  onPress={handleDisableConfirm}
                >
                  <Text style={styles.confirmBtnText}>{selectedUser?.status === "Active" ? "Disable" : "Enable"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
  // Filter Section
  filterSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  chipsContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#C8102E',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
  },
  activeChipText: {
    color: '#C8102E',
    fontWeight: '600',
  },
  // List & Cards
  addButton: {
    backgroundColor: '#C8102E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    gap: 12,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextActive: { color: '#166534' },
  statusTextInactive: { color: '#475569' },
  cardDetails: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
    maxWidth: '70%',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  specialtyBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#1E40AF',
  },
  moreSpecialties: {
    fontSize: 10,
    color: '#64748B',
    alignSelf: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  actionTextEdit: {
    fontSize: 12,
    color: '#C8102E',
    fontWeight: '500',
  },
  actionBtnPower: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  actionTextPower: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalSelect: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  selectChipActive: {
    backgroundColor: '#C8102E',
  },
  selectChipText: {
    fontSize: 12,
    color: '#475569',
  },
  selectChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#C8102E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // Specialties Accordion
  specialtiesSection: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialtiesList: {
    marginTop: 10,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  checkboxItemActive: {
    borderColor: '#C8102E',
    backgroundColor: '#FEF2F2',
  },
  checkboxText: {
    fontSize: 12,
    color: '#475569',
  },
  checkboxTextActive: {
    color: '#C8102E',
    fontWeight: '500',
  },
  // Confirm Modal
  confirmText: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: '600',
  }
});