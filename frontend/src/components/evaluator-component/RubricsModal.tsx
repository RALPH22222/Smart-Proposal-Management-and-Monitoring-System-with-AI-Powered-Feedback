import { X, CheckCircle, BookOpen } from "lucide-react";

interface RubricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RubricsModal({ isOpen, onClose }: RubricsModalProps) {
  if (!isOpen) return null;

  const rubrics = [
    {
      category: "Objectives Assessment",
      description:
        "Evaluate the clarity, measurability, and significance of project goals",
      criteria: [
        {
          score: 5,
          description:
            "Objectives are crystal clear, highly measurable, and very significant to the field with clear alignment to national priorities",
        },
        {
          score: 4,
          description:
            "Objectives are clear and relevant with well-defined metrics and good alignment",
        },
        {
          score: 3,
          description:
            "Objectives are understandable but lack specificity in some areas or could be more significant",
        },
        {
          score: 2,
          description:
            "Objectives are vague, poorly justified, or lack clear connection to project scope",
        },
        {
          score: 1,
          description:
            "Objectives are unclear, not measurable, or insignificant to the research field",
        },
      ],
      evaluatorGuide: [
        "Are the objectives SMART (Specific, Measurable, Achievable, Relevant, Time-bound)?",
        "Do the objectives align with national research priorities?",
        "Is there a clear distinction between general and specific objectives?",
        "Are the outcomes clearly defined?",
        "Does the proposal address relevant social or economic needs?",
      ],
    },
    {
      category: "Methodology Assessment",
      description:
        "Evaluate the research approach, methods, and feasibility of implementation",
      criteria: [
        {
          score: 5,
          description:
            "Methodology is rigorous, innovative, well-designed, and highly feasible with detailed implementation plan",
        },
        {
          score: 4,
          description:
            "Methodology is sound with appropriate methods, tools, and realistic timeline",
        },
        {
          score: 3,
          description:
            "Methodology is acceptable but has some gaps in detail or minor feasibility concerns",
        },
        {
          score: 2,
          description:
            "Methodology has significant flaws, questionable feasibility, or unclear implementation steps",
        },
        {
          score: 1,
          description:
            "Methodology is inadequate, not clearly described, or fundamentally flawed",
        },
      ],
      evaluatorGuide: [
        "Are the research methods appropriate for achieving the objectives?",
        "Is there sufficient detail on data collection/analysis procedures?",
        "Are the team's capabilities adequate to execute this methodology?",
        "Have potential challenges and mitigation strategies been identified?",
        "Is the implementation timeline realistic and achievable?",
      ],
    },
    {
      category: "Budget Assessment",
      description:
        "Evaluate the appropriateness, justification, and realistic allocation of budget",
      criteria: [
        {
          score: 5,
          description:
            "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan",
        },
        {
          score: 4,
          description:
            "Budget is appropriate with minor justification gaps or minor allocation concerns",
        },
        {
          score: 3,
          description:
            "Budget is acceptable but lacks detailed justification for some line items",
        },
        {
          score: 2,
          description:
            "Budget appears inflated or inadequately justified with unclear allocation logic",
        },
        {
          score: 1,
          description:
            "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency",
        },
      ],
      evaluatorGuide: [
        "Are all line items necessary and directly related to project objectives?",
        "Is the unit cost reasonable and comparable to market rates?",
        "Are personnel costs justified based on roles and time allocation?",
        "Is there clear justification for equipment purchases vs. rentals?",
        "Does the budget reflect efficient use of resources?",
      ],
    },
    {
      category: "Timeline Assessment",
      description:
        "Evaluate the feasibility and realism of the project schedule",
      criteria: [
        {
          score: 5,
          description:
            "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers",
        },
        {
          score: 4,
          description:
            "Timeline is reasonable with appropriate milestones and reasonable contingency planning",
        },
        {
          score: 3,
          description:
            "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions",
        },
        {
          score: 2,
          description:
            "Timeline appears unrealistic, poorly structured, or lacks clear milestones",
        },
        {
          score: 1,
          description:
            "Timeline is not feasible, unclear, or unrealistic given the project scope",
        },
      ],
      evaluatorGuide: [
        "Are the project phases clearly defined with specific durations?",
        "Are key milestones achievable within the stated timeframe?",
        "Has sufficient time been allocated for critical activities?",
        "Are there clear deliverables for each phase?",
        "Is there buffer time for unexpected delays or issues?",
      ],
    },
  ];

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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                    {rubric.evaluatorGuide.map((guide, gidx) => (
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
                  {rubric.criteria.map((criterion, cidx) => (
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
