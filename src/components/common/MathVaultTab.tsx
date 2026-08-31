import React, { useState } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME } from '../../context/SystemContext';
import { MathFormula, MathQuizQuestion } from '../../types';
import {
  BookOpen,
  HelpCircle,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Calculator,
  Sigma,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const MATH_FORMULAS_DATA: MathFormula[] = [
  {
    id: 'f1',
    category: 'algebra',
    grade: 'الصف الثالث الإعدادي / الأول الثانوي',
    title: 'القانون العام لحل المعادلة التربيعية',
    formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
    description: 'يُستخدم لإيجاد جذور المعادلة التربيعية ax² + bx + c = 0 مع فحص المميز Δ = b² - 4ac',
  },
  {
    id: 'f2',
    category: 'algebra',
    grade: 'الصف الثاني الثانوي',
    title: 'مجموع المتتابعة الحسابية (Sn)',
    formula: 'Sn = (n / 2) × [2a + (n - 1)d] = (n / 2) × (a + l)',
    description: 'حيث a الحد الأول، d أساس المتتابعة، n عدد الحدود، و l الحد الأخير.',
  },
  {
    id: 'f3',
    category: 'algebra',
    grade: 'الصف الثاني الثانوي',
    title: 'مجموع المتتابعة الهندسية اللانهائية (|r| < 1)',
    formula: 'S∞ = a / (1 - r)',
    description: 'تُستخدم لحساب مجموع المتسلسلة الهندسية المتقاربة عندما يكون مقياس الأساس أقل من 1.',
  },
  {
    id: 'f4',
    category: 'trig',
    grade: 'الصف الثاني الثانوي / الثالث الثانوي',
    title: 'قانون جيب التمام (Cosine Rule)',
    formula: 'a² = b² + c² - 2bc cos(A)',
    description: 'يُستخدم لحساب طول ضلع في أي مثلث بمعلومية طول الضلعين الآخرين وقياس الزاوية المحصورة بينهما.',
  },
  {
    id: 'f5',
    category: 'trig',
    grade: 'الصف الأول والثاني الثانوي',
    title: 'المتطابقات المثلثية الأساسية لفيثاغورس',
    formula: 'sin²(θ) + cos²(θ) = 1  |  1 + tan²(θ) = sec²(θ)  |  1 + cot²(θ) = csc²(θ)',
    description: 'القواعد الذهبية لحساب المثلثات وتبسيط المقادير الجبرية والمثلثية.',
  },
  {
    id: 'f6',
    category: 'calculus',
    grade: 'الصف الثاني والثالث الثانوي',
    title: 'مشتقة حاصل ضرب وقسمة دالتين',
    formula: 'd/dx [u × v] = u\'v + uv\'   |   d/dx [u / v] = (u\'v - uv\') / v²',
    description: 'قواعد التفاضل الأساسية للدوال الجبرية والمثلثية في منهج التفاضل والتكامل.',
  },
  {
    id: 'f7',
    category: 'calculus',
    grade: 'الصف الثالث الثانوي',
    title: 'مشتقات الدوال الأسية واللوغاريتمية الطبيعية',
    formula: 'd/dx [e^(f(x))] = f\'(x) e^(f(x))   |   d/dx [ln(f(x))] = f\'(x) / f(x)',
    description: 'التفاضل المتقدم للأساس الطبيعي e والدالة اللوغاريتمية.',
  },
  {
    id: 'f8',
    category: 'mechanics',
    grade: 'الصف الثاني والثالث الثانوي',
    title: 'معادلات الحركة بعجلة منتظمة (نيوتن)',
    formula: 'v = v₀ + at  |  s = v₀t + ½at²  |  v² = v₀² + 2as',
    description: 'معادلات الديناميكا الأساسية لحساب السرعة، الإزاحة، والزمن تحت تأثير عجلة ثابتة.',
  },
  {
    id: 'f9',
    category: 'geometry',
    grade: 'الصف الثالث الإعدادي',
    title: 'معادلة الخط المستقيم بمعلومية الميل والجزء المقطوع',
    formula: 'y = m x + c  |  الميل m = (y₂ - y₁) / (x₂ - x₁)',
    description: 'حيث m يمثل ميل المستقيم، و c يمثل الجزء المقطوع من محور الصادات.',
  },
];

const MATH_QUIZ_DATA: MathQuizQuestion[] = [
  {
    id: 'q1',
    grade: 'الصف الثاني الثانوي',
    question: 'ما هو مدى الدالة د(س) = |س - 3| + 2 ؟',
    options: ['[2, ∞[', '[3, ∞[', ']-∞, 2]', 'ح'],
    correctIndex: 0,
    explanation: 'القيمة الصغرى لدالة المقياس هي صفر عند س = 3، وبالتالي أصغر قيمة للدالة هي 0 + 2 = 2، فيكون المدى [2, ∞[.',
  },
  {
    id: 'q2',
    grade: 'الصف الثالث الثانوي',
    question: 'إذا كانت ص = جا(2س)، فإن المشتقة الثانية ص\'\' تساوي:',
    options: ['-4 جا(2س)', '4 جتا(2س)', '-2 جا(2س)', '-4 جتا(2س)'],
    correctIndex: 0,
    explanation: 'المشتقة الأولى ص\' = 2 جتا(2س)، والمشتقة الثانية ص\'\' = 2 × (-2 جا(2س)) = -4 جا(2س).',
  },
  {
    id: 'q3',
    grade: 'الصف الثالث الإعدادي',
    question: 'إذا كان المستقيمان اللذان ميلاهما -3/2 و ك/6 متعامدين، فإن قيمة ك =',
    options: ['4', '-4', '9', '-9'],
    correctIndex: 0,
    explanation: 'شرط التعامد: م₁ × م₂ = -1 => (-3/2) × (ك/6) = -1 => -3ك / 12 = -1 => -3ك = -12 => ك = 4.',
  },
  {
    id: 'q4',
    grade: 'الصف الأول الثانوي',
    question: 'إذا كان جذرا المعادلة س² - 6س + ك = 0 متساويين، فإن قيمة ك =',
    options: ['9', '36', '-9', '3'],
    correctIndex: 0,
    explanation: 'عندما يكون الجذران متساويين فإن المميز ب² - 4أ جـ = 0 => (-6)² - 4(1)(ك) = 0 => 36 - 4ك = 0 => ك = 9.',
  },
  {
    id: 'q5',
    grade: 'الصف الثاني الثانوي',
    question: 'في المثلث أ ب جـ، إذا كان قياس زاوية أ = 30°، وطول نصف قطر الدائرة المارة برؤوسه نق = 5 سم، فإن طول الضلع أ شرطة =',
    options: ['5 سم', '10 سم', '2.5 سم', '5√3 سم'],
    correctIndex: 0,
    explanation: 'قانون الجيب: أ شرطة / جا أ = 2 نق => أ شرطة = 2 نق × جا 30° = 2 × 5 × 0.5 = 5 سم.',
  },
];

export const MathVaultTab: React.FC = () => {
  const { theme } = useSystem();
  const isDark = theme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<'formulas' | 'quiz'>('formulas');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFormula, setSearchFormula] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quiz state
  const [quizStep, setQuizStep] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const filteredFormulas = MATH_FORMULAS_DATA.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    if (!searchFormula) return matchesCat;
    const term = searchFormula.toLowerCase().trim();
    return (
      matchesCat &&
      (f.title.toLowerCase().includes(term) ||
        f.formula.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term) ||
        f.grade.toLowerCase().includes(term))
    );
  });

  const handleCopyFormula = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Quiz Handlers
  const currentQ = MATH_QUIZ_DATA[quizStep];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizStep + 1 < MATH_QUIZ_DATA.length) {
      setQuizStep((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizStep(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div
        className="p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sigma className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-amber-300">
              خزينة الرياضيات واختبارات التحدي الذكية
            </h2>
            <p className="text-xs text-slate-400">
              أهم القوانين والنظريات الرياضية للمرحلتين الإعدادية والثانوية مع تحديات تفاعلية فورية.
            </p>
          </div>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/50 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('formulas')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'formulas'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📐 بنك القوانين والنظريات
          </button>
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'quiz'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🧠 تحدي الرياضيات السريع
          </button>
        </div>
      </div>

      {/* VIEW 1: Math Formulas Bank */}
      {activeSubTab === 'formulas' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div
            className="p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'algebra', label: 'الجبر' },
                { id: 'calculus', label: 'التفاضل والتكامل' },
                { id: 'trig', label: 'حساب المثلثات' },
                { id: 'geometry', label: 'الهندسة' },
                { id: 'mechanics', label: 'الميكانيكا' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في القوانين والمعادلات..."
                value={searchFormula}
                onChange={(e) => setSearchFormula(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFormulas.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl border flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-all group"
                  style={{
                    backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                    borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-black text-slate-800 dark:text-amber-300">
                        {item.title}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                        {item.grade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Formula Mathematical Display Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-center font-bold text-sm sm:text-base tracking-wide select-all shadow-inner">
                      {item.formula}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/20 text-xs">
                    <span className="text-[11px] text-slate-500">
                      تصنيف: {item.category === 'algebra' ? 'جبر' : item.category === 'calculus' ? 'تفاضل وتكامل' : item.category === 'trig' ? 'حساب مثلثات' : item.category === 'mechanics' ? 'ميكانيكا' : 'هندسة'}
                    </span>
                    <button
                      onClick={() => handleCopyFormula(item.id, item.formula)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ القانون</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive Math Quiz */}
      {activeSubTab === 'quiz' && (
        <div
          className="p-6 sm:p-8 rounded-3xl border max-w-3xl mx-auto space-y-6"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : '#e2e8f0',
          }}
        >
          {!quizFinished ? (
            <div className="space-y-6">
              {/* Progress & Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    السؤال {quizStep + 1} من {MATH_QUIZ_DATA.length}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{currentQ.grade}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-mono font-black text-sm">
                  <Award className="w-4 h-4" />
                  <span>النقاط: {score}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${((quizStep + 1) / MATH_QUIZ_DATA.length) * 100}%` }}
                />
              </div>

              {/* Question Body */}
              <div className="p-4 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-amber-200 leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((option, idx) => {
                  let btnStyle = isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800';

                  if (selectedAnswer === idx) {
                    btnStyle = 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md';
                  }

                  if (isAnswerSubmitted) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-black';
                    } else if (selectedAnswer === idx && idx !== currentQ.correctIndex) {
                      btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300 font-black';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`p-4 rounded-2xl border text-right font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && idx === currentQ.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {isAnswerSubmitted && selectedAnswer === idx && idx !== currentQ.correctIndex && (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box when submitted */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed animate-fade-in ${
                    selectedAnswer === currentQ.correctIndex
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <p className="font-black mb-1">
                    {selectedAnswer === currentQ.correctIndex ? '🎉 إجابة صحيحة وممتازة!' : '❌ إجابة غير صحيحة.'}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-bold text-amber-300">طريقة الحل والتوضيح: </span>
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/30">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={selectedAnswer === null}
                    className="px-6 py-2.5 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{quizStep + 1 === MATH_QUIZ_DATA.length ? 'عرض النتيجة النهائية' : 'السؤال التالي'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed View */
            <div className="text-center py-8 space-y-5 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Sparkles className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-amber-300">
                  {score === MATH_QUIZ_DATA.length
                    ? 'ما شاء الله! عبقري الرياضيات 🏆'
                    : score >= 3
                    ? 'أحسنت! مستوى رائع ومتميز ⭐'
                    : 'محاولة جيدة، يمكنك المراجعة والمحاولة مجدداً 💪'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  لقد أتممت تحدي الكويز السريع لمجموعات {SCHOOL_TEACHER_NAME}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-xs mx-auto">
                <span className="text-xs text-slate-400 block font-bold">النتيجة المحصلة</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {score} / {MATH_QUIZ_DATA.length}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  ({Math.round((score / MATH_QUIZ_DATA.length) * 100)}%)
                </span>
              </div>

              <button
                onClick={handleRestartQuiz}
                className="px-6 py-2.5 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة التحدي من جديد
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
