import React, { useState, useRef } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
  SCHOOL_TEACHER_PHONE,
} from '../../context/SystemContext';
import { GRADE_ORDER, TreasuryReceipt } from '../../types';
import {
  DollarSign,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  Download,
  Filter,
  Check,
  Send,
  Eye,
  X,
} from 'lucide-react';

export const TreasuryAccountsTab: React.FC = () => {
  const {
    theme,
    students,
    receipts,
    groupPrices,
    payments,
    recordTreasuryReceipt,
    deleteTreasuryReceipt,
  } = useSystem();

  const isDark = theme === 'dark';

  // Sub-tabs: 'subscriptions-grid' or 'receipts-log'
  const [activeSubTab, setActiveSubTab] = useState<'subscriptions' | 'receipts'>('subscriptions');

  // Month & Grade Filters
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // New Receipt Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentBarcode, setSelectedStudentBarcode] = useState<string>(students[0]?.barcode || '');
  const [issueMonth, setIssueMonth] = useState<string>(currentMonthStr);
  const [issueAmount, setIssueAmount] = useState<number>(200);
  const [issueNotes, setIssueNotes] = useState<string>('سداد اشتراك شهري نقداً');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Receipt Preview / Print Voucher Modal
  const [activeVoucher, setActiveVoucher] = useState<TreasuryReceipt | null>(null);

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesGrade = selectedGrade === 'all' || s.groupGrade === selectedGrade;
    if (!searchTerm) return matchesGrade;
    const term = searchTerm.toLowerCase().trim();
    return (
      matchesGrade &&
      (s.name.toLowerCase().includes(term) ||
        s.barcode.toLowerCase().includes(term) ||
        s.phone.includes(term))
    );
  });

  // Calculate Financial Metrics for Selected Month
  const monthPayments = payments[selectedMonth] || {};
  let totalCollected = 0;
  let totalPaidStudents = 0;
  let totalExpected = 0;

  students.forEach((st) => {
    const price = groupPrices[st.groupGrade] || 200;
    totalExpected += price;
    const p = monthPayments[st.barcode];
    if (p && p.amount > 0) {
      totalCollected += p.amount;
      totalPaidStudents += 1;
    }
  });

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const pendingAmount = Math.max(0, totalExpected - totalCollected);

  const handleIssueReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentBarcode) return;

    const res = await recordTreasuryReceipt({
      studentBarcode: selectedStudentBarcode,
      month: issueMonth,
      amount: Number(issueAmount),
      notes: issueNotes,
    });

    if (res.success && res.receipt) {
      setFeedback(res.message);
      setActiveVoucher(res.receipt);
      setShowIssueModal(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const openIssueModalForStudent = (studentBarcode: string) => {
    const stu = students.find((s) => s.barcode === studentBarcode);
    setSelectedStudentBarcode(studentBarcode);
    setIssueMonth(selectedMonth);
    const defPrice = stu ? groupPrices[stu.groupGrade] || 200 : 200;
    setIssueAmount(defPrice);
    setShowIssueModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Treasury Summary Dashboard */}
      <div
        className="p-6 rounded-3xl border space-y-6"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-amber-300">
                الخزينة والحسابات وسندات القبض الإلكترونية
              </h2>
              <p className="text-xs text-slate-400">
                متابعة اشتراكات المجموعات الشهرية، تسجيل المدفوعات، وإصدار إيصالات استلام نقدية رسمية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowIssueModal(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إصدار سند قبض جديد
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-700/20">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold">إجمالي المحصل لشهر ({selectedMonth})</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400 font-mono">{totalCollected.toLocaleString()}</span>
              <span className="text-xs text-emerald-500 font-bold">ج.م</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold">المستهدف الشهري الإجمالي</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400 font-mono">{totalExpected.toLocaleString()}</span>
              <span className="text-xs text-amber-500 font-bold">ج.م</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold">المتبقي وغير المسدد</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-400 font-mono">{pendingAmount.toLocaleString()}</span>
              <span className="text-xs text-rose-500 font-bold">ج.م</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold">نسبة التحصيل وسداد الطلاب</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-blue-400 font-mono">{collectionRate}%</span>
              <span className="text-xs text-blue-500 font-bold">{totalPaidStudents} من {students.length} طالب</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {feedback}
        </div>
      )}

      {/* Sub Tab Switcher & Filter Bar */}
      <div
        className="p-5 rounded-3xl border space-y-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/50 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('subscriptions')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'subscriptions'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 كشف اشتراكات الطلاب الشهرية
            </button>
            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'receipts'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧾 سجل سندات القبض الصادرة ({receipts.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>الشهر:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white font-mono outline-none"
              />
            </div>

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالطالب أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Grade Filter Pill */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-700/20">
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === 'all'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            جميع المراحل
          </button>
          {GRADE_ORDER.map((gr) => (
            <button
              key={gr}
              onClick={() => setSelectedGrade(gr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedGrade === gr
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {gr}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: Subscriptions Status Grid */}
      {activeSubTab === 'subscriptions' && (
        <div
          className="p-6 rounded-3xl border space-y-4"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-amber-300">
              قائمة الطلاب وحالة السداد لشهر ({selectedMonth})
            </h3>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center gap-1.5 no-print cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الكشف المالي
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/30">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-500/10 text-amber-300 border-b border-slate-700/30 font-black">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الكود</th>
                  <th className="p-3">المرحلة</th>
                  <th className="p-3">قيمة الاشتراك</th>
                  <th className="p-3">المبلغ المسدد</th>
                  <th className="p-3">حالة السداد</th>
                  <th className="p-3 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {filteredStudents.map((st, idx) => {
                  const expected = groupPrices[st.groupGrade] || 200;
                  const payment = monthPayments[st.barcode];
                  const paidAmount = payment?.amount || 0;
                  const isPaidFull = paidAmount >= expected;
                  const isPaidPartial = paidAmount > 0 && paidAmount < expected;

                  return (
                    <tr key={st.barcode} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {st.name}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{st.barcode}</td>
                      <td className="p-3 text-slate-300">{st.groupGrade}</td>
                      <td className="p-3 font-mono text-slate-400">{expected} ج.م</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{paidAmount} ج.م</td>
                      <td className="p-3">
                        {isPaidFull ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" />
                            تم السداد بالكامل
                          </span>
                        ) : isPaidPartial ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 w-fit">
                            سداد جزئي ({paidAmount} من {expected})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 w-fit">
                            لم يسدد بعد ⚠️
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => openIssueModalForStudent(st.barcode)}
                          className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 text-[11px] font-black transition-all cursor-pointer"
                        >
                          إصدار سند قبض 🧾
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Receipts Log */}
      {activeSubTab === 'receipts' && (
        <div
          className="p-6 rounded-3xl border space-y-4"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-amber-300">
              أرشيف سندات وإيصالات القبض المسجلة ({receipts.length})
            </h3>
          </div>

          {receipts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/30 text-slate-400">
              لا توجد سندات قبض مسجلة حتى الآن. اضغطي على زر "إصدار سند قبض جديد" بالرأس.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-700/30">
              <table className="w-full text-right text-xs">
                <thead className="bg-amber-500/10 text-amber-300 border-b border-slate-700/30 font-black">
                  <tr>
                    <th className="p-3">رقم الإيصال</th>
                    <th className="p-3">تاريخ ووقت التحصيل</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">كود الطالب</th>
                    <th className="p-3">عن شهر</th>
                    <th className="p-3">المبلغ المسدد</th>
                    <th className="p-3">المستلم</th>
                    <th className="p-3 text-center no-print">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/20">
                  {receipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-3 font-mono font-black text-amber-400">{rec.receiptNumber}</td>
                      <td className="p-3 font-mono text-slate-400">{rec.date} ({rec.time})</td>
                      <td className="p-3 font-bold text-slate-200">{rec.studentName}</td>
                      <td className="p-3 font-mono text-slate-400">{rec.studentBarcode}</td>
                      <td className="p-3 text-slate-300">{rec.month}</td>
                      <td className="p-3 font-mono font-black text-emerald-400 text-sm">{rec.amount} ج.م</td>
                      <td className="p-3 text-slate-400">{rec.collectedBy}</td>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveVoucher(rec)}
                            className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 transition-all"
                            title="عرض وطباعة السند الفاخر"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنتِ متأكدة من إلغاء وحذف سند القبض (${rec.receiptNumber})؟`)) {
                                deleteTreasuryReceipt(rec.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-all"
                            title="حذف الإيصال"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Issue New Receipt */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl relative"
            style={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            <h3 className="text-lg font-black text-amber-400 mb-1 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              إصدار سند قبض نقدية إلكتروني
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              سيتم تسجيل السداد فورياً وإرسال إشعار فوري بحساب ولي الأمر بالمنصة.
            </p>

            <form onSubmit={handleIssueReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اختر الطالب *</label>
                <select
                  value={selectedStudentBarcode}
                  onChange={(e) => {
                    setSelectedStudentBarcode(e.target.value);
                    const stu = students.find((s) => s.barcode === e.target.value);
                    if (stu) {
                      setIssueAmount(groupPrices[stu.groupGrade] || 200);
                    }
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                >
                  {students.map((st) => (
                    <option key={st.barcode} value={st.barcode}>
                      {st.name} - ({st.groupGrade}) - [{st.barcode}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عن اشتراك شهر *</label>
                  <input
                    type="month"
                    required
                    value={issueMonth}
                    onChange={(e) => setIssueMonth(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ المحصل (ج.م) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={issueAmount}
                    onChange={(e) => setIssueAmount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات التحصيل</label>
                <input
                  type="text"
                  placeholder="سداد اشتراك شهري نقداً بالسنتر"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  إصدار السند الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LUXURY RECEIPT VOUCHER PREVIEW & PRINT MODAL */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative border-4 border-amber-400">
            <button
              onClick={() => setActiveVoucher(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 no-print"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Voucher Body for Print / Display */}
            <div className="space-y-6 text-right font-sans">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-amber-400">
                <div className="text-right">
                  <h2 className="text-xl font-black text-amber-900">سند قبض نقدية رسمي</h2>
                  <p className="text-xs font-bold text-amber-700">مجموعات الأستاذة / {SCHOOL_TEACHER_NAME}</p>
                  <p className="text-[11px] text-slate-500">معلمة أولى الرياضيات والتحليل الرياضي</p>
                </div>
                <div className="text-left font-mono">
                  <div className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-xl text-xs font-black text-amber-900">
                    {activeVoucher.receiptNumber}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">{activeVoucher.date}</span>
                </div>
              </div>

              {/* Receipt Content Details */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">استلمنا من ولي أمر الطالب/ة:</span>
                  <span className="font-black text-slate-900 text-sm">{activeVoucher.studentName}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">كود الباركود التعريفي:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVoucher.studentBarcode}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">المرحلة الدراسية:</span>
                  <span className="font-bold text-slate-800">{activeVoucher.grade}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">سداد اشتراك عن شهر:</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">{activeVoucher.month}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-bold">المبلغ المسدد وقدره:</span>
                  <div className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-base font-mono shadow-sm">
                    {activeVoucher.amount} جنيه مصري فقط لا غير
                  </div>
                </div>

                {activeVoucher.notes && (
                  <div className="pt-2 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800">البيان / ملاحظات: </span>
                    {activeVoucher.notes}
                  </div>
                )}
              </div>

              {/* Signatures & Stamps */}
              <div className="flex items-end justify-between pt-4 text-xs font-bold text-slate-700">
                <div>
                  <p className="text-[11px] text-slate-500 mb-1">توقيع وختم الإدارة:</p>
                  <div className="w-24 h-12 border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-center text-[10px] text-amber-800 font-bold">
                    معتمد إلكترونياً
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-slate-500">المستلم: {activeVoucher.collectedBy}</p>
                  <p className="text-[10px] text-slate-400 mt-1">هاتف: {SCHOOL_TEACHER_PHONE}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال (Print)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
