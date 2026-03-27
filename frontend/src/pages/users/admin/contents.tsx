import React, { useState } from 'react';
import { ContactsSection } from './components/ContactsSection';
import { AboutSection } from "./components/AboutSection";
import { FaqSection } from "./components/FaqSection";
import { HomeSection } from "./components/HomeSection";
import { LogosSection } from "./components/LogosSection";
import { ClipboardList, FileText, Home, Info, Phone, HelpCircle, BarChart, Palette } from 'lucide-react';

// --- MAIN COMPONENT ---
const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('guidelines');

  const tabs = [
    { id: 'guidelines', label: 'Guidelines & Resources', icon: ClipboardList },
    { id: 'templates', label: 'Proposal Templates', icon: FileText },
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
  const [templates] = useState([
    {
      id: 1,
      name: 'Research Proposal Template',
      type: 'DOCX',
      version: '2.1',
      lastUpdated: '2024-02-15',
      category: 'Research'
    },
    {
      id: 2,
      name: 'Project Proposal Template',
      type: 'PDF',
      version: '1.8',
      lastUpdated: '2024-02-10',
      category: 'Project'
    }
  ]);

  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className='p-4 sm:p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6'>
        <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>
          Proposal Templates
        </h2>
        <button
          onClick={() => setShowUpload(true)}
          className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto text-sm sm:text-base'
        >
          + Upload Template
        </button>
      </div>

      {showUpload && (
        <div className='mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg'>
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
              <label htmlFor='template-upload' className='cursor-pointer'>
                <span className='block text-sm sm:text-base font-medium text-gray-900'>
                  Upload template files
                </span>
                <input
                  id='template-upload'
                  name='template-upload'
                  type='file'
                  className='sr-only'
                  multiple
                />
              </label>
              <p className='mt-1 text-xs sm:text-sm text-gray-500'>DOCX, PDF up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        {templates.map((template) => (
          <div
            key={template.id}
            className='border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-3 min-w-0 flex-1'>
                <span className='flex-shrink-0'>
                  {template.type === 'DOCX' ? <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" /> : <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className='font-semibold text-gray-900 text-sm sm:text-base truncate'>
                    {template.name}
                  </h3>
                  <p className='text-xs sm:text-sm text-gray-500'>
                    {template.type} • v{template.version}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-2 mb-4'>
              <div className='text-xs sm:text-sm text-gray-600'>
                <span className='font-medium'>Category:</span>{' '}
                {template.category}
              </div>
              <div className='text-xs sm:text-sm text-gray-600'>
                <span className='font-medium'>Last Updated:</span>{' '}
                {template.lastUpdated}
              </div>
            </div>

            <div className='flex gap-2 flex-wrap'>
              <button className='flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm'>
                Download
              </button>
              <button className='px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm'>
                Edit
              </button>
              <button className='px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm'>
                Replace
              </button>
            </div>
          </div>
        ))}
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