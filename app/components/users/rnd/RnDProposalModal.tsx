import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import {
  X,
  FileText,
  User,
  Calendar,
  Plus,
  Trash2,
  Clock,
  Users,
  Send,
  Eye,
  ChevronDown,
  Check,
  Paperclip
} from 'lucide-react-native';

// --- Types ---
export type DecisionType = 'Sent to Evaluators' | 'Revision Required' | 'Rejected Proposal';

export interface Reviewer {
  id: string;
  name: string;
  role: string;
}

export interface CommentSection {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
}

export interface StructuredComments {
  objectives: CommentSection;
  methodology: CommentSection;
  budget: CommentSection;
  timeline: CommentSection;
  overall: CommentSection;
  additional: CommentSection[];
}

export interface AttachmentFile {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedDate: string;
  type: string;
  size: number;
}

export interface Proposal {
  id: string;
  title: string;
  submittedBy: string;
  submittedDate: string;
  rdStaffReviewer?: string;
  documentUrl?: string;
  evaluationDeadline?: string;
}

export interface Decision {
  proposalId: string;
  decision: string;
  structuredComments: StructuredComments;
  attachments: AttachmentFile[];
  reviewedBy: string;
  reviewedDate: string;
  evaluationDeadline?: string;
  proponentInfoVisibility?: 'name' | 'agency' | 'both';
}

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

interface EnhancedProposalModalProps {
  proposal: Proposal | null; // Allow null here for safety
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (decision: Decision) => void;
  userRole: 'R&D Staff' | 'Evaluator';
  collaborationSession?: any;
  currentUser: Reviewer;
}

// --- Constants ---
const ACCENT_COLOR = "#C10003";

