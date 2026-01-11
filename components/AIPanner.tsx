
import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, X, Plus, Flag, ChevronRight, Check, ListChecks, CalendarRange, Zap, Eye, ArrowLeft, Clock, BarChart2, TrendingUp, Lightbulb } from 'lucide-react';
import { generateScheduleOptions, PriorityItem, ScheduleOption, OptimizationInsight } from '../services/geminiService';
import { ScheduleItem, RecurringRule, DayPerformance } from '../types';

interface AIPannerProps {
  history: Record<string, DayPerformance>;
  recurringRules: RecurringRule[];
  onPlanGenerated: (items: Partial<ScheduleItem>[]) => void;
  onClose: () => void;
}

const AIPanner: React.FC<AIPannerProps> = ({ history, recurringRules, onPlanGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [newPriorityText, setNewPriorityText] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState<PriorityItem['level']>('Medium');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ScheduleOption[]>([]);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() && priorities.length === 0) return;
    setLoading(true);
    try {
      const result = await generateScheduleOptions(prompt, priorities, history, recurringRules);
      setOptions(result.options);
      setInsights(result.insights);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addPriority = () => {
    if (!newPriorityText.trim()) return;
    setPriorities([...priorities, { text: newPriorityText, level: newPriorityLevel }]);
    setNewPriorityText('');
    setNewPriorityLevel('Medium');
  };

  const removePriority = (index: number) => {
    setPriorities(priorities.filter((_, i) => i !== index));
  };

  const applySelectedPlan = (index: number | null) => {
    const idx = index !== null ? index : selectedOptionIndex;
    if (idx !== null) {
      onPlanGenerated(options[idx].items);
      onClose();
    }
  };

  const getPriorityColor = (level: PriorityItem['level']) => {
    switch (level) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    }
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${period}`;
  };

  const currentPreview = previewIndex !== null ? options[previewIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            {previewIndex !== null || showInsights ? (
              <button 
                onClick={() => { setPreviewIndex(null); setShowInsights(false); }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <Sparkles className="text-amber-300 animate-pulse" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {showInsights ? 'Routine Auditor' : previewIndex !== null ? currentPreview?.title : 'AI Day Architect'}
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                {showInsights ? 'Patterns & Optimization' : previewIndex !== null ? 'Detailed Schedule Preview' : options.length > 0 ? 'Pick your preferred routine' : 'Design your perfect day'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors relative z-10">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {options.length === 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  What's your focus today?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'Work from home, need to fit in a gym session and grocery shopping...'"
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-slate-700 text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Flag size={14} className="text-indigo-500" /> Key Priorities
                </label>
                
                <div className="flex flex-col gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPriorityText}
                      onChange={(e) => setNewPriorityText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPriority()}
                      placeholder="Goal (e.g., Study History)"
                      className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <select
                      value={newPriorityLevel}
                      onChange={(e) => setNewPriorityLevel(e.target.value as PriorityItem['level'])}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-3 text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Med</option>
                      <option value="Low">Low</option>
                    </select>
                    <button
                      onClick={addPriority}
                      disabled={!newPriorityText.trim()}
                      className="px-4 bg-indigo-600 text-white rounded-xl disabled:bg-slate-300 hover:bg-indigo-700 transition-colors shadow-sm tap-target"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {priorities.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {priorities.map((p, i) => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getPriorityColor(p.level)}`}>
                          <span>{p.text}</span>
                          <button onClick={() => removePriority(i)} className="hover:text-rose-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || (!prompt.trim() && priorities.length === 0)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] tap-target"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing Habits...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Architect Daily Route
                  </>
                )}
              </button>
            </div>
          ) : showInsights ? (
            /* INSIGHTS VIEW */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900">Optimization Report</h3>
                    <p className="text-xs text-indigo-600 font-medium italic">Based on your last {Object.keys(history).length} days of data</p>
                  </div>
               </div>

               <div className="grid gap-4">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          insight.impact === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {insight.impact} Impact
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                          {insight.type}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">{insight.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{insight.observation}</p>
                      <div className="flex items-start gap-2 bg-indigo-50/30 p-3 rounded-2xl border border-indigo-50">
                        <Lightbulb size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                          <span className="font-black uppercase text-[10px] mr-1">Fix:</span>
                          {insight.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
               </div>

               <button
                  onClick={() => setShowInsights(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all tap-target"
                >
                  <ArrowLeft size={18} />
                  Back to Schedule Options
                </button>
            </div>
          ) : previewIndex === null ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Select an Architecture</h3>
                <button 
                  onClick={() => setShowInsights(true)}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors tap-target"
                >
                  <BarChart2 size={14} /> Routine Insights
                </button>
              </div>

              <div className="grid gap-4">
                {options.map((opt, idx) => (
                  <div 
                    key={idx}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                      selectedOptionIndex === idx 
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
                        : 'border-slate-100 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3" onClick={() => setSelectedOptionIndex(idx)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          selectedOptionIndex === idx ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {idx === 0 ? <Zap size={20} /> : idx === 1 ? <ListChecks size={20} /> : <CalendarRange size={20} />}
                        </div>
                        <div className="max-w-[180px]">
                          <h4 className="font-bold text-slate-800 truncate">{opt.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{opt.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewIndex(idx); }}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100 tap-target"
                          title="Full Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedOptionIndex === idx ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200'
                        }`}>
                          {selectedOptionIndex === idx && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 overflow-hidden h-8 px-1" onClick={() => setSelectedOptionIndex(idx)}>
                      {opt.items.filter((_, i) => i % 4 === 0).map((it, i) => (
                        <div key={i} className="flex-shrink-0 flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100/50 rounded-lg px-2 py-1">
                          <span className="text-indigo-400">{formatHour(it.hour || 0)}</span>
                          <span className="truncate max-w-[50px]">{it.task}</span>
                        </div>
                      ))}
                      <div className="ml-auto">
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 sticky bottom-0 bg-white/90 backdrop-blur-sm pb-2">
                <button
                  onClick={() => applySelectedPlan(null)}
                  disabled={selectedOptionIndex === null}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] tap-target"
                >
                  Apply Selected Schedule
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-700 font-medium leading-relaxed italic">
                  "{currentPreview?.description}"
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                {currentPreview?.items.map((it, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className="w-16 flex-shrink-0 flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Time</span>
                      <span className="text-sm font-bold text-indigo-600">{formatHour(it.hour || 0)}</span>
                    </div>
                    <div className="flex-grow space-y-1">
                      <h5 className="font-bold text-slate-800 text-sm">{it.task}</h5>
                      {it.notes && <p className="text-[11px] text-slate-500 leading-relaxed">{it.notes}</p>}
                    </div>
                    <div className="flex-shrink-0 self-center">
                      <Clock size={14} className="text-slate-200" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm pt-4 pb-2">
                <button
                  onClick={() => setPreviewIndex(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all tap-target"
                >
                  <ArrowLeft size={18} />
                  Back to Options
                </button>
                <button
                  onClick={() => applySelectedPlan(previewIndex)}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] tap-target"
                >
                  Apply This Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPanner;
