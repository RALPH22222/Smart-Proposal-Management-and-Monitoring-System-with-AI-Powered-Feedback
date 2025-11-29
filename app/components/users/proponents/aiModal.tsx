import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

// Define types locally since we don't have access to your file
export interface AICheckResult {
  title: string;
  isValid: boolean;
  score: number;
  type: 'form' | 'template'; // Inferred from usage
  issues: string[];
  suggestions: string[];
}

interface AIModalProps {
  show: boolean;
  onClose: () => void;
  aiCheckResult: AICheckResult | null;
  isChecking: boolean;
  checkType: 'template' | 'form';
}

const { height } = Dimensions.get('window');

const AIModal: React.FC<AIModalProps> = ({
  show,
  onClose,
  aiCheckResult,
  isChecking,
  checkType,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={show}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Icon name="android" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {aiCheckResult?.title || 'AI Analysis'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {checkType === 'form'
                    ? 'Form completion insights'
                    : 'Document template analysis'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentScroll}>
            <View style={styles.contentContainer}>
              {isChecking ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>
                    AI is analyzing your {checkType}...
                  </Text>
                  <Text style={styles.loadingSubtext}>
                    This may take a few moments
                  </Text>
                </View>
              ) : aiCheckResult ? (
                <View style={styles.resultContainer}>
                  {/* Status Card */}
                  <View
                    style={[
                      styles.statusCard,
                      aiCheckResult.isValid
                        ? styles.statusCardSuccess
                        : styles.statusCardWarning,
                    ]}
                  >
                    <View style={styles.statusHeader}>
                      <View style={styles.statusLeft}>
                        <View
                          style={[
                            styles.statusIconBox,
                            aiCheckResult.isValid
                              ? styles.bgGreen100
                              : styles.bgOrange100,
                          ]}
                        >
                          <Icon
                            name={aiCheckResult.isValid ? 'check' : 'warning'}
                            size={18}
                            color={aiCheckResult.isValid ? '#16A34A' : '#EA580C'}
                          />
                        </View>
                        <View style={styles.statusTexts}>
                          <Text style={styles.statusTitle}>
                            {aiCheckResult.isValid
                              ? 'All Set!'
                              : 'Needs Improvement'}
                          </Text>
                          <Text style={styles.statusDescription}>
                            {aiCheckResult.isValid
                              ? `Your ${
                                  aiCheckResult.type === 'form'
                                    ? 'form looks great!'
                                    : 'template meets requirements!'
                                }`
                              : 'Some areas need attention before submission'}
                          </Text>
                        </View>
                      </View>

                      {/* Score Badge */}
                      <View
                        style={[
                          styles.scoreBadge,
                          aiCheckResult.score >= 80
                            ? styles.bgGreen100
                            : aiCheckResult.score >= 60
                            ? styles.bgOrange100
                            : styles.bgRed100,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreText,
                            aiCheckResult.score >= 80
                              ? styles.textGreen700
                              : aiCheckResult.score >= 60
                              ? styles.textOrange700
                              : styles.textRed700,
                          ]}
                        >
                          {aiCheckResult.score}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Issues Section */}
                  {aiCheckResult.issues.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Icon name="exclamation-triangle" size={16} color="#F97316" />
                        <Text style={styles.sectionTitle}>
                          Areas for Improvement
                        </Text>
                      </View>
                      <View style={styles.listContainerWarning}>
                        {aiCheckResult.issues.map((issue, index) => (
                          <View key={index} style={styles.listItem}>
                            <View style={styles.bulletWarning} />
                            <Text style={styles.listText}>{issue}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Suggestions Section */}
                  {aiCheckResult.suggestions.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Icon name="magic" size={16} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>
                          AI Recommendations
                        </Text>
                      </View>
                      <View style={styles.listContainerInfo}>
                        {aiCheckResult.suggestions.map((suggestion, index) => (
                          <View key={index} style={styles.listItem}>
                            <View style={styles.bulletInfo} />
                            <Text style={styles.listText}>{suggestion}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Success State */}
                  {aiCheckResult.isValid && aiCheckResult.issues.length === 0 && (
                    <View style={styles.successContainer}>
                      <Icon name="check" size={40} color="#22C55E" />
                      <Text style={styles.successTitle}>Excellent!</Text>
                      <Text style={styles.successText}>
                        Your{' '}
                        {aiCheckResult.type === 'form'
                          ? 'form is complete'
                          : 'document template meets all requirements'}{' '}
                        and is ready for submission.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, styles.buttonOutline]}
              >
                <Text style={styles.buttonTextOutline}>Close</Text>
              </TouchableOpacity>

              {aiCheckResult && !aiCheckResult.isValid && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.button, styles.buttonPrimary]}
                >
                  <Text style={styles.buttonTextPrimary}>Review Issues</Text>
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
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500, // md:max-w-2xl equivalent logic
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },

  // Header
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: '#DC2626', // Red-600
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4B5563',
  },
  closeButton: {
    padding: 8,
  },

  // Content
  contentScroll: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },

  // Results
  resultContainer: {
    gap: 16,
  },
  
  // Status Card
  statusCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusCardSuccess: {
    backgroundColor: '#F0FDF4', // green-50
    borderColor: '#BBF7D0', // green-200
  },
  statusCardWarning: {
    backgroundColor: '#FFF7ED', // orange-50
    borderColor: '#FED7AA', // orange-200
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusIconBox: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  statusTexts: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 13,
    color: '#4B5563',
  },

  // Scores
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Colors helpers
  bgGreen100: { backgroundColor: '#DCFCE7' },
  bgOrange100: { backgroundColor: '#FFEDD5' },
  bgRed100: { backgroundColor: '#FEE2E2' },
  textGreen700: { color: '#15803D' },
  textOrange700: { color: '#C2410C' },
  textRed700: { color: '#B91C1C' },

  // Sections
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContainerWarning: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  listContainerInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletWarning: {
    width: 6,
    height: 6,
    backgroundColor: '#F97316',
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  bulletInfo: {
    width: 6,
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  listText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },

  // Success State
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803D',
    marginTop: 8,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },

  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  buttonPrimary: {
    backgroundColor: '#DC2626',
  },
  buttonTextOutline: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default AIModal;