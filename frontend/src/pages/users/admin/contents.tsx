import React, { useState, useEffect } from 'react';
import { ContactsSection } from './components/ContactsSection';
import { AboutSection } from "./components/AboutSection";
import { FaqSection } from "./components/FaqSection";
import { HomeSection } from "./components/HomeSection";
import { LogosSection } from "./components/LogosSection";
import { ClipboardList, FileText, Home, Info, Phone, HelpCircle, BarChart, Palette, Save, Loader2, ListOrdered } from 'lucide-react';
import { HomeApi } from "../../../services/HomeApi";
import { DEFAULT_HOME_INFO, type HomeInfo, type HomeProcessStep } from "../../../schemas/home-schema";
import { FileUpload } from "./components/shared/FileUpload";
import { toast, Toaster } from "react-hot-toast";

// --- MAIN COMPONENT ---
const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('guidelines');

  const tabs = [
    { id: 'guidelines', label: 'Guidelines & Resources', icon: ClipboardList },
    { id: 'templates', label: 'Proposal Templates', icon: FileText },
    { id: 'howitworks', label: 'Proponent', icon: ListOrdered },
    { id: 'home', label: 'Home Page', icon: Home },
    { id: 'about', label: 'About Page', icon: Info },
    { id: 'contacts', label: 'Contact Info', icon: Phone },
    { id: 'faq', label: 'FAQ Page', icon: HelpCircle },
    { id: 'branding', label: 'System Branding', icon: Palette }
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 h-full overflow-hidden">
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
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-6 flex-shrink-0'>
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
        {activeTab === 'guidelines' && <GuidelinesSection />}
        { activeTab === 'templates' && <TemplatesSection />}
        { activeTab === 'howitworks' && <HowItWorksSection />}
        { activeTab === 'home' && <HomeSection />}
        { activeTab === 'about' && <AboutSection />}
        {activeTab === 'contacts' && <ContactsSection />}
        {activeTab === 'faq' && <FaqSection />}
        {activeTab === 'branding' && <MediaLibrarySection />}
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
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading steps...</p>
      </div>
    );
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

// Guidelines & Resources Section
const GuidelinesSection: React.FC = () => {
  const [guidelines] = useState([
    {
      id: 1,
      title: 'Proposal Writing Guidelines',
      type: 'PDF',
      size: '2.3 MB',
      uploadDate: '2024-02-15',
      category: 'Writing'
    },
    {
      id: 2,
      title: 'Evaluation Rubric Template',
      type: 'DOCX',
      size: '1.1 MB',
      uploadDate: '2024-02-10',
      category: 'Evaluation'
    }
  ]);

  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className='p-4 sm:p-6'>
      <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-6'>
        Guidelines & Resources
      </h2>

      {/* File Upload Section */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
          <h3 className='text-base sm:text-lg font-medium text-gray-900'>
            Uploaded Files
          </h3>
          <button
            onClick={() => setShowUpload(true)}
            className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto text-sm sm:text-base'
          >
            + Upload File
          </button>
        </div>

        {showUpload && (
          <div className='mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg'>
            <div className='text-center'>
              <svg
                className='mx-auto h-8 sm:h-12 w-8 sm:w-12 text-gray-400'
                stroke='currentColor'
                fill='none'
                viewBox='0 0 48 48'
              >
                <path
                  d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <div className='mt-3 sm:mt-4'>
                <label htmlFor='file-upload' className='cursor-pointer'>
                  <span className='block text-sm sm:text-base font-medium text-gray-900'>
                    Drop files here or click to upload
                  </span>
                  <input
                    id='file-upload'
                    name='file-upload'
                    type='file'
                    className='sr-only'
                    multiple
                  />
                </label>
                <p className='mt-1 text-xs sm:text-sm text-gray-500'>
                  PDF, DOCX, XLSX up to 10MB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {guidelines.map((file) => (
            <div
              key={file.id}
              className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='flex items-center gap-2 min-w-0 flex-1'>
                  <span className='flex-shrink-0'>
                    {file.type === 'PDF'
                      ? <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                      : file.type === 'DOCX'
                      ? <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                      : <BarChart className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className='font-medium text-gray-900 truncate'>{file.title}</h4>
                    <p className='text-xs sm:text-sm text-gray-500'>
                      {file.type} • {file.size}
                    </p>
                  </div>
                </div>
              </div>
              <div className='text-xs text-gray-400 mb-2'>
                Uploaded: {file.uploadDate}
              </div>
              <div className='flex gap-2 flex-wrap'>
                <button className='text-red-600 hover:text-red-700 text-xs sm:text-sm'>
                  Download
                </button>
                <button className='text-gray-600 hover:text-gray-700 text-xs sm:text-sm'>
                  Edit
                </button>
                <button className='text-red-600 hover:text-red-700 text-xs sm:text-sm'>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium font-inter">Loading templates...</p>
      </div>
    );
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
          helperText="Generic template for Monitoring and Project implementation plans."
        />
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex gap-3">
          <div className="bg-blue-100 p-2 rounded-lg h-fit">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">CMS Guidance</h4>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              These files are linked directly to the download buttons on the landing page. 
              Always ensure you use high-quality, standardized templates endorsed by the research center.
            </p>
          </div>
        </div>
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

export default ContentManagement;