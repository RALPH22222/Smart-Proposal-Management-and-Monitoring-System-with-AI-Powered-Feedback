import { useEffect, useState } from 'react';

const PageLoader = ({ text, className }: { text?: string; className?: string }) => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		setProgress(0);
		const interval = setInterval(() => {
			setProgress(prev => {
				if (prev >= 90) {
					clearInterval(interval);
					return prev;
				}
				const increment = Math.max(0.5, (90 - prev) * 0.08);
				return Math.min(90, prev + increment);
			});
		}, 80);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className={`flex flex-col items-center justify-center w-full backdrop-blur-sm z-50 ${className ?? 'min-h-screen'}`}>
			{/* Circle with percentage inside */}
			<div className="relative w-20 h-20 mb-6 flex items-center justify-center">
				{/* Outer static ring */}
				<div className="absolute inset-0 rounded-full border-[4px] border-slate-200"></div>

				{/* Inner spinning highlight */}
				<div
					className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#C8102E] animate-[spin_0.8s_ease-in-out_infinite]"
				></div>

				{/* Percentage number centered inside */}
				<span className="text-sm font-bold text-[#C8102E] z-10 select-none">
					{Math.round(progress)}%
				</span>
			</div>

			{/* Progress bar + label */}
			<div className="w-48 flex flex-col items-center gap-2">
				<div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
					<div
						className="h-full bg-[#C8102E] rounded-full transition-all duration-300 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
				{text && (
					<span className="text-slate-500 text-xs font-medium">{text}</span>
				)}
			</div>
		</div>
	);
};

export default PageLoader;
