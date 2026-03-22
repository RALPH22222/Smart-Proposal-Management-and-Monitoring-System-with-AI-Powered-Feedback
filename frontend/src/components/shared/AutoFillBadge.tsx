import React from "react";
import { Sparkles, AlertCircle } from "lucide-react";

interface AutoFillBadgeProps {
  fieldName: string;
  autoFilledFields: Set<string>;
}

const AutoFillBadge: React.FC<AutoFillBadgeProps> = ({ fieldName, autoFilledFields }) => {
  if (autoFilledFields.size === 0) return null;

  const isFilled = autoFilledFields.has(fieldName);

  if (isFilled) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 ml-2 select-none">
        <Sparkles className="w-2.5 h-2.5" />
        Auto-filled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 ml-2 select-none">
      <AlertCircle className="w-2.5 h-2.5" />
      Needs input
    </span>
  );
};

export default AutoFillBadge;
