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
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  MessageSquare,
  Clock,
  Calendar,
  X,
  User
} from 'lucide-react-native';

// --- Interfaces ---
export interface EvaluatorDecision {
  evaluatorId: string;
  evaluatorName: string;
  decision: string;
  comments: string;
  submittedDate: string;
  ratings?: {
    objectives: number;
    methodology: number;
    budget: number;
    timeline: number;
  };
}

interface EvaluatorDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: EvaluatorDecision;
  proposalTitle: string;
  proposalId: string;
}

// --- Constants ---
const RATING_CRITERIA = {
  objectives: {
    label: "Objectives Assessment",
    descriptions: {
      5: "Objectives are crystal clear, highly measurable, and very significant to the field with clear alignment to national priorities",
      4: "Objectives are clear and relevant with well-defined metrics and good alignment",
      3: "Objectives are understandable but lack specificity in some areas or could be more significant",
      2: "Objectives are vague, poorly justified, or lack clear connection to project scope",
      1: "Objectives are unclear, not measurable, or insignificant to the research field",
    },
  },
  methodology: {
    label: "Methodology Assessment",
    descriptions: {
      5: "Methodology is rigorous, innovative, well-designed, and highly feasible with detailed implementation plan",
      4: "Methodology is sound with appropriate methods, tools, and realistic timeline",
      3: "Methodology is acceptable but has some gaps in detail or minor feasibility concerns",
      2: "Methodology has significant flaws, questionable feasibility, or unclear implementation steps",
      1: "Methodology is inadequate, not clearly described, or fundamentally flawed",
    },
  },
  budget: {
    label: "Budget Assessment",
    descriptions: {
      5: "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan",
      4: "Budget is appropriate with minor justification gaps or minor allocation concerns",
      3: "Budget is acceptable but lacks detailed justification for some line items",
      2: "Budget appears inflated or inadequately justified with unclear allocation logic",
      1: "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency",
    },
  },
  timeline: {
    label: "Timeline Assessment",
    descriptions: {
      5: "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers",
      4: "Timeline is reasonable with appropriate milestones and reasonable contingency planning",
      3: "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions",
      2: "Timeline appears unrealistic, poorly structured, or lacks clear milestones",
      1: "Timeline is not feasible, unclear, or unrealistic given the project scope",
    },
  },
};

const EvaluatorDecisionModal: React.FC<EvaluatorDecisionModalProps> = ({
  isOpen,
  onClose,
  decision,
  proposalTitle,
  proposalId
}) => {
  if (!decision) return null;

  // --- Helpers for Styles ---
  const getDecisionTheme = (decisionStatus: string) => {
    switch (decisionStatus) {
      case 'Approve':
        return {
          bg: '#ECFDF5', // emerald-50
          border: '#A7F3D0', // emerald-200
          text: '#059669', // emerald-600
          icon: <CheckCircle size={20} color="#059669" />
        };
      case 'Revise':
        return {
          bg: '#FFFBEB', // yellow-50
          border: '#FDE68A', // yellow-200
          text: '#D97706', // yellow-600
          icon: <RotateCcw size={20} color="#D97706" />
        };
      case 'Reject':
        return {
          bg: '#FEF2F2', // red-50
          border: '#FECACA', // red-200
          text: '#DC2626', // red-600
          icon: <XCircle size={20} color="#DC2626" />
        };
      default:
        return {
          bg: '#F8FAFC', // slate-50
          border: '#E2E8F0', // slate-200
          text: '#475569', // slate-600
          icon: <FileText size={20} color="#475569" />
        };
    }
  };

  const getRatingTheme = (value: number) => {
    if (value >= 4) return { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' }; // emerald
    if (value === 3) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' }; // blue
    return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' }; // yellow
  };

  const decisionTheme = getDecisionTheme(decision.decision);

  // Helper to safely access dynamic keys
  const getDescription = (key: keyof typeof RATING_CRITERIA, rating: number) => {
    const criteria = RATING_CRITERIA[key];
    // Cast to any to access number keys on the descriptions object safely
    return (criteria.descriptions as any)[rating] || "No description available.";
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
            <View style={styles.headerTitleContainer}>
              {decisionTheme.icon}
              <View>
                <Text style={styles.headerTitle}>Evaluator Assessment</Text>
                <Text style={styles.headerSubtitle}>Detailed review and comments</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            {/* Proposal Info */}
            <View style={styles.infoSection}>
              {/* Row 1: Title & Evaluator */}
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.label}>PROJECT TITLE</Text>
                  <Text style={styles.infoText} numberOfLines={2}>{proposalTitle}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.label}>EVALUATOR</Text>
                  <View style={styles.iconTextRow}>
                    <User size={14} color="#94A3B8" />
                    <Text style={styles.infoText}>{decision.evaluatorName}</Text>
                  </View>
                </View>
              </View>

              {/* Row 2: ID & Date */}
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.label}>PROPOSAL ID</Text>
                  <Text style={styles.infoText}>{proposalId}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.label}>EVALUATION DATE</Text>
                  <View style={styles.dateRow}>
                    <View style={styles.iconTextRow}>
                      <Calendar size={14} color="#64748B" />
                      <Text style={styles.dateText}>
                        {new Date(decision.submittedDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.iconTextRow}>
                      <Clock size={14} color="#64748B" />
                      <Text style={styles.dateText}>
                        {new Date(decision.submittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Decision Badge */}
            <View style={[
              styles.decisionBadge, 
              { backgroundColor: decisionTheme.bg, borderColor: decisionTheme.border }
            ]}>
              {decisionTheme.icon}
              <Text style={[styles.decisionText, { color: decisionTheme.text }]}>
                Decision: {decision.decision}
              </Text>
            </View>

            {/* Ratings Section */}
            {decision.ratings && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MessageSquare size={20} color="#C8102E" />
                  <Text style={styles.sectionTitle}>Evaluator Ratings</Text>
                </View>

                {/* Rating Cards */}
                {(Object.keys(decision.ratings) as Array<keyof typeof RATING_CRITERIA>).map((key) => {
                  const ratingValue = decision.ratings![key];
                  const ratingTheme = getRatingTheme(ratingValue);
                  const criteria = RATING_CRITERIA[key];

                  return (
                    <View key={key} style={styles.ratingCard}>
                      <View style={styles.ratingHeader}>
                        <Text style={styles.ratingLabel}>{criteria.label}</Text>
                        <View style={styles.scoreBadge}>
                          <Text style={styles.scoreText}>{ratingValue}/5</Text>
                        </View>
                      </View>
                      
                      <View style={[
                        styles.descriptionBox,
                        { backgroundColor: ratingTheme.bg, borderColor: ratingTheme.border }
                      ]}>
                        <Text style={[styles.descriptionText, { color: ratingTheme.text }]}>
                          {getDescription(key, ratingValue)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsLabel}>Comments</Text>
              <View style={styles.commentsBox}>
                <Text style={styles.commentsText}>{decision.comments}</Text>
              </View>
            </View>

            {/* Bottom Padding for Scroll */}
            <View style={{ height: 20 }} />

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalView: {
    width: '100%',
    maxHeight: '90%',
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
    backgroundColor: '#F8FAFC', // slate-50
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B', // slate-800
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B', // slate-500
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  
  // Info Section
  infoSection: {
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCol: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B', // slate-500
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 20,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#475569',
  },

  // Decision Badge
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  decisionText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Ratings Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  scoreBadge: {
    backgroundColor: '#C8102E',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Comments
  commentsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  commentsBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentsText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },

  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  closeBtn: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  closeBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EvaluatorDecisionModal;