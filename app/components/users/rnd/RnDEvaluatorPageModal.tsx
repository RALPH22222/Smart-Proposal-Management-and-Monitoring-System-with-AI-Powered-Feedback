import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  FlatList
} from 'react-native';
import {
  X,
  Plus,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Trash2,
  Check,
  XCircle,
  Search
} from 'lucide-react-native';

// --- Interfaces ---
export interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending';
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => void;
  proposalTitle: string;
}

const ACCENT_COLOR = "#C10003";

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
  isOpen,
  onClose,
  currentEvaluators = [],
  onReassign,
  proposalTitle = "Untitled Project"
}) => {
  const departments = [
    'Information Technology',
    'Computer Science',
    'Engineering'
  ];

  // --- MOCK DATA ---
  const mockEvaluators: Record<string, EvaluatorOption[]> = {
    'Information Technology': [
      { id: 'e1', name: 'Dr. Alice Santos', department: 'Information Technology', status: 'Pending' },
      { id: 'e2', name: 'Prof. Ben Reyes', department: 'Information Technology', status: 'Accepts' },
      { id: 'e7', name: 'Dr. Michael Chen', department: 'Information Technology', status: 'Pending' },
      { id: 'e8', name: 'Prof. Sarah Johnson', department: 'Information Technology', status: 'Accepts' },
      { id: 'e13', name: 'Dr. Emily White', department: 'Information Technology', status: 'Pending' }
    ],
    'Computer Science': [
      { id: 'e3', name: 'Dr. Carla Lim', department: 'Computer Science', status: 'Rejected' },
      { id: 'e4', name: 'Prof. David Tan', department: 'Computer Science', status: 'Pending' },
      { id: 'e9', name: 'Dr. Robert Wilson', department: 'Computer Science', status: 'Accepts' },
      { id: 'e10', name: 'Prof. Lisa Garcia', department: 'Computer Science', status: 'Pending' }
    ],
    'Engineering': [
      { id: 'e5', name: 'Dr. John Cruz', department: 'Engineering', status: 'Accepts' },
      { id: 'e6', name: 'Prof. Eva Martinez', department: 'Engineering', status: 'Rejected' },
      { id: 'e11', name: 'Dr. James Brown', department: 'Engineering', status: 'Accepts' },
      { id: 'e12', name: 'Prof. Maria Rodriguez', department: 'Engineering', status: 'Pending' }
    ]
  };

  // --- STATE ---
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
  const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);
  
  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [evaluatorToRemove, setEvaluatorToRemove] = useState<EvaluatorOption | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null); // ID of row in replace mode
  const [replacementCandidates, setReplacementCandidates] = useState<EvaluatorOption[]>([]); // Options for specific row replacement

  // Initialize Data
  useEffect(() => {
    if (currentEvaluators.length > 0) {
      setCurrentList(currentEvaluators);
    } else {
      setCurrentList([]);
    }
  }, [currentEvaluators, isOpen]);

  // Filter Logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvaluators(availableEvaluators);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableEvaluators.filter(evaluator =>
        evaluator.name.toLowerCase().includes(query) ||
        evaluator.department.toLowerCase().includes(query)
      );
      setFilteredEvaluators(filtered);
    }
  }, [availableEvaluators, searchQuery]);

  // Handlers
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setIsDeptDropdownOpen(false);
    const evaluators = mockEvaluators[dept] || [];
    setAvailableEvaluators(evaluators);
    setFilteredEvaluators(evaluators);
    setSearchQuery('');
  };

  const handleAddEvaluator = (evaluator: EvaluatorOption) => {
    if (currentList.some(ev => ev.id === evaluator.id)) return;
    const newEvaluator: EvaluatorOption = { ...evaluator, status: 'Pending' };
    setCurrentList(prev => [...prev, newEvaluator]);
  };

  const initiateRemove = (evaluator: EvaluatorOption) => {
    setEvaluatorToRemove(evaluator);
  };

  const confirmRemove = () => {
    if (evaluatorToRemove) {
      setCurrentList(prev => prev.filter(ev => ev.id !== evaluatorToRemove.id));
      setEvaluatorToRemove(null);
    }
  };

  const initiateReplace = (id: string, department: string) => {
    if (replacingId === id) {
      setReplacingId(null); // Toggle off
      setReplacementCandidates([]);
    } else {
      setReplacingId(id);
      // Find valid candidates (same dept, not already assigned)
      const allInDept = mockEvaluators[department] || [];
      const candidates = allInDept.filter(c => !currentList.some(curr => curr.id === c.id));
      setReplacementCandidates(candidates);
    }
  };

  const confirmReplace = (originalId: string, newEvaluator: EvaluatorOption) => {
    setCurrentList(prev => prev.map(ev => {
      if (ev.id === originalId) {
        return { ...newEvaluator, status: 'Pending' };
      }
      return ev;
    }));
    setReplacingId(null);
    setReplacementCandidates([]);
  };

  const handleSaveClick = () => setShowSaveConfirmation(true);
  
  const handleFinalConfirmSave = () => {
    onReassign(currentList);
    setShowSaveConfirmation(false);
    onClose();
  };

  // --- Render Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepts': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
      default: return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Evaluator Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* Current Evaluators Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Evaluators</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{currentList.length} Assigned</Text>
                </View>
              </View>

              {currentList.length > 0 ? (
                <View style={styles.evaluatorTable}>
                  {currentList.map((ev, index) => {
                    const statusStyle = getStatusColor(ev.status);
                    const isReplacing = replacingId === ev.id;

                    return (
                      <View key={ev.id} style={[
                        styles.evaluatorRow,
                        index !== currentList.length - 1 && styles.rowBorder,
                        isReplacing && styles.replacingRow
                      ]}>
                        
                        {/* Main Info */}
                        <View style={styles.rowMain}>
                          <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{ev.name}</Text>
                            <Text style={styles.rowDept}>{ev.department}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                              <Text style={[styles.statusText, { color: statusStyle.text }]}>{ev.status}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.rowActions}>
                          {ev.status === 'Accepts' ? (
                            <View style={styles.confirmedBox}>
                              <Check size={12} color="#9CA3AF" />
                              <Text style={styles.confirmedText}>Confirmed</Text>
                            </View>
                          ) : (
                            <View style={styles.actionButtons}>
                              <TouchableOpacity 
                                onPress={() => initiateReplace(ev.id, ev.department)}
                                style={[styles.actionBtn, styles.replaceBtn]}
                              >
                                {isReplacing ? <X size={14} color="#2563EB" /> : <RefreshCw size={14} color="#2563EB" />}
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => initiateRemove(ev)}
                                style={[styles.actionBtn, styles.removeBtn]}
                              >
                                <Trash2 size={14} color="#DC2626" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        {/* Replacement Dropdown Area (Accordion style) */}
                        {isReplacing && (
                          <View style={styles.replacementContainer}>
                            <Text style={styles.replacementLabel}>Select Replacement:</Text>
                            {replacementCandidates.length > 0 ? (
                                replacementCandidates.map((candidate) => (
                                  <TouchableOpacity 
                                    key={candidate.id} 
                                    style={styles.candidateItem}
                                    onPress={() => confirmReplace(ev.id, candidate)}
                                  >
                                    <Text style={styles.candidateName}>{candidate.name}</Text>
                                    <View style={styles.selectBtn}>
                                      <Text style={styles.selectBtnText}>Select</Text>
                                    </View>
                                  </TouchableOpacity>
                                ))
                            ) : (
                              <Text style={styles.emptyText}>No available candidates in this department.</Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                   <Text style={styles.emptyText}>No evaluators currently assigned.</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Add Evaluators Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Add New Evaluators</Text>
              
              {/* Dept Dropdown */}
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              >
                <Text style={selectedDepartment ? styles.dropdownText : styles.placeholderText}>
                  {selectedDepartment || "-- Choose Department --"}
                </Text>
                {isDeptDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </TouchableOpacity>
              
              {isDeptDropdownOpen && (
                <View style={styles.dropdownList}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={styles.dropdownItem}
                      onPress={() => handleDepartmentChange(dept)}
                    >
                      <Text style={styles.dropdownItemText}>{dept}</Text>
                      {selectedDepartment === dept && <Check size={16} color={ACCENT_COLOR} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* List of Available */}
              {selectedDepartment && (
                <View style={styles.availableSection}>
                  <View style={styles.searchContainer}>
                    <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search evaluators..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.availableList}>
                    {filteredEvaluators.length > 0 ? (
                      filteredEvaluators.map(ev => {
                        const isAssigned = currentList.some(curr => curr.id === ev.id);
                        if (isAssigned) return null;

                        return (
                          <TouchableOpacity
                            key={ev.id}
                            style={styles.availableItem}
                            onPress={() => handleAddEvaluator(ev)}
                          >
                            <View style={styles.availableAvatar}>
                              <Plus size={16} color="#9CA3AF" />
                            </View>
                            <View style={styles.availableInfo}>
                              <Text style={styles.availableName}>{ev.name}</Text>
                              <Text style={styles.availableDept}>{ev.department}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>No matching evaluators found.</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClick}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* --- CONFIRM SAVE MODAL --- */}
      <Modal visible={showSaveConfirmation} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertHeader}>
              <AlertCircle size={24} color={ACCENT_COLOR} />
              <Text style={styles.alertTitle}>Confirm Assignments</Text>
            </View>
            <Text style={styles.alertMessage}>
              Are you sure you want to assign these evaluators to "{proposalTitle}"?
            </Text>
            <ScrollView style={styles.confirmList} nestedScrollEnabled>
              {currentList.map(ev => (
                <View key={ev.id} style={styles.confirmItem}>
                  <UserIcon size={14} color="#9CA3AF" />
                  <Text style={styles.confirmName}>{ev.name}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.alertActions}>
              <TouchableOpacity 
                style={styles.alertCancelBtn} 
                onPress={() => setShowSaveConfirmation(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.alertConfirmBtn} 
                onPress={handleFinalConfirmSave}
              >
                <Text style={styles.alertConfirmText}>Yes, Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- CONFIRM REMOVE MODAL --- */}
      <Modal visible={!!evaluatorToRemove} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.removeIconCircle}>
              <XCircle size={32} color="#DC2626" />
            </View>
            <Text style={styles.alertTitleCenter}>Remove Evaluator?</Text>
            <Text style={styles.alertMessageCenter}>
              Are you sure to remove <Text style={{ fontWeight: 'bold' }}>{evaluatorToRemove?.name}</Text>?
            </Text>
            <View style={styles.alertActionsCenter}>
              <TouchableOpacity 
                style={styles.alertCancelBtn} 
                onPress={() => setEvaluatorToRemove(null)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.alertDeleteBtn} 
                onPress={confirmRemove}
              >
                <Text style={styles.alertDeleteText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalView: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Table
  evaluatorTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  evaluatorRow: {
    backgroundColor: 'white',
    padding: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  replacingRow: {
    backgroundColor: '#EFF6FF', // Light blue
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rowDept: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  confirmedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replaceBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  
  // Replacement
  replacementContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  replacementLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 6,
  },
  candidateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  candidateName: {
    fontSize: 13,
    color: '#1E3A8A',
  },
  selectBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectBtnText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  // Dropdown
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  
  // Available List
  availableSection: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
  },
  availableList: {
    maxHeight: 200,
  },
  availableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  availableAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  availableInfo: {
    flex: 1,
  },
  availableName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  availableDept: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ACCENT_COLOR,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Alerts
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  alertMessage: {
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmList: {
    maxHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  confirmName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  alertCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  alertCancelText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  alertConfirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: ACCENT_COLOR,
  },
  alertConfirmText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Delete Alert Specifics
  removeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  alertTitleCenter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessageCenter: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 24,
  },
  alertActionsCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  alertDeleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  alertDeleteText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RnDEvaluatorPageModal;