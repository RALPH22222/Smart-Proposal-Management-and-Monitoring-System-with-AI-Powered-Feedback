import React, { useState, useEffect } from "react";
import { FaqApi } from "../../../../services/FaqApi";
import { type FaqInfo, type FaqCategory, type FaqItem } from "../../../../schemas/faq-schema";
import { toast, Toaster } from "react-hot-toast";
import { Plus, Trash2, GripVertical, Rocket, HelpCircle, Phone } from "lucide-react";
import PageLoader from "../../../../components/shared/PageLoader";

export const FaqSection: React.FC = () => {
  const [faqData, setFaqData] = useState<FaqInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFaqInfo();
  }, []);

  const fetchFaqInfo = async () => {
    try {
      const data = await FaqApi.getFaqInfo();
      setFaqData(data);
    } catch (error) {
      console.error("Fetch faq error:", error);
      toast.error("Failed to load FAQ information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!faqData) return;
    
    try {
      setIsSaving(true);
      await FaqApi.updateFaqInfo(faqData);
      toast.success("FAQ page information saved successfully!");
    } catch (error) {
      toast.error("Failed to save FAQ page information");
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    if (!faqData) return;
    const newCategory: FaqCategory = {
      id: `cat_${Date.now()}`,
      name: "New Category",
      icon: "general",
      items: [],
    };
    setFaqData({
      ...faqData,
      categories: [...faqData.categories, newCategory],
    });
  };

  const removeCategory = (index: number) => {
    if (!faqData) return;
    const newCategories = [...faqData.categories];
    newCategories.splice(index, 1);
    setFaqData({ ...faqData, categories: newCategories });
  };

  const updateCategory = (index: number, field: keyof FaqCategory, value: any) => {
    if (!faqData) return;
    const newCategories = [...faqData.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setFaqData({ ...faqData, categories: newCategories });
  };

  const addQuestion = (categoryIndex: number) => {
    if (!faqData) return;
    const newItem: FaqItem = {
      id: `q_${Date.now()}`,
      question: "New Question",
      answer: "Answer...",
    };
    const newCategories = [...faqData.categories];
    newCategories[categoryIndex].items.push(newItem);
    setFaqData({ ...faqData, categories: newCategories });
  };

  const removeQuestion = (categoryIndex: number, itemIndex: number) => {
    if (!faqData) return;
    const newCategories = [...faqData.categories];
    newCategories[categoryIndex].items.splice(itemIndex, 1);
    setFaqData({ ...faqData, categories: newCategories });
  };

  const updateQuestion = (categoryIndex: number, itemIndex: number, field: keyof FaqItem, value: string) => {
    if (!faqData) return;
    const newCategories = [...faqData.categories];
    newCategories[categoryIndex].items[itemIndex] = {
      ...newCategories[categoryIndex].items[itemIndex],
      [field]: value,
    };
    setFaqData({ ...faqData, categories: newCategories });
  };

  if (isLoading) {
    return <PageLoader text="Loading FAQ information..." className="min-h-[400px]" />;
  }

  if (!faqData) {
    return <div className="p-6 text-center text-red-500">Failed to load FAQ data. Please try again later.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          FAQ Page Content
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base font-medium"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        
        {/* HERO SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Rocket className="w-5 h-5 text-gray-500" /> Hero Section
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={faqData.hero.badge}
                  onChange={(e) => setFaqData({ ...faqData, hero: { ...faqData.hero, badge: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Prefix (Black)</label>
                  <input
                    type="text"
                    value={faqData.hero.titlePrefix}
                    onChange={(e) => setFaqData({ ...faqData, hero: { ...faqData.hero, titlePrefix: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Highlight (Red)</label>
                  <input
                    type="text"
                    value={faqData.hero.titleHighlight}
                    onChange={(e) => setFaqData({ ...faqData, hero: { ...faqData.hero, titleHighlight: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={faqData.hero.description}
                onChange={(e) => setFaqData({ ...faqData, hero: { ...faqData.hero, description: e.target.value } })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm h-full"
              />
            </div>
          </div>
        </div>

        {/* CATEGORIES & QUESTIONS SECTION */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center mb-4'>
             <h3 className='text-md font-semibold text-gray-800 flex items-center gap-2'>
               <HelpCircle className="w-5 h-5 text-gray-500" /> Categories & Questions
             </h3>
             <button
                onClick={addCategory}
                className="flex items-center gap-1 text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors font-medium border border-gray-300"
             >
                <Plus className="w-4 h-4" /> Add Category
             </button>
          </div>

          <div className='space-y-6'>
            {faqData.categories.map((category, catIndex) => (
              <div key={catIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                
                {/* Category Header */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                   <div className="flex gap-4 flex-1 w-full">
                     <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category Name</label>
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => updateCategory(catIndex, "name", e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                        />
                     </div>
                   </div>
                   <button
                     onClick={() => removeCategory(catIndex)}
                     className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors mt-4 md:mt-0 flex-shrink-0 border border-transparent hover:border-red-200"
                     title="Delete Category"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                {/* Category Questions */}
                <div className="p-4 space-y-4">
                   {category.items.length === 0 ? (
                     <div className="text-sm text-gray-500 italic text-center py-4">No questions added yet.</div>
                   ) : (
                     category.items.map((item, itemIndex) => (
                       <div key={itemIndex} className="flex gap-3 items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                         <div className="mt-2 flex-shrink-0 cursor-grab text-gray-400 hover:text-gray-600">
                           <GripVertical className="w-4 h-4" />
                         </div>
                         <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={item.question}
                              placeholder="Question..."
                              onChange={(e) => updateQuestion(catIndex, itemIndex, "question", e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm font-medium"
                            />
                            <textarea
                              value={item.answer}
                              placeholder="Answer..."
                              onChange={(e) => updateQuestion(catIndex, itemIndex, "answer", e.target.value)}
                              rows={2}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                            />
                         </div>
                         <button
                           onClick={() => removeQuestion(catIndex, itemIndex)}
                           className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors mt-[1px]"
                           title="Delete Question"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))
                   )}

                   <button
                     onClick={() => addQuestion(catIndex)}
                     className="flex items-center gap-1 text-sm text-[#C8102E] hover:text-[#A00D26] font-medium transition-colors mt-2"
                   >
                     <Plus className="w-4 h-4" /> Add Question
                   </button>
                </div>
              </div>
            ))}
            {faqData.categories.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                No categories defined. Add one to start building your FAQ!
              </div>
            )}
          </div>
        </div>

        {/* SUPPORT / CONTACT BANNERS */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
           <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
             <Phone className="w-5 h-5 text-gray-500" /> Contact Support Footer
           </h3>
           <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={faqData.support.title}
                  onChange={(e) => setFaqData({ ...faqData, support: { ...faqData.support, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Description</label>
                <input
                  type="text"
                  value={faqData.support.description}
                  onChange={(e) => setFaqData({ ...faqData, support: { ...faqData.support, description: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={faqData.support.email}
                  onChange={(e) => setFaqData({ ...faqData, support: { ...faqData.support, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={faqData.support.phone}
                  onChange={(e) => setFaqData({ ...faqData, support: { ...faqData.support, phone: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
