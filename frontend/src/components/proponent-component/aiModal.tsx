import React from 'react';
import {
  FaRobot,
  FaTimes,
  FaExclamationTriangle,
  FaMagic,
  FaFingerprint,
  FaBook,
  FaLightbulb,
  FaGlobeAmericas
} from 'react-icons/fa';

// 1. Strict Type Definition
export interface AIAnalysisResult {
  title?: string;
  score?: number;
  isValid?: boolean;
  noveltyScore?: number;
  keywords?: string[];
  similarPapers?: Array<{ title: string; year: string }>;
  issues?: string[];
  suggestions?: string[];
}

interface AIModalProps {
  show: boolean;
  onClose: () => void;
  aiCheckResult: AIAnalysisResult | null;
  isChecking: boolean;
}

const AIModal: React.FC<AIModalProps> = ({
  show,
  onClose,
  aiCheckResult,
  isChecking
}) => {
  if (!show) return null;

  // --- MOCK DATA CONFIGURATION ---
  const DEFAULT_RESULT: AIAnalysisResult = {
    title: "AI Analysis Report",
    score: 88,
    isValid: true,
    noveltyScore: 92,
    keywords: ["Large-Scale R&D", "Agri-Tech", "Multi-Agency"],
    similarPapers: [
      { title: "Traditional Soil Analysis Methods in Mindanao", year: "2019" }
    ],
    issues: ["Personal Services budget is 55% (Approaching the 60% limit)."],
    suggestions: [
      "Consider increasing MOOE allocation for field testing.",
      "Add one more LGU partner to strengthen deployment plan."
    ]
  };

  // --- SAFETY MERGE ---
  // This ensures that if aiCheckResult is missing fields, we use defaults 
  // to prevent the "White Screen" crash.
  const finalResult = { 
    ...DEFAULT_RESULT, 
    ...(aiCheckResult || {}) 
  };

  const isNovel = (finalResult.noveltyScore || 0) > 75;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* --- Header --- */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#C8102E] to-blue-800 rounded-xl shadow-lg shadow-red-200">
                <FaRobot className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {finalResult.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Proposal Analysis & Validation</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* --- Content Scroll Area --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isChecking ? (
            /* LOADING STATE */
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-100 border-t-[#C8102E] rounded-full animate-spin"></div>
                <FaRobot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#C8102E] text-xl" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">Scanning Research Database...</h3>
                <p className="text-gray-500 text-sm">Comparing budget & novelty against 2,000+ records</p>
              </div>
            </div>
          ) : (
            /* RESULT STATE */
            <div className="space-y-6">

              {/* 1. Score & Overview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Compliance Score */}
                <div className={`col-span-1 p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
                  finalResult.isValid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className={`text-3xl font-black mb-1 ${finalResult.isValid ? 'text-green-600' : 'text-[#C8102E]'}`}>
                    {finalResult.score}%
                  </div>
                  <div className={`text-sm font-medium ${finalResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    Compliance Score
                  </div>
                </div>

                {/* Novelty / Uniqueness Score */}
                <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <FaFingerprint className="text-6xl text-blue-900" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <FaFingerprint /> Research Novelty
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isNovel ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isNovel ? 'High Uniqueness' : 'Similarity Detected'}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-gradient-to-r from-[#C8102E] to-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                        style={{ width: `${finalResult.noveltyScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-800">
                      {isNovel 
                        ? "Great job! This research topic appears original in our database."
                        : "This topic overlaps with existing projects. Consider refining your focus."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Research Landscape Analysis */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FaGlobeAmericas className="text-blue-600" /> Landscape Analysis
                </h3>
                
                <div className="space-y-4">
                   {/* Keywords / Profile Tags */}
                   <div>
                    <p className="text-xs text-gray-500 mb-2">DETECTED CONCEPTS / PROFILE</p>
                    <div className="flex flex-wrap gap-2">
                      {(finalResult.keywords || []).map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-blue-100 rounded-full text-xs font-medium text-blue-700 shadow-sm">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Similar Papers Check */}
                  <div className={`rounded-xl p-4 border ${isNovel ? 'bg-blue-50 border-blue-100' : 'bg-white border-red-100 shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isNovel ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-[#C8102E]'}`}>
                        {isNovel ? <FaLightbulb /> : <FaBook />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${isNovel ? 'text-blue-900' : 'text-gray-900'}`}>
                          {isNovel ? 'Potential for Groundbreaking Research' : 'Similar Past Research Found'}
                        </h4>
                        
                        {/* Safe Check for array length */}
                        {(finalResult.similarPapers || []).length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {(finalResult.similarPapers || []).map((paper, idx) => (
                              <li key={idx} className="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full"></span>
                                <span className="italic font-medium">"{paper.title}"</span>
                                <span className="text-gray-400">({paper.year})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Actionable Insights */}
              {((finalResult.issues || []).length > 0 || (finalResult.suggestions || []).length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <FaMagic className="text-[#C8102E]" /> Optimization Guide
                  </h3>
                  
                  {/* Critical Issues (Red) */}
                  {(finalResult.issues || []).map((issue, index) => (
                    <div key={`issue-${index}`} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <FaExclamationTriangle className="text-[#C8102E] mt-1 flex-shrink-0" />
                      <span className="text-sm text-red-800 font-medium">{issue}</span>
                    </div>
                  ))}

                  {/* Suggestions (Blue) */}
                  {(finalResult.suggestions || []).map((suggestion, index) => (
                    <div key={`sugg-${index}`} className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FaMagic className="text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-blue-800 font-medium">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#C8102E] hover:bg-[#a00d24] text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200"
          >
            {finalResult.isValid ? 'Proceed with Submission' : 'I\'ll Make Adjustments'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIModal;