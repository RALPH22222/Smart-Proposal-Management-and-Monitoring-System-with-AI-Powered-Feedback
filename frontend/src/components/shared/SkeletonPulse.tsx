import React from 'react';

interface SkeletonPulseProps {
  className?: string;
  style?: React.CSSProperties;
}

const SkeletonPulse: React.FC<SkeletonPulseProps> = ({ className, style }) => (
  <div 
    className={`bg-slate-200 animate-pulse rounded ${className || ''}`} 
    style={style}
  />
);

export default SkeletonPulse;
