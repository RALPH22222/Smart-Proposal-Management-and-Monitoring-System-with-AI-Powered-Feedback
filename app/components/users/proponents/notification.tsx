import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

// Define the shape of a notification item
export interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  unreadCount: number; // Kept in interface if needed for badge logic elsewhere
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onViewAll: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onViewAll,
}) => {
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.read ? styles.readItem : styles.unreadItem,
      ]}
      onPress={() => onMarkRead(item.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: item.read ? 'transparent' : '#C8102E' },
        ]}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* TouchableWithoutFeedback + overlay allows clicking outside to close.
        We wrap the inner View in another TouchableWithoutFeedback to prevent 
        clicks inside the dropdown from closing it.
      */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={onMarkAllRead}>
                    <Text style={styles.markReadText}>Mark all read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="times" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* List */}
              <View style={styles.listContainer}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No notifications</Text>
                  </View>
                ) : (
                  <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.listContent}
                  />
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', 
  },
  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40, // Adjust based on your Header height
    right: 16,
    width: 320, // w-80 equivalent
    maxHeight: 400,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 5,
    overflow: 'hidden',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markReadText: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },

  // List
  listContainer: {
    maxHeight: 250, // max-h-56 equivalent-ish
  },
  listContent: {
    paddingBottom: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  readItem: {
    backgroundColor: 'white',
  },
  unreadItem: {
    backgroundColor: '#F9FAFB', // gray-50
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Footer
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#C8102E',
    fontWeight: '500',
  },
});

export default NotificationsDropdown;