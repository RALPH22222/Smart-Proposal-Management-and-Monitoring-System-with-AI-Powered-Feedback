import React from "react";
import { FiCalendar, FiEdit3, FiClipboard, FiDollarSign, FiCheck } from "react-icons/fi";

// Tailwind-first styles; custom keyframes are provided via a <style> tag below
// Usage: <StatusStepper currentIndex={2} />
// Steps: 0 Submitted, 1 Department Review, 2 RDE Review, 3 Budget, 4 Approved

const steps = [
  { label: "Submitted", icon: FiCalendar },
  { label: "R&D Evaluation", icon: FiEdit3 },
  { label: "Evaluators Assessment", icon: FiClipboard },
  { label: "Endorsement", icon: FiDollarSign },
  { label: "Project Approved", icon: FiCheck },
];

export interface StatusStepperProps {
  currentIndex: number; // 0..4
}

const brand = "#C8102E"; // match navbar brand color

const StatusStepper: React.FC<StatusStepperProps> = ({ currentIndex }) => {
  return (
    <div className="w-full">
      {/* Inject keyframes for the moving loader */}
      <style>
        {`
        @keyframes movingBar {
          0% { width: 0%; left: 0; right: unset; }
          50% { width: 100%; left: 0; right: unset; }
          100% { width: 0%; left: unset; right: 0; }
        }
      `}
      </style>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const state = idx < currentIndex
            ? "done"
            : idx === currentIndex
            ? "in_progress"
            : "pending";

          return (
            <React.Fragment key={step.label}>
              {/* Icon */}
              <div className="flex flex-col items-center min-w-10">
                <Icon
                  size={20}
                  color={state === "done" || state === "in_progress" ? brand : "#c4c4c4"}
                  className="shrink-0"
                />
                <span className="text-[10px] text-gray-500 mt-1 hidden sm:block">{step.label}</span>
              </div>

              {/* Connector (except after the last icon) */}
              {idx < steps.length - 1 && (
                <div className="flex-1">
                  {idx === currentIndex ? (
                    // Animated loader
                    <div
                      className="relative h-[4px] w-full rounded-full bg-black/20 overflow-hidden"
                      aria-label="in-progress"
                    >
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{
                          background: brand,
                          animation: "movingBar 1s ease-in-out infinite",
                        }}
                      />
                    </div>
                  ) : (
                    // Static line: filled for completed segments, gray for pending
                    <div
                      className={`h-[4px] w-full rounded-full ${idx < currentIndex ? "bg-[" + brand + "]" : "bg-black/10"}`}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StatusStepper;
