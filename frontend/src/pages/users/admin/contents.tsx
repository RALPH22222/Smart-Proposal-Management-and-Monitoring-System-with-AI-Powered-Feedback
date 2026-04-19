import React, { useState, useEffect, useRef } from 'react';
import { ContactsSection } from './components/ContactsSection';
import { AboutSection } from "./components/AboutSection";
import { FaqSection } from "./components/FaqSection";
import { HomeSection } from "./components/HomeSection";
import { LogosSection } from "./components/LogosSection";
import { FileText, Home, Info, Phone, HelpCircle, Palette, Save, Loader2, ListOrdered, Smartphone, ClipboardList, Trash2, Plus } from 'lucide-react';
import { HomeApi } from "../../../services/HomeApi";
import { DEFAULT_HOME_INFO, type HomeInfo, type HomeProcessStep } from "../../../schemas/home-schema";
import { FileUpload } from "./components/shared/FileUpload";
import { CmsApi } from "../../../services/CmsApi";
import { toast, Toaster } from "react-hot-toast";
import PageLoader from "../../../components/shared/PageLoader";

// --- MAIN COMPONENT ---
const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('branding');

  const tabs = [
    { id: 'branding', label: 'System Logos', icon: Palette },
    { id: 'home', label: 'Home Page', icon: Home },
    { id: 'about', label: 'About Page', icon: Info },
    { id: 'contacts', label: 'Contact Info', icon: Phone },
    { id: 'faq', label: 'FAQ Page', icon: HelpCircle },
    { id: 'howitworks', label: 'Proponent', icon: ListOrdered },
    { id: 'templates', label: 'Proposal Templates', icon: FileText },
    { id: 'mobileapp', label: 'Mobile App', icon: Smartphone },
    { id: 'rubrics', label: 'Evaluator Rubrics', icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6 min-h-full h-full px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="flex-shrink-0">
        <h1 className='text-xl sm:text-2xl font-bold text-red-700 mb-2'>
          Content Management System
        </h1>
        <p className='text-gray-600 text-sm sm:text-base'>
          Manage all RDEC System content, announcements, and resources
        </p>
      </header>

      {/* Tab Navigation */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0'>
        <div className='border-b border-gray-200'>
          <nav
            className='flex space-x-4 sm:space-x-6 md:space-x-8 px-3 sm:px-4 md:px-6 overflow-x-auto'
            aria-label='Tabs'
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-2`}
              >
                 <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-y-auto'>
        { activeTab === 'templates' && <TemplatesSection />}
        { activeTab === 'mobileapp' && <MobileAppSection />}
        { activeTab === 'howitworks' && <HowItWorksSection />}
        { activeTab === 'home' && <HomeSection />}
        { activeTab === 'about' && <AboutSection />}
        {activeTab === 'contacts' && <ContactsSection />}
        {activeTab === 'faq' && <FaqSection />}
        {activeTab === 'branding' && <MediaLibrarySection />}
        {activeTab === 'rubrics' && <EvaluatorRubricsSection />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS (Fully Preserved) ---

// Proponent Section
const HowItWorksSection: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeInfo>(DEFAULT_HOME_INFO);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        setHomeData({
          ...DEFAULT_HOME_INFO,
          ...(data || {}),
          process_steps: (Array.isArray(data?.process_steps) && data.process_steps.length > 0)
            ? data.process_steps
            : DEFAULT_HOME_INFO.process_steps,
        });
      } catch {
        toast.error("Failed to load process steps.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await HomeApi.updateHomeInfo(homeData);
      toast.success('Process steps updated!');
    } catch {
      toast.error('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStep = (index: number, field: keyof HomeProcessStep, value: string) => {
    setHomeData(prev => ({
      ...prev,
      process_steps: prev.process_steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const addStep = () => {
    setHomeData(prev => ({
      ...prev,
      process_steps: [...prev.process_steps, { title: 'New Step', description: '' }],
    }));
  };

  const removeStep = (index: number) => {
    if (homeData.process_steps.length <= 1) { toast.error('At least one step is required.'); return; }
    setHomeData(prev => ({
      ...prev,
      process_steps: prev.process_steps.filter((_, i) => i !== index),
    }));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...homeData.process_steps];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= steps.length) return;
    [steps[index], steps[swapIndex]] = [steps[swapIndex], steps[index]];
    setHomeData(prev => ({ ...prev, process_steps: steps }));
  };

  if (isLoading) {
    return <PageLoader mode="rows" className="min-h-[400px]" />;
  }

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Proponent Steps</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the step-by-step process shown to proponents in the "How It Works" modal.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 flex-shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {homeData.process_steps.map((step, index) => (
          <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
            {/* Step Number & Move buttons */}
            <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {index + 1}
              </div>
              <button
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors leading-none font-bold"
                title="Move up"
              >▲</button>
              <button
                onClick={() => moveStep(index, 'down')}
                disabled={index === homeData.process_steps.length - 1}
                className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors leading-none font-bold"
                title="Move down"
              >▼</button>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={step.title}
                onChange={(e) => updateStep(index, 'title', e.target.value)}
                placeholder="Step title..."
                className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
              />
              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                placeholder="Step description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none bg-white"
              />
            </div>

            {/* Remove */}
            <button
              onClick={() => removeStep(index)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0 mt-1 p-1 text-lg leading-none font-bold"
              title="Remove step"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add Step */}
      <button
        onClick={addStep}
        className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"
      >
        + Add Step
      </button>
    </div>
  );
};


// Proposal Templates Section
const TemplatesSection: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeInfo>(DEFAULT_HOME_INFO);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        setHomeData({
          ...DEFAULT_HOME_INFO,
          ...(data || {}),
          templates: {
            ...DEFAULT_HOME_INFO.templates,
            ...(data?.templates || {})
          }
        });
      } catch (error) {
        toast.error("Failed to load templates.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await HomeApi.updateHomeInfo(homeData);
      toast.success("Proposal templates updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader mode="contents-card" className="min-h-[400px]" />;
  }

  return (
    <div className='p-4 sm:p-6'>
      <Toaster position="top-right" />
      
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
            Proposal Templates
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage the official downloadable templates for research and project proposals.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50'
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Research Template */}
        <FileUpload 
          label="Research Proposal Template (.docx/PDF)"
          currentUrl={homeData?.templates?.research_url || ""}
          onUploadSuccess={(url) => setHomeData({
            ...homeData,
            templates: { 
              ...(homeData?.templates || { research_url: "", project_url: "" }), 
              research_url: url 
            }
          })}
          onDelete={() => setHomeData({
            ...homeData,
            templates: { 
              ...(homeData?.templates || { research_url: "", project_url: "" }), 
              research_url: "" 
            }
          })}
          helperText="Standardized DOST Form 1B for Research & Development Proposals."
        />

        {/* Project Template */}
        <FileUpload 
          label="Project Proposal Template (.docx/PDF)"
          currentUrl={homeData?.templates?.project_url || ""}
          onUploadSuccess={(url) => setHomeData({
            ...homeData,
            templates: { 
              ...(homeData?.templates || { research_url: "", project_url: "" }), 
              project_url: url 
            }
          })}
          onDelete={() => setHomeData({
            ...homeData,
            templates: { 
              ...(homeData?.templates || { research_url: "", project_url: "" }), 
              project_url: "" 
            }
          })}
          helperText="Generic template for Monitoring and Project implementation plans."
        />
      </div>

    </div>
  );
};

// Media Library Section
const MediaLibrarySection: React.FC = () => {
  return (
    <div className='p-4 sm:p-6'>
      <LogosSection />
    </div>
  );
};

// Phone Mockup Image Upload with live preview
const PhoneMockupUpload: React.FC<{
  currentUrl: string;
  onUploadSuccess: (url: string) => void;
  onDelete: () => void;
}> = ({ currentUrl, onUploadSuccess, onDelete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.');
      return;
    }
    try {
      setIsUploading(true);
      const { uploadUrl, fileUrl } = await CmsApi.getUploadUrl(file.name, file.type);
      await CmsApi.uploadFile(uploadUrl, file);
      onUploadSuccess(fileUrl);
      toast.success('Phone image updated!');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800">Phone Mockup Image</label>

      {/* Phone frame preview */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: 160, height: 300 }}>
          {/* Outer bezel */}
          <div className="absolute inset-0 rounded-[2rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
            {/* Screen */}
            <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-gray-100 flex items-center justify-center">
              {currentUrl ? (
                <img src={currentUrl} alt="Phone preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-300 select-none">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] font-medium text-center px-2">No image</span>
                </div>
              )}
            </div>
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full z-10" />
            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-600 rounded-full z-10" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {isUploading ? 'Uploading...' : currentUrl ? 'Replace Image' : 'Upload Image'}
        </button>

        {currentUrl && !isUploading && (
          <button
            type="button"
            onClick={onDelete}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Image
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400 italic">Recommended: portrait screenshot (JPG/PNG, ≤10MB)</p>
    </div>
  );
};

// Mobile App Download Section
const MobileAppSection: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeInfo>(DEFAULT_HOME_INFO);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        setHomeData({
          ...DEFAULT_HOME_INFO,
          ...(data || {}),
          app_config: {
            ...DEFAULT_HOME_INFO.app_config,
            ...(data?.app_config || {})
          }
        });
      } catch (error) {
        toast.error("Failed to load app config.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await HomeApi.updateHomeInfo(homeData);
      toast.success("Mobile App link updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader mode="contents-card" className="min-h-[400px]" />;
  }

  return (
    <div className='p-4 sm:p-6'>
      <Toaster position="top-right" />
      
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
            Mobile App Distribution
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upload the .apk file here. Users will be able to download it directly from the public interfaces.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50'
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* APK File */}
        <FileUpload 
          label="Android Application Package (.apk)"
          accept=".apk"
          maxSizeMB={500}
          hideUrlMode
          helperText="Upload the official WMSU Project Portal .apk file (up to 500MB) for Android users to download."
          currentUrl={homeData?.app_config?.apk_url || ""}
          onUploadSuccess={(url) => setHomeData({
            ...homeData,
            app_config: { 
              ...(homeData?.app_config || { apk_url: "", phone_image_url: "" }), 
              apk_url: url 
            }
          })}
          onDelete={() => setHomeData({
            ...homeData,
            app_config: { 
              ...(homeData?.app_config || { apk_url: "", phone_image_url: "" }), 
              apk_url: "" 
            }
          })}
        />

        {/* Phone Mockup Image — custom preview */}
        <PhoneMockupUpload
          currentUrl={homeData?.app_config?.phone_image_url || ""}
          onUploadSuccess={(url) => setHomeData({
            ...homeData,
            app_config: {
              ...(homeData?.app_config || { apk_url: "", phone_image_url: "" }),
              phone_image_url: url
            }
          })}
          onDelete={() => setHomeData({
            ...homeData,
            app_config: {
              ...(homeData?.app_config || { apk_url: "", phone_image_url: "" }),
              phone_image_url: ""
            }
          })}
        />
      </div>
    </div>
  );
};

// Evaluator Rubrics Section
const EvaluatorRubricsSection: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeInfo>(DEFAULT_HOME_INFO);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        setHomeData({
          ...DEFAULT_HOME_INFO,
          ...(data || {}),
          evaluator_rubrics: (Array.isArray(data?.evaluator_rubrics) && data.evaluator_rubrics.length > 0)
            ? data.evaluator_rubrics
            : DEFAULT_HOME_INFO.evaluator_rubrics,
        });
      } catch (error) {
        toast.error("Failed to load evaluator rubrics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await HomeApi.updateHomeInfo(homeData);
      toast.success("Evaluator rubrics updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategory = (idx: number, field: string, val: string) => {
    setHomeData((prev) => {
      const updated = [...(prev.evaluator_rubrics || [])];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, evaluator_rubrics: updated };
    });
  };

  const updateCriterion = (catIdx: number, critIdx: number, val: string) => {
    setHomeData((prev) => {
      const updated = [...(prev.evaluator_rubrics || [])];
      const criteria = [...updated[catIdx].criteria];
      criteria[critIdx] = { ...criteria[critIdx], description: val };
      updated[catIdx] = { ...updated[catIdx], criteria };
      return { ...prev, evaluator_rubrics: updated };
    });
  };

  const updateGuide = (catIdx: number, guideIdx: number, val: string) => {
    setHomeData((prev) => {
      const updated = [...(prev.evaluator_rubrics || [])];
      const evaluatorGuide = [...updated[catIdx].evaluatorGuide];
      evaluatorGuide[guideIdx] = val;
      updated[catIdx] = { ...updated[catIdx], evaluatorGuide };
      return { ...prev, evaluator_rubrics: updated };
    });
  };

  const addGuide = (catIdx: number) => {
    setHomeData((prev) => {
      const updated = [...(prev.evaluator_rubrics || [])];
      const evaluatorGuide = [...updated[catIdx].evaluatorGuide, "New guide question"];
      updated[catIdx] = { ...updated[catIdx], evaluatorGuide };
      return { ...prev, evaluator_rubrics: updated };
    });
  };

  const removeGuide = (catIdx: number, guideIdx: number) => {
    setHomeData((prev) => {
      const updated = [...(prev.evaluator_rubrics || [])];
      const evaluatorGuide = updated[catIdx].evaluatorGuide.filter((_, i) => i !== guideIdx);
      updated[catIdx] = { ...updated[catIdx], evaluatorGuide };
      return { ...prev, evaluator_rubrics: updated };
    });
  };

  const addCategory = () => {
    setHomeData(prev => ({
      ...prev,
      evaluator_rubrics: [...(prev.evaluator_rubrics || []), {
        category: "New Assessment",
        description: "Description of the assessment.",
        criteria: [
          { score: 5, description: "" },
          { score: 4, description: "" },
          { score: 3, description: "" },
          { score: 2, description: "" },
          { score: 1, description: "" },
        ],
        evaluatorGuide: ["Guide question?"]
      }]
    }));
  };

  const removeCategory = (idx: number) => {
    if ((homeData.evaluator_rubrics || []).length <= 1) {
      toast.error('At least one rubric category is required.');
      return;
    }
    if (!window.confirm("Are you sure you want to remove this rubric category?")) return;
    setHomeData(prev => ({
      ...prev,
      evaluator_rubrics: (prev.evaluator_rubrics || []).filter((_, i) => i !== idx)
    }));
  };

  if (isLoading) {
    return <PageLoader mode="contents-card" className="min-h-[400px]" />;
  }

  return (
    <div className='p-4 sm:p-6'>
      <Toaster position="top-right" />
      
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
            Evaluator Rubrics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage the rubric criteria and descriptions used by evaluators.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50 flex-shrink-0'
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='space-y-8'>
        {(homeData.evaluator_rubrics || []).map((rubric, catIdx) => (
          <div key={catIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category Name</label>
                  <input
                    type="text"
                    value={rubric.category}
                    onChange={(e) => updateCategory(catIdx, 'category', e.target.value)}
                    className="w-full font-bold text-slate-800 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={rubric.description}
                    onChange={(e) => updateCategory(catIdx, 'description', e.target.value)}
                    rows={2}
                    className="w-full text-slate-600 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>
              </div>
              <button
                onClick={() => removeCategory(catIdx)}
                className="text-red-500 hover:text-red-700 p-2 bg-white rounded border border-red-200 shadow-sm transition-colors flex-shrink-0"
                title="Remove Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scoring Criteria */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-3 border-b pb-2">Scoring Criteria (1 - 5)</h4>
                <div className="space-y-3">
                  {rubric.criteria.map((crit, critIdx) => (
                    <div key={critIdx} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex-shrink-0 rounded bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
                        {crit.score}
                      </div>
                      <textarea
                        value={crit.description}
                        onChange={(e) => updateCriterion(catIdx, critIdx, e.target.value)}
                        rows={2}
                        placeholder="Criteria description..."
                        className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-400 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluator Guide */}
              <div>
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h4 className="font-bold text-sm text-slate-800">Evaluator Guide Questions</h4>
                  <button
                    onClick={() => addGuide(catIdx)}
                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {rubric.evaluatorGuide.map((guide, guideIdx) => (
                    <div key={guideIdx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-2">•</span>
                      <textarea
                        value={guide}
                        onChange={(e) => updateGuide(catIdx, guideIdx, e.target.value)}
                        rows={2}
                        className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none"
                      />
                      <button
                        onClick={() => removeGuide(catIdx, guideIdx)}
                        className="text-red-400 hover:text-red-600 p-1.5 mt-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {rubric.evaluatorGuide.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No guide questions defined.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCategory}
        className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-red-400 hover:text-red-600 transition-colors text-sm font-bold flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50"
      >
        <Plus className="w-4 h-4" /> Add Rubric Category
      </button>
    </div>
  );
};

export default ContentManagement;