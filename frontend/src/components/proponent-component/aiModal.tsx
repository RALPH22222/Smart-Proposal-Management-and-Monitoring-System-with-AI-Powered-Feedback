import React from 'react';
import {
  FaRobot,
  FaTimes,
  FaExclamationTriangle,
  FaMagic,
  FaFingerprint,
  FaLightbulb,
  FaGlobeAmericas,
  FaCheckCircle
} from 'react-icons/fa';
import type { FormExtractedFields } from '../../services/proposal.api';

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
  strengths?: string[];
  formFields?: FormExtractedFields;
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

  // Prevent invalid/undetectable documents (which return noveltyScore: 0) from appearing as 100% similar
  const similarityScore = finalResult.isValid ? 100 - (finalResult.noveltyScore || 0) : 0;
  const isMatchDetected = similarityScore > 60;
  
  let similarityStatus = "Not Related";
  if (!finalResult.isValid) similarityStatus = "N/A (Analysis failed)";
  else if (similarityScore <= 20) similarityStatus = "Not Related";
  else if (similarityScore <= 40) similarityStatus = "Slightly Related";
  else if (similarityScore <= 60) similarityStatus = "Moderately Similar";
  else if (similarityScore <= 80) similarityStatus = "Highly Similar";
  else similarityStatus = "Very Similar";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-[1.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* --- Header --- */}
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#C8102E] to-blue-800 rounded-xl shadow-lg shadow-red-100">
                <FaRobot className="text-white text-base sm:text-xl" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight">
                  {finalResult.title}
                </h2>
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] mt-2 font-bold text-gray-400 uppercase tracking-widest">
                  <span className="bg-red-50 text-[#C8102E] px-1.5 py-0.5 rounded">AI POWERED</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all hover:rotate-90 duration-300"
            >
              <FaTimes className="text-gray-400 hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* --- Content Scroll Area --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {isChecking ? (
            /* LOADING STATE */
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-[5px] border-red-50 border-t-[#C8102E] rounded-full animate-spin"></div>
                <FaRobot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#C8102E] text-xl animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Analyzing Proposal...</h3>
                <p className="text-gray-500 text-xs max-w-[250px] mx-auto">Cross-referencing research databases and checking institutional compliance</p>
              </div>
            </div>
          ) : (
            /* RESULT STATE */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* 1. Score & Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
                {/* Compliance Score */}
                <div className={`md:col-span-4 p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all hover:shadow-md ${
                  finalResult.isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100 shadow-red-50'
                }`}>
                  <div className={`text-3xl sm:text-4xl font-black mb-0.5 ${finalResult.isValid ? 'text-emerald-600' : 'text-[#C8102E]'}`}>
                    {finalResult.score}%
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${finalResult.isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                    Compliance
                  </div>
                </div>

                {/* Novelty / Uniqueness Score */}
                <div className="md:col-span-8 p-4 rounded-2xl border-2 border-blue-50 bg-gradient-to-br from-blue-50/50 to-white relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <FaFingerprint className="text-7xl text-blue-900 -rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-tighter">
                        <FaFingerprint className="text-xs" /> Research Novelty
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${(!finalResult.isValid || isMatchDetected) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {similarityStatus}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out-expo ${
                          (finalResult.noveltyScore || 0) > 75 ? 'bg-blue-600' : 
                          (finalResult.noveltyScore || 0) > 40 ? 'bg-amber-500' : 'bg-[#C8102E]'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(0, finalResult.noveltyScore || 0))}%` }}
                      ></div>
                    </div>
                    <div className="font-bold text-[10px] text-blue-800 flex items-start gap-1.5 leading-tight">
                      {finalResult.title?.includes("Cannot Detect Proposal") ? (
                        <>
                          <FaExclamationTriangle className="text-[#C8102E] text-xs flex-shrink-0" aria-hidden />
                          <span className="text-[#C8102E]">ERROR: Document structure not recognized</span>
                        </>
                      ) : !isMatchDetected ? (
                        <>
                          <FaCheckCircle className="text-emerald-600 text-xs flex-shrink-0" aria-hidden />
                          <span>High Novelty — No duplicates identified.</span>
                        </>
                      ) : (
                        <>
                          <FaExclamationTriangle className="text-amber-500 text-xs flex-shrink-0" aria-hidden />
                          <span>Low Novelty — Consider rephrasing objectives.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Landscape Analysis Section */}
              <div className="bg-gray-50/50 rounded-[1.5rem] p-4 sm:p-5 border border-gray-100">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <FaGlobeAmericas className="text-blue-500" /> Research Landscape
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                   {/* Keywords / Profile Tags */}
                   <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2.5 tracking-widest">Detected Concepts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(finalResult.keywords || []).map((kw, i) => (
                        <span key={i} className={`px-3 py-1 bg-white border-2 rounded-lg text-[10px] font-bold shadow-sm transition-transform hover:scale-105 ${
                          kw.toLowerCase() === 'undetectable' || !finalResult.isValid
                            ? 'border-red-100 text-[#C8102E]' 
                            : 'border-blue-50 text-blue-700'
                        }`}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Similar Papers Check */}
                  <div className={`rounded-xl p-4 border-2 transition-all ${
                    !finalResult.isValid ? 'bg-red-50/50 border-red-100' : 
                    !isMatchDetected ? 'bg-blue-50/30 border-blue-100/50' : 
                    'bg-white border-amber-100 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${(!finalResult.isValid || isMatchDetected) ? 'bg-red-100 text-[#C8102E]' : 'bg-blue-100 text-blue-600'}`}>
                        {(!finalResult.isValid || isMatchDetected) ? <FaExclamationTriangle className="text-lg" /> : <FaLightbulb className="text-lg" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-black text-[11px] uppercase tracking-tight mb-1.5 ${!finalResult.isValid ? 'text-[#C8102E]' : !isMatchDetected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {!finalResult.isValid ? 'Analysis Interrupted' : !isMatchDetected ? 'Groundbreaking Potential' : 'Related Research Found'}
                        </h4>
                        
                        {(finalResult.similarPapers || []).length > 0 ? (
                          <div className="space-y-1.5 mt-3">
                            {(finalResult.similarPapers || []).map((paper, idx) => (
                              <div key={idx} className="group bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between gap-3 hover:border-blue-200 transition-all cursor-default">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-red-600 rounded-full shrink-0"></div>
                                  <span className="text-[10px] font-bold text-gray-700 leading-tight">"{paper.title}"</span>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 shrink-0">{paper.year}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] font-medium italic text-gray-500 leading-snug">
                            {!finalResult.isValid
                              ? "Verification interrupted."
                              : !isMatchDetected 
                                ? "Verified Unique: No duplicate research detected." 
                                : "Thematic similarities detected."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Actionable Insights */}
              {((finalResult.issues || []).length > 0 || (finalResult.suggestions || []).length > 0 || (finalResult.strengths || []).length > 0) && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FaMagic className="text-[#C8102E]" /> AI Optimization Guide
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Critical Issues (Red) */}
                    {(finalResult.issues || []).map((issue, index) => (
                      <div key={`issue-${index}`} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <FaExclamationTriangle className="text-[#C8102E] text-base mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-red-400 uppercase mb-0.5">Issue</span>
                          <span className="text-xs text-red-900 font-bold leading-tight">{issue}</span>
                        </div>
                      </div>
                    ))}

                    {/* Suggestions (Blue) */}
                    {(finalResult.suggestions || []).map((suggestion, index) => (
                      <div key={`sugg-${index}`} className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <FaMagic className="text-blue-600 text-base mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Optimization</span>
                          <span className="text-xs text-blue-800 font-bold leading-tight">{suggestion}</span>
                        </div>
                      </div>
                    ))}

                    {/* Strengths (Green) */}
                    {(finalResult.strengths || []).map((strength, index) => (
                      <div key={`strength-${index}`} className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <FaCheckCircle className="text-emerald-600 text-base mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-emerald-400 uppercase mb-0.5">Strength</span>
                          <span className="text-xs text-emerald-900 font-bold leading-tight">{strength}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#C8102E] hover:bg-[#a00d24] text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-red-100 active:scale-95"
          >
            {finalResult.isValid ? 'Confirm & Close' : 'Dismiss'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIModal;