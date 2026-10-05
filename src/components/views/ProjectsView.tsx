/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وملكية علمية: د. أمل معتوق — Dr. Amal Matouk
 * Projects Management View
 */

import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  Layers,
  Award,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Project, Language } from '../../types';

interface ProjectsViewProps {
  projects: Project[];
  currentProject: Project;
  setCurrentProject: (proj: Project) => void;
  language: Language;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentProject,
  setCurrentProject,
  language,
}) => {
  const isAr = language === 'ar';
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [newProjectRegion, setNewProjectRegion] = useState<string>('القاهرة والدلتا');

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newPrj: Project = {
      id: `PRJ_${Date.now().toString(36).toUpperCase()}`,
      name: newProjectName,
      description: newProjectDesc || 'مشروع دراسة هيدرولوجية مخصص',
      region: newProjectRegion,
      station_ids: ['CAI01', 'ALX01'],
      period_start: '2000-01-01',
      period_end: '2023-12-31',
      source_name: 'بيانات رصد مرفوعة من المستخدم',
      researcher_name: 'د. أمل معتوق — Dr. Amal Matouk',
      created_at: new Date().toISOString().substring(0, 10),
      status: 'Ready for Analysis',
      is_demo: false,
      completeness_threshold: 90,
      rainy_day_threshold: 1.0,
      confidence_level: 95,
      bootstrap_replications: 5000,
    };
    projects.push(newPrj);
    setCurrentProject(newPrj);
    setShowNewModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Title & Guidance */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isAr ? 'إدارة المشاريع والدراسات الهيدرولوجية' : 'Hydrological Projects Management'}
            </h2>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء دراسة جديدة' : 'New Project'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {isAr
            ? 'تتيح المنصة إدارة دراسات مستقلة لكل منطقة أو حوض صرف في مصر، مع حفظ الإعدادات، ومعايير الاكتمال، والمحطات المختارة، وسجلات الفحص دون تداخل بين المشاريع.'
            : 'Organize hydrological studies by basin or region. Customize thresholds and track project lifecycle.'}
        </p>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === currentProject.id;
          return (
            <div
              key={proj.id}
              className={`rounded-2xl border p-5 space-y-3 transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-950/40'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {proj.region} • {proj.period_start.substring(0, 4)} – {proj.period_end.substring(0, 4)}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    proj.status === 'Analysis Completed' || proj.status === 'Report Ready'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                {proj.description}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>{proj.station_ids.length} {isAr ? 'محطات مدرجة' : 'Stations'}</span>
                {isSelected ? (
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المشروع النشط حالياً' : 'Active Project'}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentProject(proj)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    {isAr ? 'تفعيل هذا المشروع' : 'Switch to Project'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-cyan-400" />
              <span>{isAr ? 'إنشاء مشروع دراسة هيدرولوجية جديدة' : 'Create New Hydrological Study'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isAr ? 'اسم المشروع / الدراسة:' : 'Project Name:'}</label>
                <input
                  type="text"
                  placeholder="مثال: دراسة مخرات سيول وادي وتير وسيناء"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isAr ? 'الإقليم / المنطقة الجغرافية:' : 'Region:'}</label>
                <input
                  type="text"
                  value={newProjectRegion}
                  onChange={(e) => setNewProjectRegion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isAr ? 'وصف نطاق وأهداف الدراسة:' : 'Description:'}</label>
                <textarea
                  rows={3}
                  placeholder="بيان أهداف تحليل قيم الأمطار القصوى، نوع شبكات التصريف، وفترات الرجوع المطلوبة..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateProject}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40"
              >
                {isAr ? 'حفظ المشروع' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
