import React, { useState } from "react";
import ProponentNavbar from "../../../components/Proponent-navbar";
import StatusStepper from "../../../components/StatusStepper";

type Project = {
  id: string;
  title: string;
  currentIndex: number;
};

const mockProjects: Project[] = [
  { id: "p1", title: "Community Health Outreach", currentIndex: 1 },
  { id: "p2", title: "AgriTech Pilot Program", currentIndex: 2 },
  { id: "p3", title: "STEM Scholarship Fund", currentIndex: 3 },
  { id: "p4", title: "Digital Library Upgrade", currentIndex: 4 },
];

const stageLabels = ["Submitted", "Department", "RDE", "Budget", "Approved"];

const Profile: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const current = mockProjects[activeIndex];

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(mockProjects.length - 1, i + 1));

  return (
    <div className="min-h-screen bg-gray-50">
      <ProponentNavbar />

      {/* Spacer for fixed navbar height */}
      <div className="h-16" />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">My Projects</h1>
          <p className="text-sm text-gray-500">Track the progress of your submitted proposals.</p>
        </header>

        {/* Single status view with pagination */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-base sm:text-lg font-medium text-gray-800">{current.title}</h2>
              <div className="w-full sm:w-auto sm:flex-1">
                <StatusStepper currentIndex={current.currentIndex} />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Stage: {stageLabels[current.currentIndex]}</div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={prev}
                disabled={activeIndex === 0}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">{activeIndex + 1} / {mockProjects.length}</div>
              <button
                onClick={next}
                disabled={activeIndex === mockProjects.length - 1}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Table of all projects */}
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">All Projects</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Title</th>
                    <th className="text-left font-medium px-4 py-2">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-800">{p.title}</td>
                      <td className="px-4 py-2 text-gray-600">{stageLabels[p.currentIndex]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;