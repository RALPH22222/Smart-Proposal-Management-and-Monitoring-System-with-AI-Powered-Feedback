import React from 'react';
import SkeletonPulse from './SkeletonPulse';

interface PageLoaderProps {
  text?: string;
  className?: string;
  mode?: 'dashboard' | 'table' | 'simple' | 'evaluator-dashboard' | 'admin-dashboard' | 'proponent-dashboard' | 'proponent-monitoring' | 'proponent-settings' | 'lookup' | 'activity' | 'contents-card' | 'rows' | 'monitoring' | 'endorsement' | string;
}


const PageLoader: React.FC<PageLoaderProps> = ({ text, className, mode = 'simple' }) => {
  if (mode === 'monitoring') {
    return (
      <div className={`p-6 space-y-6 flex flex-col h-full bg-slate-50 ${className || ''} animate-pulse`}>
         <div className="space-y-2"><SkeletonPulse className="h-8 w-48"/><SkeletonPulse className="h-4 w-72"/></div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 shadow-sm">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="space-y-3"><SkeletonPulse className="h-3 w-2/3 opacity-40"/><SkeletonPulse className="h-8 w-full rounded-xl"/></div>)}
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 shadow-sm">
            <SkeletonPulse className="h-11 w-full max-w-md rounded-xl" /><SkeletonPulse className="h-11 w-32 rounded-xl ml-auto" />
         </div>
         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between">
              <div className="flex gap-8"><SkeletonPulse className="h-3 w-40" /><SkeletonPulse className="h-3 w-32" /></div>
              <SkeletonPulse className="h-3 w-20" />
            </div>
            <div className="p-0">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="p-6 flex justify-between border-b border-slate-50">
                    <div className="space-y-3 flex-1">
                      <SkeletonPulse className="h-5 w-3/4 rounded-md" />
                      <div className="flex gap-4"><SkeletonPulse className="h-3 w-32" /><SkeletonPulse className="h-3 w-24" /></div>
                      <div className="flex gap-2"><SkeletonPulse className="h-2 w-16" /><SkeletonPulse className="h-2 w-20 opacity-50" /></div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block"><SkeletonPulse className="h-6 w-24 rounded-full opacity-60" /></div>
                      <SkeletonPulse className="h-10 w-32 rounded-xl shadow-sm" />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  if (mode === 'endorsement') {
    return (
      <div className={`p-6 space-y-6 flex flex-col h-full bg-slate-50 ${className || ''} animate-pulse`}>
         <div className="space-y-2"><SkeletonPulse className="h-8 w-48"/><SkeletonPulse className="h-4 w-72"/></div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-24 space-y-3 shadow-sm"><SkeletonPulse className="h-3 w-2/3 opacity-50"/><SkeletonPulse className="h-8 w-1/3 rounded-lg"/></div>)}
         </div>
         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="space-y-2"><SkeletonPulse className="h-4 w-40" /><SkeletonPulse className="h-3 w-32 opacity-50" /></div>
              <SkeletonPulse className="h-9 w-32 rounded-xl" />
            </div>
            <div className="p-6 space-y-10">
               {[1, 2].map(i => (
                 <div key={i} className="space-y-6 pb-10 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="space-y-3"><SkeletonPulse className="h-7 w-2/3" /><div className="flex gap-3"><SkeletonPulse className="h-4 w-24" /><SkeletonPulse className="h-4 w-16" /></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[1, 2].map(j => (
                         <div key={j} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-4">
                            <SkeletonPulse className="w-14 h-14 rounded-xl shadow-sm" />
                            <div className="flex-1 space-y-3">
                               <SkeletonPulse className="h-4 w-3/4" />
                               <SkeletonPulse className="h-3 w-1/2 opacity-60" />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  if (mode === 'rows') {
    return (
      <div className={`p-6 space-y-8 ${className || ''} animate-pulse divide-y divide-slate-100`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-8 space-y-6 pt-8 first:pt-0">
            <SkeletonPulse className="h-7 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-5">
                  <div className="space-y-2"><SkeletonPulse className="h-3.5 w-24 opacity-50"/><SkeletonPulse className="h-11 w-full rounded-xl"/></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><SkeletonPulse className="h-3.5 w-24 opacity-50"/><SkeletonPulse className="h-11 w-full rounded-xl"/></div>
                    <div className="space-y-2"><SkeletonPulse className="h-3.5 w-24 opacity-50"/><SkeletonPulse className="h-11 w-full rounded-xl"/></div>
                  </div>
               </div>
               <div className="space-y-2"><SkeletonPulse className="h-3.5 w-24 opacity-50"/><SkeletonPulse className="h-32 w-full rounded-xl"/></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'lookup') {
    return (
      <div className={`p-6 space-y-6 flex flex-col h-full bg-slate-50 ${className || ''} animate-pulse`}>
         <div className="space-y-2">
           <SkeletonPulse className="h-9 w-64" />
           <SkeletonPulse className="h-4 w-80 opacity-50" />
         </div>
         <div className="flex flex-wrap gap-2 pb-2">
           {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPulse key={i} className="h-10 w-28 rounded-xl shadow-sm" />)}
         </div>
         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex-1 shadow-md">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <SkeletonPulse className="h-4 w-40" />
              <SkeletonPulse className="h-10 w-24 rounded-xl shadow-sm" />
            </div>
            <div className="p-2">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0">
                  <SkeletonPulse className="h-4 w-10 opacity-40" />
                  <SkeletonPulse className="h-5 w-1/3" />
                  <div className="flex gap-2"><SkeletonPulse className="h-8 w-16 rounded-lg" /><SkeletonPulse className="h-8 w-8 rounded-lg" /></div>
                </div>
              ))}
            </div>
         </div>
      </div>
    );
  }

  if (mode === 'activity') {
    return (
      <div className={`p-6 space-y-6 max-w-[1400px] mx-auto ${className || ''} animate-pulse`}>
         <div className="flex items-center gap-4">
           <SkeletonPulse className="w-12 h-12 rounded-xl shadow-sm" />
           <div className="space-y-2">
             <SkeletonPulse className="h-8 w-48" />
             <SkeletonPulse className="h-4 w-64 opacity-50" />
           </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 h-24 space-y-3 shadow-sm"><SkeletonPulse className="h-3 w-24 opacity-50"/><SkeletonPulse className="h-8 w-16 rounded-lg"/></div>)}
         </div>
         <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
           <SkeletonPulse className="h-11 w-full max-w-sm rounded-xl" />
           <div className="flex gap-2 w-full md:w-auto"><SkeletonPulse className="h-11 flex-1 md:w-32 rounded-xl" /><SkeletonPulse className="h-11 flex-1 md:w-32 rounded-xl" /></div>
         </div>
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50 px-6">
                <SkeletonPulse className="h-3 w-24" />
                <SkeletonPulse className="h-3 w-32" />
                <SkeletonPulse className="h-3 w-48" />
                <SkeletonPulse className="h-3 w-24" />
                <SkeletonPulse className="h-3 w-16" />
            </div>
            <div className="p-0">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="px-6 py-5 flex justify-between border-b border-slate-50 items-center last:border-0">
                    <SkeletonPulse className="h-4 w-24 opacity-60" />
                    <SkeletonPulse className="h-5 w-32" />
                    <SkeletonPulse className="h-4 w-64" />
                    <SkeletonPulse className="h-6 w-24 rounded-full opacity-60" />
                    <SkeletonPulse className="h-4 w-12" />
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  if (mode === 'proponent-dashboard') {
    return (
      <div className={`p-6 space-y-8 max-w-7xl mx-auto ${className || ''} animate-pulse`}>
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <SkeletonPulse className="w-20 h-20 rounded-xl shadow-md" />
               <div className="space-y-3">
                  <SkeletonPulse className="h-9 w-64" />
                  <SkeletonPulse className="h-4 w-80 opacity-50" />
               </div>
            </div>
            <div className="flex gap-3"><SkeletonPulse className="h-10 w-10 rounded-lg" /><SkeletonPulse className="h-10 w-10 rounded-lg" /></div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 h-24 space-y-3 shadow-sm"><SkeletonPulse className="h-3 w-2/3 opacity-50"/><SkeletonPulse className="h-7 w-1/3 rounded-lg"/></div>)}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 border-2 border-slate-200 space-y-4 shadow-sm h-64 flex flex-col">
                 <div className="flex justify-between items-start"><SkeletonPulse className="h-6 w-3/4" /><SkeletonPulse className="h-4 w-8" /></div>
                 <div className="flex flex-wrap gap-2"><SkeletonPulse className="h-5 w-20 rounded-full" /><SkeletonPulse className="h-5 w-16 rounded-full" /></div>
                 <div className="space-y-3 mt-auto">
                    <div className="flex justify-between"><SkeletonPulse className="h-3 w-16" /><SkeletonPulse className="h-3 w-24" /></div>
                    <div className="flex justify-between"><SkeletonPulse className="h-3 w-16" /><SkeletonPulse className="h-3 w-12" /></div>
                 </div>
                 <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center mb-1"><SkeletonPulse className="h-2 w-12" /><SkeletonPulse className="h-2 w-8" /></div>
                    <SkeletonPulse className="h-2 w-full rounded-full" />
                 </div>
                 <div className="pt-2"><SkeletonPulse className="h-7 w-32 rounded-full" /></div>
              </div>
            ))}
         </div>
      </div>
    );
  }

  if (mode === 'proponent-monitoring') {
    return (
      <div className={`p-6 space-y-6 max-w-7xl mx-auto ${className || ''} animate-pulse bg-slate-50 min-h-screen`}>
         <div className="flex items-center gap-4 mb-4">
            <SkeletonPulse className="w-12 h-12 rounded-xl" />
            <div className="space-y-2"><SkeletonPulse className="h-8 w-48" /><SkeletonPulse className="h-4 w-64 opacity-50" /></div>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 h-24 space-y-3 shadow-sm"><SkeletonPulse className="h-3.5 w-20 opacity-50"/><SkeletonPulse className="h-8 w-12 rounded-lg"/></div>)}
         </div>
         <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-350px)]">
            <div className="w-full lg:w-1/3 bg-white rounded-2xl border border-slate-200 flex flex-col p-5 space-y-6 shadow-sm">
               <SkeletonPulse className="h-6 w-32" />
               <SkeletonPulse className="h-10 w-full rounded-xl" />
               <div className="flex gap-2"><SkeletonPulse className="h-7 w-16 rounded-full" /><SkeletonPulse className="h-7 w-16 rounded-full" /><SkeletonPulse className="h-7 w-16 rounded-full" /></div>
               <div className="flex-1 space-y-3 overflow-hidden">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center"><div className="space-y-2 flex-1"><SkeletonPulse className="h-4 w-3/4" /><SkeletonPulse className="h-3 w-1/2 opacity-50" /></div><SkeletonPulse className="h-4 w-4 rounded-full" /></div>)}
               </div>
            </div>
            <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                     <SkeletonPulse className="h-3 w-20 opacity-50" />
                     <SkeletonPulse className="h-9 w-5/6 rounded-lg" />
                     <SkeletonPulse className="h-4 w-48" />
                  </div>
                  <SkeletonPulse className="h-10 w-10 rounded-lg" />
               </div>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-5">
                  <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2"><SkeletonPulse className="h-3 w-20 opacity-50"/><SkeletonPulse className="h-6 w-32"/></div>
                     <div className="space-y-2 text-center"><SkeletonPulse className="h-3 w-28 opacity-50"/><SkeletonPulse className="h-6 w-32 mx-auto"/></div>
                     <div className="space-y-2 text-right"><SkeletonPulse className="h-3 w-20 opacity-50"/><SkeletonPulse className="h-8 w-40 ml-auto"/></div>
                  </div>
                  <SkeletonPulse className="h-3 w-full rounded-full" />
                  <div className="flex justify-between"><SkeletonPulse className="h-2 w-10"/><SkeletonPulse className="h-2 w-32"/></div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><SkeletonPulse className="h-6 w-40" /><SkeletonPulse className="h-8 w-32 rounded-lg" /></div>
                  <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
                     <SkeletonPulse className="h-12 w-12 rounded-full opacity-20" />
                     <SkeletonPulse className="h-6 w-48" />
                     <SkeletonPulse className="h-4 w-64 opacity-50 text-center" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (mode === 'contents-card') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {[1, 2].map(i => (
          <div key={i} className="border border-slate-200 rounded-xl p-6 space-y-4">
            <SkeletonPulse className="h-5 w-48" />
            <div className="h-32 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
               <SkeletonPulse className="w-12 h-12 rounded-full" />
            </div>
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-2/3 opacity-70" />
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'proponent-settings') {
    return (
      <div className={`max-w-5xl mx-auto px-4 py-8 space-y-8 animate-pulse ${className || ''}`}>
        <div className="space-y-3">
          <SkeletonPulse className="h-8 w-64" />
          <SkeletonPulse className="h-4 w-96 opacity-50" />
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6 flex items-center gap-6 shadow-sm">
           <SkeletonPulse className="h-24 w-24 rounded-full" />
           <div className="space-y-3 flex-1"><SkeletonPulse className="h-5 w-32"/><SkeletonPulse className="h-4 w-64 opacity-50"/></div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-6 shadow-sm">
           <SkeletonPulse className="h-6 w-48 border-b pb-2"/>
           <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-5 space-y-2"><SkeletonPulse className="h-4 w-20"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="col-span-12 md:col-span-2 space-y-2"><SkeletonPulse className="h-4 w-8"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="col-span-12 md:col-span-5 space-y-2"><SkeletonPulse className="h-4 w-20"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><SkeletonPulse className="h-4 w-20"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="space-y-2"><SkeletonPulse className="h-4 w-12"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
           </div>
        </div>
        {/* Academic Information skeleton */}
        <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-6 shadow-sm">
           <SkeletonPulse className="h-6 w-48 border-b pb-2"/>
           <div className="space-y-4">
              <div className="space-y-2"><SkeletonPulse className="h-4 w-32"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="space-y-3">
                 <SkeletonPulse className="h-4 w-24"/>
                 <div className="flex gap-6"><div className="flex items-center gap-2"><SkeletonPulse className="h-4 w-4 rounded-full"/><SkeletonPulse className="h-4 w-32"/></div><div className="flex items-center gap-2"><SkeletonPulse className="h-4 w-4 rounded-full"/><SkeletonPulse className="h-4 w-32"/></div></div>
              </div>
           </div>
           <div className="flex justify-end pt-4"><SkeletonPulse className="h-10 w-48 rounded-md opacity-20"/></div>
        </div>
        {/* Notification Preferences skeleton grid */}
        <div className="space-y-4">
           <SkeletonPulse className="h-6 w-48"/>
           <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-6 space-y-4 shadow-sm">
                  <SkeletonPulse className="h-5 w-40 mb-2"/>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center gap-3">
                        <SkeletonPulse className="h-4 w-4 rounded"/><SkeletonPulse className="h-3 w-48 opacity-50"/>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>
        {/* Security Section skeleton */}
        <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-6 shadow-sm">
           <SkeletonPulse className="h-6 w-48 border-b pb-2"/>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2"><SkeletonPulse className="h-4 w-32"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="sm:col-start-1 space-y-2"><SkeletonPulse className="h-4 w-32"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
              <div className="space-y-2"><SkeletonPulse className="h-4 w-40"/><SkeletonPulse className="h-10 w-full rounded-md"/></div>
           </div>
           <div className="flex justify-end pt-2"><SkeletonPulse className="h-10 w-32 rounded-md opacity-30"/></div>
        </div>
      </div>
    );
  }

  if (mode === 'admin-dashboard') {
    return (
      <div className={`p-4 sm:p-6 bg-slate-50 space-y-6 min-h-screen ${className || ''} animate-pulse`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-3">
            <SkeletonPulse className="h-10 w-64 sm:w-96" />
            <SkeletonPulse className="h-4 w-48 sm:w-72" />
          </div>
          <SkeletonPulse className="h-10 w-28 rounded-xl shrink-0" />
        </div>

        {/* Stats Grid - Admin Style (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-4 h-32 space-y-4">
              <SkeletonPulse className="w-8 h-8 rounded-xl" />
              <div className="space-y-2 pt-1">
                <SkeletonPulse className="h-3 w-2/3" />
                <SkeletonPulse className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Submissions Chart Area */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="space-y-2">
              <SkeletonPulse className="h-6 w-48" />
              <SkeletonPulse className="h-3 w-32" />
            </div>
            <SkeletonPulse className="h-5 w-20 rounded-full" />
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="flex-1 flex items-end gap-3 px-2 h-48 border-b border-slate-50 pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
                <SkeletonPulse key={i} className="flex-1 opacity-60" style={{ height: `${Math.random() * 80 + 20}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
               <div className="space-y-2 text-center"><SkeletonPulse className="h-3 w-20 mx-auto"/><SkeletonPulse className="h-8 w-16 mx-auto"/></div>
               <div className="space-y-2 text-center md:border-x border-slate-100"><SkeletonPulse className="h-3 w-20 mx-auto"/><SkeletonPulse className="h-8 w-16 mx-auto"/></div>
               <div className="space-y-2 text-center"><SkeletonPulse className="h-3 w-20 mx-auto"/><SkeletonPulse className="h-8 w-16 mx-auto"/></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Pipeline vs Status */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
             <div className="p-4 border-b border-slate-200 bg-slate-50 mt-auto"><SkeletonPulse className="h-6 w-48"/></div>
             <div className="p-3 bg-slate-100/50 flex justify-between px-4">
                <SkeletonPulse className="h-3 w-8"/><SkeletonPulse className="h-3 w-48"/><SkeletonPulse className="h-3 w-16"/>
             </div>
             <div className="p-4 space-y-6">
               {[1, 2, 3, 4, 5, 6, 7].map(i => (
                 <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                    <SkeletonPulse className="h-4 w-8"/><SkeletonPulse className="h-4 w-1/2"/><SkeletonPulse className="h-6 w-12 rounded-full"/>
                 </div>
               ))}
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto">
                <div className="grid grid-cols-4 gap-4">
                   {[1, 2, 3, 4].map(i => <div key={i} className="space-y-2"><SkeletonPulse className="h-8 w-12 mx-auto"/><SkeletonPulse className="h-2 w-16 mx-auto"/></div>)}
                </div>
             </div>
          </div>

          <div className="w-full lg:w-80 shadow-xl bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
             <SkeletonPulse className="h-6 w-40" />
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-100 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3"><SkeletonPulse className="w-6 h-6 rounded-full"/><SkeletonPulse className="h-4 w-24"/></div>
                    <SkeletonPulse className="h-8 w-10"/>
                 </div>
               ))}
             </div>
             <div className="pt-6 border-t border-slate-100 space-y-4">
               <SkeletonPulse className="h-4 w-28" />
               <div className="space-y-3">
                 {[1, 2, 3, 4].map(i => <div key={i} className="flex justify-between"><SkeletonPulse className="h-3 w-20"/><SkeletonPulse className="h-5 w-10 rounded-full"/></div>)}
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }
  if (mode === 'evaluator-dashboard') {
    return (
      <div className={`p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 space-y-6 min-h-screen ${className || ''} animate-pulse`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-3">
            <SkeletonPulse className="h-10 w-64 sm:w-96" />
            <SkeletonPulse className="h-4 w-48 sm:w-72" />
          </div>
          <SkeletonPulse className="h-10 w-28 rounded-xl shrink-0" />
        </div>

        {/* Stats Grid Skeleton - Evaluator Style (3 + 1) */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-4 h-32 space-y-4">
                <SkeletonPulse className="w-8 h-8 rounded-xl" />
                <div className="space-y-2 pt-1">
                  <SkeletonPulse className="h-3 w-2/3" />
                  <SkeletonPulse className="h-6 w-1/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="w-full lg:w-80">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 h-32 space-y-4">
              <SkeletonPulse className="w-8 h-8 rounded-xl" />
              <div className="space-y-2 pt-1">
                <SkeletonPulse className="h-3 w-2/3" />
                <SkeletonPulse className="h-6 w-1/3" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Reviewed Chart Area */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="space-y-2">
              <SkeletonPulse className="h-6 w-48" />
              <SkeletonPulse className="h-3 w-32" />
            </div>
            <SkeletonPulse className="h-5 w-20 rounded-full" />
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="flex-1 flex items-end gap-3 px-2 h-48 border-b border-slate-50 pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
                <SkeletonPulse key={i} className="flex-1 opacity-60" style={{ height: `${Math.random() * 80 + 20}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
               <div className="space-y-2 text-center">
                 <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                 <SkeletonPulse className="h-8 w-16 mx-auto"/>
               </div>
               <div className="space-y-2 text-center md:border-x border-slate-100">
                 <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                 <SkeletonPulse className="h-8 w-16 mx-auto"/>
               </div>
               <div className="space-y-2 text-center">
                 <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                 <SkeletonPulse className="h-8 w-16 mx-auto"/>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Split Section: Table vs Status Box */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50"><SkeletonPulse className="h-6 w-48"/></div>
            <div className="p-4 space-y-4 bg-slate-100/50">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                 <SkeletonPulse className="h-3 w-8" />
                 <SkeletonPulse className="h-3 w-48" />
                 <SkeletonPulse className="h-3 w-32 hidden sm:block" />
                 <SkeletonPulse className="h-3 w-24 hidden lg:block" />
              </div>
            </div>
            <div className="px-4 pb-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <SkeletonPulse className="h-4 w-8 shrink-0"/>
                  <SkeletonPulse className="h-4 w-48"/>
                  <SkeletonPulse className="h-4 w-32 hidden sm:block"/>
                  <SkeletonPulse className="h-4 w-24 hidden lg:block"/>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200"><SkeletonPulse className="h-4 w-32"/></div>
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  <SkeletonPulse className="h-8 w-16 mx-auto" /><SkeletonPulse className="h-8 w-16 mx-auto" /><SkeletonPulse className="h-8 w-16 mx-auto" />
                </div>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-white shadow-xl border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6">
            <SkeletonPulse className="h-6 w-32" />
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                 <div key={i} className="h-[76px] rounded-xl border border-slate-200 p-5 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                      <SkeletonPulse className="w-6 h-6 rounded-full"/>
                      <SkeletonPulse className="h-4 w-24"/>
                    </div>
                    <SkeletonPulse className="h-8 w-10"/>
                 </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-200 space-y-2 mt-6">
               <SkeletonPulse className="h-4 w-24 mb-3"/>
               <div className="flex items-center gap-2"><SkeletonPulse className="w-2 h-2 rounded-full"/><SkeletonPulse className="h-3 w-40"/></div>
               <div className="flex items-center gap-2"><SkeletonPulse className="w-2 h-2 rounded-full"/><SkeletonPulse className="h-3 w-32"/></div>
               <div className="flex items-center gap-2"><SkeletonPulse className="w-2 h-2 rounded-full"/><SkeletonPulse className="h-3 w-36"/></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'dashboard') {
    return (
      <div className={`p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 space-y-6 min-h-screen ${className || ''} animate-pulse`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-3">
            <SkeletonPulse className="h-10 w-64 sm:w-96" />
            <SkeletonPulse className="h-4 w-48 sm:w-72" />
          </div>
          <SkeletonPulse className="h-10 w-28 rounded-xl shrink-0" />
        </div>

        {/* Stats Grid Skeleton - 5 Card Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-4 h-32 space-y-4">
              <div className="flex justify-between items-center">
                <SkeletonPulse className="w-8 h-8 rounded-xl" />
                <SkeletonPulse className="w-12 h-4 rounded-full" />
              </div>
              <div className="space-y-2 pt-1">
                <SkeletonPulse className="h-3 w-2/3" />
                <SkeletonPulse className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area Split Skeleton */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Chart/Table Area */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[450px]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="space-y-2">
                <SkeletonPulse className="h-6 w-48" />
                <SkeletonPulse className="h-3 w-32" />
              </div>
              <SkeletonPulse className="h-5 w-20 rounded-full" />
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6">
              <div className="flex-1 flex items-end gap-3 px-2 h-48 border-b border-slate-50 pb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => (
                  <SkeletonPulse key={i} className="flex-1 opacity-60" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                 <div className="space-y-2 text-center">
                   <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                   <SkeletonPulse className="h-8 w-16 mx-auto"/>
                 </div>
                 <div className="space-y-2 text-center md:border-x border-slate-100">
                   <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                   <SkeletonPulse className="h-8 w-16 mx-auto"/>
                 </div>
                 <div className="space-y-2 text-center">
                   <SkeletonPulse className="h-3 w-20 mx-auto opacity-70"/>
                   <SkeletonPulse className="h-8 w-16 mx-auto"/>
                 </div>
              </div>
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 w-full xl:w-80 flex flex-col gap-6">
            <SkeletonPulse className="h-6 w-40" />
            <div className="space-y-6 flex-1">
              {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex gap-4">
                    <SkeletonPulse className="w-10 h-10 rounded-xl shrink-0"/>
                    <div className="flex-1 space-y-3">
                      <SkeletonPulse className="h-4 w-full"/>
                      <SkeletonPulse className="h-3 w-2/3 opacity-70"/>
                      <div className="flex gap-2">
                        <SkeletonPulse className="h-3 w-12 rounded-full"/>
                        <SkeletonPulse className="h-3 w-12 rounded-full"/>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-100 space-y-4">
               <SkeletonPulse className="h-4 w-32"/>
               <div className="space-y-2">
                 <div className="flex items-center gap-2"><SkeletonPulse className="w-2 h-2 rounded-full"/><SkeletonPulse className="h-3 w-32"/></div>
                 <div className="flex items-center gap-2"><SkeletonPulse className="w-2 h-2 rounded-full"/><SkeletonPulse className="h-3 w-40"/></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'table') {
    return (
      <div className={`flex flex-col gap-6 p-6 h-full min-h-screen bg-slate-50/30 animate-pulse ${className || ''}`}>
        {/* Header Skeleton */}
        <header className="flex-shrink-0">
          <div className="space-y-3">
            <SkeletonPulse className="h-10 w-64 sm:w-96" />
            <SkeletonPulse className="h-4 w-48 sm:w-72" />
          </div>
        </header>

        {/* Filter Section Skeleton */}
        <section className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 space-y-6">
          <SkeletonPulse className="h-11 w-full max-w-md rounded-lg" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonPulse key={i} className="h-10 w-36 rounded-lg" />
            ))}
          </div>
          <SkeletonPulse className="h-3 w-32" />
        </section>

        {/* Main Content Table/List Skeleton */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <SkeletonPulse className="w-5 h-5 rounded-md"/>
              <SkeletonPulse className="h-6 w-48" />
            </div>
            <SkeletonPulse className="h-4 w-32" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <SkeletonPulse className="h-6 w-11/12 max-w-2xl" />
                    <div className="flex flex-wrap gap-6">
                      <div className="flex gap-2"><SkeletonPulse className="h-3 w-3 rounded-full"/><SkeletonPulse className="h-3 w-28"/></div>
                      <div className="flex gap-2"><SkeletonPulse className="h-3 w-3 rounded-full"/><SkeletonPulse className="h-3 w-32"/></div>
                      <div className="flex gap-2"><SkeletonPulse className="h-3 w-3 rounded-full"/><SkeletonPulse className="h-3 w-24"/></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <SkeletonPulse className="h-8 w-28 rounded-full" />
                    <div className="flex gap-2">
                      <SkeletonPulse className="h-9 w-24 rounded-lg md:w-28" />
                      <SkeletonPulse className="h-9 w-9 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Footer Skeleton */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <SkeletonPulse className="h-4 w-48" />
            <div className="flex items-center gap-3">
              <SkeletonPulse className="h-9 w-24 rounded-lg" />
              <div className="px-2"><SkeletonPulse className="h-4 w-20" /></div>
              <SkeletonPulse className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fallback to simpler loading ring/percentage
  return (
    <div className={`flex flex-col items-center justify-center w-full backdrop-blur-sm z-50 ${className ?? 'min-h-screen'}`}>
      <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[4px] border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#C8102E] animate-[spin_0.8s_ease-in-out_infinite]"></div>
        <span className="text-sm font-bold text-[#C8102E] z-10 select-none italic">
          RDEC
        </span>
      </div>
      <div className="w-48 flex flex-col items-center gap-3">
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#C8102E] rounded-full animate-[shimmer_1.5s_infinite] transition-all duration-300" 
               style={{ width: '60%' }} />
        </div>
        {text && <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{text}</span>}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
