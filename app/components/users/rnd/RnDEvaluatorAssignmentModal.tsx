import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react-native';

// --- Interfaces ---
export interface Evaluator {
  id: string;
  name: string;
  department: string;
  specialty: string[];
  availabilityStatus: 'Available' | 'Busy';
  currentWorkload: number;
  maxWorkload: number;
  rating: number;
  completedReviews: number;
  email: string;
  agency: string;
}

export interface Proposal {
  id: string;
  title: string;
}

interface EvaluatorAssignmentData {
  department: string;
  evaluators: Evaluator[];
}

interface RnDEvaluatorAssignmentModalProps {
  proposal?: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onAssignEvaluators: (data: EvaluatorAssignmentData) => void;
}

// --- Constants ---
const ACCENT_COLOR = "#C10003";

const RnDEvaluatorAssignmentModal: React.FC<RnDEvaluatorAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssignEvaluators
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEvaluators, setSelectedEvaluators] = useState<Evaluator[]>([]);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  // Mock Data
  const evaluators: Evaluator[] = [
    {
      id: '1',
      name: 'Dr. Alice Santos',
      department: 'Information Technology',
      specialty: ['AI', 'Systems'],
      availabilityStatus: 'Available',
      currentWorkload: 2,
      maxWorkload: 5,
      rating: 4.8,
      completedReviews: 20,
      email: 'alice@wmsu.edu.ph',
      agency: 'WMSU'
    },
    {
      id: '2',
      name: 'Prof. Ben Reyes',
      department: 'Computer Science',
      specialty: ['Security', 'Networks'],
      availabilityStatus: 'Busy',
      currentWorkload: 4,
      maxWorkload: 5,
      rating: 4.5,
      completedReviews: 15,
      email: 'ben@wmsu.edu.ph',
      agency: 'WMSU'
    },
    {
      id: '3',
      name: 'Engr. Carla Lim',
      department: 'Information Technology',
      specialty: ['Databases', 'Web Dev'],
      availabilityStatus: 'Available',
      currentWorkload: 1,
      maxWorkload: 4,
      rating: 4.9,
      completedReviews: 30,
      email: 'carla@wmsu.edu.ph',
      agency: 'WMSU'
    }
  ];

  // Derived State
  const uniqueDepartments = useMemo(() => 
    [...new Set(evaluators.map((e) => e.department))],
    []
  );

  const availableEvaluators = useMemo(() => 
    selectedDepartment 
      ? evaluators.filter((e) => e.department === selectedDepartment)
      : [],
    [selectedDepartment]
  );

  // Handlers
  const handleDepartmentSelect = (dept: string) => {
    setSelectedDepartment(dept);
    setIsDeptDropdownOpen(false);
    setSelectedEvaluators([]); // Reset evaluators when department changes
  };

  const toggleEvaluator = (evaluator: Evaluator) => {
    const isSelected = selectedEvaluators.some(e => e.id === evaluator.id);
    if (isSelected) {
      setSelectedEvaluators(prev => prev.filter(e => e.id !== evaluator.id));
    } else {
      setSelectedEvaluators(prev => [...prev, evaluator]);
    }
  };

  const handleAssign = () => {
    onAssignEvaluators({
      department: selectedDepartment,
      evaluators: selectedEvaluators
    });
    onClose();
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
            <Text style={styles.modalTitle}>Evaluator Assignment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* Department Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Select Department</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                activeOpacity={0.7}
              >
                <Text style={selectedDepartment ? styles.dropdownText : styles.placeholderText}>
                  {selectedDepartment || "-- Choose Department --"}
                </Text>
                {isDeptDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </TouchableOpacity>

              {isDeptDropdownOpen && (
                <View style={styles.dropdownList}>
                  {uniqueDepartments.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.dropdownItem,
                        selectedDepartment === dept && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleDepartmentSelect(dept)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedDepartment === dept && styles.selectedDropdownItemText
                      ]}>{dept}</Text>
                      {selectedDepartment === dept && <Check size={16} color={ACCENT_COLOR} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Evaluator Selection List */}
            {selectedDepartment ? (
              <View style={styles.section}>
                <Text style={styles.label}>Select Evaluators</Text>
                <View style={styles.evaluatorList}>
                  {availableEvaluators.length > 0 ? (
                    availableEvaluators.map((ev) => {
                      const isSelected = selectedEvaluators.some(e => e.id === ev.id);
                      return (
                        <TouchableOpacity
                          key={ev.id}
                          style={[
                            styles.evaluatorItem,
                            isSelected && styles.selectedEvaluatorItem
                          ]}
                          onPress={() => toggleEvaluator(ev)}
                          activeOpacity={0.6}
                        >
                          <View style={styles.evaluatorInfo}>
                            <Text style={[styles.evaluatorName, isSelected && styles.selectedEvaluatorText]}>
                              {ev.name}
                            </Text>
                            <Text style={[styles.evaluatorSpecialty, isSelected && styles.selectedEvaluatorSubText]}>
                              {ev.specialty.join(', ')}
                            </Text>
                            <View style={styles.badgesRow}>
                              <View style={[styles.badge, ev.availabilityStatus === 'Available' ? styles.badgeSuccess : styles.badgeBusy]}>
                                <Text style={[styles.badgeText, ev.availabilityStatus === 'Available' ? styles.badgeTextSuccess : styles.badgeTextBusy]}>
                                  {ev.availabilityStatus}
                                </Text>
                              </View>
                              <Text style={[styles.workloadText, isSelected && styles.selectedEvaluatorSubText]}>
                                Load: {ev.currentWorkload}/{ev.maxWorkload}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Check size={14} color="white" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No evaluators found for this department.</Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* Selected Tags Display */}
            {selectedEvaluators.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Assigned Evaluators:</Text>
                <View style={styles.tagsContainer}>
                  {selectedEvaluators.map((ev) => (
                    <View key={ev.id} style={styles.tag}>
                      <Text style={styles.tagText}>{ev.name}</Text>
                      <TouchableOpacity
                        onPress={() => toggleEvaluator(ev)}
                        style={styles.tagRemoveBtn}
                      >
                        <X size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.assignButton,
                (!selectedDepartment || selectedEvaluators.length === 0) && styles.disabledButton
              ]} 
              onPress={handleAssign}
              disabled={!selectedDepartment || selectedEvaluators.length === 0}
            >
              <Text style={styles.assignButtonText}>Assign Evaluators</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalView: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
  selectedDropdownItem: {
    backgroundColor: '#FEF2F2',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedDropdownItemText: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  evaluatorList: {
    gap: 8,
  },
  evaluatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedEvaluatorItem: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  evaluatorInfo: {
    flex: 1,
    marginRight: 12,
  },
  evaluatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  evaluatorSpecialty: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedEvaluatorText: {
    color: '#991B1B', 
  },
  selectedEvaluatorSubText: {
    color: '#B91C1C',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeBusy: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextSuccess: {
    color: '#166534',
  },
  badgeTextBusy: {
    color: '#991B1B',
  },
  workloadText: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tagRemoveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  assignButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ACCENT_COLOR,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB', 
  },
});

export default RnDEvaluatorAssignmentModal;