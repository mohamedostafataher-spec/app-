/**
 * منصة مصر لتحليل الأمطار القصوى والمخاطر المطرية
 * إعداد وتدقيق: د. أمل معتوق — Dr. Amal Matouk
 * Scientific Roles & Peer-Review Component (الصلاحيات والمراجعة العلمية وتدقيق النتائج)
 */

import React, { useState } from 'react';
import {
  UserCheck,
  X,
  Shield,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Lock,
} from 'lucide-react';
import { UserRole, ScientificReviewComment } from '../types';

interface RolesReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationName: string;
}

export const RolesReviewModal: React.FC<RolesReviewModalProps> = ({
  isOpen,
  onClose,
  stationName,
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('Reviewer');
  const [authorName, setAuthorName] = useState<string>('د. أمل معتوق');
  const [commentText, setCommentText] = useState<string>('');
  const [commentSection, setCommentSection] = useState<string>('توزيع Gumbel ومستويات الرجوع');
  const [commentStatus, setCommentStatus] = useState<ScientificReviewComment['status']>('Accepted');

  const [reviewsList, setReviewsList] = useState<ScientificReviewComment[]>([
    {
      id: 'REV_1',
      author: 'د. أمل معتوق',
      role: 'Reviewer',
      date: '2026-10-05 09:30',
      status: 'Accepted',
      comment: 'تم التحقق من معاملات L-Moments واختبارات Anderson-Darling لنموذج Gumbel، النتائج متوافقة مع التوقعات المناخية.',
      target_section: 'مقارنة نماذج GEV و Gumbel',
    },
    {
      id: 'REV_2',
      author: 'م. أحمد الشريف',
      role: 'Researcher',
      date: '2026-10-05 09:45',
      status: 'Needs Revision',
      comment: 'فترة الرجوع 100 سنة تتجاوز ضعف طول السجل في بعض المحطات، يُنصح بتضمين هامش عدم اليقين الاستقرائي في التقرير التنفيذي.',
      target_section: 'فترات الرجوع والاستقراء',
    },
  ]);

  if (!isOpen) return null;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newEntry: ScientificReviewComment = {
      id: `REV_${Date.now()}`,
      author: authorName || 'مراجع علمي',
      role: currentRole,
      date: new Date().toLocaleString('ar-EG'),
      status: commentStatus,
      comment: commentText.trim(),
      target_section: commentSection,
    };
    setReviewsList([newEntry, ...reviewsList]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-[#D7B98E] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#12304A] via-[#0E7490] to-[#168A8A] text-white flex items-center justify-between border-b border-[#D7B98E]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#D7B98E]/50 flex items-center justify-center text-amber-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                الصلاحيات والمراجعة العلمية وتدقيق النتائج (Scientific Roles & Peer Review)
              </h2>
              <p className="text-xs text-[#F4EBDD]">
                إدارة الأدوار (Viewer, Researcher, Reviewer, Admin) وتسجيل التعليقات والاعتمادات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F7F9FA]">
          
          {/* Active Role Switcher */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 block">اختر دورك الحالي في المنصة:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Viewer', label: 'مشاهد (Viewer)', desc: 'عرض النتائج وتنزيل التقارير فقط' },
                { id: 'Researcher', label: 'باحث (Researcher)', desc: 'تشغيل الحسابات وإضافة ملاحظات' },
                { id: 'Reviewer', label: 'مراجع علمي (Reviewer)', desc: 'اعتماد ومراجعة وطلب تعديلات' },
                { id: 'Admin', label: 'مدير (Admin)', desc: 'تحكم كامل وتعديل الإعدادات' },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setCurrentRole(role.id as UserRole)}
                  className={`p-3 rounded-xl text-right border transition-all cursor-pointer ${
                    currentRole === role.id
                      ? 'bg-[#0E7490]/10 border-[#0E7490] text-[#0E7490] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs block">{role.label}</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Review Comment Form (Enabled for Researcher, Reviewer, Admin) */}
          {(currentRole === 'Reviewer' || currentRole === 'Researcher' || currentRole === 'Admin') && (
            <div className="bg-white p-5 rounded-2xl border border-[#D7B98E] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0E7490]" />
                <span>إضافة تدقيق أو تعليق علمي على المحطة ({stationName}):</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">اسم المراجع:</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">القسم المستهدف:</label>
                  <select
                    value={commentSection}
                    onChange={(e) => setCommentSection(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="اكتمال التقويم والجودة">اكتمال التقويم والجودة</option>
                    <option value="مؤشرات Rx1, Rx3, Rx5">مؤشرات Rx1, Rx3, Rx5</option>
                    <option value="سلسلة AMS السنوية">سلسلة AMS السنوية</option>
                    <option value="مقارنة GEV و Gumbel">مقارنة GEV و Gumbel</option>
                    <option value="فترات الرجوع والاستقراء">فترات الرجوع والاستقراء</option>
                    <option value="فترات الثقة والـ Bootstrap">فترات الثقة والـ Bootstrap</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">حالة القرار (Status):</label>
                  <select
                    value={commentStatus}
                    onChange={(e) => setCommentStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="Accepted">معتمد (Accepted)</option>
                    <option value="Needs Revision">يتطلب مراجعة (Needs Revision)</option>
                    <option value="Rejected">مرفوض (Rejected)</option>
                    <option value="Pending">قيد الدراسة (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">نص المراجعة العلمية:</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                  placeholder="اكتب التوجيه العلمي أو ملاحظات التدقيق..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddComment}
                  className="px-5 py-2 bg-[#0E7490] hover:bg-[#12304A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تسجيل المراجعة</span>
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 block">سجل التدقيق والمراجعات العلمية السابقة:</span>
            <div className="space-y-2.5">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rev.author}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold font-mono">
                        {rev.role}
                      </span>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        rev.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rev.status === 'Needs Revision'
                          ? 'bg-amber-100 text-amber-800'
                          : rev.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#0E7490]">{rev.target_section}</div>
                  <p className="text-slate-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Scientific Peer-Review Audit Trail | Role-Based Access Control
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
