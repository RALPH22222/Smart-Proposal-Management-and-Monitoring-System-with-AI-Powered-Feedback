import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isMobile && isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isVisible]);

  // Design adjustments:
  // 1. w-max: Forces the tooltip to be as wide as the text needs.
  // 2. max-w-xs: Constraints it so it doesn't get too wide (wraps nicely).
  const baseClasses = "absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-md shadow-xl border border-slate-800 w-max max-w-xs animate-in fade-in zoom-in-95 duration-200";

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  // Matched arrow color to bg-slate-900
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div 
      ref={tooltipRef}
      className="relative inline-flex items-center"
    >
      <div
        className="cursor-help flex items-center justify-center touch-none"
        onMouseEnter={() => !isMobile && setIsVisible(true)}
        onMouseLeave={() => !isMobile && setIsVisible(false)}
        onClick={() => isMobile && setIsVisible(!isVisible)}
      >
        {children || (
          <Info className={`w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors ${className}`} />
        )}
      </div>

      {isVisible && (
        <div 
          className={`${baseClasses} ${positionClasses[position]}`}
          style={{ pointerEvents: 'none' }} // Prevents tooltip from blocking clicks if it fades out slowly
        >
          {/* Content */}
          <span className="block leading-relaxed text-slate-100">
            {content}
          </span>
          
          {/* Arrow */}
          <div 
            className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;