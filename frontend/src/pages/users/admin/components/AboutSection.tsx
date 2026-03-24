import React, { useState, useEffect } from "react";
import { type AboutInfo } from "../../../../schemas/about-schema";
import { AboutApi } from "../../../../services/AboutApi";
import { toast, Toaster } from "react-hot-toast";
import { Rocket, BookOpen, Target, BarChart2, Clock, Lightbulb } from "lucide-react";
import PageLoader from "../../../../components/shared/PageLoader";

import { ImageUpload } from "./shared/ImageUpload";

export const AboutSection: React.FC = () => {
  const [aboutData, setAboutData] = useState<AboutInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAboutInfo();
  }, []);

  const fetchAboutInfo = async () => {
    try {
      const data = await AboutApi.getAboutInfo();
      setAboutData(data);
    } catch (error) {
      console.error("Fetch about error:", error);
      toast.error("Failed to load about information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!aboutData) return;
    
    try {
      setIsSaving(true);
      await AboutApi.updateAboutInfo(aboutData);
      toast.success("About page information saved successfully!");
    } catch (error) {
      toast.error("Failed to save about page information");
    } finally {
      setIsSaving(false);
    }
  };



  if (isLoading) {
    return <PageLoader text="Loading about page information..." className="min-h-[400px]" />;
  }

  if (!aboutData) {
    return <div className="p-6 text-center text-red-500">Failed to load about data. Please try again later.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          About Page Content
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base font-medium"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        
        {/* HERO SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Rocket className="w-5 h-5 text-gray-500" /> Hero Section
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={aboutData.hero.badge}
                  onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Prefix (Black)</label>
                  <input
                    type="text"
                    value={aboutData.hero.title_prefix}
                    onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, title_prefix: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Highlight (Red)</label>
                  <input
                    type="text"
                    value={aboutData.hero.title_highlight}
                    onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, title_highlight: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={aboutData.hero.description}
                onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, description: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm h-full"
              />
            </div>
          </div>
        </div>

        {/* OUR STORY SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <BookOpen className="w-5 h-5 text-gray-500" /> Our Story
          </h3>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
            <div className='lg:col-span-7 space-y-5'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={aboutData.story.badge}
                    onChange={(e) => setAboutData({ ...aboutData, story: { ...aboutData.story, badge: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={aboutData.story.title}
                    onChange={(e) => setAboutData({ ...aboutData, story: { ...aboutData.story, title: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {aboutData.story.paragraphs.map((p: string, index: number) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paragraph {index + 1}</label>
                    <textarea
                      value={p}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const newParagraphs = [...aboutData.story.paragraphs];
                        newParagraphs[index] = e.target.value;
                        setAboutData({ ...aboutData, story: { ...aboutData.story, paragraphs: newParagraphs } });
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <ImageUpload
                currentUrl={aboutData.story.image_url || ""}
                label="Story Section Image"
                onUploadSuccess={(newUrl) => {
                  setAboutData({ ...aboutData, story: { ...aboutData.story, image_url: newUrl } });
                }}
              />
            </div>
          </div>
        </div>

        {/* MISSION & VISION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Target className="w-5 h-5 text-gray-500" /> Mission & Vision
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
              <textarea
                value={aboutData.mission_vision.mission}
                onChange={(e) => setAboutData({ ...aboutData, mission_vision: { ...aboutData.mission_vision, mission: e.target.value } })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Our Vision</label>
              <textarea
                value={aboutData.mission_vision.vision}
                onChange={(e) => setAboutData({ ...aboutData, mission_vision: { ...aboutData.mission_vision, vision: e.target.value } })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* KEY STATISTICS */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <BarChart2 className="w-5 h-5 text-gray-500" /> Key Statistics & Track Record
          </h3>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={aboutData.stats.badge}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={aboutData.stats.title}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
              <textarea
                value={aboutData.stats.description}
                onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, description: e.target.value } })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Approval Rate (%)</label>
                <input
                  type="number"
                  value={aboutData.stats.approval_rate}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, approval_rate: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Projects Funded</label>
                <input
                  type="number"
                  value={aboutData.stats.projects_funded}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, projects_funded: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Funding Secured Text</label>
                <input
                  type="text"
                  value={aboutData.stats.funding_secured_text}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, funding_secured_text: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                  placeholder="e.g. ₱2.3M+"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client Satisfaction (%)</label>
                <input
                  type="number"
                  value={aboutData.stats.client_satisfaction}
                  onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, client_satisfaction: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PROCESS TIMELINE */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Clock className="w-5 h-5 text-gray-500" /> Process Timeline
          </h3>
          <div className='space-y-6'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline Section Title</label>
              <input
                type="text"
                value={aboutData.process.title}
                onChange={(e) => setAboutData({ ...aboutData, process: { ...aboutData.process, title: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            
            <div className="space-y-4">
               {aboutData.process.steps.map((step: any, index: number) => (
                 <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                   <div className="md:col-span-1">
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Step {index + 1} Title</label>
                     <input
                       type="text"
                       value={step.title}
                       onChange={(e) => {
                         const newSteps = [...aboutData.process.steps];
                         newSteps[index] = { ...step, title: e.target.value };
                         setAboutData({ ...aboutData, process: { ...aboutData.process, steps: newSteps } });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Step {index + 1} Description</label>
                     <textarea
                       value={step.description}
                       onChange={(e) => {
                         const newSteps = [...aboutData.process.steps];
                         newSteps[index] = { ...step, description: e.target.value };
                         setAboutData({ ...aboutData, process: { ...aboutData.process, steps: newSteps } });
                       }}
                       rows={2}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                     />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* VALUE PROPOSITIONS */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Lightbulb className="w-5 h-5 text-gray-500" /> Value Propositions
          </h3>
          <div className='space-y-6'>
            <div className='space-y-4'>
               {/* Proposition 1 */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                 <div className="md:col-span-1 space-y-3">
                   <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prop 1 Title</label>
                     <input
                       type="text"
                       value={aboutData.value_props.proposition_1.title}
                       onChange={(e) => {
                         setAboutData({
                           ...aboutData,
                           value_props: {
                             ...aboutData.value_props,
                             proposition_1: { ...aboutData.value_props.proposition_1, title: e.target.value }
                           }
                         });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Button Text</label>
                     <input
                       type="text"
                       value={aboutData.value_props.proposition_1.button_text}
                       onChange={(e) => {
                         setAboutData({
                           ...aboutData,
                           value_props: {
                             ...aboutData.value_props,
                             proposition_1: { ...aboutData.value_props.proposition_1, button_text: e.target.value }
                           }
                         });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                       placeholder="e.g. Learn More"
                     />
                   </div>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prop 1 Description</label>
                   <textarea
                     value={aboutData.value_props.proposition_1.description}
                     onChange={(e) => {
                       setAboutData({
                         ...aboutData,
                         value_props: {
                           ...aboutData.value_props,
                           proposition_1: { ...aboutData.value_props.proposition_1, description: e.target.value }
                         }
                       });
                     }}
                     rows={4}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                   />
                 </div>
               </div>

               {/* Proposition 2 */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                 <div className="md:col-span-1 space-y-3">
                   <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prop 2 Title</label>
                     <input
                       type="text"
                       value={aboutData.value_props.proposition_2.title}
                       onChange={(e) => {
                         setAboutData({
                           ...aboutData,
                           value_props: {
                             ...aboutData.value_props,
                             proposition_2: { ...aboutData.value_props.proposition_2, title: e.target.value }
                           }
                         });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Button Text</label>
                     <input
                       type="text"
                       value={aboutData.value_props.proposition_2.button_text}
                       onChange={(e) => {
                         setAboutData({
                           ...aboutData,
                           value_props: {
                             ...aboutData.value_props,
                             proposition_2: { ...aboutData.value_props.proposition_2, button_text: e.target.value }
                           }
                         });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                       placeholder="e.g. Get Started"
                     />
                   </div>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prop 2 Description</label>
                   <textarea
                     value={aboutData.value_props.proposition_2.description}
                     onChange={(e) => {
                       setAboutData({
                         ...aboutData,
                         value_props: {
                           ...aboutData.value_props,
                           proposition_2: { ...aboutData.value_props.proposition_2, description: e.target.value }
                         }
                       });
                     }}
                       rows={4}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                   />
                 </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
