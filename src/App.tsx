/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

const FUNDS_MAP: Record<string, string> = {
  UNIT_COST1: "แผนลงทุนพื้นฐานทั่วไป",
  UNIT_COST2: "แผนเชิงรุก 35",
  UNIT_COST3: "แผนตราสารหนี้",
  UNIT_COST4: "แผนเงินฝากและตราสารหนี้ระยะสั้น",
  UNIT_COST5: "แผนเชิงรุก 20* (เป็นส่วนหนึ่งของแผนสมดุลตามอายุ)",
  UNIT_COST6: "แผนเชิงรุก 65",
  UNIT_COST7: "แผนหุ้นไทย",
  UNIT_COST8: "แผนกองทุนอสังหาริมทรัพย์ไทย",
  UNIT_COST9: "แผนหุ้นต่างประเทศ",
  UNIT_COST11: "แผนตราสารหนี้ต่างประเทศ",
  UNIT_COST12: "แผนทองคำ",
  UNIT_COST13: "แผนเชิงรุก 75* (เป็นส่วนหนึ่งของแผนสมดุลตามอายุ)",
  UNIT_COST14: "แผนกองทุนรวมวายุภักษ์",
  UNIT_COST15: "แผนเกษียณสบายใจ 2569",
  UNIT_COST16: "แผนการลงทุนตามหลักชะรีอะฮ์"
};

const COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', 
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1', 
  '#EAB308', '#84CC16', '#0EA5E9', '#D946EF', '#10B981'
];

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const allFunds = Object.values(FUNDS_MAP);
  const [selectedFunds, setSelectedFunds] = useState<string[]>(['แผนลงทุนพื้นฐานทั่วไป', 'แผนเชิงรุก 65']);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const fetchFromFirebase = async () => {
      try {
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        const q = query(collection(db, 'nav_history'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedData: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedData.push(doc.data());
        });
        setData(fetchedData);
        setLoading(false);
      } catch(e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchFromFirebase();
  }, []);

  const toggleFund = (fund: string) => {
    setSelectedFunds(prev => 
      prev.includes(fund) ? prev.filter(f => f !== fund) : [...prev, fund]
    );
  };

  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: format(parseISO(item.date), 'MMM dd, yyyy')
    }));
  }, [data]);

  const latestData = formattedData[formattedData.length - 1];
  const previousData = formattedData[formattedData.length - 2];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border-none p-3 rounded-lg shadow-xl z-50 text-white">
          <p className="font-semibold text-xs text-slate-300 mb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-medium text-slate-200">{p.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{Number(p.value).toFixed(4)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Helvetica_Neue',Arial,sans-serif] text-slate-900 dark:text-slate-100 transition-colors duration-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-max">

        <header className="md:col-span-4 flex justify-between items-center px-1 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">GPF NAV Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Next Update</p>
              <p className="text-sm font-mono text-slate-600 dark:text-slate-300">Today, 12:00 PM</p>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  theme === 'light' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  theme === 'dark' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Dark
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="md:col-span-4 flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Syncing & Loading GPF Data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="md:col-span-4 text-center py-20 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 font-medium">No data available right now. Background sync might still be running...</p>
          </div>
        ) : (
          <>
            <div className="md:col-span-3 md:row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors duration-200 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Performance History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Daily NAV tracking for selected portfolios</p>
                </div>
                <div className="flex gap-3 flex-wrap justify-end max-w-[50%]">
                  {selectedFunds.slice(0, 3).map(fund => (
                    <span key={fund} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[allFunds.indexOf(fund) % COLORS.length] }}></span> 
                      {fund.length > 20 ? fund.substring(0, 20) + '...' : fund}
                    </span>
                  ))}
                  {selectedFunds.length > 3 && (
                    <span className="text-xs text-slate-500 font-medium">+{selectedFunds.length - 3} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex-grow w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: theme === 'dark' ? '#64748B' : '#94A3B8', fontSize: 10, fontWeight: 600 }} 
                      tickMargin={12}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={40}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fill: theme === 'dark' ? '#64748B' : '#94A3B8', fontSize: 10, fontWeight: 600 }}
                      tickMargin={12}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => val.toFixed(2)}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: theme === 'dark' ? '#334155' : '#E2E8F0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    {selectedFunds.map((fund, idx) => (
                      <Line
                        key={fund}
                        type="monotone"
                        dataKey={fund}
                        name={fund}
                        stroke={COLORS[allFunds.indexOf(fund) % COLORS.length]}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: COLORS[allFunds.indexOf(fund) % COLORS.length] }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {selectedFunds.slice(0, 2).map((fund, idx) => {
              const currentVal = latestData ? latestData[fund] : null;
              const prevVal = previousData ? previousData[fund] : null;
              const diff = currentVal && prevVal ? ((currentVal - prevVal) / prevVal) * 100 : 0;
              const isUp = diff >= 0;

              return (
                <div key={`card-${idx}`} className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors duration-200 flex flex-col justify-between">
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {fund}
                  </span>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {currentVal ? currentVal.toFixed(4) : '--'}
                    </div>
                    {currentVal && prevVal && (
                      <div className={clsx("text-xs font-semibold mt-1 flex items-center gap-1", isUp ? "text-emerald-500" : "text-red-500")}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? "+" : ""}{diff.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="md:col-span-1 bg-slate-900 dark:bg-black text-white rounded-[20px] p-5 flex flex-col justify-between shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border-none">
              <span className="text-xs opacity-60 font-medium uppercase tracking-wider">System Status</span>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="text-sm font-medium">Syncing at 12:00 PM</span>
              </div>
              <p className="text-[11px] mt-4 opacity-50 font-medium leading-relaxed">
                Web Scraper connection: Active<br/>Source: gpf.or.th (Thai2019)
              </p>
            </div>

            <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mt-2 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors duration-200">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Configure Portfolios</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{selectedFunds.length} selected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {allFunds.map((fund) => {
                  const isSelected = selectedFunds.includes(fund);
                  const color = COLORS[allFunds.indexOf(fund) % COLORS.length];
                  return (
                    <button
                      key={fund}
                      onClick={() => toggleFund(fund)}
                      className={clsx(
                        "flex items-center gap-2.5 p-3 text-left rounded-xl border transition-all duration-200 group h-full",
                        isSelected 
                          ? "bg-slate-50 dark:bg-slate-800/50 border-emerald-500/30 dark:border-emerald-500/30 shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                      )}
                    >
                      <div 
                        className={clsx(
                          "w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-200",
                          isSelected ? "scale-110" : "group-hover:scale-110"
                        )}
                        style={{ backgroundColor: isSelected ? color : 'transparent', border: `2px solid ${isSelected ? color : '#CBD5E1'}` }}
                      />
                      <span className={clsx(
                        "text-[13px] font-medium leading-snug",
                        isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {fund}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
