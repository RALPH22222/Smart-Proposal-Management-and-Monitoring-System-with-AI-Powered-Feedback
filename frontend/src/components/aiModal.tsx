import React from 'react';
import {
  FaRobot,
  FaTimes,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaMagic
} from 'react-icons/fa';
import type { AICheckResult } from '../types/proponent-form';

interface AIModalProps {
  show: boolean;
  onClose: () => void;
  aiCheckResult: AICheckResult | null;
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-2 sm:mx-4">
        {/* Header */}
        <div className="p-2 sm:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg">
                <FaRobot className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  {aiCheckResult?.title || 'AI Analysis'}
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {checkType === 'form' 
                    ? 'Form completion insights' 
                    : 'Document template analysis'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-400 hover:text-gray-600 text-sm sm:text-base" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[60vh]">
          {isChecking ? (
            <div className="text-center py-8 sm:py-12">
              <FaSpinner className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                AI is analyzing your {checkType}...
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                This may take a few moments
              </p>
            </div>
          ) : aiCheckResult ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Status Card */}
              <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 ${
                aiCheckResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${
                      aiCheckResult.isValid ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {aiCheckResult.isValid ? (
                        <FaCheck className="text-green-600 text-base sm:text-xl" />
                      ) : (
                        <FaExclamationTriangle className="text-orange-600 text-base sm:text-xl" />
                      )}
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                        {aiCheckResult.isValid ? 'All Set!' : 'Needs Improvement'}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {aiCheckResult.isValid 
                          ? `Your ${aiCheckResult.type === 'form' ? 'form looks great!' : 'template meets requirements!'}`
                          : 'Some areas need attention before submission'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-base sm:text-lg font-bold ${
                    aiCheckResult.score >= 80 
                      ? 'bg-green-100 text-green-700' 
                      : aiCheckResult.score >= 60 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {aiCheckResult.score}%
                  </div>
                </div>
              </div>

              {/* Issues Section */}
              {aiCheckResult.issues.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-orange-500 text-base sm:text-lg" />
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                      Areas for Improvement
                    </h3>
                  </div>
                  <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
                    <ul className="space-y-2 sm:space-y-3">
                      {aiCheckResult.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm sm:text-base">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggestions Section */}
              {aiCheckResult.suggestions.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <FaMagic className="text-blue-500 text-base sm:text-lg" />
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                      AI Recommendations
                    </h3>
                  </div>
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                    <ul className="space-y-2 sm:space-y-3">
                      {aiCheckResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm sm:text-base">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Success State */}
              {aiCheckResult.isValid && aiCheckResult.issues.length === 0 && (
                <div className="text-center py-4 sm:py-6">
                  <FaCheck className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-1 sm:mb-2">
                    Excellent!
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Your {aiCheckResult.type === 'form' ? 'form is complete' : 'document template meets all requirements'} and is ready for submission.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
            {aiCheckResult && !aiCheckResult.isValid && (
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-red-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Review Issues
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModal;