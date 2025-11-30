import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Gavel } from 'lucide-react-native';

// --- Types ---
export interface EndorsementProposal {
  id: string;
  title: string;
}

interface EndorsementDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: EndorsementProposal | null;
  onConfirm: (action: 'endorsed' | 'revised' | 'rejected', remarks: string) => void;
}

const EndorsementDecisionModal: React.FC<EndorsementDecisionModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onConfirm,
}) => {
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState<'endorsed' | 'revised' | 'rejected'>('endorsed');

  const handleConfirm = () => {
    if (proposal) {
      onConfirm(action, remarks);
      setRemarks('');
      setAction('endorsed');
    }
  };

  const handleClose = () => {
    setRemarks('');
    setAction('endorsed');
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Final Endorsement</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.proposalPreviewTitle} numberOfLines={2}>
              {proposal?.title || ''}
            </Text>

            <Text style={styles.inputLabel}>Action</Text>
            <View style={styles.actionButtons}>
              {[
                { id: 'endorsed', label: 'Endorse', color: '#10B981', bg: '#ECFDF5' },
                { id: 'revised', label: 'Return', color: '#F59E0B', bg: '#FFFBEB' },
                { id: 'rejected', label: 'Reject', color: '#EF4444', bg: '#FEF2F2' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.actionOption,
                    action === opt.id && { backgroundColor: opt.bg, borderColor: opt.color, borderWidth: 2 }
                  ]}
                  onPress={() => setAction(opt.id as 'endorsed' | 'revised' | 'rejected')}
                >
                  <Text style={[
                    styles.actionOptionText, 
                    action === opt.id && { color: opt.color, fontWeight: 'bold' }
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Remarks</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Enter remarks or instructions..."
              placeholderTextColor="#94A3B8"
              value={remarks}
              onChangeText={setRemarks}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: action === 'rejected' ? '#EF4444' : action === 'revised' ? '#F59E0B' : '#10B981' }]}
              onPress={handleConfirm}
            >
              <Gavel size={16} color="#FFF" />
              <Text style={styles.submitButtonText}>Confirm {action.charAt(0).toUpperCase() + action.slice(1)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
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
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalBody: {
    padding: 16,
  },
  proposalPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  actionOptionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    color: '#1E293B',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EndorsementDecisionModal;
