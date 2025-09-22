import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import { useLoading } from "../../contexts/LoadingContext";

const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className }) => {
  const w = 120;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className={className}>
      <polyline fill="none" stroke="#C8102E" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Donut: React.FC<{ value: number; size?: number; stroke?: number }> = ({ value, size = 64, stroke = 8 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, value / 100)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F3F4F6" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#C8102E"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={12} fill="#374151">
        {Math.round(value)}%
      </text>
    </svg>
  );
};

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, value, right, children }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
      <div>
        <h4 className="text-xs font-medium text-gray-500">{title}</h4>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{children}</div>
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
};

/* AreaChart */
const AreaChart: React.FC<{ data: number[]; width?: number; height?: number }> = ({ data, width = 800, height = 240 }) => {
  if (!data || data.length === 0) return null;
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };
  const w = width;
  const h = height;
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const x = (i: number) => padding.left + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padding.top + innerH - ((v - min) / (max - min || 1)) * innerH;

  const linePath = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
    .join(" ");
  const areaPath = `${data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
    .join(" ")} L ${padding.left + innerW} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`;

  const labels = data.map((_, i) => {
    if (data.length <= 6) return `${i + 1}`;
    const step = Math.ceil(data.length / 6);
    return i % step === 0 ? `${i + 1}` : "";
  });

  // Add state for animation control
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
        const yy = padding.top + innerH * t;
        return <line key={idx} x1={padding.left} x2={padding.left + innerW} y1={yy} y2={yy} stroke="#F3F4F6" strokeWidth={1} />;
      })}
      
      {/* Area with animation */}
      <path
        d={areaPath}
        fill="#FEEFEF"
        stroke="none"
        className={`transition-all duration-1000 ease-out ${
          isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      />
      
      {/* Line with animation */}
      <path
        d={linePath}
        fill="none"
        stroke="#C8102E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-1000 ease-out delay-150 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Labels */}
      {labels.map((lab, i) => (
        <text key={i} x={x(i)} y={h - 6} fontSize={10} textAnchor="middle" fill="#6B7280">
          {lab}
        </text>
      ))}
      <text x={8} y={padding.top + innerH} fontSize={10} fill="#6B7280">
        {min}
      </text>
      <text x={8} y={padding.top + 10} fontSize={10} fill="#6B7280">
        {max}
      </text>
    </svg>
  );
};

const DashboardAdmin: React.FC = () => {
  // mock data — replace with API data
  const proposalsSpark = [4, 8, 6, 10, 12, 9, 14];
  const proposalsLast30 = [3, 5, 4, 6, 8, 7, 9, 12, 10, 11, 14, 13, 15, 17, 18, 16, 19, 21, 20, 22, 24, 23, 25, 26, 28, 27, 29, 30, 28, 31];
  const usersTotal = 1284;
  const activeProjects = 8;
  const notices = 3;
  const approvalRate = 72; // percent

  // loading / enter animation control
  const { setLoading } = useLoading();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // ensure overlay shows until page is ready (replace timeout with real fetch)
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
      // trigger the enter animation after loading ends
      // use requestAnimationFrame to ensure transition runs
      requestAnimationFrame(() => setEntered(true));
    }, 450);
    return () => clearTimeout(t);
  }, [setLoading]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main
        // animate on enter: initial opacity 0 + translate, then transition to visible
        className={`flex-1 p-6 transition-all duration-500 ease-out transform ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of system activity.</p>
          </header>

          <section className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
            <StatCard
              title="Total Users"
              value={usersTotal.toLocaleString()}
              right={<Donut value={(usersTotal % 100) || 45} />}
            >
              <div className="text-xs text-gray-400">All registered accounts</div>
            </StatCard>

            <StatCard
              title="Approval Rate"
              value={<span className="text-lg font-semibold">{approvalRate}%</span>}
              right={<Donut value={approvalRate} />}
            >
              <div className="text-xs text-gray-400">Proposals approved (last 30d)</div>
            </StatCard>

            <StatCard
              title="Active Projects"
              value={<span className="text-2xl font-semibold">{activeProjects}</span>}
            >
              <div className="text-xs text-gray-400">Ongoing proposals turned projects</div>
            </StatCard>
          </section>

          {/* Bigger chart card (full width) */}
          <section className="mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">Proposals (last 30 days)</h3>
                <div className="text-xs text-gray-400">Updated just now</div>
              </div>
              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: 720 }}>
                  <AreaChart data={proposalsLast30} width={720} height={260} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Proposals Summary</h3>
              <p className="mt-2 text-2xl font-semibold">42</p>
              <div className="mt-3">
                <Sparkline data={proposalsSpark} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Notices</h3>
              <p className="mt-2 text-2xl font-semibold">{notices}</p>
              <div className="mt-3 text-xs text-gray-400">Important announcements</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;
