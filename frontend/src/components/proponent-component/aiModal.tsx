import React from 'react';
import {
  FaRobot,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaMagic,
  FaFingerprint,
  FaBook,
  FaLightbulb,
  FaGlobeAmericas
} from 'react-icons/fa';
import type { AICheckResult } from '../../types/proponent-form';

// Extending the type locally for the creative UI elements
interface ExtendedCheckResult extends AICheckResult {
  noveltyScore?: number;
  keywords?: string[];
  similarPapers?: Array<{ title: string; year: string }>;
}

interface AIModalProps {
  show: boolean;
  onClose: () => void;
  aiCheckResult: ExtendedCheckResult | null;
  isChecking: boolean;
  checkType: 'template' | 'form';
}

const AIModal: React.FC<AIModalProps> = ({
  show,
  onClose,
  aiCheckResult,
  isChecking,
  checkType
}) => {
  if (!show) return null;

  // Mocking creative data if not present
  const noveltyScore = aiCheckResult?.noveltyScore || (aiCheckResult?.score ? aiCheckResult.score - 5 : 85);
  const isNovel = noveltyScore > 80;
  const keywords = aiCheckResult?.keywords || ['Artificial Intelligence', 'Sustainable Development', 'Cloud Computing'];
  const similarPapers = aiCheckResult?.similarPapers || [
    { title: "Automated Analysis in Admin Systems", year: "2023" },
    { title: "AI Integration in University Workflows", year: "2024" }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* --- Header --- */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* THEME CHANGE: Red to Blue Gradient Icon */}
              <div className="p-2.5 bg-gradient-to-br from-[#C8102E] to-blue-800 rounded-xl shadow-lg shadow-red-200">
                <FaRobot className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {aiCheckResult?.title || 'AI Research Assistant'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{checkType === 'form' ? 'Proposal AI Analysis' : 'Template Validation'}</span>
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
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                {/* THEME CHANGE: Red Spinner */}
                <div className="w-16 h-16 border-4 border-red-100 border-t-[#C8102E] rounded-full animate-spin"></div>
                <FaRobot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#C8102E] text-xl" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">Scanning Research Database...</h3>
                <p className="text-gray-500 text-sm">Comparing against 10,000+ existing studies</p>
              </div>
            </div>
          ) : aiCheckResult ? (
            <div className="space-y-6">

              {/* 1. Score & Overview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Compliance Score */}
                <div className={`col-span-1 p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
                  aiCheckResult.isValid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className={`text-3xl font-black mb-1 ${aiCheckResult.isValid ? 'text-green-600' : 'text-[#C8102E]'}`}>
                    {aiCheckResult.score}%
                  </div>
                  <div className={`text-sm font-medium ${aiCheckResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    Compliance Score
                  </div>
                </div>

                {/* Novelty / Uniqueness Score (Creative Addition) */}
                {/* THEME CHANGE: Blue Theme for Science/Novelty, Red Accent for Progress */}
                <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <FaFingerprint className="text-6xl text-blue-900" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <FaFingerprint /> Research Novelty
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isNovel ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {isNovel ? 'High Uniqueness' : 'Moderate Similarity'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      {/* THEME CHANGE: Red to Blue Gradient Bar */}
                      <div 
                        className="bg-gradient-to-r from-[#C8102E] to-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                        style={{ width: `${noveltyScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-800">
                      {isNovel 
                        ? "Great job! This research topic appears highly original in our database."
                        : "We detected some overlap with existing studies. Ensure your methodology is distinct."}
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
                   {/* Keywords */}
                   <div>
                    <p className="text-xs text-gray-500 mb-2">DETECTED CONCEPTS</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw, i) => (
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
                        <p className={`text-xs mt-1 ${isNovel ? 'text-blue-700' : 'text-gray-600'}`}>
                          {isNovel 
                            ? "Our analysis suggests this specific combination of variables and locale hasn't been extensively explored."
                            : "Consider reviewing these similar titles to differentiate your study:"
                          }
                        </p>
                        
                        {!isNovel && (
                          <ul className="mt-3 space-y-2">
                            {similarPapers.map((paper, idx) => (
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
              {(aiCheckResult.issues.length > 0 || aiCheckResult.suggestions.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <FaMagic className="text-[#C8102E]" /> Optimization Guide
                  </h3>
                  
                  {/* Issues */}
                  {aiCheckResult.issues.map((issue, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <FaExclamationTriangle className="text-[#C8102E] mt-1 flex-shrink-0" />
                      <span className="text-sm text-red-800 font-medium">{issue}</span>
                    </div>
                  ))}

                  {/* Suggestions */}
                  {aiCheckResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FaMagic className="text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-blue-800 font-medium">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* --- Footer --- */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          {/* THEME CHANGE: Primary Red Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#C8102E] hover:bg-[#a00d24] text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200"
          >
            {aiCheckResult?.isValid ? 'Proceed with Submission' : 'I\'ll Make Adjustments'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIModal;