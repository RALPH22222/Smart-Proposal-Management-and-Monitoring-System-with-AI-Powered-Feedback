import { X, CheckCircle, BookOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { HomeApi } from "../../services/HomeApi";
import { DEFAULT_HOME_INFO, type RubricCategory, type RubricCriterion } from "../../schemas/home-schema";

interface RubricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RubricsModal({ isOpen, onClose }: RubricsModalProps) {
  const [rubrics, setRubrics] = useState<RubricCategory[]>(DEFAULT_HOME_INFO.evaluator_rubrics || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRubrics = async () => {
      try {
        setIsLoading(true);
        const data = await HomeApi.getHomeInfo();
        if (data && Array.isArray(data.evaluator_rubrics) && data.evaluator_rubrics.length > 0) {
          setRubrics(data.evaluator_rubrics);
        } else {
          setRubrics(DEFAULT_HOME_INFO.evaluator_rubrics || []);
        }
      } catch (err) {
        console.error("Failed to fetch evaluator rubrics", err);
        setRubrics(DEFAULT_HOME_INFO.evaluator_rubrics || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRubrics();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C8102E] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Evaluation Rubrics
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Guidelines for evaluating research proposals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#C8102E] mb-2" />
              <p className="text-sm text-slate-500 font-medium">Loading rubrics...</p>
            </div>
          )}
          <div className="space-y-6">
            {rubrics.map((rubric, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#C8102E]" />
                    {rubric.category}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {rubric.description}
                  </p>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-slate-900 mb-2">
                    Key Questions to Consider:
                  </p>
                  <ul className="space-y-1">
                    {rubric.evaluatorGuide.map((guide: string, gidx: number) => (
                      <li
                        key={gidx}
                        className="text-xs text-slate-700 flex gap-2"
                      >
                        <span className="flex-shrink-0 text-blue-600 font-bold">
                          •
                        </span>
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  {rubric.criteria.map((criterion: RubricCriterion, cidx: number) => (
                    <div
                      key={cidx}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-sm font-bold">
                        {criterion.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {criterion.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#A00E26] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
