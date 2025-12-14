import { createElement } from 'react';
import { FaUsers, FaClipboardCheck, FaCheckCircle, FaClock, FaEdit, FaTimesCircle } from 'react-icons/fa';

// Updated status color mapping based on status string instead of index
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'endorsed': "bg-green-200 text-green-700 border border-green-400",
    'r&d evaluation': "bg-blue-100 text-blue-800 border border-blue-300", 
    'evaluators assessment': "bg-purple-100 text-purple-800 border border-purple-300",
    'revise': "bg-orange-100 text-orange-800 border border-orange-300",
    'funded': "bg-green-100 text-green-800 border border-green-300",
    'reject': "bg-red-100 text-red-800 border border-red-300"
  };
  return colors[status];
};

// Get status color by index (for backward compatibility)
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

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-800 border border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    low: "bg-green-100 text-green-800 border border-green-300"
  };
  return colors[priority] || colors.medium;
};

export const getStageIcon = (index: number): any => {
  const icons = [
    createElement(FaClock, { className: "text-gray-600" }), // Endorsed
    createElement(FaUsers, { className: "text-blue-600" }), // R&D Evaluation
    createElement(FaClipboardCheck, { className: "text-purple-600" }), // Evaluators Assessment
    createElement(FaEdit, { className: "text-orange-600" }), // Revision
    createElement(FaCheckCircle, { className: "text-green-600" }), // Funded
    createElement(FaTimesCircle, { className: "text-red-600" }) // Rejected
  ];
  return icons[index] || icons[0];
};

// Get progress percentage based on status
export const getProgressPercentage = (status: string): number => {
  const progressMap: Record<string, number> = {
    'endorsed': 75,
    'r&d evaluation': 25,
    'evaluators assessment': 50,
    'revise': 10,
    'funded': 100,
    'reject': 0
  };
  return progressMap[status] || 0;
};

// Get progress percentage by index
export const getProgressPercentageByIndex = (index: number): number => {
  const statusMap: Record<number, string> = {
    0: 'endorsed',
    1: 'r&d evaluation',
    2: 'evaluators assessment',
    3: 'revise',
    4: 'funded',
    5: 'reject'
  };
  return getProgressPercentage(statusMap[index] || 'endorsed');
};

// Get status label from status string
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'endorsed': 'Endorsed for funding',
    'r&d evaluation': 'R&D Evaluation',
    'evaluators assessment': 'Evaluators Assessment', 
    'revise': 'Revision Required',
    'funded': 'Funded',
    'reject': 'Rejected'
  };
  return labels[status] || status;
};

// Get status label from index
export const getStatusLabelByIndex = (index: number): string => {
  const statusMap: Record<number, string> = {
    0: 'endorsed',
    1: 'r&d evaluation',
    2: 'evaluators assessment',
    3: 'revise',
    4: 'funded',
    5: 'reject'
  };
  return getStatusLabel(statusMap[index]);
};

// Convert currentIndex to status
export const getStatusFromIndex = (currentIndex: number): 'endorsed' | 'r&d evaluation' | 'evaluators assessment' | 'revise' | 'funded' | 'reject' => {
  const statusMap: Record<number, 'endorsed' | 'r&d evaluation' | 'evaluators assessment' | 'revise' | 'funded' | 'reject'> = {
    0: 'endorsed',
    1: 'r&d evaluation',
    2: 'evaluators assessment',
    3: 'revise',
    4: 'funded',
    5: 'reject'
  };
  return statusMap[currentIndex];
};

// Updated project filtering by status
export const filterProjectsByStatus = (projects: any[]) => {
  return {
    pendendorsed: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'endorsed'),
    rdEvaluation: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'r&d evaluation'),
    evaluatorsAssessment: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'evaluators assessment'),
    revision: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'revise'),
    funded: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'funded'),
    rejected: projects.filter(p => getStatusFromIndex(p.currentIndex) === 'reject')
  };
};

// Check if project can be edited (only for revise status)
export const canEditProject = (status: string): boolean => {
  return status === 'revise';
};

// Check if project is view-only (all statuses except revise)
export const isViewOnly = (status: string): boolean => {
  return status !== 'revise';
};