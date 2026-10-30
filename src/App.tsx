import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Copy,
  Download,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MapPin,
  User,
  Calendar,
  Wallet,
  FileText,
  ArrowLeftRight,
  ClipboardList,
  HelpCircle,
  X
} from 'lucide-react';
import {
  RestaurantId,
  QuestionCategory,
  InterviewQuestion,
  QuestionAnswer,
  RestaurantMeta,
  CATEGORIES,
  INITIAL_QUESTIONS,
} from './data/interviewQuestions';

type ActiveTab = 'the_byk' | 'myaso_ryba' | 'compare';

const STORAGE_KEY_ANSWERS = 'waiter_interview_answers_v1';
const STORAGE_KEY_META = 'waiter_interview_meta_v1';
const STORAGE_KEY_CUSTOM_Q = 'waiter_interview_custom_q_v1';

const DEFAULT_META: Record<RestaurantId, RestaurantMeta> = {
  the_byk: {
    id: 'the_byk',
    name: 'THE БЫК',
    subtitle: 'Мясной ресторан с фиксированной ценой и высоким потоком гостей',
    addressNote: '',
    interviewerName: '',
    interviewDate: new Date().toISOString().split('T')[0],
    expectedIncomeDay: '',
    overallNotes: '',
  },
  myaso_ryba: {
    id: 'myaso_ryba',
    name: 'Мясо&Рыба',
    subtitle: 'Стейк-хаус и фиш-хаус с высоким средним чеком и широкой винной картой',
    addressNote: '',
    interviewerName: '',
    interviewDate: new Date().toISOString().split('T')[0],
    expectedIncomeDay: '',
    overallNotes: '',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('the_byk');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionHint, setNewQuestionHint] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState<Exclude<QuestionCategory, 'all'>>('money');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Answers state: { the_byk: { [qId]: QuestionAnswer }, myaso_ryba: { [qId]: QuestionAnswer } }
  const [answers, setAnswers] = useState<Record<RestaurantId, Record<string, QuestionAnswer>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ANSWERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { the_byk: {}, myaso_ryba: {} };
  });

  // Restaurant Meta state
  const [meta, setMeta] = useState<Record<RestaurantId, RestaurantMeta>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_META);
      if (saved) return { ...DEFAULT_META, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_META;
  });

  // Custom questions added by the user
  const [customQuestions, setCustomQuestions] = useState<InterviewQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_Q);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
    } catch (e) {
      console.error(e);
    }
  }, [answers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));
    } catch (e) {
      console.error(e);
    }
  }, [meta]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_Q, JSON.stringify(customQuestions));
    } catch (e) {
      console.error(e);
    }
  }, [customQuestions]);

  const allQuestions = useMemo(() => {
    return [...INITIAL_QUESTIONS, ...customQuestions];
  }, [customQuestions]);

  const currentRestaurantId: RestaurantId = activeTab === 'myaso_ryba' ? 'myaso_ryba' : 'the_byk';

  // Update answer for a specific restaurant and question
  const handleUpdateAnswer = (
    restaurant: RestaurantId,
    questionId: string,
    updates: Partial<QuestionAnswer>
  ) => {
    setAnswers((prev) => {
      const currentAns = prev[restaurant]?.[questionId] || { text: '' };
      return {
        ...prev,
        [restaurant]: {
          ...prev[restaurant],
          [questionId]: {
            ...currentAns,
            ...updates,
            updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          },
        },
      };
    });
  };

  // Toggle quick chip text into answer input
  const handleToggleQuickOption = (
    restaurant: RestaurantId,
    questionId: string,
    optionText: string
  ) => {
    const currentText = answers[restaurant]?.[questionId]?.text || '';
    let newText = '';

    if (currentText.includes(optionText)) {
      // Remove option cleanly
      newText = currentText
        .split(', ')
        .filter((part) => part.trim() !== optionText)
        .join(', ')
        .replace(optionText, '')
        .trim();
    } else {
      newText = currentText.trim()
        ? `${currentText.trim().replace(/[,;.]$/, '')}, ${optionText}`
        : optionText;
    }

    handleUpdateAnswer(restaurant, questionId, { text: newText });
  };

  const handleUpdateMeta = (
    restaurant: RestaurantId,
    field: keyof RestaurantMeta,
    value: string
  ) => {
    setMeta((prev) => ({
      ...prev,
      [restaurant]: {
        ...prev[restaurant],
        [field]: value,
      },
    }));
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim()) return;

    const categoryObj = CATEGORIES.find((c) => c.id === newQuestionCategory);
    const newQ: InterviewQuestion = {
      id: `custom_${Date.now()}`,
      category: newQuestionCategory,
      categoryLabel: categoryObj?.label || 'Свой вопрос',
      title: newQuestionTitle.trim(),
      hint: newQuestionHint.trim() || 'Дополнительный вопрос соискателя',
      placeholder: 'Запишите ответ работодателя...',
    };

    setCustomQuestions((prev) => [...prev, newQ]);
    setNewQuestionTitle('');
    setNewQuestionHint('');
    setIsAddingQuestion(false);
  };

  const handleDeleteCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Calculate progress stats
  const getProgressStats = (restId: RestaurantId) => {
    const restAnswers = answers[restId] || {};
    let answeredCount = 0;
    let goodCount = 0;
    let badCount = 0;

    allQuestions.forEach((q) => {
      const ans = restAnswers[q.id];
      if (ans && (ans.text.trim().length > 0 || ans.rating)) {
        answeredCount++;
      }
      if (ans?.rating === 'good') goodCount++;
      if (ans?.rating === 'bad') badCount++;
    });

    return {
      answeredCount,
      totalCount: allQuestions.length,
      percent: Math.round((answeredCount / Math.max(1, allQuestions.length)) * 100),
      goodCount,
      badCount,
    };
  };

  const bykStats = getProgressStats('the_byk');
  const mrStats = getProgressStats('myaso_ryba');

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (selectedCategory !== 'all' && q.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchHint = q.hint.toLowerCase().includes(query);
        const matchCat = q.categoryLabel.toLowerCase().includes(query);
        if (!matchTitle && !matchHint && !matchCat) return false;
      }
      if (showUnansweredOnly && activeTab !== 'compare') {
        const ans = answers[currentRestaurantId]?.[q.id];
        const isAnswered = ans && ans.text.trim().length > 0;
        if (isAnswered) return false;
      }
      return true;
    });
  }, [allQuestions, selectedCategory, searchQuery, showUnansweredOnly, activeTab, answers, currentRestaurantId]);

  // Generate formatted summary for Telegram / Notes
  const generateSummaryText = () => {
    const lines: string[] = [];
    lines.push('📋 СРАВНЕНИЕ ВАКАНСИЙ ОФИЦИАНТА: THE БЫК vs МЯСО&РЫБА');
    lines.push('================================================');

    (['the_byk', 'myaso_ryba'] as RestaurantId[]).forEach((rId) => {
      const m = meta[rId];
      const stats = getProgressStats(rId);
      lines.push(`\n🏢 ${m.name.toUpperCase()} (Заполнено: ${stats.answeredCount}/${stats.totalCount}, Плюсов: ${stats.goodCount}, Минусов: ${stats.badCount})`);
      if (m.addressNote) lines.push(`📍 Точка/Метро: ${m.addressNote}`);
      if (m.interviewerName) lines.push(`👤 Менеджер/HR: ${m.interviewerName}`);
      if (m.expectedIncomeDay) lines.push(`💰 Ожидаемый доход за смену: ${m.expectedIncomeDay}`);
      if (m.overallNotes) lines.push(`📝 Впечатление: ${m.overallNotes}`);
      lines.push('------------------------------------------------');

      allQuestions.forEach((q, idx) => {
        const ans = answers[rId]?.[q.id];
        const ratingIcon =
          ans?.rating === 'good' ? '[+]' : ans?.rating === 'bad' ? '[-]' : ans?.rating === 'neutral' ? '[~]' : '';
        const text = ans?.text?.trim() || '— (не заполнено)';
        lines.push(`${idx + 1}. ${q.title}`);
        lines.push(`   Ответ ${ratingIcon}: ${text}`);
      });
    });

    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    const text = generateSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['№', 'Раздел', 'Вопрос', 'THE БЫК (Ответ)', 'THE БЫК (Оценка)', 'Мясо&Рыба (Ответ)', 'Мясо&Рыба (Оценка)'];
    const rows = allQuestions.map((q, idx) => {
      const bykAns = answers.the_byk?.[q.id];
      const mrAns = answers.myaso_ryba?.[q.id];
      const formatRating = (r?: string) => (r === 'good' ? 'Плюс' : r === 'bad' ? 'Минус' : r === 'neutral' ? 'Нейтрально' : '');
      return [
        idx + 1,
        q.categoryLabel,
        `"${q.title.replace(/"/g, '""')}"`,
        `"${(bykAns?.text || '').replace(/"/g, '""')}"`,
        formatRating(bykAns?.rating),
        `"${(mrAns?.text || '').replace(/"/g, '""')}"`,
        formatRating(mrAns?.rating),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Собеседования_Официант_БЫК_МясоРыба.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    setAnswers({ the_byk: {}, myaso_ryba: {} });
    setMeta(DEFAULT_META);
    setConfirmClearModal(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-24 lg:pb-12">
      {/* Top Bar following strict 3-zone contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            className="text-base sm:text-lg font-bold tracking-tight text-stone-950 whitespace-nowrap shrink-0"
          >
            Собеседование: Официант
          </a>

          {/* Zone 2: Desktop Navigation Switcher */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('the_byk')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'the_byk'
                  ? 'border-amber-700 text-stone-950 font-semibold'
                  : 'border-transparent hover:text-stone-950'
              }`}
            >
              THE БЫК ({bykStats.answeredCount}/{bykStats.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('myaso_ryba')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'myaso_ryba'
                  ? 'border-teal-700 text-stone-950 font-semibold'
                  : 'border-transparent hover:text-stone-950'
              }`}
            >
              Мясо&Рыба ({mrStats.answeredCount}/{mrStats.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'compare'
                  ? 'border-stone-900 text-stone-950 font-semibold'
                  : 'border-transparent hover:text-stone-950'
              }`}
            >
              Сводная таблица (2 ресторана)
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать ответы</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Restaurant Switcher Banner for Mobile & Quick Status */}
        <section className="mb-5">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-200/80 rounded-2xl">
            <button
              onClick={() => setActiveTab('the_byk')}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-left transition-all flex flex-col justify-center ${
                activeTab === 'the_byk'
                  ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap truncate">
                  1. THE БЫК
                </span>
                <span className="font-mono text-xs font-semibold text-amber-700 tabular-nums">
                  {bykStats.answeredCount}/{bykStats.totalCount}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 truncate hidden sm:inline">
                Фикс-прайс · Высокий поток
              </span>
            </button>

            <button
              onClick={() => setActiveTab('myaso_ryba')}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-left transition-all flex flex-col justify-center ${
                activeTab === 'myaso_ryba'
                  ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap truncate">
                  2. Мясо&Рыба
                </span>
                <span className="font-mono text-xs font-semibold text-teal-700 tabular-nums">
                  {mrStats.answeredCount}/{mrStats.totalCount}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 truncate hidden sm:inline">
                Стейки и морепродукты · Высокий чек
              </span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-left transition-all flex flex-col justify-center ${
                activeTab === 'compare'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap truncate">
                  Сравнение
                </span>
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </div>
              <span
                className={`text-[11px] truncate hidden sm:inline ${
                  activeTab === 'compare' ? 'text-stone-300' : 'text-stone-500'
                }`}
              >
                Оба ресторана рядом
              </span>
            </button>
          </div>
        </section>

        {/* Single Restaurant Details Card (When in THE БЫК or Мясо&Рыба mode) */}
        {activeTab !== 'compare' && (
          <section className="mb-6 bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  <span>Карточка собеседования</span>
                  <span aria-hidden="true">·</span>
                  <span>Автосохранение в телефоне</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Заполнено {getProgressStats(currentRestaurantId).percent}%
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-950 tracking-tight">
                  {meta[currentRestaurantId].name}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {meta[currentRestaurantId].subtitle}
                </p>
              </div>

              <button
                onClick={() => setIsMetaExpanded(!isMetaExpanded)}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 shrink-0"
              >
                <span>{isMetaExpanded ? 'Свернуть инфо' : 'Детали встречи'}</span>
                {isMetaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isMetaExpanded && (
              <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Филиал / Метро / Адрес
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={meta[currentRestaurantId].addressNote}
                      onChange={(e) => handleUpdateMeta(currentRestaurantId, 'addressNote', e.target.value)}
                      placeholder="Например: м. Тверская / ТРЦ..."
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Кто проводит (Имя и телефон)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={meta[currentRestaurantId].interviewerName}
                      onChange={(e) => handleUpdateMeta(currentRestaurantId, 'interviewerName', e.target.value)}
                      placeholder="Менеджер Анна..."
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Обещанный доход за смену (итог)
                  </label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={meta[currentRestaurantId].expectedIncomeDay}
                      onChange={(e) => handleUpdateMeta(currentRestaurantId, 'expectedIncomeDay', e.target.value)}
                      placeholder="Например: 6 500 – 9 000 ₽/смена"
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Дата собеседования
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={meta[currentRestaurantId].interviewDate}
                      onChange={(e) => handleUpdateMeta(currentRestaurantId, 'interviewDate', e.target.value)}
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Общее впечатление от атмосферы, менеджера и зала
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={meta[currentRestaurantId].overallNotes}
                      onChange={(e) => handleUpdateMeta(currentRestaurantId, 'overallNotes', e.target.value)}
                      placeholder="Адекватность руководства, загруженность зала, чистота на раздаче, когда дадут ответ..."
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Filter & Search Toolbar */}
        <section className="mb-5 space-y-3">
          {/* Category Horizontal Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? allQuestions.length
                  : allQuestions.filter((q) => q.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      selectedCategory === cat.id ? 'text-stone-300' : 'text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Unanswered Filter & Add Custom Question Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск вопроса (чай, штрафы, график, чек, такси)..."
                className="w-full min-h-[42px] pl-10 pr-8 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
                  aria-label="Очистить поиск"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeTab !== 'compare' && (
                <button
                  onClick={() => setShowUnansweredOnly(!showUnansweredOnly)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    showUnansweredOnly
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {showUnansweredOnly ? 'Показаны без ответа' : 'Только без ответа'}
                </button>
              )}

              <button
                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white border border-stone-200 text-stone-900 hover:bg-stone-100 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить свой вопрос</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Скачать таблицу в Excel (CSV)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Скачать Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Add Custom Question Form */}
          {isAddingQuestion && (
            <form
              onSubmit={handleAddCustomQuestion}
              className="bg-white border border-stone-300 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Добавить свой вопрос в таблицу</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="text-xs text-stone-500 hover:text-stone-800"
                >
                  Закрыть
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-600 mb-1">Формулировка вопроса *</label>
                  <input
                    type="text"
                    required
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    placeholder="Например: Есть ли скидка для сотрудников в меню?"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Категория</label>
                  <select
                    value={newQuestionCategory}
                    onChange={(e) =>
                      setNewQuestionCategory(e.target.value as Exclude<QuestionCategory, 'all'>)
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="base">Ваши основные вопросы</option>
                    <option value="money">Деньги и Чай</option>
                    <option value="training">Стажировка и Меню</option>
                    <option value="schedule">График и Смены</option>
                    <option value="workplace">Быт и Команда</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-600 mb-1">
                    Подсказка (на что обратить внимание)
                  </label>
                  <input
                    type="text"
                    value={newQuestionHint}
                    onChange={(e) => setNewQuestionHint(e.target.value)}
                    placeholder="Необязательно..."
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 whitespace-nowrap shrink-0"
                >
                  Сохранить вопрос
                </button>
              </div>
            </form>
          )}
        </section>

        {/* MODE 1 & 2: SINGLE RESTAURANT INTERACTIVE CARDS (Optimized for Mobile Input) */}
        {activeTab !== 'compare' ? (
          <section className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-base font-semibold text-stone-900">Вопросы не найдены</p>
                <p className="text-sm text-stone-500 mt-1">
                  Попробуйте сбросить фильтр или поисковый запрос.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setShowUnansweredOnly(false);
                  }}
                  className="mt-4 min-h-[42px] px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-xl"
                >
                  Показать все вопросы
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredQuestions.map((q, index) => {
                  const currentAns = answers[currentRestaurantId]?.[q.id] || { text: '' };
                  const isAnswered = currentAns.text.trim().length > 0;
                  const isCustom = q.id.startsWith('custom_');

                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-2xl border transition-colors p-4 sm:p-5 flex flex-col justify-between ${
                        isAnswered ? 'border-stone-300' : 'border-stone-200'
                      }`}
                    >
                      <div>
                        {/* Quiet unboxed metadata line */}
                        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-semibold text-stone-700 tabular-nums">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <span>{q.categoryLabel}</span>
                            {q.isUserProvided && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-800 font-medium">Ваш базовый список</span>
                              </>
                            )}
                            {currentAns.updatedAt && isAnswered && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[11px] text-emerald-700">
                                  Сохранено в {currentAns.updatedAt}
                                </span>
                              </>
                            )}
                          </div>

                          {isCustom && (
                            <button
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              className="text-stone-400 hover:text-red-600 p-1"
                              title="Удалить свой вопрос"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Question Title */}
                        <h2 className="text-base sm:text-lg font-bold text-stone-950 leading-snug">
                          {q.title}
                        </h2>

                        {/* Recruiter / Waiter Insider Hint */}
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span>{q.hint}</span>
                        </p>

                        {/* Quick Tap Buttons for fast one-handed mobile entry */}
                        {q.quickOptions && q.quickOptions.length > 0 && (
                          <div className="mt-3">
                            <span className="block text-[11px] text-stone-400 mb-1.5">
                              Быстрый ввод (нажми, чтобы подставить в ответ):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {q.quickOptions.map((opt) => {
                                const isSelected = currentAns.text.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() =>
                                      handleToggleQuickOption(currentRestaurantId, q.id, opt)
                                    }
                                    className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                                      isSelected
                                        ? 'bg-stone-900 text-white'
                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                    }`}
                                  >
                                    {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Answer Input & Condition Rating */}
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <textarea
                          rows={2}
                          value={currentAns.text}
                          onChange={(e) =>
                            handleUpdateAnswer(currentRestaurantId, q.id, { text: e.target.value })
                          }
                          placeholder={
                            q.placeholder ||
                            `Запишите ответ работодателя (${meta[currentRestaurantId].name})...`
                          }
                          className="w-full p-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 resize-y"
                        />

                        {/* Evaluation of employer's answer (Плюс / Норм / Минус) */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-xs text-stone-500">Оценка условий:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAnswer(currentRestaurantId, q.id, {
                                  rating: currentAns.rating === 'good' ? undefined : 'good',
                                })
                              }
                              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                                currentAns.rating === 'good'
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Плюс</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAnswer(currentRestaurantId, q.id, {
                                  rating: currentAns.rating === 'neutral' ? undefined : 'neutral',
                                })
                              }
                              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                                currentAns.rating === 'neutral'
                                  ? 'bg-stone-700 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                              <span>Норм</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAnswer(currentRestaurantId, q.id, {
                                  rating: currentAns.rating === 'bad' ? undefined : 'bad',
                                })
                              }
                              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                                currentAns.rating === 'bad'
                                  ? 'bg-red-700 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Минус</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* MODE 3: SIDE-BY-SIDE COMPARISON TABLE (THE БЫК vs МЯСО&РЫБА) */
          <section className="space-y-5">
            {/* Summary Scoreboard Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-500">Раздел 1</span>
                    <h2 className="text-lg font-bold text-stone-950">THE БЫК</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('the_byk')}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-800"
                  >
                    Редактировать раздел →
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-mono tabular-nums">
                  <span>Ответов: {bykStats.answeredCount}/{bykStats.totalCount}</span>
                  <span className="text-emerald-700 font-semibold">Плюсов: {bykStats.goodCount}</span>
                  <span className="text-red-700 font-semibold">Минусов: {bykStats.badCount}</span>
                </div>
                {meta.the_byk.expectedIncomeDay && (
                  <p className="mt-2 text-xs text-stone-700">
                    Ожидаемый доход: <strong className="font-mono">{meta.the_byk.expectedIncomeDay}</strong>
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-500">Раздел 2</span>
                    <h2 className="text-lg font-bold text-stone-950">Мясо&Рыба</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('myaso_ryba')}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-800"
                  >
                    Редактировать раздел →
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-mono tabular-nums">
                  <span>Ответов: {mrStats.answeredCount}/{mrStats.totalCount}</span>
                  <span className="text-emerald-700 font-semibold">Плюсов: {mrStats.goodCount}</span>
                  <span className="text-red-700 font-semibold">Минусов: {mrStats.badCount}</span>
                </div>
                {meta.myaso_ryba.expectedIncomeDay && (
                  <p className="mt-2 text-xs text-stone-700">
                    Ожидаемый доход: <strong className="font-mono">{meta.myaso_ryba.expectedIncomeDay}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Comparison Table (Editable directly in cells!) */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100/80 text-xs font-semibold text-stone-700">
                      <th className="py-3.5 px-4 w-[32%]">Вопрос соискателя</th>
                      <th className="py-3.5 px-4 w-[34%] border-l border-stone-200">
                        1. THE БЫК (Ответ и оценка)
                      </th>
                      <th className="py-3.5 px-4 w-[34%] border-l border-stone-200">
                        2. Мясо&Рыба (Ответ и оценка)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    {filteredQuestions.map((q, idx) => {
                      const bykAns = answers.the_byk?.[q.id] || { text: '' };
                      const mrAns = answers.myaso_ryba?.[q.id] || { text: '' };

                      return (
                        <tr key={q.id} className="hover:bg-stone-50/60 transition-colors align-top">
                          <td className="p-3.5 sm:p-4">
                            <div className="text-xs text-stone-500 mb-1">
                              <span className="font-mono tabular-nums font-semibold text-stone-700">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>{' '}
                              <span>{q.categoryLabel}</span>
                              {q.isUserProvided && (
                                <>
                                  {' · '}
                                  <span className="text-amber-800">Базовый</span>
                                </>
                              )}
                            </div>
                            <div className="font-semibold text-stone-950 text-sm leading-snug">
                              {q.title}
                            </div>
                            <div className="text-xs text-stone-500 mt-1">{q.hint}</div>
                          </td>

                          {/* Column 1: THE БЫК */}
                          <td className="p-3.5 sm:p-4 border-l border-stone-200">
                            <textarea
                              rows={2}
                              value={bykAns.text}
                              onChange={(e) =>
                                handleUpdateAnswer('the_byk', q.id, { text: e.target.value })
                              }
                              placeholder="Впишите ответ по THE БЫК..."
                              className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                            />
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAnswer('the_byk', q.id, {
                                    rating: bykAns.rating === 'good' ? undefined : 'good',
                                  })
                                }
                                className={`px-2 py-1 rounded text-[11px] font-medium ${
                                  bykAns.rating === 'good'
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                + Плюс
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAnswer('the_byk', q.id, {
                                    rating: bykAns.rating === 'bad' ? undefined : 'bad',
                                  })
                                }
                                className={`px-2 py-1 rounded text-[11px] font-medium ${
                                  bykAns.rating === 'bad'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                − Минус
                              </button>
                            </div>
                          </td>

                          {/* Column 2: Мясо&Рыба */}
                          <td className="p-3.5 sm:p-4 border-l border-stone-200">
                            <textarea
                              rows={2}
                              value={mrAns.text}
                              onChange={(e) =>
                                handleUpdateAnswer('myaso_ryba', q.id, { text: e.target.value })
                              }
                              placeholder="Впишите ответ по Мясо&Рыба..."
                              className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                            />
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAnswer('myaso_ryba', q.id, {
                                    rating: mrAns.rating === 'good' ? undefined : 'good',
                                  })
                                }
                                className={`px-2 py-1 rounded text-[11px] font-medium ${
                                  mrAns.rating === 'good'
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                + Плюс
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAnswer('myaso_ryba', q.id, {
                                    rating: mrAns.rating === 'bad' ? undefined : 'bad',
                                  })
                                }
                                className={`px-2 py-1 rounded text-[11px] font-medium ${
                                  mrAns.rating === 'bad'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                − Минус
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Footer Utility Actions */}
        <footer className="mt-10 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            Все ответы автоматически сохраняются в памяти вашего браузера на телефоне.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirmClearModal(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-red-700 hover:border-red-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Очистить все ответы</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <nav
        aria-label="Переключение разделов"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 grid grid-cols-3 items-center h-14 px-2"
      >
        <button
          onClick={() => setActiveTab('the_byk')}
          className={`h-full flex flex-col items-center justify-center transition-colors ${
            activeTab === 'the_byk' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <div className="flex items-center gap-1">
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs">THE БЫК</span>
          </div>
          <span className="text-[10px] font-mono tabular-nums">
            {bykStats.answeredCount}/{bykStats.totalCount} отв.
          </span>
        </button>

        <button
          onClick={() => setActiveTab('myaso_ryba')}
          className={`h-full flex flex-col items-center justify-center transition-colors ${
            activeTab === 'myaso_ryba' ? 'text-teal-800 font-bold' : 'text-stone-500'
          }`}
        >
          <div className="flex items-center gap-1">
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs">Мясо&Рыба</span>
          </div>
          <span className="text-[10px] font-mono tabular-nums">
            {mrStats.answeredCount}/{mrStats.totalCount} отв.
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`h-full flex flex-col items-center justify-center transition-colors ${
            activeTab === 'compare' ? 'text-stone-950 font-bold' : 'text-stone-500'
          }`}
        >
          <div className="flex items-center gap-1">
            <ArrowLeftRight className="w-4 h-4" />
            <span className="text-xs">Сравнить</span>
          </div>
          <span className="text-[10px]">Сводная таблица</span>
        </button>
      </nav>

      {/* Confirmation Modal for Reset */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-xl">
            <h3 className="text-base font-bold text-stone-950">Очистить все внесенные ответы?</h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Это удалит записанные ответы по ресторанам «THE БЫК» и «Мясо&Рыба». Сами вопросы останутся на месте.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Отмена
              </button>
              <button
                onClick={handleResetAll}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium bg-red-700 text-white hover:bg-red-800"
              >
                Да, очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
