import React, { useState, useEffect } from "react";
import { type HomeInfo } from "../../../../schemas/home-schema";
import { HomeApi } from "../../../../services/HomeApi";
import { toast, Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export const HomeSection: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchHomeInfo();
  }, []);

  const fetchHomeInfo = async () => {
    try {
      const data = await HomeApi.getHomeInfo();
      setHomeData(data);
    } catch (error) {
      console.error("Fetch home error:", error);
      toast.error("Failed to load home page information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!homeData) return;
    
    try {
      setIsSaving(true);
      await HomeApi.updateHomeInfo(homeData);
      toast.success("Home page information saved successfully!");
    } catch (error) {
      toast.error("Failed to save home page information");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!homeData) {
    return <div className="p-6 text-center text-red-500">Failed to load home data. Please try again later.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Home Page Content
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base font-medium"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='space-y-6'>
        
        {/* HERO SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <span>🚀</span> Hero Section
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={homeData.hero.badge}
                  onChange={(e) => setHomeData({ ...homeData, hero: { ...homeData.hero, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Prefix (Black)</label>
                  <input
                    type="text"
                    value={homeData.hero.title_prefix}
                    onChange={(e) => setHomeData({ ...homeData, hero: { ...homeData.hero, title_prefix: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Highlight (Red)</label>
                  <input
                    type="text"
                    value={homeData.hero.title_highlight}
                    onChange={(e) => setHomeData({ ...homeData, hero: { ...homeData.hero, title_highlight: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={homeData.hero.description}
                onChange={(e) => setHomeData({ ...homeData, hero: { ...homeData.hero, description: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm h-full"
              />
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <span>📊</span> Statistics
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {homeData.stats.map((stat, index) => (
              <div key={index} className="p-4 bg-white border rounded-lg space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-red-600 uppercase">Stat {index + 1}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...homeData.stats];
                      newStats[index] = { ...stat, label: e.target.value };
                      setHomeData({ ...homeData, stats: newStats });
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Value (Number)</label>
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = [...homeData.stats];
                        newStats[index] = { ...stat, value: parseInt(e.target.value) || 0 };
                        setHomeData({ ...homeData, stats: newStats });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Suffix (e.g. + or %)</label>
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => {
                        const newStats = [...homeData.stats];
                        newStats[index] = { ...stat, suffix: e.target.value };
                        setHomeData({ ...homeData, stats: newStats });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT OFFICE SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <span>🏛️</span> About Our Office
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={homeData.about.badge}
                  onChange={(e) => setHomeData({ ...homeData, about: { ...homeData.about, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={homeData.about.title}
                  onChange={(e) => setHomeData({ ...homeData, about: { ...homeData.about, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={homeData.about.description}
                  onChange={(e) => setHomeData({ ...homeData, about: { ...homeData.about, description: e.target.value } })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bullet Points (Service List)</label>
                <div className="space-y-2">
                  {homeData.about.bullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...homeData.about.bullets];
                          newBullets[index] = e.target.value;
                          setHomeData({ ...homeData, about: { ...homeData.about, bullets: newBullets } });
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={homeData.about.image_url}
                  onChange={(e) => setHomeData({ ...homeData, about: { ...homeData.about, image_url: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION GUIDELINES */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <span>📝</span> Submission Guidelines
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={homeData.guidelines.badge}
                  onChange={(e) => setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={homeData.guidelines.title}
                  onChange={(e) => setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pro Tip Text</label>
                <textarea
                  value={homeData.guidelines.pro_tip}
                  onChange={(e) => setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, pro_tip: e.target.value } })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={homeData.guidelines.description}
                  onChange={(e) => setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, description: e.target.value } })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeData.guidelines.items.map((item, index) => (
              <div key={index} className="p-4 bg-white border rounded-lg space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-red-600 uppercase">Guideline Item {index + 1}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...homeData.guidelines.items];
                      newItems[index] = { ...item, title: e.target.value };
                      setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, items: newItems } });
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...homeData.guidelines.items];
                      newItems[index] = { ...item, description: e.target.value };
                      setHomeData({ ...homeData, guidelines: { ...homeData.guidelines, items: newItems } });
                    }}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EVALUATION CRITERIA */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <span>🎓</span> Evaluation Criteria
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={homeData.criteria.badge}
                  onChange={(e) => setHomeData({ ...homeData, criteria: { ...homeData.criteria, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={homeData.criteria.title}
                  onChange={(e) => setHomeData({ ...homeData, criteria: { ...homeData.criteria, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={homeData.criteria.description}
                onChange={(e) => setHomeData({ ...homeData, criteria: { ...homeData.criteria, description: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeData.criteria.items.map((item, index) => (
              <div key={index} className="p-4 bg-white border rounded-lg space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-red-600 uppercase">Criterion {index + 1}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...homeData.criteria.items];
                      newItems[index] = { ...item, title: e.target.value };
                      setHomeData({ ...homeData, criteria: { ...homeData.criteria, items: newItems } });
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...homeData.criteria.items];
                      newItems[index] = { ...item, description: e.target.value };
                      setHomeData({ ...homeData, criteria: { ...homeData.criteria, items: newItems } });
                    }}
                    rows={4}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
