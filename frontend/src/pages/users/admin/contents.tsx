import React, { useState, useEffect } from "react";
import { useLoading } from "../../../contexts/LoadingContext";
import Sidebar from "../../../components/sidebar";

const ContentManagement: React.FC = () => {
  const { setLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab, setLoading]);

  const tabs = [
    { id: "announcements", label: "Announcements & Updates", icon: "📢" },
    { id: "guidelines", label: "Guidelines & Resources", icon: "📋" },
    { id: "templates", label: "Proposal Templates", icon: "📄" },
    { id: "static", label: "Static Pages", icon: "📝" },
    { id: "media", label: "Media Library", icon: "🖼️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Content Management System</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage all REOC System content, announcements, and resources</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 md:space-x-8 px-4 md:px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-slideIn">
          {activeTab === "announcements" && <AnnouncementsSection />}
          {activeTab === "guidelines" && <GuidelinesSection />}
          {activeTab === "templates" && <TemplatesSection />}
          {activeTab === "static" && <StaticPagesSection />}
          {activeTab === "media" && <MediaLibrarySection />}
        </div>
        </div>
      </main>
    </div>
  );
};

// Announcements & Updates Section
const AnnouncementsSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Proposal Submission Deadline Extended",
      content: "The deadline for Q1 proposals has been extended to March 15th, 2024.",
      scheduledDate: "2024-03-01",
      isPublished: true,
      priority: "high",
    },
    {
      id: 2,
      title: "New AI Feedback System Available",
      content: "We've launched our new AI-powered feedback system for proposal evaluation.",
      scheduledDate: "2024-02-20",
      isPublished: true,
      priority: "medium",
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    scheduledDate: "",
    priority: "medium",
  });

  const handleSaveAnnouncement = () => {
    const announcement = {
      id: Date.now(),
      ...newAnnouncement,
      isPublished: false,
    };
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: "", content: "", scheduledDate: "", priority: "medium" });
    setShowEditor(false);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Announcements & Updates</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
        >
          + New Announcement
        </button>
      </div>

      {showEditor && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Create New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter announcement content"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
                <input
                  type="date"
                  value={newAnnouncement.scheduledDate}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAnnouncement}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Announcement
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    announcement.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : announcement.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {announcement.priority}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    announcement.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {announcement.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-2">{announcement.content}</p>
            <div className="text-sm text-gray-500">
              Scheduled: {announcement.scheduledDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Guidelines & Resources Section
const GuidelinesSection: React.FC = () => {
  const [guidelines] = useState([
    {
      id: 1,
      title: "Proposal Writing Guidelines",
      type: "PDF",
      size: "2.3 MB",
      uploadDate: "2024-02-15",
      category: "Writing",
    },
    {
      id: 2,
      title: "Evaluation Rubric Template",
      type: "DOCX",
      size: "1.1 MB",
      uploadDate: "2024-02-10",
      category: "Evaluation",
    },
  ]);

  const [faqs, setFaqs] = useState([
    {
      id: 1,
      question: "How do I submit a proposal?",
      answer: "Navigate to the proposals section and click 'New Proposal' to start the submission process.",
    },
    {
      id: 2,
      question: "What is the deadline for submissions?",
      answer: "The deadline varies by quarter. Check the announcements section for current deadlines.",
    },
  ]);

  const [showUpload, setShowUpload] = useState(false);
  const [showFaqEditor, setShowFaqEditor] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">Guidelines & Resources</h2>

      {/* File Upload Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-base md:text-lg font-medium text-gray-900">Uploaded Files</h3>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
          >
            + Upload File
          </button>
        </div>

        {showUpload && (
          <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">Drop files here or click to upload</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                </label>
                <p className="mt-1 text-sm text-gray-500">PDF, DOCX, XLSX up to 10MB</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guidelines.map((file) => (
            <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {file.type === "PDF" ? "📄" : file.type === "DOCX" ? "📝" : "📊"}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900">{file.title}</h4>
                    <p className="text-sm text-gray-500">{file.type} • {file.size}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-2">Uploaded: {file.uploadDate}</div>
              <div className="flex gap-2">
                <button className="text-red-600 hover:text-red-700 text-sm">Download</button>
                <button className="text-gray-600 hover:text-gray-700 text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-base md:text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
          <button
            onClick={() => setShowFaqEditor(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
          >
            + Add FAQ
          </button>
        </div>

        {showFaqEditor && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-medium mb-4">Add New FAQ</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter question"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter answer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const faq = { id: Date.now(), ...newFaq };
                    setFaqs([...faqs, faq]);
                    setNewFaq({ question: "", answer: "" });
                    setShowFaqEditor(false);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add FAQ
                </button>
                <button
                  onClick={() => setShowFaqEditor(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
              <p className="text-gray-600">{faq.answer}</p>
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
      name: "Research Proposal Template",
      type: "DOCX",
      version: "2.1",
      lastUpdated: "2024-02-15",
      category: "Research",
    },
    {
      id: 2,
      name: "Project Proposal Template",
      type: "PDF",
      version: "1.8",
      lastUpdated: "2024-02-10",
      category: "Project",
    },
  ]);

  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Proposal Templates</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
        >
          + Upload Template
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <label htmlFor="template-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">Upload template files</span>
                <input id="template-upload" name="template-upload" type="file" className="sr-only" multiple />
              </label>
              <p className="mt-1 text-sm text-gray-500">DOCX, PDF up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {template.type === "DOCX" ? "📝" : "📄"}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.type} • v{template.version}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Category:</span> {template.category}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Last Updated:</span> {template.lastUpdated}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                Download
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Edit
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Replace
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Static Pages Section
const StaticPagesSection: React.FC = () => {
  const [pages] = useState([
    {
      id: 1,
      title: "About the System",
      slug: "about",
      lastModified: "2024-02-15",
      status: "published",
    },
    {
      id: 2,
      title: "Mission & Vision",
      slug: "mission-vision",
      lastModified: "2024-02-10",
      status: "published",
    },
    {
      id: 3,
      title: "Contact Information",
      slug: "contact",
      lastModified: "2024-02-08",
      status: "draft",
    },
    {
      id: 4,
      title: "Privacy Policy",
      slug: "privacy",
      lastModified: "2024-01-20",
      status: "published",
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const handleEditPage = (page: any) => {
    setEditingPage(page);
    setShowEditor(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Static Pages & Content</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
        >
          + New Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map((page) => (
          <div key={page.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                <p className="text-sm text-gray-500">/{page.slug}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  page.status === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {page.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Last modified: {page.lastModified}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditPage(page)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Edit
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Preview
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                {page.status === "published" ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingPage ? `Edit ${editingPage.title}` : "Create New Page"}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingPage(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input
                  type="text"
                  defaultValue={editingPage?.title || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  defaultValue={editingPage?.slug || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter page content..."
                />
              </div>
              <div className="flex gap-2">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Save Page
                </button>
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingPage(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Media Library Section
const MediaLibrarySection: React.FC = () => {
  const [media] = useState([
    {
      id: 1,
      name: "logo-wmsu.png",
      type: "image",
      size: "245 KB",
      uploadDate: "2024-02-15",
      category: "Branding",
      department: "Admin",
    },
    {
      id: 2,
      name: "proposal-guidelines.pdf",
      type: "document",
      size: "1.2 MB",
      uploadDate: "2024-02-10",
      category: "Guidelines",
      department: "R&D",
    },
    {
      id: 3,
      name: "presentation-template.pptx",
      type: "presentation",
      size: "3.4 MB",
      uploadDate: "2024-02-08",
      category: "Templates",
      department: "All",
    },
  ]);

  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);

  const categories = ["all", "Branding", "Guidelines", "Templates", "Images", "Documents"];

  const filteredMedia = selectedCategory === "all" 
    ? media 
    : media.filter(item => item.category === selectedCategory);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Media Library</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2 rounded-lg text-sm w-full md:w-auto ${
              viewMode === "grid" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 rounded-lg text-sm w-full md:w-auto ${
              viewMode === "list" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto"
          >
            + Upload Media
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showUpload && (
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <label htmlFor="media-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">Drop media files here or click to upload</span>
                <input id="media-upload" name="media-upload" type="file" className="sr-only" multiple />
              </label>
              <p className="mt-1 text-sm text-gray-500">Images, PDFs, Documents up to 10MB each</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {item.type === "image" ? "🖼️" : 
                   item.type === "document" ? "📄" : 
                   item.type === "presentation" ? "📊" : "📁"}
                </div>
                <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.size}</p>
                <p className="text-xs text-gray-400">{item.uploadDate}</p>
                <div className="mt-2 flex gap-1">
                  <button className="text-red-600 hover:text-red-700 text-xs">View</button>
                  <button className="text-gray-600 hover:text-gray-700 text-xs">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMedia.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <span className="text-2xl">
                  {item.type === "image" ? "🖼️" : 
                   item.type === "document" ? "📄" : 
                   item.type === "presentation" ? "📊" : "📁"}
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.type} • {item.size} • {item.uploadDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{item.category}</span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{item.department}</span>
                <div className="flex gap-2">
                  <button className="text-red-600 hover:text-red-700 text-sm">View</button>
                  <button className="text-gray-600 hover:text-gray-700 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