const EnhancedProposalModal: React.FC<EnhancedProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSubmitDecision,
  userRole,
  collaborationSession,
  currentUser
}) => {
  // Mock Data
  const evaluators: Evaluator[] = [
    { id: '1', name: 'Dr. Alice Santos', department: 'Information Technology', specialty: ['AI', 'Systems'], availabilityStatus: 'Available', currentWorkload: 2, maxWorkload: 5, rating: 4.8, completedReviews: 20, email: 'alice@wmsu.edu.ph', agency: 'WMSU - CCS' },
    { id: '2', name: 'Prof. Ben Reyes', department: 'Computer Science', specialty: ['Security', 'Networks'], availabilityStatus: 'Busy', currentWorkload: 4, maxWorkload: 5, rating: 4.5, completedReviews: 15, email: 'ben@wmsu.edu.ph', agency: 'WMSU - COE' },
    { id: '3', name: 'Engr. Carla Lim', department: 'Information Technology', specialty: ['Databases', 'Web Dev'], availabilityStatus: 'Available', currentWorkload: 1, maxWorkload: 4, rating: 4.9, completedReviews: 30, email: 'carla@wmsu.edu.ph', agency: 'WMSU - CCS' }
  ];

  // State
  const [decision, setDecision] = useState<DecisionType>('Sent to Evaluators');
  const [evaluationDeadline, setEvaluationDeadline] = useState('14');
  const [structuredComments, setStructuredComments] = useState<StructuredComments>({
    objectives: { id: '1', title: 'Objectives', content: '', lastModified: '', author: currentUser.name },
    methodology: { id: '2', title: 'Methodology', content: '', lastModified: '', author: currentUser.name },
    budget: { id: '3', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
    timeline: { id: '4', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
    overall: { id: '5', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
    additional: []
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [availableEvaluators, setAvailableEvaluators] = useState<Evaluator[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<Evaluator | null>(null);
  const [selectedEvaluators, setSelectedEvaluators] = useState<Evaluator[]>([]);
  const [showAnonymitySelection, setShowAnonymitySelection] = useState(false);
  const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both'>('both');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [activeSection, setActiveSection] = useState<string>('objectives');
  
  // UI State helpers
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [evaluatorDropdownOpen, setEvaluatorDropdownOpen] = useState(false);
  const [deadlineDropdownOpen, setDeadlineDropdownOpen] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('Sent to Evaluators');
      setEvaluationDeadline('14');
      setStructuredComments({
        objectives: { id: '1', title: 'Objectives', content: '', lastModified: '', author: currentUser.name },
        methodology: { id: '2', title: 'Methodology', content: '', lastModified: '', author: currentUser.name },
        budget: { id: '3', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
        timeline: { id: '4', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
        overall: { id: '5', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
        additional: []
      });
      setAttachments([]);
      setActiveSection('objectives');
      setShowAnonymitySelection(false);
      setShowProponentInfo('both');
      setSelectedEvaluators([]);
    }
  }, [isOpen, proposal, currentUser.name]);

  // Reject Logic
  useEffect(() => {
    if (decision === 'Rejected Proposal') {
      setStructuredComments((prev) => ({
        ...prev,
        objectives: {
          ...prev.objectives,
          content: prev.objectives.content || 'After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:\n\n1. [Specify main concern]\n2. [Additional concerns if any]\n\nWe recommend that the proponent address these issues before resubmission.',
          lastModified: new Date().toISOString()
        }
      }));
    }
  }, [decision]);

  // Evaluator Filter
  useEffect(() => {
    if (selectedDepartment) {
      const filtered = evaluators.filter((ev) => ev.department === selectedDepartment);
      setAvailableEvaluators(filtered);
    }
  }, [selectedDepartment]);

  // Handlers
  const handleCommentChange = (sectionKey: keyof StructuredComments | number, content: string) => {
    setStructuredComments((prev) => {
      if (typeof sectionKey === 'string' && sectionKey !== 'additional') {
        return {
          ...prev,
          [sectionKey]: { ...(prev[sectionKey] as CommentSection), content, lastModified: new Date().toISOString() }
        };
      } else if (typeof sectionKey === 'number') {
        const newAdditional = [...prev.additional];
        newAdditional[sectionKey] = { ...newAdditional[sectionKey], content, lastModified: new Date().toISOString() };
        return { ...prev, additional: newAdditional };
      }
      return prev;
    });
  };

  const addAdditionalSection = () => {
    const newSection: CommentSection = {
      id: `additional-${Date.now()}`,
      title: `Additional Section ${structuredComments.additional.length + 1}`,
      content: '',
      lastModified: new Date().toISOString(),
      author: currentUser.name
    };
    setStructuredComments((prev) => ({ ...prev, additional: [...prev.additional, newSection] }));
  };

  const removeAdditionalSection = (index: number) => {
    setStructuredComments((prev) => ({
      ...prev,
      additional: prev.additional.filter((_, i) => i !== index)
    }));
  };

  const handleAddDummyAttachment = () => {
    const newAttachment: AttachmentFile = {
      id: `file-${Date.now()}`,
      name: `Document-${attachments.length + 1}.pdf`,
      url: '#',
      uploadedBy: currentUser.name,
      uploadedDate: new Date().toISOString(),
      type: 'application/pdf',
      size: 1024 * 1024 // 1MB dummy
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  const handleSubmit = () => {
    if (!proposal) return;

    if (decision === 'Sent to Evaluators' && userRole === 'R&D Staff') {
      setShowAnonymitySelection(true);
      return;
    }

    const decisionData: Decision = {
      proposalId: proposal.id,
      decision,
      structuredComments,
      attachments,
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: (decision === 'Sent to Evaluators' || decision === 'Revision Required')
        ? new Date(Date.now() + parseInt(evaluationDeadline) * 24 * 60 * 60 * 1000).toISOString()
        : undefined
    };

    onSubmitDecision(decisionData);
    onClose();
  };

  const confirmEvaluatorAssignment = () => {
    // FIX: Add safety check to ensure proposal exists
    if (!proposal) return;

    const deadlineIso = new Date(Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000).toISOString();
    const decisionData: Decision & { proponentInfoVisibility?: 'name' | 'agency' | 'both' } = {
      proposalId: proposal.id,
      decision: 'Sent to Evaluators',
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: deadlineIso,
      proponentInfoVisibility: showProponentInfo
    };
    onSubmitDecision(decisionData);
    setShowAnonymitySelection(false);
    onClose();
  };

  // Helpers
  const getDecisionButtonText = (decisionType: DecisionType) => {
    switch (decisionType) {
      case 'Sent to Evaluators': return userRole === 'R&D Staff' ? 'Forward to Evaluators' : 'Approve Proposal';
      case 'Revision Required': return 'Send Feedback';
      case 'Rejected Proposal': return 'Reject Proposal';
      default: return decisionType;
    }
  };

  const sections = [
    { key: 'objectives', title: 'Objectives Assessment', data: structuredComments.objectives },
    { key: 'methodology', title: 'Methodology Assessment', data: structuredComments.methodology },
    { key: 'budget', title: 'Budget Assessment', data: structuredComments.budget },
    { key: 'timeline', title: 'Timeline Assessment', data: structuredComments.timeline },
    { key: 'overall', title: 'Overall Assessment', data: structuredComments.overall },
    ...structuredComments.additional.map((section, index) => ({
      key: `additional-${index}`,
      title: section.title,
      data: section
    }))
  ];

  if (!isOpen || !proposal) return null;

  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {userRole === 'R&D Staff' ? 'Review Proposal' : 'Evaluate Proposal'}
              </Text>
              <Text style={styles.headerSubTitle} numberOfLines={1}>{proposal.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* Info Snippet */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <User size={12} color="#64748B" />
                <Text style={styles.infoText}>By: {proposal.submittedBy}</Text>
              </View>
              <View style={styles.infoItem}>
                <Calendar size={12} color="#64748B" />
                <Text style={styles.infoText}>{new Date(proposal.submittedDate).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Document Preview Placeholder */}
            <View style={styles.docPreview}>
              <FileText size={40} color="#CBD5E1" />
              <Text style={styles.docPreviewText}>Document Preview</Text>
              <Text style={styles.docPreviewSub}>PDF rendering is not supported in this view.</Text>
            </View>

            {/* Decision Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Make Decision</Text>
              
              {/* Radio Options */}
              <View style={styles.radioGroup}>
                {(['Sent to Evaluators', 'Revision Required', 'Rejected Proposal'] as DecisionType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      decision === option && styles.radioOptionSelected
                    ]}
                    onPress={() => setDecision(option)}
                  >
                    <View style={styles.radioCircle}>
                      {decision === option && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[
                      styles.radioText,
                      decision === option && styles.radioTextSelected,
                      option === 'Sent to Evaluators' && { color: '#15803D' },
                      option === 'Revision Required' && { color: '#C2410C' },
                      option === 'Rejected Proposal' && { color: '#B91C1C' },
                    ]}>
                      {getDecisionButtonText(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Limit Section */}
              {(decision === 'Sent to Evaluators' || decision === 'Revision Required') && (
                <View style={styles.subsection}>
                  <Text style={styles.label}>
                    {decision === 'Sent to Evaluators' ? 'Evaluation Time Limit' : 'Revision Time Limit'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => setDeadlineDropdownOpen(!deadlineDropdownOpen)}
                  >
                    <Text style={styles.dropdownText}>
                      {evaluationDeadline === '7' ? '1 Week' : 
                       evaluationDeadline === '14' ? '2 Weeks (Default)' :
                       evaluationDeadline === '21' ? '3 Weeks' :
                       evaluationDeadline === '30' ? '1 Month' :
                       evaluationDeadline === '45' ? '6 Weeks' : '2 Months'}
                    </Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                  
                  {deadlineDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {[
                        { label: '1 Week', value: '7' },
                        { label: '2 Weeks', value: '14' },
                        { label: '3 Weeks', value: '21' },
                        { label: '1 Month', value: '30' },
                      ].map((opt) => (
                        <TouchableOpacity 
                          key={opt.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setEvaluationDeadline(opt.value);
                            setDeadlineDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Evaluator Assignment (Only for Forward) */}
              {decision === 'Sent to Evaluators' && (
                <View style={styles.subsection}>
                  <Text style={styles.label}>Assign Evaluators</Text>
                  
                  {/* Dept Select */}
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      setDeptDropdownOpen(!deptDropdownOpen);
                      setEvaluatorDropdownOpen(false);
                    }}
                  >
                    <Text style={selectedDepartment ? styles.dropdownText : styles.placeholderText}>
                      {selectedDepartment || "Select Department"}
                    </Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                  
                  {deptDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {[...new Set(evaluators.map(e => e.department))].map(dept => (
                        <TouchableOpacity 
                          key={dept}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedDepartment(dept);
                            setDeptDropdownOpen(false);
                            setSelectedEvaluators([]);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{dept}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Evaluator Select */}
                  {selectedDepartment && (
                    <>
                      <TouchableOpacity 
                        style={[styles.dropdownTrigger, { marginTop: 8 }]}
                        onPress={() => setEvaluatorDropdownOpen(!evaluatorDropdownOpen)}
                      >
                        <Text style={styles.placeholderText}>
                          {selectedEvaluator ? selectedEvaluator.name : "Select Evaluator to Add"}
                        </Text>
                        <Plus size={16} color="#64748B" />
                      </TouchableOpacity>

                      {evaluatorDropdownOpen && (
                        <View style={styles.dropdownList}>
                          {availableEvaluators.map(ev => (
                            <TouchableOpacity 
                              key={ev.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                if (!selectedEvaluators.some(e => e.id === ev.id)) {
                                  setSelectedEvaluators([...selectedEvaluators, ev]);
                                }
                                setEvaluatorDropdownOpen(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{ev.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  {/* Selected Chips */}
                  <View style={styles.chipContainer}>
                    {selectedEvaluators.map(ev => (
                      <View key={ev.id} style={styles.chip}>
                        <Text style={styles.chipText}>{ev.name}</Text>
                        <TouchableOpacity 
                          onPress={() => setSelectedEvaluators(prev => prev.filter(e => e.id !== ev.id))}
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Comments Sections */}
              {(decision === 'Revision Required' || decision === 'Rejected Proposal') && (
                <View style={styles.subsection}>
                  <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {decision === 'Rejected Proposal' ? (
                        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                          <Text style={[styles.tabText, styles.activeTabText]}>Rejection Explanation</Text>
                        </TouchableOpacity>
                      ) : (
                        sections.map((section) => (
                          <TouchableOpacity
                            key={section.key}
                            style={[styles.tab, activeSection === section.key && styles.activeTab]}
                            onPress={() => setActiveSection(section.key)}
                          >
                            <Text style={[styles.tabText, activeSection === section.key && styles.activeTabText]}>
                              {section.title}
                            </Text>
                            {section.data.content ? <View style={styles.activeDot} /> : null}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.textAreaContainer}>
                    {decision === 'Rejected Proposal' ? (
                      <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={6}
                        placeholder="Provide a clear explanation for rejecting this proposal..."
                        value={structuredComments.objectives.content}
                        onChangeText={(text) => handleCommentChange('objectives', text)}
                        textAlignVertical="top"
                      />
                    ) : (
                      sections.map((section) => {
                        if (section.key !== activeSection) return null;
                        return (
                          <View key={section.key}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.commentLabel}>{section.title}</Text>
                              {section.key.startsWith('additional-') && (
                                <TouchableOpacity onPress={() => removeAdditionalSection(parseInt(section.key.split('-')[1]))}>
                                  <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                            <TextInput
                              style={styles.textArea}
                              multiline
                              numberOfLines={6}
                              placeholder={`Comments for ${section.title}...`}
                              value={section.data.content}
                              onChangeText={(text) => {
                                if (section.key.startsWith('additional-')) {
                                  handleCommentChange(parseInt(section.key.split('-')[1]), text);
                                } else {
                                  handleCommentChange(section.key as keyof StructuredComments, text);
                                }
                              }}
                              textAlignVertical="top"
                            />
                          </View>
                        );
                      })
                    )}
                  </View>
                  
                  {decision === 'Revision Required' && (
                    <TouchableOpacity style={styles.addSectionBtn} onPress={addAdditionalSection}>
                      <Plus size={14} color="#4B5563" />
                      <Text style={styles.addSectionText}>Add Section</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Attachments */}
              {decision === 'Revision Required' && (
                <View style={styles.subsection}>
                  <Text style={styles.label}>Attachments</Text>
                  <View style={styles.attachmentsList}>
                    {attachments.map(att => (
                      <View key={att.id} style={styles.attachmentItem}>
                        <Paperclip size={14} color="#64748B" />
                        <Text style={styles.attachmentName} numberOfLines={1}>{att.name}</Text>
                        <TouchableOpacity onPress={() => removeAttachment(att.id)}>
                          <X size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handleAddDummyAttachment}>
                    <Plus size={16} color="#64748B" />
                    <Text style={styles.uploadText}>Add File (Mock)</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
            <View style={{height: 40}} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerCancel} onPress={onClose}>
              <Text style={styles.footerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerSubmit} onPress={handleSubmit}>
              <Text style={styles.footerSubmitText}>{getDecisionButtonText(decision)}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* Anonymity Modal */}
      <Modal visible={showAnonymitySelection} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <Eye size={24} color={ACCENT_COLOR} />
              <Text style={styles.dialogTitle}>Proponent Visibility</Text>
            </View>
            <Text style={styles.dialogDesc}>Choose what information evaluators can see:</Text>
            
            <View style={styles.radioGroup}>
              {[
                { val: 'both', label: 'Show Both Name & Agency', desc: 'Full transparency' },
                { val: 'name', label: 'Show Name Only', desc: 'Hide agency info' },
                { val: 'agency', label: 'Show Agency Only', desc: 'Hide proponent name' },
              ].map((opt) => (
                <TouchableOpacity 
                  key={opt.val} 
                  style={[styles.radioOption, showProponentInfo === opt.val && styles.radioOptionSelected]}
                  onPress={() => setShowProponentInfo(opt.val as any)}
                >
                  <View style={styles.radioCircle}>
                    {showProponentInfo === opt.val && <View style={styles.radioDot} />}
                  </View>
                  <View>
                    <Text style={styles.radioText}>{opt.label}</Text>
                    <Text style={styles.radioSubText}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dialogActions}>
              <TouchableOpacity 
                style={styles.dialogCancel} 
                onPress={() => setShowAnonymitySelection(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dialogConfirm} 
                onPress={confirmEvaluatorAssignment}
              >
                <Text style={styles.dialogConfirmText}>Continue</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  modalView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 250,
  },
  closeBtn: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
  },
  docPreview: {
    height: 150,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  docPreviewText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  docPreviewSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  radioGroup: {
    gap: 8,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: '#FFF1F2',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT_COLOR,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  radioTextSelected: {
    fontWeight: '700',
  },
  subsection: {
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1E293B',
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tabsContainer: {
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTab: {
    borderBottomColor: ACCENT_COLOR,
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textArea: {
    height: 120,
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    padding: 4,
  },
  addSectionText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  attachmentsList: {
    gap: 8,
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    marginLeft: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadText: {
    fontSize: 13,
    color: '#64748B',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: 'white',
    gap: 12,
  },
  footerCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  footerCancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  footerSubmit: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
  },
  footerSubmitText: {
    color: 'white',
    fontWeight: '700',
  },
  
  // Overlay styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  dialogDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  radioSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  dialogCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dialogCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  dialogConfirm: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  dialogConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default EnhancedProposalModal;