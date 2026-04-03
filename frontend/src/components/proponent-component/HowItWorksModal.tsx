import React, { useState, useEffect } from 'react';
import { X, FileSliders } from "lucide-react";
import { HomeApi } from '../../services/HomeApi';
import { DEFAULT_HOME_INFO, type HomeProcessStep } from '../../schemas/home-schema';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Color rotation for step number badges */
const STEP_COLORS = [
  'text-[#C8102E] group-hover:border-[#C8102E]',
  'text-amber-500 group-hover:border-amber-500',
  'text-blue-600 group-hover:border-blue-600',
  'text-purple-600 group-hover:border-purple-600',
  'text-blue-800 group-hover:border-blue-800',
  'text-green-600 group-hover:border-green-600',
  'text-red-500 group-hover:border-red-500',
];

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const [steps, setSteps] = useState<HomeProcessStep[]>(DEFAULT_HOME_INFO.process_steps);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchSteps = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        if (!cancelled && Array.isArray(data?.process_steps) && data.process_steps.length > 0) {
          setSteps(data.process_steps);
        }
      } catch {
        // silently fall back to pre-loaded defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSteps();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden relative">
        {/* --- HEADER --- */}
        <div className="relative bg-white border-b border-gray-100 px-8 py-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <FileSliders className="w-5 h-5 text-[#C8102E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#C8102E] tracking-tight">
                How the Process Works
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                Comprehensive guide to DOST project proposal submission, evaluation, and monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 text-slate-700">
          {isLoading ? (
            <div className="space-y-8 blur-[1px]">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex gap-4 relative z-10 animate-pulse">
                  <div className="relative flex flex-col items-center w-12 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-gray-100 shrink-0"></div>
                    {idx !== 4 && (
                      <div className="absolute top-12 -bottom-8 w-0.5 bg-gray-100 hidden sm:block z-0" />
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-5 border-2 border-gray-100 flex-1 space-y-3 shadow-sm">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-100 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="space-y-8">
                {steps.map((step, index) => {
                  const colorClass = STEP_COLORS[index % STEP_COLORS.length];
                  const isLast = index === steps.length - 1;
                  return (
                    <div key={index} className="flex gap-4 relative z-10 group">
                      <div className="relative flex flex-col items-center w-12 shrink-0">
                        <div className={`w-12 h-12 rounded-xl bg-white border-2 border-slate-200 ${colorClass} flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:shadow-md transition-all duration-300 relative z-10`}>
                          {index + 1}
                        </div>
                        {!isLast && (
                          <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0" />
                        )}
                      </div>
                      <div className={`bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:shadow-md transition-all duration-300 ${colorClass.split(' ').find(c => c.startsWith('group-hover:border')) || ''}`}>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;