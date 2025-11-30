import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Calendar,
  User,
  MapPin,
  DollarSign,
  X,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Building2,
  Phone,
  Mail,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  FileText
} from 'lucide-react-native';

// --- Types ---
export type ProjectStatus = 'Pending' | 'Approved' | 'Rejected' | 'Ongoing' | 'Completed';
export type ProjectPhase = 'Planning' | 'Implementation' | 'Review' | 'Closure';

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  currentPhase: ProjectPhase;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  budget: number;
  principalInvestigator: string;
  department: string;
  projectId: string;
  collaborators?: string[];
  milestones?: {
    name: string;
    completed: boolean;
    dueDate: string;
    description?: string;
  }[];
  researchArea?: string;
}

interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

// Extended Interface
interface ExtendedProject extends Project {
  proponent?: string;
  gender?: string;
  address?: string;
  telephone?: string;
  email?: string;
  agency?: string;
  cooperatingAgencies?: string;
  rdStation?: string;
  classification?: string;
  classificationDetails?: string;
  modeOfImplementation?: string;
  priorityAreas?: string;
  sector?: string;
  discipline?: string;
  duration?: string;
  budgetSources?: BudgetSource[];
  budgetTotal?: string;
}

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  getStatusBadge?: (status: ProjectStatus) => string; 
  getPhaseBadge?: (phase: ProjectPhase) => string;
  getDaysRemaining: (endDate: string) => number;
}

