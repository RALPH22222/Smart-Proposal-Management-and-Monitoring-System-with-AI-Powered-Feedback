import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  Modal
} from "react-native";
import {
  Users,
  Search,
  List,
  Grid,
  FileText,
  Clock,
  Microscope,
  Award,
  LogOut,
  Filter,
  Tag,
  Share2,
  ChevronDown,
  ClipboardCheck,
  RefreshCw,
  X,
  Check
} from "lucide-react-native";
import { useNavigation, useRouter } from "expo-router";

// CONTEXT & API
import { useAuthContext } from "../../context/AuthContext";
import { getProposals } from "../../services/proposal.api";
import { Project, Proposal } from "../../types/proponentTypes";
import { getStatusLabelByIndex, getProgressPercentageByIndex } from "../../types/helpers";

// --- HELPER: Web-Matching Logic ---
const getWebStatusColor = (statusRaw: string) => {
  const s = (statusRaw || "").toLowerCase();
  if (s === "pending") return { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" }; 
  if (["revise", "revision", "revision_rnd"].includes(s)) return { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" }; 
  if (["review_rnd", "r&d evaluation"].includes(s)) return { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" }; 
  if (["under_evaluation", "evaluators assessment"].includes(s)) return { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" }; 
  if (["endorsed_for_funding", "funded"].includes(s)) return { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" }; 
  if (["rejected", "reject", "rejected_rnd"].includes(s)) return { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" }; 
  return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
};

const getWebStatusLabel = (statusRaw: string, index: number) => {
  const s = (statusRaw || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (["revise", "revision", "revision_rnd"].includes(s)) return "Revision Required";
  if (["review_rnd", "r&d evaluation"].includes(s)) return "Under R&D Evaluation";
  if (["under_evaluation", "evaluators assessment"].includes(s)) return "Under Evaluators Assessment";
  return getStatusLabelByIndex(index);
};

const getWebProgress = (statusRaw: string, index: number) => {
  const s = (statusRaw || "").toLowerCase();
  if (s === "pending" || ["revise", "revision"].includes(s)) return 0;
  return getProgressPercentageByIndex(index);
};

const getTagColorStyles = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" }, 
    { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" }, 
    { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" }, 
    { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" }, 
    { bg: "#FAF5FF", text: "#7E22CE", border: "#E9D5FF" }, 
  ];
  return colors[Math.abs(hash) % colors.length];
};

const ProfileScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = useAuthContext();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projectTab, setProjectTab] = useState<"all" | "budget">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [proposals, setProposals] = useState<Project[]>([]);
  const [rawProposals, setRawProposals] = useState<any[]>([]); 
  const [stats, setStats] = useState({ pending: 0, rdEval: 0, evalAssessment: 0, revision: 0, funded: 0 });

  const fetchProposalsData = async () => {
    if (!user) return;
    try {
      const data: any[] = await getProposals();
      const myProposals = data.filter((p: any) => {
          const pId = (typeof p.proponent_id === 'object' && p.proponent_id !== null) ? p.proponent_id.id : p.proponent_id;
          return String(pId) === String(user.id);
      });

      setRawProposals(myProposals); // Save Raw Data

      const mappedProposals: Project[] = myProposals.map((p: any) => {
        let index = 1;
        const status = (p.status || "").toLowerCase();
        if (status === "endorsed_for_funding") index = 0;
        else if (status === "review_rnd") index = 1;
        else if (status === "under_evaluation") index = 2;
        else if (status === "revision_rnd") index = 3;
        else if (status === "funded") index = 4;
        else if (status === "rejected_rnd") index = 5;

        const budgetTotal = Array.isArray(p.estimated_budget) ? p.estimated_budget.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) : 0;

        return {
          id: String(p.id),
          title: p.project_title || "Untitled Project",
          currentIndex: index,
          rawStatus: p.status,
          submissionDate: p.created_at || "N/A",
          lastUpdated: p.updated_at || "N/A",
          budget: `₱${budgetTotal.toLocaleString()}`,
          duration: p.duration ? `${p.duration} months` : "0 months",
          priority: "medium",
          evaluators: p.proposal_evaluators?.length || 0,
          proponent: user.first_name
        };
      });

      setProposals(mappedProposals);
      
      setStats({
        pending: mappedProposals.filter(p => (p.rawStatus || "").includes("pending")).length,
        rdEval: mappedProposals.filter(p => ["review_rnd", "r&d evaluation"].includes(p.rawStatus || "")).length,
        evalAssessment: mappedProposals.filter(p => ["under_evaluation", "evaluators assessment"].includes(p.rawStatus || "")).length,
        revision: mappedProposals.filter(p => ["revision_rnd", "revise", "revision"].includes(p.rawStatus || "")).length,
        funded: mappedProposals.filter(p => (p.rawStatus || "").includes("funded") || (p.rawStatus || "").includes("endorsed")).length,
      });

    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await fetchProposalsData();
      if(isMounted) setLoading(false);
    };
    init();
    return () => { isMounted = false; };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProposalsData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout }
    ]);
  };

  // --- CRITICAL: MAP REAL DATA BEFORE NAVIGATION ---
  const handleNavigateToDetail = (project: Project) => {
    const raw = rawProposals.find((p) => String(p.id) === project.id);
    if (!raw) return;

    const val = (v: any) => (v === null || v === undefined ? "" : v);
    const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

    // 1. Process Budget
    const budgetMap = new Map();
    if (Array.isArray(raw.estimated_budget)) {
      raw.estimated_budget.forEach((item: any) => {
        const source = val(item.source) || "Unknown Source";
        if (!budgetMap.has(source)) {
          budgetMap.set(source, { source, ps: 0, mooe: 0, co: 0, total: 0, breakdown: { ps: [], mooe: [], co: [] } });
        }
        const entry = budgetMap.get(source);
        const amount = Number(item.amount) || 0;
        const type = (item.budget || "mooe").toLowerCase();
        
        if (entry.breakdown[type]) {
          entry.breakdown[type].push({ id: item.id, item: val(item.item), amount });
          entry[type] += amount;
          entry.total += amount;
        }
      });
    }
    const budgetSources = Array.from(budgetMap.values()).map((b: any) => ({
      source: b.source,
      ps: formatCurrency(b.ps),
      mooe: formatCurrency(b.mooe),
      co: formatCurrency(b.co),
      total: formatCurrency(b.total),
      breakdown: b.breakdown
    }));

    // 2. Prepare Proposal Object
    const fullProposal: Proposal = {
      id: String(raw.id),
      title: val(raw.project_title),
      status: getWebStatusLabel(raw.status, project.currentIndex),
      proponent: user ? (user.first_name + " " + (user.last_name || "")) : "Unknown Proponent",
      gender: val(raw.proponent?.gender) || "",
      agency: raw.agency ? val(raw.agency.name) : "",
      department: raw.department?.name || "",
      schoolYear: val(raw.school_year),
      address: raw.agency ? [raw.agency.street, raw.agency.barangay, raw.agency.city].map(val).filter(Boolean).join(", ") : "",
      telephone: val(raw.phone),
      email: val(raw.email),
      cooperatingAgencies: Array.isArray(raw.cooperating_agencies) ? raw.cooperating_agencies.map((c: any) => c.agencies?.name).join(", ") : "",
      rdStation: raw.rnd_station?.name || "",
      classification: raw.classification_type || "",
      classificationDetails: raw.class_input || "",
      modeOfImplementation: val(raw.implementation_mode).replace(/_/g, " "),
      implementationSites: Array.isArray(raw.implementation_site) ? raw.implementation_site.map((s: any) => ({ site: val(s.site_name), city: val(s.city) })) : [],
      priorityAreas: Array.isArray(raw.proposal_priorities) ? raw.proposal_priorities.map((pp: any) => pp.priorities?.name).join(", ") : "",
      sector: raw.sector ? val(raw.sector.name) : "",
      discipline: raw.discipline ? val(raw.discipline.name) : "",
      duration: val(raw.duration) ? `${raw.duration}` : "",
      startDate: val(raw.plan_start_date),
      endDate: val(raw.plan_end_date),
      budgetSources: budgetSources,
      budgetTotal: project.budget,
      uploadedFile: Array.isArray(raw.proposal_version) && raw.proposal_version.length > 0 ? raw.proposal_version[raw.proposal_version.length - 1].file_url : "",
      lastUpdated: val(raw.updated_at) || val(raw.created_at),
      deadline: raw.evaluation_deadline_at || undefined,
    };

    (navigation as any).navigate('screens/DetailedProposalScreen', { proposal: fullProposal });
  };

  const getProjectTags = (id: string) => {
    const raw = rawProposals.find((p) => String(p.id) === id);
    if (!raw || !Array.isArray(raw.proposal_tags)) return [];
    return raw.proposal_tags.map((pt: any) => pt.tags?.name).filter(Boolean);
  };

  // Rendering
  const filteredProjects = proposals.filter((p) => {
    if (projectTab === "budget" && !p.rawStatus?.includes("funded") && !p.rawStatus?.includes("endorsed")) return false;
    return p.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const StatCard = ({ label, count, icon, bg, border, text }: any) => (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.statHeader}>
        <View><Text style={styles.statLabel}>{label}</Text><Text style={[styles.statCount, { color: text }]}>{count}</Text></View>
        <View style={{ opacity: 0.8 }}>{icon}</View>
      </View>
    </View>
  );

  const renderGridItem = ({ item }: { item: Project }) => {
    const statusStyle = getWebStatusColor(item.rawStatus || "");
    const tags = getProjectTags(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleNavigateToDetail(item)}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text></View>
        <View style={styles.tagsContainer}>
          {tags.slice(0, 3).map((tag: string, idx: number) => {
             const style = getTagColorStyles(tag);
             return (<View key={idx} style={[styles.tagPill, { backgroundColor: style.bg, borderColor: style.border }]}><Tag size={10} color={style.text} /><Text style={[styles.tagText, { color: style.text }]}>{tag}</Text></View>);
          })}
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Budget:</Text><Text style={styles.metaValue}>{item.budget}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Duration:</Text><Text style={styles.metaValue}>{item.duration}</Text></View>
        </View>
        <View style={styles.progressContainer}>
           <View style={styles.progressHeader}><Text style={styles.progressLabel}>Progress</Text><Text style={styles.progressValue}>{getWebProgress(item.rawStatus || "", item.currentIndex)}%</Text></View>
           <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${getWebProgress(item.rawStatus || "", item.currentIndex)}%` }]} /></View>
        </View>
        <View style={styles.cardFooter}>
           <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, borderWidth: 1 }]}> 
             <Text style={[styles.statusText, { color: statusStyle.text }]}>{getWebStatusLabel(item.rawStatus || "", item.currentIndex)}</Text>
           </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <View style={styles.iconBox}><Users color="#fff" size={20} /></View>
              <View><Text style={styles.appTitle}>Project Portfolio</Text><Text style={styles.appSubtitle}>Monitor your research proposals</Text></View>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}><LogOut color="#C8102E" size={22} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
            <StatCard label="Total" count={proposals.length} bg="#F8FAFC" border="#CBD5E1" text="#1E293B" icon={<FileText size={24} color="#475569" />} />
            <StatCard label="Pending" count={stats.pending} bg="#FFF7ED" border="#FDBA74" text="#EA580C" icon={<Clock size={24} color="#EA580C" />} />
            <StatCard label="R&D Eval" count={stats.rdEval} bg="#EFF6FF" border="#93C5FD" text="#2563EB" icon={<Microscope size={24} color="#2563EB" />} />
            <StatCard label="Review" count={stats.evalAssessment} bg="#FAF5FF" border="#D8B4FE" text="#9333EA" icon={<ClipboardCheck size={24} color="#9333EA" />} />
            <StatCard label="Funded" count={stats.funded} bg="#F0FDF4" border="#86EFAC" text="#16A34A" icon={<Award size={24} color="#16A34A" />} />
          </ScrollView>
        </View>
        <View style={styles.portfolioSection}>
            <View style={styles.controlsSection}>
               <View style={styles.searchRow}>
                  <View style={styles.searchInputWrapper}>
                    <Search size={16} color="#94A3B8" />
                    <TextInput style={styles.searchInput} placeholder="Search projects..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94A3B8" />
                  </View>
               </View>
            </View>
            {loading ? <ActivityIndicator size="large" color="#C8102E" style={{ marginTop: 40 }} /> : 
              <FlatList data={filteredProjects} renderItem={renderGridItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />} />
            }
        </View>
      </View>
    </SafeAreaView>
  );
};

// ... (Paste your Styles from previous response here, they are fine) ...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === "android" ? 30 : 0 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, backgroundColor: '#C8102E', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  appTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  appSubtitle: { fontSize: 12, color: '#64748B' },
  iconButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
  statsContainer: { gap: 12, paddingRight: 16 },
  statCard: { minWidth: 120, padding: 16, borderRadius: 16, borderWidth: 1, marginRight: 8, justifyContent: 'center' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 },
  statCount: { fontSize: 22, fontWeight: '800' },
  portfolioSection: { flex: 1, margin: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  controlsSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#334155' },
  listContent: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '600' },
  cardMeta: { marginBottom: 12, gap: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 12, color: '#64748B' },
  metaValue: { fontSize: 12, fontWeight: '600', color: '#334155' },
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 11, color: '#64748B' },
  progressValue: { fontSize: 11, fontWeight: '600', color: '#334155' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#C8102E', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 14 },
});

export default ProfileScreen;