import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Types (Mocked for context) ---
export interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

export interface Proposal {
  id?: string;
  title: string;
  status: string;
  deadline?: string;
  uploadedFile?: string;
  lastUpdated?: string;
  proponent: string;
  gender: string;
  telephone: string;
  email: string;
  agency: string;
  address: string;
  cooperatingAgencies: string;
  sector: string;
  discipline: string;
  priorityAreas: string;
  rdStation: string;
  modeOfImplementation: string;
  classification: string;
  duration: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
}

interface DetailedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdateProposal?: (proposal: Proposal) => void;
}

const { width, height } = Dimensions.get('window');

const DetailedProposalModal: React.FC<DetailedProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null);
  const [newFileName, setNewFileName] = useState<string | null>(null); // Store name instead of File object
  const [submittedFiles, setSubmittedFiles] = useState<string[]>([]);

  // --- Initialization Effects ---
  useEffect(() => {
    if (proposal) {
      setEditedProposal(proposal);
      if (proposal.uploadedFile) {
        setSubmittedFiles([proposal.uploadedFile]);
      }
    }
  }, [proposal]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setNewFileName(null);
    }
  }, [isOpen]);

  if (!isOpen || !proposal || !editedProposal) {
    return null;
  }

  // --- Logic Handlers ---
  const handleInputChange = (field: keyof Proposal, value: string) => {
    if (!editedProposal) return;
    setEditedProposal({ ...editedProposal, [field]: value });
  };

  const handleBudgetChange = (
    index: number,
    field: keyof BudgetSource,
    value: string
  ) => {
    if (!editedProposal) return;
    const updatedBudgetSources = [...editedProposal.budgetSources];
    updatedBudgetSources[index] = {
      ...updatedBudgetSources[index],
      [field]: value,
    };
    setEditedProposal({
      ...editedProposal,
      budgetSources: updatedBudgetSources,
    });
  };

  // Mock File Picker
  const handleFilePick = () => {
    // In a real app, use react-native-document-picker here
    Alert.alert('File Picker', 'Simulating file selection...', [
      {
        text: 'Select PDF',
        onPress: () => setNewFileName('Revised_Proposal_v2.pdf'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (onUpdateProposal && editedProposal) {
      const newFileUrl = newFileName
        ? `path/to/${newFileName}`
        : editedProposal.uploadedFile;
      
      if (newFileUrl && !submittedFiles.includes(newFileUrl)) {
        setSubmittedFiles((prev) => [...prev, newFileUrl]);
      }

      const updatedProposal = {
        ...editedProposal,
        uploadedFile: newFileUrl,
        status: 'r&d evaluation',
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      onUpdateProposal(updatedProposal);
      setIsEditing(false);
      setNewFileName(null);
    }
  };

  const handleCancel = () => {
    setEditedProposal(proposal);
    setNewFileName(null);
    setIsEditing(false);
  };

  // --- Helper Variables ---
  const currentData = isEditing ? editedProposal : proposal;
  const canEdit = proposal.status === 'revise' && isEditing;
  const isFunded = proposal.status === 'funded';

  // --- Design Helpers ---
  const getStatusTheme = (status: string) => {
    const s = status.toLowerCase();
    const iconSize = 16;

    if (['pending'].includes(s)) {
      return {
        bg: styles.bgYellow50,
        border: styles.borderYellow200,
        text: styles.textYellow800,
        iconName: 'clock',
        iconColor: '#D97706', // yellow-600
        label: 'Pending',
      };
    }
    if (['funded', 'accepted', 'approved'].includes(s)) {
      return {
        bg: styles.bgEmerald50,
        border: styles.borderEmerald200,
        text: styles.textEmerald800,
        iconName: 'check-circle',
        iconColor: '#059669', // emerald-600
        label: 'Project Funded',
      };
    }
    if (['rejected', 'disapproved', 'reject'].includes(s)) {
      return {
        bg: styles.bgRed50,
        border: styles.borderRed200,
        text: styles.textRed800,
        iconName: 'x-circle',
        iconColor: '#DC2626', // red-600
        label: 'Proposal Rejected',
      };
    }
    if (['revise', 'revision'].includes(s)) {
      return {
        bg: styles.bgOrange50,
        border: styles.borderOrange200,
        text: styles.textOrange800,
        iconName: 'refresh-cw',
        iconColor: '#EA580C', // orange-600
        label: 'Revision Required',
      };
    }
    if (['r&d evaluation'].includes(s)) {
      return {
        bg: styles.bgBlue50,
        border: styles.borderBlue200,
        text: styles.textBlue800,
        iconName: 'search', // microscope replacement
        iconColor: '#2563EB', // blue-600
        label: 'Under R&D Evaluation',
      };
    }
    if (['evaluators assessment'].includes(s)) {
      return {
        bg: styles.bgPurple50,
        border: styles.borderPurple200,
        text: styles.textPurple800,
        iconName: 'file-text',
        iconColor: '#9333EA', // purple-600
        label: 'Under Evaluators Assessment',
      };
    }

    return {
      bg: styles.bgSlate50,
      border: styles.borderSlate200,
      text: styles.textSlate700,
      iconName: 'clock',
      iconColor: '#64748B', // slate-500
      label: 'Under Evaluation',
    };
  };

  const theme = getStatusTheme(proposal.status);

  // --- Comments Data ---
  const reviseComments = [
    {
      section: 'Methodology',
      comment:
        'The proposed methodology lacks sufficient detail in implementation approach.',
    },
    {
      section: 'Budget',
      comment:
        'Some line items require better justification and cost-benefit analysis.',
    },
    {
      section: 'Overall',
      comment:
        'Project shows promise but requires moderate revisions before proceeding.',
    },
  ];
  const rejectComments = [
    {
      section: 'Reason for Rejection',
      comment:
        'Project objectives do not align with current organizational priorities.',
    },
  ];
  const activeComments =
    proposal.status === 'revise'
      ? reviseComments
      : proposal.status === 'reject'
      ? rejectComments
      : [];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={[styles.statusBadge, theme.bg, theme.border]}>
                <Feather
                  name={theme.iconName}
                  size={12}
                  color={theme.iconColor}
                  style={styles.statusIcon}
                />
                <Text style={[styles.statusText, theme.text]}>{theme.label}</Text>
              </View>
              <Text style={styles.formNumber}>DOST Form No. 1B</Text>
            </View>
            <View style={styles.headerMainRow}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {currentData.title}
              </Text>
              <View style={styles.headerActions}>
                {proposal.status === 'revise' && (
                  <TouchableOpacity
                    onPress={() => setIsEditing(!isEditing)}
                    style={[
                      styles.editButton,
                      isEditing ? styles.editButtonActive : styles.editButtonPrimary,
                    ]}
                  >
                    <Feather
                      name={isEditing ? 'eye' : 'edit-2'}
                      size={14}
                      color={isEditing ? '#334155' : '#FFFFFF'}
                    />
                    <Text
                      style={
                        isEditing
                          ? styles.editButtonTextActive
                          : styles.editButtonTextPrimary
                      }
                    >
                      {isEditing ? 'Preview' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Feather name="x" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Revision Deadline Banner */}
          {proposal.status === 'revise' && (
            <View style={styles.deadlineBanner}>
              <Feather name="refresh-cw" size={14} color="#9A3412" />
              <Text style={styles.deadlineText}>
                Deadline for Revision: {proposal.deadline || '2024-12-31 23:59'}
              </Text>
            </View>
          )}

          {/* --- BODY --- */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            
            {/* 1. Status Banner & Comments */}
            {(proposal.status === 'revise' || proposal.status === 'reject') && (
              <View style={[styles.feedbackContainer, theme.bg, theme.border]}>
                <View style={styles.feedbackHeader}>
                  <Feather name={theme.iconName} size={16} color={theme.iconColor} />
                  <Text style={[styles.feedbackTitle, theme.text]}>
                    R&D Staff Feedback
                  </Text>
                </View>
                <View style={styles.commentsList}>
                  {activeComments.map((c, i) => (
                    <View key={i} style={styles.commentItem}>
                      <Text style={[styles.commentSection, theme.text]}>
                        {c.section}
                      </Text>
                      <Text style={[styles.commentText, theme.text]}>
                        {c.comment}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 2. File Management Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Feather name="file-text" size={16} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Project Documents</Text>
                </View>
                {submittedFiles.length > 1 && (
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionText}>v{submittedFiles.length}</Text>
                  </View>
                )}
              </View>

              <View style={styles.fileActions}>
                {/* Current File Display */}
                <View style={styles.fileCard}>
                  <View style={styles.fileInfo}>
                    <View style={styles.fileIconBox}>
                      <MaterialCommunityIcons
                        name="file-check"
                        size={20}
                        color="#C8102E"
                      />
                    </View>
                    <View>
                      <Text style={styles.fileName}>
                        {submittedFiles.length > 0
                          ? 'Current Proposal PDF'
                          : 'No file uploaded'}
                      </Text>
                      <Text style={styles.fileSubtext}>
                        {submittedFiles.length > 0
                          ? 'Latest version'
                          : 'Pending upload'}
                      </Text>
                    </View>
                  </View>
                  {submittedFiles.length > 0 && (
                    <TouchableOpacity style={styles.downloadButton}>
                      <Feather name="download" size={16} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Upload New File (Only in Edit Mode) */}
                {canEdit && (
                  <TouchableOpacity
                    onPress={newFileName ? undefined : handleFilePick}
                    style={[
                      styles.uploadBox,
                      newFileName ? styles.uploadBoxSuccess : styles.uploadBoxDefault,
                    ]}
                  >
                    {!newFileName ? (
                      <View style={styles.uploadPlaceholder}>
                        <Feather name="upload" size={20} color="#94A3B8" />
                        <Text style={styles.uploadText}>
                          Click to upload revised PDF
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.uploadSuccess}>
                        <View style={styles.uploadSuccessLeft}>
                          <Feather name="check-circle" size={20} color="#16A34A" />
                          <View>
                            <Text style={styles.uploadSuccessTitle}>
                              Ready to submit
                            </Text>
                            <Text style={styles.uploadSuccessName}>
                              {newFileName}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => setNewFileName(null)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 3. Proponent & Agency Details */}
            {/* Proponent Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Feather name="user" size={16} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Proponent Details</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                {canEdit ? (
                  <TextInput
                    value={currentData.proponent}
                    onChangeText={(val) => handleInputChange('proponent', val)}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.valueText}>{currentData.proponent}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Gender</Text>
                  {canEdit ? (
                     // Simple TextInput for demo, effectively a Picker replacement
                    <TextInput
                      value={currentData.gender}
                      onChangeText={(val) => handleInputChange('gender', val)}
                      style={styles.input}
                      placeholder="Male / Female"
                    />
                  ) : (
                    <Text style={styles.valueText}>{currentData.gender}</Text>
                  )}
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Phone</Text>
                  <View style={styles.iconInputRow}>
                    {!canEdit && <Feather name="phone" size={14} color="#94A3B8" />}
                    {canEdit ? (
                      <TextInput
                        value={currentData.telephone}
                        onChangeText={(val) => handleInputChange('telephone', val)}
                        style={[styles.input, { flex: 1 }]}
                      />
                    ) : (
                      <Text style={[styles.valueText, { marginLeft: 8 }]}>
                        {currentData.telephone}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.iconInputRow}>
                  {!canEdit && <Feather name="mail" size={14} color="#94A3B8" />}
                  {canEdit ? (
                    <TextInput
                      value={currentData.email}
                      onChangeText={(val) => handleInputChange('email', val)}
                      style={[styles.input, { flex: 1 }]}
                    />
                  ) : (
                    <Text style={[styles.valueText, { marginLeft: 8 }]}>
                      {currentData.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Agency Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <MaterialCommunityIcons name="office-building" size={16} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Agency Information</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Agency</Text>
                {canEdit ? (
                  <TextInput
                    value={currentData.agency}
                    onChangeText={(val) => handleInputChange('agency', val)}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.valueText}>{currentData.agency}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                {canEdit ? (
                  <TextInput
                    value={currentData.address}
                    onChangeText={(val) => handleInputChange('address', val)}
                    style={[styles.input, styles.textArea]}
                    multiline
                  />
                ) : (
                  <View style={styles.iconInputRow}>
                    <Feather name="map-pin" size={14} color="#94A3B8" />
                    <Text style={[styles.valueText, { marginLeft: 8 }]}>
                      {currentData.address}
                    </Text>
                  </View>
                )}
              </View>
              
               <View style={styles.formGroup}>
                <Text style={styles.label}>Cooperating Agencies</Text>
                {canEdit ? (
                  <TextInput
                    value={currentData.cooperatingAgencies}
                    onChangeText={(val) => handleInputChange('cooperatingAgencies', val)}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.valueText}>{currentData.cooperatingAgencies}</Text>
                )}
              </View>
            </View>

            {/* 4. Project Details Grid */}
            <View style={styles.sectionContainer}>
              <View style={styles.gridContainer}>
                {[
                  { label: 'Sector', icon: 'briefcase', field: 'sector' },
                  { label: 'Discipline', icon: 'book-open', field: 'discipline' },
                  { label: 'Priority Area', icon: 'target', field: 'priorityAreas' },
                  { label: 'R&D Station', icon: 'search', field: 'rdStation' },
                  { label: 'Mode of Imp.', icon: 'file-text', field: 'modeOfImplementation' },
                  { label: 'Classification', icon: 'tag', field: 'classification' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.gridItem}>
                    <View style={styles.gridLabelRow}>
                      <Feather name={item.icon} size={12} color="#94A3B8" />
                      <Text style={styles.gridLabel}>{item.label}</Text>
                    </View>
                    {canEdit ? (
                      <TextInput
                        value={(currentData as any)[item.field]}
                        onChangeText={(val) =>
                          handleInputChange(item.field as keyof Proposal, val)
                        }
                        style={styles.gridInput}
                      />
                    ) : (
                      <Text style={styles.gridValue}>
                        {(currentData as any)[item.field]}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* 5. Schedule */}
            <View style={styles.sectionContainer}>
               <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Feather name="calendar" size={16} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Schedule</Text>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration</Text>
                {canEdit ? (
                  <TextInput
                    value={currentData.duration}
                    onChangeText={(val) => handleInputChange('duration', val)}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.valueTextBold}>{currentData.duration}</Text>
                )}
              </View>

               <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start</Text>
                  {canEdit ? (
                    <TextInput
                      value={currentData.startDate}
                      onChangeText={(val) => handleInputChange('startDate', val)}
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.valueText}>{currentData.startDate}</Text>
                  )}
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End</Text>
                  {canEdit ? (
                    <TextInput
                      value={currentData.endDate}
                      onChangeText={(val) => handleInputChange('endDate', val)}
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.valueText}>{currentData.endDate}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* 6. Budget Table */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Feather name="dollar-sign" size={16} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Budget Breakdown</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeadCell, { width: 100 }]}>Source</Text>
                    <Text style={[styles.tableHeadCell, styles.alignRight]}>PS</Text>
                    <Text style={[styles.tableHeadCell, styles.alignRight]}>MOOE</Text>
                    <Text style={[styles.tableHeadCell, styles.alignRight]}>CO</Text>
                    <Text style={[styles.tableHeadCell, styles.alignRight, styles.textBold]}>Total</Text>
                  </View>

                  {/* Table Body */}
                  {currentData.budgetSources.map((budget, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={{ width: 100, justifyContent: 'center' }}>
                         {canEdit ? (
                             <TextInput
                              value={budget.source}
                              onChangeText={(v) => handleBudgetChange(index, 'source', v)}
                              style={styles.tableInput}
                             />
                         ) : (
                             <Text style={styles.tableCellText}>{budget.source}</Text>
                         )}
                      </View>
                      
                      {['ps', 'mooe', 'co', 'total'].map((key) => (
                        <View key={key} style={[styles.tableCell, styles.alignRight]}>
                          {canEdit ? (
                            <TextInput
                              value={(budget as any)[key]}
                              onChangeText={(v) => handleBudgetChange(index, key as keyof BudgetSource, v)}
                              style={[styles.tableInput, styles.alignRight]}
                              keyboardType="numeric"
                            />
                          ) : (
                            <Text style={[styles.tableCellText, key === 'total' && styles.textBold]}>
                              {(budget as any)[key]}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                  
                   {/* Table Footer / Grand Total */}
                   <View style={[styles.tableRow, styles.bgSlate50]}>
                      <Text style={[styles.tableCellText, styles.textBold, { width: 100 }]}>GRAND TOTAL</Text>
                       <View style={{flex: 1, alignItems: 'flex-end', paddingRight: 12, justifyContent: 'center'}}>
                         <Text style={styles.grandTotalText}>{currentData.budgetTotal}</Text>
                       </View>
                   </View>
                </View>
              </ScrollView>
            </View>

          </ScrollView>

          {/* --- FOOTER --- */}
          <View style={styles.footer}>
             <Text style={styles.modeText}>
                {isEditing ? "Editing Mode Active" : "Read-Only View"}
             </Text>
             <View style={styles.footerButtons}>
                {isEditing ? (
                  <>
                     <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={handleSave} style={styles.submitButton}>
                        <Feather name="upload" size={14} color="white" style={{marginRight: 6}} />
                        <Text style={styles.submitButtonText}>Submit</Text>
                     </TouchableOpacity>
                  </>
                ) : (
                   <TouchableOpacity onPress={onClose} style={styles.closeFooterButton}>
                      <Text style={styles.closeFooterText}>Close</Text>
                   </TouchableOpacity>
                )}
             </View>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0, // Better spacing on web preview
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : width, // Responsive width
    height: Platform.OS === 'web' ? '90%' : '100%',
    overflow: 'hidden',
  },

  // Header
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: 'white',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formNumber: {
    fontSize: 12,
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    paddingRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  editButtonPrimary: {
    backgroundColor: '#C8102E',
  },
  editButtonActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editButtonTextPrimary: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  editButtonTextActive: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  deadlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5', // orange-100/50 approx
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  deadlineText: {
    fontSize: 14,
    color: '#9A3412',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Body
  bodyScroll: {
    flex: 1,
    backgroundColor: 'white',
  },
  bodyContent: {
    padding: 20,
    gap: 24,
  },

  // Feedback
  feedbackContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  commentSection: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.75,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Sections
  sectionContainer: {
    backgroundColor: '#F8FAFC', // slate-50
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  versionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 10,
    color: '#475569',
  },
  
  // File Actions
  fileActions: {
      gap: 12,
  },
  fileCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  fileIconBox: {
      width: 40,
      height: 40,
      backgroundColor: '#F1F5F9',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  fileName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#0F172A',
  },
  fileSubtext: {
      fontSize: 12,
      color: '#64748B',
  },
  downloadButton: {
      padding: 8,
  },
  
  // Upload
  uploadBox: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 16,
  },
  uploadBoxDefault: {
      borderColor: '#CBD5E1',
      backgroundColor: 'transparent',
  },
  uploadBoxSuccess: {
      borderColor: '#86EFAC',
      backgroundColor: '#F0FDF4',
  },
  uploadPlaceholder: {
      alignItems: 'center',
      gap: 8,
  },
  uploadText: {
      fontSize: 14,
      color: '#475569',
      fontWeight: '500',
  },
  uploadSuccess: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  uploadSuccessLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  uploadSuccessTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#166534',
  },
  uploadSuccessName: {
      fontSize: 12,
      color: '#16A34A',
  },
  removeText: {
      fontSize: 12,
      color: '#DC2626',
      fontWeight: '500',
  },

  // Forms
  formGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  iconInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  valueText: {
      fontSize: 14,
      color: '#0F172A',
  },
  valueTextBold: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0F172A',
  },

  // Grid
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
  },
  gridItem: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 16,
  },
  gridLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  gridLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#64748B',
      marginLeft: 6,
      textTransform: 'uppercase',
  },
  gridInput: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 13,
  },
  gridValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#0F172A',
      paddingLeft: 18, // Indent to align under label
  },

  // Table
  table: {
      minWidth: 500, // Ensure scrolling happens on small screens
  },
  tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      paddingBottom: 8,
      backgroundColor: '#F8FAFC',
  },
  tableHeadCell: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: '#64748B',
      paddingHorizontal: 8,
  },
  tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
  },
  tableCell: {
      flex: 1,
      paddingHorizontal: 8,
      justifyContent: 'center',
  },
  tableCellText: {
      fontSize: 12,
      color: '#475569',
  },
  tableInput: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
      fontSize: 12,
  },
  grandTotalText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#C8102E',
  },
  alignRight: {
      textAlign: 'right',
      alignItems: 'flex-end',
  },
  textBold: {
      fontWeight: 'bold',
      color: '#0F172A',
  },
  bgSlate50: { backgroundColor: '#F8FAFC' },

  // Footer
  footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      backgroundColor: '#F9FAFB',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  modeText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#64748B',
  },
  footerButtons: {
      flexDirection: 'row',
      gap: 12,
  },
  cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 8,
  },
  cancelButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#334155',
  },
  submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: '#C8102E',
      borderRadius: 8,
  },
  submitButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: 'white',
  },
  closeFooterButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 8,
  },
  closeFooterText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#334155',
  },

  // Theme Helpers
  bgYellow50: { backgroundColor: '#FEFCE8' },
  borderYellow200: { borderColor: '#FEF08A' },
  textYellow800: { color: '#854D0E' },

  bgEmerald50: { backgroundColor: '#ECFDF5' },
  borderEmerald200: { borderColor: '#A7F3D0' },
  textEmerald800: { color: '#065F46' },

  bgRed50: { backgroundColor: '#FEF2F2' },
  borderRed200: { borderColor: '#FECACA' },
  textRed800: { color: '#991B1B' },

  bgOrange50: { backgroundColor: '#FFF7ED' },
  borderOrange200: { borderColor: '#FED7AA' },
  textOrange800: { color: '#9A3412' },

  bgBlue50: { backgroundColor: '#EFF6FF' },
  borderBlue200: { borderColor: '#BFDBFE' },
  textBlue800: { color: '#1E40AF' },
  
  bgPurple50: { backgroundColor: '#FAF5FF' },
  borderPurple200: { borderColor: '#E9D5FF' },
  textPurple800: { color: '#6B21A8' },

  bgSlate50Theme: { backgroundColor: '#F8FAFC' },
  borderSlate200: { borderColor: '#E2E8F0' },
  textSlate700: { color: '#334155' },
});

export default DetailedProposalModal;