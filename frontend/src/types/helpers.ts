import { createElement } from 'react';
import { FaFileAlt, FaUsers, FaMoneyBillWave, FaClipboardCheck, FaCheckCircle } from 'react-icons/fa';

export const getStatusColor = (index: number): string => {
  const colors = [
    "bg-gray-100 text-gray-800 border border-gray-300",
    "bg-blue-100 text-blue-800 border border-blue-300",
    "bg-purple-100 text-purple-800 border border-purple-300",
    "bg-orange-100 text-orange-800 border border-orange-300",
    "bg-green-100 text-green-800 border border-green-300",
  ];
  return colors[index] || colors[0];
};

export const getPriorityColor = (priority: string): string => {
  const colors = {
    high: "bg-red-100 text-red-800 border border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    low: "bg-green-100 text-green-800 border border-green-300"
  };
  return colors[priority as keyof typeof colors] || colors.medium;
};

export const getStageIcon = (index: number): any => {
  const icons = [
    createElement(FaFileAlt, { className: "text-gray-600" }),
    createElement(FaUsers, { className: "text-blue-600" }),
    createElement(FaUsers, { className: "text-purple-600" }),
    createElement(FaMoneyBillWave, { className: "text-orange-600" }),
    createElement(FaClipboardCheck, { className: "text-yellow-600" }),
    createElement(FaCheckCircle, { className: "text-green-600" })
  ];
  return icons[index] || icons[0];
};

export const filterProjectsByStatus = (projects: any[]) => {
  return {
    draft: projects.filter(p => p.currentIndex === 0),
    review: projects.filter(p => p.currentIndex === 1),
    evaluation: projects.filter(p => p.currentIndex === 2),
    budget: projects.filter(p => p.currentIndex === 3),
    approval: projects.filter(p => p.currentIndex === 4),
    funded: projects.filter(p => p.currentIndex === 5)
  };
};