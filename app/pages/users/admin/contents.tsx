import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../types/navigation';
import AdminNavBar from '../../../components/users/admin/sidebar';
import { 
  FileText, 
  ClipboardList, 
  LayoutTemplate, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  X,
  Grid,
  List as ListIcon,
  Download,
  Edit2,
  Trash2,
  Globe,
  MoreHorizontal
} from 'lucide-react-native';

// --- Types & Mock Data ---

// Guidelines Data
const initialGuidelines = [
  { id: 1, title: 'Proposal Writing Guidelines', type: 'PDF', size: '2.3 MB', uploadDate: '2024-02-15' },
  { id: 2, title: 'Evaluation Rubric Template', type: 'DOCX', size: '1.1 MB', uploadDate: '2024-02-10' }
];

const initialFaqs = [
  { id: 1, question: 'How do I submit a proposal?', answer: "Navigate to the proposals section and click 'New Proposal' to start." },
  { id: 2, question: 'What is the deadline?', answer: 'The deadline varies by quarter. Check announcements.' }
];

// Templates Data
const initialTemplates = [
  { id: 1, name: 'Research Proposal Template', type: 'DOCX', version: '2.1', lastUpdated: '2024-02-15', category: 'Research' },
  { id: 2, name: 'Project Proposal Template', type: 'PDF', version: '1.8', lastUpdated: '2024-02-10', category: 'Project' }
];

// Static Pages Data
const initialPages = [
  { id: 1, title: 'About the System', slug: 'about', lastModified: '2024-02-15', status: 'published' },
  { id: 2, title: 'Mission & Vision', slug: 'mission-vision', lastModified: '2024-02-10', status: 'published' },
  { id: 3, title: 'Contact Information', slug: 'contact', lastModified: '2024-02-08', status: 'draft' },
  { id: 4, title: 'Privacy Policy', slug: 'privacy', lastModified: '2024-01-20', status: 'published' }
];

// Media Data
const initialMedia = [
  { id: 1, name: 'logo-wmsu.png', type: 'image', size: '245 KB', uploadDate: '2024-02-15', category: 'Branding', department: 'Admin' },
  { id: 2, name: 'proposal-guidelines.pdf', type: 'document', size: '1.2 MB', uploadDate: '2024-02-10', category: 'Guidelines', department: 'R&D' },
  { id: 3, name: 'presentation.pptx', type: 'presentation', size: '3.4 MB', uploadDate: '2024-02-08', category: 'Templates', department: 'All' },
  { id: 4, name: 'banner-main.jpg', type: 'image', size: '1.5 MB', uploadDate: '2024-02-18', category: 'Branding', department: 'Admin' },
];

