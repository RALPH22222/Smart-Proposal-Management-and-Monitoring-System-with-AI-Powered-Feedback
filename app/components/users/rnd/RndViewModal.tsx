import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
  Download,
  AlertTriangle,
  XCircle,
  GitBranch,
  Clock,
  Briefcase,
  BookOpen,
  Target,
  Timer,
} from 'lucide-react-native';

// --- Interfaces ---
export interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

export interface Proposal {
  id: string;
  title: string;
  status: string;
  // Fields used in this component
  proponent?: string;
  gender?: string;
  agency?: string;
  address?: string;
  telephone?: string;
  email?: string;
  cooperatingAgencies?: string;
  rdStation?: string;
  classification?: string;
  classificationDetails?: string;
  modeOfImplementation?: string;
  priorityAreas?: string;
  sector?: string;
  discipline?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  budgetSources?: BudgetSource[];
  budgetTotal?: string;
  revisionDeadline?: string;
}

interface DetailedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
}

// --- Constants ---
const ACCENT_COLOR = "#C10003";

const DetailedProposalModal: React.FC<DetailedProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  if (!isOpen || !proposal) return null;

  // --- Handlers ---
  const handleDownload = (fileName: string) => {
    Alert.alert("Download", `Downloading ${fileName}...`);
  };

  // Mock Data
  const mockAssessment = {
    objectives:
      "The specific objectives are generally clear but need more measurable indicators (SMART criteria). Objective 2 is currently too broad and needs to be narrowed down.",
    methodology:
      "The proposed statistical analysis method (ANOVA) needs further justification. Consider using regression analysis for continuous variables.",
    budget:
      "The travel expenses listed for Q3 seem excessive relative to the project scope. Please provide a detailed breakdown.",
    timeline:
      "The data collection phase is too short (2 weeks). Recommended extending to at least 1 month.",
    overall:
      "The proposal is promising but requires adjustments in the methodology and budget allocation before proceeding to evaluation.",
  };

  const mockRejection =
    "The proposal does not align with the current priority agenda of the institution. Specifically, the focus on blockchain for this specific agricultural application is not feasible with current resources.";

  const mockRevisionDeadline = "November 30, 2025 | 5:00 PM";

  // --- Helper for Status Styles ---
  const getStatusTheme = (status: string) => {
    switch (status) {
      case "Revised Proposal":
        return { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE' }; // purple
      case "Revision Required":
        return { bg: '#FFEDD5', border: '#FDBA74', text: '#C2410C' }; // orange
      case "Rejected Proposal":
        return { bg: '#FEE2E2', border: '#FECACA', text: '#B91C1C' }; // red
      case "Sent to Evaluators":
        return { bg: '#D1FAE5', border: '#6EE7B7', text: '#047857' }; // emerald
      default:
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' }; // amber
    }
  };

  const statusTheme = getStatusTheme(proposal.status);

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
            <View style={styles.headerContent}>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border }]}>
                  <Text style={[styles.statusText, { color: statusTheme.text }]}>{proposal.status}</Text>
                </View>
                <Text style={styles.formNo}>DOST Form No. 1B</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{proposal.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* --- DYNAMIC STATUS SECTION --- */}
            {proposal.status === "Revision Required" && (
              <View style={[styles.alertSection, styles.orangeAlert]}>
                <View style={styles.alertHeader}>
                  <AlertTriangle size={20} color="#9A3412" />
                  <Text style={styles.alertTitleOrange}>Revision Requirements</Text>
                </View>

                {/* Deadline Box */}
                <View style={styles.deadlineBox}>
                  <Text style={styles.deadlineLabel}>Revision Submission Deadline</Text>
                  <View style={styles.deadlineRow}>
                    <Timer size={20} color="#EF4444" />
                    <Text style={styles.deadlineText}>{proposal.revisionDeadline || mockRevisionDeadline}</Text>
                  </View>
                </View>

                <View style={styles.assessmentList}>
                  <AssessmentItem label="Objectives Assessment" text={mockAssessment.objectives} />
                  <AssessmentItem label="Methodology Assessment" text={mockAssessment.methodology} />
                  <AssessmentItem label="Budget Assessment" text={mockAssessment.budget} />
                  <AssessmentItem label="Timeline Assessment" text={mockAssessment.timeline} />
                  
                  <View style={styles.overallBox}>
                    <Text style={styles.overallLabel}>Overall Comments</Text>
                    <Text style={styles.overallText}>"{mockAssessment.overall}"</Text>
                  </View>
                </View>
              </View>
            )}

            {proposal.status === "Rejected Proposal" && (
              <View style={[styles.alertSection, styles.redAlert]}>
                <View style={styles.alertHeader}>
                  <XCircle size={20} color="#991B1B" />
                  <Text style={styles.alertTitleRed}>Rejection Reason</Text>
                </View>
                <Text style={styles.rejectionText}>{mockRejection}</Text>
              </View>
            )}

            {/* --- DOCUMENTS SECTION --- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FileText size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Project Documents</Text>
              </View>

              {proposal.status === "Revised Proposal" ? (
                <View style={styles.filesGrid}>
                  {/* Previous Version */}
                  <View style={styles.fileCardDisabled}>
                    <View style={styles.fileHeader}>
                      <View style={styles.fileLabelRow}>
                        <Clock size={12} color="#64748B" />
                        <Text style={styles.fileLabel}>Previous Version</Text>
                      </View>
                      <Text style={styles.fileDate}>Oct 15, 2023</Text>
                    </View>
                    <View style={styles.fileContent}>
                      <View style={styles.fileIconBg}>
                        <FileText size={20} color="#94A3B8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName}>Proposal_v1.pdf</Text>
                        <Text style={styles.fileSize}>2.4 MB</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDownload("Proposal_v1.pdf")}>
                        <Download size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Latest Version */}
                  <View style={styles.fileCardActive}>
                    <View style={styles.fileHeader}>
                      <View style={styles.fileLabelRow}>
                        <GitBranch size={12} color="#9333EA" />
                        <Text style={[styles.fileLabel, { color: '#9333EA' }]}>Latest Revision</Text>
                      </View>
                      <Text style={[styles.fileDate, { color: '#C084FC' }]}>Just now</Text>
                    </View>
                    <View style={styles.fileContent}>
                      <View style={[styles.fileIconBg, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                        <FileText size={20} color="#A855F7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName}>Proposal_v2_Revised.pdf</Text>
                        <Text style={styles.fileSize}>2.6 MB</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDownload("Proposal_v2_Revised.pdf")}>
                        <Download size={16} color="#9333EA" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                // Standard View
                <TouchableOpacity 
                  style={styles.singleFileCard}
                  onPress={() => handleDownload("Full Project Proposal.pdf")}
                >
                  <View style={styles.fileContent}>
                    <View style={[styles.fileIconBg, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                      <FileText size={20} color={ACCENT_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName}>Full Project Proposal.pdf</Text>
                      <Text style={styles.fileSize}>PDF Document • 2.4 MB</Text>
                    </View>
                    <View style={styles.downloadBadge}>
                      <Download size={12} color="#475569" />
                      <Text style={styles.downloadText}>Download</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* --- Leader & Agency Information --- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderBorder}>
                <User size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Leader & Agency Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <InfoItem label="Leader / Proponent" value={proposal.proponent} />
                <InfoItem label="Gender" value={proposal.gender} />
              </View>
              
              <View style={styles.infoGrid}>
                <InfoItem label="Agency" value={proposal.agency} icon={<Building2 size={14} color="#9CA3AF" />} />
                <InfoItem label="Address" value={proposal.address} icon={<MapPin size={14} color="#9CA3AF" />} />
              </View>

              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <InfoItem label="Telephone" value={proposal.telephone} icon={<Phone size={14} color="#9CA3AF" />} />
                <InfoItem label="Email" value={proposal.email} icon={<Mail size={14} color="#9CA3AF" />} />
              </View>
            </View>

            {/* --- Cooperating Agencies --- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Users size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Cooperating Agencies</Text>
              </View>
              <Text style={styles.bodyText}>{proposal.cooperatingAgencies || "None"}</Text>
            </View>

            {/* --- R&D Station & Classification --- */}
            <View style={styles.dualGrid}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Microscope size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>R&D Station</Text>
                </View>
                <Text style={styles.bodyText}>{proposal.rdStation || "N/A"}</Text>
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Tags size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Classification</Text>
                </View>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>{proposal.classification}: </Text>
                  {proposal.classificationDetails}
                </Text>
              </View>
            </View>

            {/* --- Mode & Priority --- */}
            <View style={styles.dualGrid}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FileText size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Mode of Implementation</Text>
                </View>
                <Text style={styles.bodyText}>{proposal.modeOfImplementation}</Text>
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Target size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Priority Areas</Text>
                </View>
                <Text style={styles.bodyText}>{proposal.priorityAreas}</Text>
              </View>
            </View>

            {/* --- Sector & Discipline --- */}
            <View style={styles.dualGrid}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Briefcase size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Sector/Commodity</Text>
                </View>
                <Text style={styles.bodyText}>{proposal.sector}</Text>
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <BookOpen size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Discipline</Text>
                </View>
                <Text style={styles.bodyText}>{proposal.discipline}</Text>
              </View>
            </View>

            {/* --- Implementing Schedule --- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Calendar size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Implementing Schedule</Text>
              </View>
              <View style={styles.scheduleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>DURATION</Text>
                  <Text style={styles.value}>{proposal.duration}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>START DATE</Text>
                  <Text style={styles.value}>{proposal.startDate}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>END DATE</Text>
                  <Text style={styles.value}>{proposal.endDate}</Text>
                </View>
              </View>
            </View>

            {/* --- Budget Table --- */}
            {proposal.budgetSources && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <DollarSign size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Estimated Budget by Source</Text>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCell, styles.headerCell, { width: 100 }]}>Source</Text>
                      <Text style={[styles.tableCell, styles.headerCell, styles.rightCell]}>PS</Text>
                      <Text style={[styles.tableCell, styles.headerCell, styles.rightCell]}>MOOE</Text>
                      <Text style={[styles.tableCell, styles.headerCell, styles.rightCell]}>CO</Text>
                      <Text style={[styles.tableCell, styles.headerCell, styles.rightCell, { borderRightWidth: 0 }]}>TOTAL</Text>
                    </View>
                    {proposal.budgetSources.map((budget, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 100 }]} numberOfLines={1}>{budget.source}</Text>
                        <Text style={[styles.tableCell, styles.rightCell]}>{budget.ps}</Text>
                        <Text style={[styles.tableCell, styles.rightCell]}>{budget.mooe}</Text>
                        <Text style={[styles.tableCell, styles.rightCell]}>{budget.co}</Text>
                        <Text style={[styles.tableCell, styles.rightCell, styles.boldText, { borderRightWidth: 0 }]}>{budget.total}</Text>
                      </View>
                    ))}
                    <View style={[styles.tableRow, styles.tableFooter]}>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold' }]}>TOTAL</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: ACCENT_COLOR }}>
                          {proposal.budgetTotal || '→'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                <Text style={styles.footnote}>PS: Personal Services | MOOE: Maintenance & Other Exp. | CO: Capital Outlay</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

// --- Sub-components for Cleaner JSX ---
const InfoItem = ({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) => (
  <View style={{ flex: 1, marginBottom: 4 }}>
    <Text style={styles.label}>{label}</Text>
    {icon ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {icon}
        <Text style={styles.value}>{value || 'N/A'}</Text>
      </View>
    ) : (
      <Text style={[styles.value, { marginTop: 2 }]}>{value || 'N/A'}</Text>
    )}
  </View>
);

const AssessmentItem = ({ label, text }: { label: string; text: string }) => (
  <View style={styles.assessmentItem}>
    <Text style={styles.assessmentLabel}>{label}</Text>
    <Text style={styles.assessmentText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
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
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  formNo: {
    fontSize: 10,
    color: '#64748B',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 24,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  
  // Alerts
  alertSection: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  orangeAlert: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  redAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitleOrange: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  alertTitleRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  rejectionText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  deadlineBox: {
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deadlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  assessmentList: {
    gap: 12,
  },
  assessmentItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  assessmentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 4,
  },
  assessmentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  overallBox: {
    backgroundColor: '#FFEDD5',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  overallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 2,
  },
  overallText: {
    fontSize: 13,
    color: '#7C2D12',
    fontStyle: 'italic',
  },

  // Sections
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionHeaderBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  filesGrid: {
    gap: 12,
  },
  fileCardDisabled: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F1F5F9',
    opacity: 0.8,
  },
  fileCardActive: {
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    shadowColor: '#9333EA',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  singleFileCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  fileDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconBg: {
    width: 40,
    height: 48,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  fileSize: {
    fontSize: 11,
    color: '#64748B',
  },
  downloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  downloadText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  
  // Table
  tableContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 400,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
  },
  tableFooter: {
    backgroundColor: '#E2E8F0',
    borderBottomWidth: 0,
  },
  tableCell: {
    padding: 8,
    fontSize: 11,
    color: '#334155',
    width: 70,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  headerCell: {
    fontWeight: '700',
    color: '#475569',
  },
  rightCell: {
    textAlign: 'right',
  },
  boldText: {
    fontWeight: '600',
    color: '#1E293B',
  },
  footnote: {
    fontSize: 9,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
  },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
  },
  closeBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DetailedProposalModal;