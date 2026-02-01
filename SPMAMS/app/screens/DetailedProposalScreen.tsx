import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  Linking
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as DocumentPicker from 'expo-document-picker';
import {
  X,
  Building2,
  Target,
  Calendar,
  DollarSign,
  Phone,
  RefreshCw,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Play,
  Globe,
  ChevronDown,
  ArrowLeft,
  Eye,
  Edit,
  Upload,
  Download,
  FileCheck,
  Clock,
  BookOpen,
  ShieldCheck,
  ClipboardCheck
} from "lucide-react-native";

// Imports from your project structure
import { Proposal, BudgetSource } from "../../types/proponentTypes";
import { 
  fetchAgencies, 
  fetchSectors, 
  fetchDisciplines, 
  fetchPriorities, 
  fetchStations, 
  fetchDepartments, 
  submitRevisedProposal,
  fetchRevisionSummary, // Ensure this is imported/defined in api
  fetchRejectionSummary, // Ensure this is imported/defined in api
  LookupItem 
} from "../../services/proposal.api";

// --- Custom Picker Component ---
const CustomPicker = ({ label, value, options, onSelect, disabled }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerButton, disabled && styles.disabledInput]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={value ? styles.inputText : styles.placeholderText}>
          {value || `Select ${label}`}
        </Text>
        <ChevronDown size={16} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: any) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onSelect(item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {value === item.name && <CheckCheck size={16} color="#C8102E" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

type DetailScreenRouteProp = RouteProp<{ params: { proposal: Proposal } }, 'params'>;

const DetailedProposalScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<DetailScreenRouteProp>();
  const proposal = route.params?.proposal;

  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null);
  const [newFile, setNewFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [feedback, setFeedback] = useState<any[]>([]); 
  
  // Lookup Data State
  const [lookups, setLookups] = useState<{
    agencies: LookupItem[];
    sectors: LookupItem[];
    disciplines: LookupItem[];
    priorities: LookupItem[];
    stations: LookupItem[];
    departments: LookupItem[];
  }>({
    agencies: [],
    sectors: [],
    disciplines: [],
    priorities: [],
    stations: [],
    departments: []
  });

  useEffect(() => {
    if (proposal) setEditedProposal(proposal);
  }, [proposal]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [agencies, sectors, disciplines, priorities, stations, departments] = await Promise.all([
          fetchAgencies(), fetchSectors(), fetchDisciplines(), fetchPriorities(), fetchStations(), fetchDepartments()
        ]);
        setLookups({ agencies, sectors, disciplines, priorities, stations, departments });
      } catch (e) {
        console.error("Error loading lookups", e);
      }
    };
    loadLookups();
  }, []);

  // Fetch Feedback Logic
  useEffect(() => {
    const loadFeedback = async () => {
      if (!proposal) return;
      try {
        if ((proposal.status || "").toLowerCase().includes("revise")) {
          // Fetch revision summary
           const data = await fetchRevisionSummary(Number(proposal.id));
           const comments = [];
           if (data.objective_comment) comments.push({ section: "Objectives Assessment", comment: data.objective_comment });
           if (data.methodology_comment) comments.push({ section: "Methodology Assessment", comment: data.methodology_comment });
           if (data.budget_comment) comments.push({ section: "Budget Assessment", comment: data.budget_comment });
           if (data.timeline_comment) comments.push({ section: "Timeline Assessment", comment: data.timeline_comment });
           if (data.overall_comment) comments.push({ section: "Overall Comments", comment: data.overall_comment });
           setFeedback(comments);
        } else if ((proposal.status || "").toLowerCase().includes("reject")) {
           const data = await fetchRejectionSummary(Number(proposal.id));
           if (data.comment) setFeedback([{ section: "Reason for Rejection", comment: data.comment }]);
        }
      } catch (e) {
        // Fallback or empty if fetch fails
      }
    };
    loadFeedback();
  }, [proposal]);


  if (!proposal || !editedProposal) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.container}><Text>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const currentData = isEditing ? editedProposal : proposal;
  const canEdit = (proposal.status || "").toLowerCase().includes("revise") && isEditing;
  const isFunded = (proposal.status || "").toLowerCase().includes("funded") || (proposal.status || "").includes("endorsed");
  const sites = (currentData.implementationSites as any[]) || [];
  
  // Handlers
  const handleInputChange = (field: keyof Proposal, value: string) => {
    setEditedProposal({ ...editedProposal, [field]: value });
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Unknown error picking file");
    }
  };

  const handleAddSite = () => {
    const currentSites = (editedProposal.implementationSites as any[]) || [];
    setEditedProposal({ ...editedProposal, implementationSites: [...currentSites, { site: "", city: "" }] });
  };

  const handleSiteChange = (index: number, field: "site" | "city", value: string) => {
    const currentSites = [...(editedProposal.implementationSites as any[])];
    currentSites[index] = { ...currentSites[index], [field]: value };
    setEditedProposal({ ...editedProposal, implementationSites: currentSites });
  };

  const handleRemoveSite = (index: number) => {
    const currentSites = (editedProposal.implementationSites as any[]).filter((_, i) => i !== index);
    setEditedProposal({ ...editedProposal, implementationSites: currentSites });
  };

  const handleSave = async () => {
    if (!newFile) {
      Alert.alert("Required", "Please upload a revised PDF file to submit.");
      return;
    }
    try {
      const fileToUpload: any = {
        uri: newFile.uri,
        type: newFile.mimeType || 'application/pdf',
        name: newFile.name || 'revision.pdf',
      };
      await submitRevisedProposal(
        Number(proposal.id), 
        fileToUpload,        
        editedProposal.title, 
        "Revised via Mobile App" 
      );
      Alert.alert("Success", "Revision submitted successfully!");
      setIsEditing(false);
      setNewFile(null);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Submission Failed", "Could not submit revision.");
    }
  };

  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("endorsed")) return { color: "#166534", bg: "#DCFCE7", icon: <CheckCheck size={18} color="#166534" />, label: "Endorsed" };
    if (s.includes("funded")) return { color: "#065F46", bg: "#D1FAE5", icon: <CheckCircle2 size={18} color="#065F46" />, label: "Funded" };
    if (s.includes("revise")) return { color: "#9A3412", bg: "#FFEDD5", icon: <RefreshCw size={18} color="#9A3412" />, label: "Revision Required" };
    if (s.includes("reject")) return { color: "#991B1B", bg: "#FEE2E2", icon: <XCircle size={18} color="#991B1B" />, label: "Rejected" };
    if (s.includes("pending")) return { color: "#9A3412", bg: "#FFEDD5", icon: <Clock size={18} color="#9A3412" />, label: "Pending" };
    return { color: "#1E40AF", bg: "#DBEAFE", icon: <Microscope size={18} color="#1E40AF" />, label: "Under Evaluation" };
  };

  const theme = getStatusTheme(proposal.status);

  const renderSectionHeader = (title: string, Icon: any) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color="#C8102E" />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{currentData.title}</Text>
        {(proposal.status || "").toLowerCase().includes("revise") && (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            {isEditing ? <Eye size={24} color="#C8102E" /> : <Edit size={24} color="#C8102E" />}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: theme.bg }]}>
          {theme.icon}
          <Text style={[styles.statusText, { color: theme.color }]}>{theme.label}</Text>
          <Text style={styles.formId}>DOST Form No. 1B</Text>
        </View>

        {/* 1. FUNDED BANNER */}
        {isFunded && (
          <View style={styles.fundedCard}>
            <View style={styles.fundedHeader}>
              <CheckCircle2 size={24} color="#15803D" />
              <Text style={styles.fundedTitle}>Project Funding Approved</Text>
            </View>
            <Text style={styles.fundedText}>
              Congratulations! Your project has been fully funded. Below is the confirmed Project Leadership Team.
            </Text>
            
            <View style={styles.teamSection}>
              <View style={styles.teamItem}>
                <User size={14} color="#64748B" />
                <Text style={styles.teamLabel}>Project Leader:</Text>
                <Text style={styles.teamValue}>{currentData.proponent}</Text>
              </View>
              {/* Note: If coProponent exists in data, display it */}
              {(currentData as any).coProponent && (
                <View style={styles.teamItem}>
                  <ShieldCheck size={14} color="#64748B" />
                  <Text style={styles.teamLabel}>Co-Leader:</Text>
                  <Text style={styles.teamValue}>{(currentData as any).coProponent}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.startButton}>
               <Play size={16} color="#FFF" />
               <Text style={styles.startButtonText}>Start Project Implementation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. FEEDBACK SECTION */}
        {feedback.length > 0 && (
          <View style={[styles.card, { borderColor: theme.color }]}>
            <View style={styles.feedbackHeader}>
              {theme.icon}
              <Text style={[styles.sectionHeaderText, { color: theme.color, marginLeft: 8 }]}>R&D Staff Feedback</Text>
            </View>
            {feedback.map((item, idx) => (
              <View key={idx} style={styles.commentBox}>
                <Text style={styles.commentLabel}>{item.section}</Text>
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. FILE MANAGEMENT */}
        <View style={styles.card}>
          {renderSectionHeader("Project Documents", FileText)}
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <FileCheck size={20} color="#C8102E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {newFile ? newFile.name : (currentData.uploadedFile ? "Project_Proposal.pdf" : "No file")}
              </Text>
              <Text style={styles.fileMeta}>{newFile ? "Ready to upload" : "Latest Version"}</Text>
            </View>
            {!newFile && currentData.uploadedFile && (
               <TouchableOpacity style={styles.iconBtn}>
                 <Download size={20} color="#64748B" />
               </TouchableOpacity>
            )}
          </View>

          {canEdit && (
             <TouchableOpacity style={styles.uploadBox} onPress={handleFilePick}>
                {!newFile ? (
                  <>
                    <Upload size={24} color="#94A3B8" />
                    <Text style={styles.uploadText}>Tap to upload revised PDF</Text>
                  </>
                ) : (
                  <View style={styles.uploadSuccess}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <Text style={{color: '#16A34A', fontWeight: '600'}}>File Selected</Text>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setNewFile(null); }}>
                      <Text style={{color: '#DC2626', fontSize: 12, marginLeft: 10}}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
             </TouchableOpacity>
          )}
        </View>

        {/* 4. LEADER & AGENCY */}
        <View style={styles.card}>
          {renderSectionHeader("Leader & Agency", User)}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leader / Proponent</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.disabledInput]}
              value={currentData.proponent}
              editable={canEdit}
              onChangeText={(t) => handleInputChange("proponent", t)}
            />
          </View>

          <CustomPicker 
            label="Agency" 
            value={currentData.agency} 
            options={lookups.agencies} 
            onSelect={(v: string) => handleInputChange("agency", v)} 
            disabled={!canEdit}
          />

          <CustomPicker 
            label="Department" 
            value={currentData.department} 
            options={lookups.departments} 
            onSelect={(v: string) => handleInputChange("department", v)} 
            disabled={!canEdit}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.disabledInput]}
              value={currentData.address}
              editable={canEdit}
              multiline
              onChangeText={(t) => handleInputChange("address", t)}
            />
          </View>

          <View style={styles.rowInputs}>
             <View style={{flex: 1}}>
                <Text style={styles.label}>Telephone</Text>
                <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.telephone} editable={canEdit} onChangeText={t => handleInputChange("telephone", t)} />
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.email} editable={canEdit} onChangeText={t => handleInputChange("email", t)} />
             </View>
          </View>
        </View>

        {/* 5. IMPLEMENTATION SITES */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            {renderSectionHeader(`Implementation Sites (${sites.length})`, Globe)}
            {canEdit && (
              <TouchableOpacity onPress={handleAddSite} style={styles.addBtn}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {sites.map((site, index) => (
            <View key={index} style={styles.siteItem}>
              <View style={styles.siteIcon}><MapPin size={16} color="#2563EB" /></View>
              <View style={{ flex: 1 }}>
                {canEdit ? (
                  <>
                    <TextInput placeholder="Site Name" value={site.site} onChangeText={(t) => handleSiteChange(index, "site", t)} style={[styles.input, styles.smallInput]} />
                    <TextInput placeholder="City/Municipality" value={site.city} onChangeText={(t) => handleSiteChange(index, "city", t)} style={[styles.input, styles.smallInput, { marginTop: 4 }]} />
                  </>
                ) : (
                  <><Text style={styles.siteTitle}>{site.site}</Text><Text style={styles.siteCity}>{site.city}</Text></>
                )}
              </View>
              {canEdit && <TouchableOpacity onPress={() => handleRemoveSite(index)} style={styles.deleteBtn}><Trash2 size={18} color="#94A3B8" /></TouchableOpacity>}
            </View>
          ))}
        </View>

        {/* 6. PROJECT DETAILS GRID (Missing Sections Added) */}
        <View style={styles.card}>
           {renderSectionHeader("Project Details", ClipboardCheck)}
           
           <View style={styles.inputGroup}>
              <Text style={styles.label}>Cooperating Agencies</Text>
              <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.cooperatingAgencies} editable={canEdit} onChangeText={t => handleInputChange("cooperatingAgencies", t)} />
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Mode of Implementation</Text>
              <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.modeOfImplementation} editable={canEdit} onChangeText={t => handleInputChange("modeOfImplementation", t)} />
           </View>

           <View style={styles.inputGroup}>
              <Text style={styles.label}>Classification</Text>
              <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.classification} editable={canEdit} onChangeText={t => handleInputChange("classification", t)} placeholder="Type" />
              {currentData.classificationDetails ? <Text style={styles.detailText}>{currentData.classificationDetails}</Text> : null}
           </View>

           <CustomPicker label="R&D Station" value={currentData.rdStation} options={lookups.stations} onSelect={(v:string) => handleInputChange("rdStation", v)} disabled={!canEdit} />
           <CustomPicker label="Priority Areas" value={currentData.priorityAreas} options={lookups.priorities} onSelect={(v:string) => handleInputChange("priorityAreas", v)} disabled={!canEdit} />
           <CustomPicker label="Discipline" value={currentData.discipline} options={lookups.disciplines} onSelect={(v:string) => handleInputChange("discipline", v)} disabled={!canEdit} />
           <CustomPicker label="Sector" value={currentData.sector} options={lookups.sectors} onSelect={(v:string) => handleInputChange("sector", v)} disabled={!canEdit} />
        </View>

        {/* 7. SCHEDULE SECTION (New) */}
        <View style={styles.card}>
           {renderSectionHeader("Implementing Schedule", Calendar)}
           <View style={styles.rowInputs}>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>School Year</Text>
                 <TextInput style={[styles.input, styles.disabledInput]} value={currentData.schoolYear} editable={false} />
              </View>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>Duration</Text>
                 <TextInput style={[styles.input, styles.disabledInput]} value={currentData.duration} editable={false} />
              </View>
           </View>
           <View style={[styles.rowInputs, {marginTop: 12}]}>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>Start Date</Text>
                 <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.startDate} editable={canEdit} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>End Date</Text>
                 <TextInput style={[styles.input, !canEdit && styles.disabledInput]} value={currentData.endDate} editable={canEdit} placeholder="YYYY-MM-DD" />
              </View>
           </View>
        </View>

        {/* 8. BUDGET (Enhanced Layout) */}
        <View style={styles.card}>
           {renderSectionHeader("Estimated Budget by Source", DollarSign)}
           
           {(currentData.budgetSources || []).map((budget: any, idx: number) => (
             <View key={idx} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <View style={{backgroundColor: '#DBEAFE', padding: 4, borderRadius: 4}}><DollarSign size={14} color="#1E40AF"/></View>
                    <View>
                      <Text style={styles.budgetSourceLabel}>SOURCE OF FUNDS</Text>
                      <Text style={styles.budgetSource}>{budget.source}</Text>
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.budgetSourceLabel}>SUBTOTAL</Text>
                    <Text style={styles.budgetTotal}>{budget.total}</Text>
                  </View>
                </View>
                
                <View style={styles.budgetGrid}>
                   <View style={styles.budgetCol}>
                      <Text style={styles.budgetLabel}>PS</Text>
                      <Text style={styles.budgetValue}>{budget.ps || '₱0.00'}</Text>
                   </View>
                   <View style={styles.budgetCol}>
                      <Text style={styles.budgetLabel}>MOOE</Text>
                      <Text style={styles.budgetValue}>{budget.mooe || '₱0.00'}</Text>
                   </View>
                   <View style={styles.budgetCol}>
                      <Text style={styles.budgetLabel}>CO</Text>
                      <Text style={styles.budgetValue}>{budget.co || '₱0.00'}</Text>
                   </View>
                </View>
             </View>
           ))}
           
           <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Project Cost</Text>
              <Text style={styles.totalValue}>{currentData.budgetTotal || "₱0.00"}</Text>
           </View>
        </View>

      </ScrollView>

      {/* Footer Actions */}
      {isEditing && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => { setIsEditing(false); setEditedProposal(proposal); }} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Upload size={18} color="#FFF" style={{marginRight: 6}} />
            <Text style={styles.saveBtnText}>Submit Revision</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  container: { flex: 1, padding: 16 },
  
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  statusText: { flex: 1, fontWeight: '700', fontSize: 14 },
  formId: { fontSize: 10, color: '#64748B' },

  // Funded Card
  fundedCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 16, marginBottom: 16 },
  fundedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fundedTitle: { fontWeight: 'bold', color: '#14532D', fontSize: 16 },
  fundedText: { color: '#166534', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  teamSection: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 16 },
  teamItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  teamLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  teamValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  startButton: { backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
  startButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Feedback
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  commentBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  commentLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4, textTransform: 'uppercase' },
  commentText: { fontSize: 13, color: '#334155', lineHeight: 18 },

  // General Card
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  sectionHeaderText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  
  // File
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  fileIcon: { width: 36, height: 36, backgroundColor: '#FFF', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  fileMeta: { fontSize: 12, color: '#64748B' },
  iconBtn: { padding: 8 },
  uploadBox: { marginTop: 12, borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 8, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  uploadText: { marginTop: 8, fontSize: 13, color: '#64748B', fontWeight: '500' },
  uploadSuccess: { alignItems: 'center' },

  // Inputs
  inputGroup: { marginBottom: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1E293B', height: 44 },
  inputText: { color: '#1E293B', fontSize: 14 },
  placeholderText: { color: '#94A3B8', fontSize: 14 },
  disabledInput: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#64748B', marginTop: 4, fontStyle: 'italic' },

  // Sites
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C8102E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  addBtnText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  siteItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  siteIcon: { width: 28, height: 28, backgroundColor: '#DBEAFE', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  siteTitle: { fontWeight: '700', color: '#1E293B', fontSize: 14 },
  siteCity: { color: '#64748B', fontSize: 12 },
  smallInput: { height: 36, paddingVertical: 0, fontSize: 13 },
  deleteBtn: { padding: 4 },

  // Budget Enhanced
  budgetCard: { backgroundColor: '#FFF', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  budgetSourceLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  budgetSource: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  budgetTotal: { fontSize: 13, fontWeight: '700', color: '#C8102E' },
  budgetGrid: { flexDirection: 'row', padding: 12 },
  budgetCol: { flex: 1 },
  budgetLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 2 },
  budgetValue: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  
  totalBox: { marginTop: 4, backgroundColor: '#1E293B', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  totalValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Footer
  footer: { backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 12, backgroundColor: '#C8102E', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 14, color: '#334155' },
});

export default DetailedProposalScreen;