export default function AdminContents() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState('guidelines');
  
  // State for different sections
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'upload', 'faq', 'page', 'template'

  // Navigation Handler
  const handleNavigate = (route: string) => {
    switch (route) {
      case 'Dashboard': navigation.navigate('AdminDashboard' as any); break;
      case 'Accounts': navigation.navigate('AdminAccounts' as any); break;
      case 'Contents': navigation.navigate('AdminContents' as any); break;
      case 'Reports': navigation.navigate('AdminReports' as any); break;
      case 'System': navigation.navigate('AdminSystem' as any); break;
      default: break;
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  // --- Render Sections ---

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'guidelines' && styles.activeTabItem]}
          onPress={() => setActiveTab('guidelines')}
        >
          <ClipboardList size={16} color={activeTab === 'guidelines' ? '#C8102E' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'guidelines' && styles.activeTabText]}>Guidelines</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'templates' && styles.activeTabItem]}
          onPress={() => setActiveTab('templates')}
        >
          <FileText size={16} color={activeTab === 'templates' ? '#C8102E' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>Templates</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'static' && styles.activeTabItem]}
          onPress={() => setActiveTab('static')}
        >
          <LayoutTemplate size={16} color={activeTab === 'static' ? '#C8102E' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'static' && styles.activeTabText]}>Pages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'media' && styles.activeTabItem]}
          onPress={() => setActiveTab('media')}
        >
          <ImageIcon size={16} color={activeTab === 'media' ? '#C8102E' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>Media</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderGuidelines = () => (
    <View style={styles.sectionContainer}>
      {/* Guidelines Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <TouchableOpacity style={styles.actionButtonSmall} onPress={() => openModal('upload')}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Files List */}
      <View style={styles.cardList}>
        {initialGuidelines.map((file) => (
          <View key={file.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}>
                <Text style={{fontSize: 20}}>{file.type === 'PDF' ? '📄' : '📝'}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{file.title}</Text>
                <Text style={styles.cardMeta}>{file.type} • {file.size}</Text>
              </View>
              <TouchableOpacity>
                <Download size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* FAQ Header */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>FAQs</Text>
        <TouchableOpacity style={styles.actionButtonSmall} onPress={() => openModal('faq')}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Add FAQ</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ List */}
      <View style={styles.cardList}>
        {initialFaqs.map((faq) => (
          <View key={faq.id} style={styles.card}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTemplates = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Proposal Templates</Text>
        <TouchableOpacity style={styles.actionButtonSmall} onPress={() => openModal('template')}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardList}>
        {initialTemplates.map((template) => (
          <View key={template.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                <Text style={{fontSize: 20}}>{template.type === 'DOCX' ? '📝' : '📄'}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{template.name}</Text>
                <Text style={styles.cardMeta}>v{template.version} • {template.category}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
               <Text style={styles.dateText}>Updated: {template.lastUpdated}</Text>
               <View style={styles.row}>
                 <TouchableOpacity style={{marginRight: 12}}>
                   <Edit2 size={18} color="#64748B" />
                 </TouchableOpacity>
                 <TouchableOpacity>
                   <Download size={18} color="#C8102E" />
                 </TouchableOpacity>
               </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStaticPages = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Static Pages</Text>
        <TouchableOpacity style={styles.actionButtonSmall} onPress={() => openModal('page')}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardList}>
        {initialPages.map((page) => (
          <View key={page.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Globe size={20} color="#C8102E" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{page.title}</Text>
                <Text style={styles.cardMeta}>/{page.slug}</Text>
              </View>
              <View style={[styles.statusBadge, page.status === 'published' ? styles.statusPub : styles.statusDraft]}>
                <Text style={[styles.statusText, page.status === 'published' ? styles.statusTextPub : styles.statusTextDraft]}>
                  {page.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>Modified: {page.lastModified}</Text>
              <TouchableOpacity>
                <MoreHorizontal size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMedia = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Media Library</Text>
        <View style={styles.row}>
           <TouchableOpacity 
             style={[styles.viewToggle, viewMode === 'grid' && styles.viewToggleActive]} 
             onPress={() => setViewMode('grid')}
           >
             <Grid size={16} color={viewMode === 'grid' ? '#FFF' : '#64748B'} />
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]} 
             onPress={() => setViewMode('list')}
           >
             <ListIcon size={16} color={viewMode === 'list' ? '#FFF' : '#64748B'} />
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionButtonSmall, {marginLeft: 8}]} onPress={() => openModal('upload')}>
              <Plus size={16} color="#FFF" />
           </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <View style={styles.cardList}>
          {initialMedia.map((item) => (
             <View key={item.id} style={styles.card}>
               <View style={styles.cardRow}>
                 <Text style={{fontSize: 24, marginRight: 12}}>
                    {item.type === 'image' ? '🖼️' : item.type === 'presentation' ? '📊' : '📄'}
                 </Text>
                 <View style={styles.cardContent}>
                   <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                   <Text style={styles.cardMeta}>{item.size} • {item.category}</Text>
                 </View>
                 <TouchableOpacity>
                   <Trash2 size={18} color="#C8102E" />
                 </TouchableOpacity>
               </View>
             </View>
          ))}
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {initialMedia.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <View style={styles.gridIcon}>
                 <Text style={{fontSize: 32}}>
                    {item.type === 'image' ? '🖼️' : item.type === 'presentation' ? '📊' : '📄'}
                 </Text>
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gridMeta}>{item.size}</Text>
                <View style={styles.chip}>
                   <Text style={styles.chipText}>{item.category}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Main Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <FileText size={24} color="#C8102E" />
            <Text style={styles.title}>Contents</Text>
          </View>
          <Text style={styles.subtitle}>Manage all system content and resources</Text>
        </View>

        {/* Tab Navigation */}
        {renderTabs()}

        {/* Dynamic Content */}
        <View style={styles.contentArea}>
          {activeTab === 'guidelines' && renderGuidelines()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'static' && renderStaticPages()}
          {activeTab === 'media' && renderMedia()}
        </View>

        <View style={{ height: 60 }} /> 
      </ScrollView>

      {/* Navigation Bar */}
      <AdminNavBar 
        activeRoute="Contents"
        onNavigate={handleNavigate}
      />

      {/* Generic Add/Edit Modal */}
      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'upload' ? 'Upload File' : 
                 modalType === 'faq' ? 'Add FAQ' : 
                 modalType === 'page' ? 'Create Page' : 'Add Template'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
               {/* Simplified Form for visual representation */}
               {modalType !== 'faq' && (
                 <View style={styles.uploadArea}>
                    <Search size={32} color="#CBD5E1" />
                    <Text style={styles.uploadText}>Tap to select files</Text>
                 </View>
               )}
               
               {modalType === 'faq' && (
                 <>
                   <Text style={styles.label}>Question</Text>
                   <TextInput style={styles.input} placeholder="Enter question..." />
                   <Text style={styles.label}>Answer</Text>
                   <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Enter answer..." />
                 </>
               )}

               {modalType === 'page' && (
                 <>
                   <Text style={styles.label}>Page Title</Text>
                   <TextInput style={styles.input} placeholder="e.g. Terms of Service" />
                   <Text style={styles.label}>Slug</Text>
                   <TextInput style={styles.input} placeholder="e.g. terms-of-service" />
                 </>
               )}

               <TouchableOpacity style={styles.submitButton} onPress={() => setShowModal(false)}>
                 <Text style={styles.submitButtonText}>Save Changes</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  // Header
  header: {
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  // Tabs
  tabContainer: {
    marginBottom: 20,
  },
  tabScroll: {
    gap: 12,
    paddingRight: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTabItem: {
    borderColor: '#C8102E',
    backgroundColor: '#FEF2F2',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#C8102E',
    fontWeight: '600',
  },
  // Content Sections
  contentArea: {
    flex: 1,
  },
  sectionContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionButtonSmall: {
    backgroundColor: '#C8102E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Cards & Lists
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // FAQ Specific
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  // Status Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPub: { backgroundColor: '#DCFCE7' },
  statusDraft: { backgroundColor: '#FEF9C3' },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextPub: { color: '#166534' },
  statusTextDraft: { color: '#854D0E' },
  // Grid View (Media)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  gridIcon: {
    height: 60,
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridContent: {
    width: '100%',
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  gridMeta: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 10,
    color: '#475569',
  },
  viewToggle: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginLeft: 4,
  },
  viewToggleActive: {
    backgroundColor: '#C8102E',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginVertical: 10,
  },
  uploadText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#C8102E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});