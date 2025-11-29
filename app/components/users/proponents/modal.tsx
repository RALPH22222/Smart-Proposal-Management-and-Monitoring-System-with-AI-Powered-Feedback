import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Clipboard
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type Project = {
  id: string;
  title: string;
  currentIndex: number;
  submissionDate: string;
  lastUpdated: string;
  budget: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  evaluators: number;
};

interface ShareModalProps {
  isOpen: boolean;
  project: Project | null;
  shareEmail: string;
  copied: boolean;
  onClose: () => void;
  onEmailChange: (email: string) => void;
  onCopyLink: () => void;
  onInviteEmail: () => void;
}

const { width } = Dimensions.get('window');

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  project,
  shareEmail,
  copied,
  onClose,
  onEmailChange,
  onCopyLink,
  onInviteEmail
}) => {
  if (!isOpen || !project) return null;

  // Mocking the URL generation for mobile
  const projectUrl = `https://app.yourdomain.com/projects/${project.id}`;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch handler */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Icon name="share-alt" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
                <Text style={styles.subtitle}>
                  Share access with team members or copy link
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Project Link Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Project link</Text>
              <View style={styles.inputRow}>
                <TextInput
                  editable={false}
                  value={projectUrl}
                  style={[styles.input, styles.readOnlyInput]}
                />
                <TouchableOpacity
                  onPress={onCopyLink}
                  style={styles.copyButton}
                >
                  {copied ? (
                    <Text style={styles.copyButtonText}>Copied</Text>
                  ) : (
                    <>
                      <Icon name="link" size={12} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Invite Email Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Invite by email</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={shareEmail}
                  onChangeText={onEmailChange}
                  placeholder="name@organization.com"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  onPress={onInviteEmail}
                  style={styles.inviteButton}
                >
                  <Icon name="user-plus" size={12} color="#374151" style={styles.buttonIcon} />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Invited users will receive a link to access this project (demo).
              </Text>
            </View>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.footerCloseButton}
              >
                <Text style={styles.footerCloseText}>Close</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: '#C8102E', // Fallback for gradient
    borderRadius: 8,
    marginRight: 12,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },

  // Content
  content: {
    padding: 20,
    gap: 16,
  },
  section: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  readOnlyInput: {
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },
  
  // Buttons
  copyButton: {
    backgroundColor: '#C8102E',
    borderRadius: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inviteButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  inviteButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 6,
  },
  
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  footerCloseButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  footerCloseText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ShareModal;