// --- Constants ---
const ACCENT_COLOR = "#C10003";

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project: baseProject,
  isOpen,
  onClose,
  getDaysRemaining
}) => {
  if (!baseProject || !isOpen) return null;

  const project = baseProject as ExtendedProject;
  const daysRemaining = getDaysRemaining(project.endDate);
  const isOverdue = daysRemaining < 0 && project.completionPercentage < 100;

  // --- Helper for Styles ---
  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'Completed': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'Ongoing': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'Pending': return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  const getPhaseStyle = (phase: ProjectPhase) => {
    return { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' }; 
  };

  const statusStyle = getStatusStyle(project.status);
  const phaseStyle = getPhaseStyle(project.currentPhase);

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
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleRow}>
                <BarChart3 size={20} color={ACCENT_COLOR} />
                <Text style={styles.headerLabel}>Project Details</Text>
                <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                  <Text style={[styles.badgeText, { color: statusStyle.text }]}>{project.status}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
            
            <View style={styles.headerMeta}>
              <View style={styles.metaItem}>
                <User size={12} color="#64748B" />
                <Text style={styles.metaText}>{project.principalInvestigator}</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={12} color="#64748B" />
                <Text style={styles.metaText}>{project.department}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, styles.monoText]}>{project.projectId}</Text>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* Top Metrics Grid (2x2) */}
            <View style={styles.metricsGrid}>
              
              {/* Timeline */}
              <View style={[styles.metricCard, isOverdue ? styles.metricCardError : styles.metricCardSuccess]}>
                <View style={styles.metricHeader}>
                  <Clock size={16} color={isOverdue ? "#DC2626" : "#16A34A"} />
                  <Text style={styles.metricLabel}>Timeline</Text>
                </View>
                <Text style={[styles.metricValue, isOverdue ? { color: '#B91C1C' } : { color: '#15803D' }]}>
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                </Text>
                <Text style={styles.metricSub}>
                  {new Date(project.startDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})} - {new Date(project.endDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric', year:'2-digit'})}
                </Text>
              </View>

              {/* Progress */}
              <View style={[styles.metricCard, styles.metricCardBlue]}>
                <View style={styles.metricHeader}>
                  <TrendingUp size={16} color="#2563EB" />
                  <Text style={styles.metricLabel}>Progress</Text>
                </View>
                <Text style={[styles.metricValue, { color: '#1D4ED8' }]}>{project.completionPercentage}% Complete</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${project.completionPercentage}%` }]} />
                </View>
              </View>

              {/* Budget */}
              <View style={[styles.metricCard, styles.metricCardYellow]}>
                <View style={styles.metricHeader}>
                  <DollarSign size={16} color="#D97706" />
                  <Text style={styles.metricLabel}>Budget</Text>
                </View>
                <Text style={[styles.metricValue, { color: '#B45309' }]}>
                  ₱{project.budget.toLocaleString()}
                </Text>
                <Text style={styles.metricSub}>Total allocated</Text>
              </View>

              {/* Phase */}
              <View style={[styles.metricCard, styles.metricCardTeal]}>
                <View style={styles.metricHeader}>
                  <Target size={16} color="#059669" />
                  <Text style={styles.metricLabel}>Phase</Text>
                </View>
                <View style={[styles.phaseBadge, { backgroundColor: phaseStyle.bg, borderColor: phaseStyle.border }]}>
                  <Text style={[styles.phaseText, { color: phaseStyle.text }]}>{project.currentPhase}</Text>
                </View>
              </View>

            </View>

            <View style={styles.spacer} />

            {/* Leader & Agency Info */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <User size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Leader & Agency Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>LEADER / PROPONENT</Text>
                  <Text style={styles.infoValue}>{project.principalInvestigator}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>GENDER</Text>
                  <Text style={styles.infoValue}>{project.gender || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>AGENCY</Text>
                  <View style={styles.iconRow}>
                    <Building2 size={14} color="#9CA3AF" />
                    <Text style={styles.infoValue}>{project.agency || project.department}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ADDRESS</Text>
                  <View style={styles.iconRow}>
                    <MapPin size={14} color="#9CA3AF" />
                    <Text style={styles.infoValue}>{project.address || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>TELEPHONE</Text>
                  <View style={styles.iconRow}>
                    <Phone size={14} color="#9CA3AF" />
                    <Text style={styles.infoValue}>{project.telephone || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <View style={styles.iconRow}>
                    <Mail size={14} color="#9CA3AF" />
                    <Text style={styles.infoValue}>{project.email || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.spacer} />

            {/* Other Details Sections */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Users size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Cooperating Agencies</Text>
              </View>
              <Text style={styles.bodyText}>
                {project.cooperatingAgencies || (project.collaborators ? project.collaborators.join(', ') : 'None')}
              </Text>
            </View>

            <View style={styles.spacer} />

            <View style={styles.gridRow}>
              <View style={[styles.sectionCard, { flex: 1 }]}>
                <View style={styles.sectionHeader}>
                  <Microscope size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>R&D Station</Text>
                </View>
                <Text style={styles.bodyText}>{project.rdStation || project.researchArea || 'N/A'}</Text>
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.sectionCard, { flex: 1 }]}>
                <View style={styles.sectionHeader}>
                  <Tags size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Classification</Text>
                </View>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>{project.classification || 'N/A'}: </Text>
                  {project.classificationDetails}
                </Text>
              </View>
            </View>

            <View style={styles.spacer} />

            {/* Implementing Schedule */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Calendar size={16} color={ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Implementing Schedule</Text>
              </View>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.infoLabel}>DURATION</Text>
                  <Text style={styles.infoValue}>
                    {project.duration || `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
                  </Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.infoLabel}>START</Text>
                  <Text style={styles.infoValue}>{new Date(project.startDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.infoLabel}>END</Text>
                  <Text style={styles.infoValue}>{new Date(project.endDate).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.spacer} />

            {/* Budget Table */}
            {project.budgetSources && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <DollarSign size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Estimated Budget</Text>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 100 }]}>Source</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.cellRight]}>PS</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.cellRight]}>MOOE</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.cellRight]}>CO</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.cellRight, { borderRightWidth: 0 }]}>TOTAL</Text>
                    </View>

                    {/* Rows */}
                    {project.budgetSources.map((budget, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 100 }]} numberOfLines={1}>{budget.source}</Text>
                        <Text style={[styles.tableCell, styles.cellRight]}>{budget.ps}</Text>
                        <Text style={[styles.tableCell, styles.cellRight]}>{budget.mooe}</Text>
                        <Text style={[styles.tableCell, styles.cellRight]}>{budget.co}</Text>
                        <Text style={[styles.tableCell, styles.cellRight, styles.boldText, { borderRightWidth: 0 }]}>{budget.total}</Text>
                      </View>
                    ))}

                    {/* Total Row */}
                    <View style={[styles.tableRow, styles.tableFooterRow]}>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold' }]}>TOTAL</Text>
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: ACCENT_COLOR }}>
                          {project.budgetTotal || `₱${project.budget.toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                <Text style={styles.footnote}>PS: Personal Services | MOOE: Maintenance & Other Exp. | CO: Capital Outlay</Text>
              </View>
            )}

            <View style={styles.spacer} />

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <CheckCircle size={16} color={ACCENT_COLOR} />
                  <Text style={styles.sectionTitle}>Milestones</Text>
                </View>
                
                {project.milestones.map((milestone, index) => {
                   const isCompleted = milestone.completed;
                   const isOverdueMilestone = !isCompleted && new Date(milestone.dueDate) < new Date();
                   
                   return (
                    <View key={index} style={styles.milestoneCard}>
                      <View style={styles.milestoneHeader}>
                        <Text style={styles.milestoneTitle}>{milestone.name}</Text>
                        <View style={[
                          styles.milestoneBadge,
                          isCompleted ? styles.badgeSuccess : isOverdueMilestone ? styles.badgeError : styles.badgeWarning
                        ]}>
                          <Text style={[
                            styles.milestoneBadgeText,
                            isCompleted ? styles.textSuccess : isOverdueMilestone ? styles.textError : styles.textWarning
                          ]}>
                            {isCompleted ? 'Completed' : isOverdueMilestone ? 'Overdue' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.milestoneDate}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</Text>
                      {milestone.description && (
                        <Text style={styles.milestoneDesc} numberOfLines={2}>{milestone.description}</Text>
                      )}
                    </View>
                   );
                })}
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

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalView: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contentContainer: {
    padding: 16,
  },
  
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%', 
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  metricCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  metricCardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  metricCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  metricCardYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  metricCardTeal: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#64748B',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#BFDBFE',
    borderRadius: 3,
    marginTop: 6,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  phaseText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
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
    gap: 12,
  },
  infoItem: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  spacer: {
    height: 16,
  },
  
  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flex: 1,
  },
  
  // Budget Table
  tableContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 400, // Force scroll on small screens
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  tableHeaderRow: {
    backgroundColor: '#F1F5F9',
  },
  tableFooterRow: {
    backgroundColor: '#E2E8F0',
    borderBottomWidth: 0,
  },
  tableCell: {
    padding: 8,
    fontSize: 11,
    color: '#334155',
    width: 70, // Default width
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: '#475569',
  },
  cellRight: {
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
  
  // Milestones
  milestoneCard: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  milestoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  milestoneBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeSuccess: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  textSuccess: { color: '#166534' },
  badgeError: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  textError: { color: '#991B1B' },
  badgeWarning: { backgroundColor: '#FEF9C3', borderColor: '#FEF08A' },
  textWarning: { color: '#854D0E' },
  milestoneDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 11,
    color: '#94A3B8',
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

export default RnDProjectDetailModal;