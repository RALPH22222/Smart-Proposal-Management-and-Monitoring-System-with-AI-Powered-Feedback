export const getStatusColorByIndex = (index: number): string => {
  const statusMap: Record<number, string> = {
    0: 'endorsed',
    1: 'r&d evaluation',
    2: 'evaluators assessment',
    3: 'revise',
    4: 'funded',
    5: 'reject'
  };
  return getStatusColor(statusMap[index]);
};

export const getStatusColor = (status: string): string => {
  const s = (status || "").toLowerCase();
  // We return hex codes or simple tailwind-like strings that you map in the UI
  if (s === 'endorsed') return "text-green-700 bg-green-100";
  if (s === 'funded') return "text-green-800 bg-green-100";
  if (s === 'reject') return "text-red-800 bg-red-100";
  if (s.includes('revise')) return "text-orange-800 bg-orange-100";
  if (s.includes('evaluators')) return "text-purple-800 bg-purple-100";
  return "text-blue-800 bg-blue-100"; // Default (R&D)
};

export const getStatusLabelByIndex = (index: number): string => {
  const labels = [
    'Endorsed for Funding', // 0
    'R&D Evaluation',       // 1
    'Evaluators Assessment',// 2
    'Revision Required',    // 3
    'Funded',               // 4
    'Rejected'              // 5
  ];
  return labels[index] || 'Unknown';
};

export const getProgressPercentageByIndex = (index: number): number => {
  const progress = [75, 25, 50, 10, 100, 0];
  return progress[index] || 0;
};

export const getStatusFromIndex = (index: number): string => {
  const mapping = ['endorsed', 'r&d evaluation', 'evaluators assessment', 'revise', 'funded', 'reject'];
  return mapping[index] || 'pending';
};
