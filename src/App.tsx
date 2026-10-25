import React, { useState, useEffect } from 'react';
import { Navbar, MainTabType } from './components/Navbar';
import { DocumentInput } from './components/DocumentInput';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { DocumentQA } from './components/DocumentQA';
import { CalendarManager } from './components/CalendarManager';
import { LocationDistanceMap } from './components/LocationDistanceMap';
import { HistoryModal } from './components/HistoryModal';
import { AnalysisResult } from './types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  MessageSquare,
  Calendar,
  BarChart3,
  UploadCloud
} from 'lucide-react';

const STORAGE_KEY = 'govdoc_ai_history_v1';
const CURRENT_RESULT_KEY = 'govdoc_ai_current_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('input');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [queuedQuestion, setQueuedQuestion] = useState<string | null>(null);
  const [isQaAnswering, setIsQaAnswering] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedCurrent = localStorage.getItem(CURRENT_RESULT_KEY);
      if (savedCurrent) {
        const parsed = JSON.parse(savedCurrent);
        setCurrentResult(parsed);
        setActiveTab('report');
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  }, []);

  // Save history
  const saveToHistory = (newResult: AnalysisResult) => {
    const updated = [newResult, ...history.filter(h => h.id !== newResult.id)].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(CURRENT_RESULT_KEY, JSON.stringify(newResult));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOneHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async (payload: {
    text?: string;
    fileBase64?: string;
    fileMimeType?: string;
    fileName?: string;
  }) => {
    setIsLoading(true);
    setErrorText(null);
    setLoadingStepText('1단계: 문서 성격 및 공고 유형 자동 판별 중...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStepText('2단계: 신청 일정, 커트라인, 자격 요건, 수치 정밀 추출 중...');
    }, 1800);

    const stepTimer2 = setTimeout(() => {
      setLoadingStepText('3단계: 규격화된 수석 분석가 마크다운 보고서 및 대시보드 생성 중...');
    }, 3800);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!resData.success || !resData.data) {
        throw new Error(resData.error || '문서 분석에 실패했습니다.');
      }

      const raw = resData.data;
      const formattedResult: AnalysisResult = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        documentType: raw.documentType || 'TYPE_A',
        typeLabel: raw.typeLabel || '[분석 유형: LH 모집 공고]',
        title: raw.title || payload.fileName || '공고/정책 문서 분석 결과',
        issuingAgency: raw.issuingAgency,
        announcementDate: raw.announcementDate,
        markdownReport: raw.markdownReport || '',
        keyBadges: raw.keyBadges || [],
        typeAData: raw.typeAData,
        typeBData: raw.typeBData,
        typeCData: raw.typeCData,
        locations: raw.locations || raw.typeAData?.locations || [],
        rawInputSnippet: payload.text ? payload.text.slice(0, 200) : payload.fileName,
      };

      setCurrentResult(formattedResult);
      saveToHistory(formattedResult);
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analyze error:', err);
      setErrorText(err.message || '서버 통신 중 오류가 발생했습니다.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStepText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSelectSample={() => {
          const sample = SAMPLE_DOCUMENTS[0];
          handleAnalyze({ text: sample.content, fileName: sample.title });
        }}
        historyCount={history.length}
        hasResult={!!currentResult}
        isQaAnswering={isQaAnswering}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Alert */}
        {errorText && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <span>{errorText}</span>
            <button
              onClick={() => setErrorText(null)}
              className="text-xs font-semibold text-red-600 hover:text-red-800"
            >
              닫기
            </button>
          </div>
        )}

        {/* ===================== TAB 1: 공고 문서 분석 ===================== */}
        <div className={activeTab === 'input' ? 'space-y-6 animate-in fade-in duration-150' : 'hidden'}>
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>대한민국 공공정책 · 주거복지 · 정부 보도자료 수석 분석가 AI</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              공고문과 정책 보도자료 분석 요청
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
              LH 임대주택 공고문 전문, 국토교통부 정책 보도자료 원문을 입력하면 3가지 유형으로 자동 판별하여 분석 보고서와 캘린더 일정을 생성합니다.
            </p>
          </div>

          <DocumentInput
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            loadingStepText={loadingStepText}
          />

          {/* Quick Link to Current Result if available */}
          {currentResult && (
            <div className="p-4 bg-white rounded-xl border border-blue-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  최근 분석 문서
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
                  {currentResult.title}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('report')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>보고서 열람</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ===================== TAB 2: 수석 분석 보고서 ===================== */}
        {currentResult && (
          <div className={activeTab === 'report' ? 'space-y-6 animate-in fade-in duration-150' : 'hidden'}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">수석 문서 분석 보고서</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('qa')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>이 보고서에 질문하기</span>
                  {isQaAnswering && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>캘린더 등록</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>내 주소 거리 비교</span>
                </button>
              </div>
            </div>

            <AnalysisDashboard 
              result={currentResult} 
              onTriggerQuestion={(q) => {
                setQueuedQuestion(q);
                setActiveTab('qa');
              }}
              onNavigateTab={setActiveTab}
            />
          </div>
        )}

        {/* ===================== TAB 3: 실시간 질의응답 (장문 지원 & 취소 기능) ===================== */}
        {currentResult && (
          <div className={activeTab === 'qa' ? 'space-y-6 animate-in fade-in duration-150' : 'hidden'}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  수석 분석관 1:1 심층 질의응답
                </h2>
                {isQaAnswering && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                    답변 작성 중... (다른 탭을 보셔도 멈추지 않습니다)
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveTab('report')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ← 보고서 다시 보기
              </button>
            </div>

            <DocumentQA 
              result={currentResult} 
              variant="full"
              queuedQuestion={queuedQuestion}
              onClearQueuedQuestion={() => setQueuedQuestion(null)}
              onSubmittingChange={setIsQaAnswering}
            />
          </div>
        )}

        {/* ===================== TAB 4: 구글 캘린더 연동 & 일정 ===================== */}
        <div className={activeTab === 'calendar' ? 'space-y-6 animate-in fade-in duration-150' : 'hidden'}>
          <CalendarManager 
            result={currentResult}
            onSelectTab={setActiveTab}
          />
        </div>

        {/* ===================== TAB 5: 공급 위치 맵 & 거리 비교 ===================== */}
        <div className={activeTab === 'map' ? 'space-y-6 animate-in fade-in duration-150' : 'hidden'}>
          <LocationDistanceMap 
            result={currentResult}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 GovDoc AI · 대한민국 공공정책 & LH공고 수석 문서 분석 플랫폼</p>
          <div className="flex items-center gap-3 text-slate-400">
            <button onClick={() => setActiveTab('input')} className="hover:underline">문서 분석</button>
            <span>•</span>
            <button onClick={() => setActiveTab('qa')} className="hover:underline">질의응답</button>
            <span>•</span>
            <button onClick={() => setActiveTab('calendar')} className="hover:underline">캘린더</button>
            <span>•</span>
            <button onClick={() => setActiveTab('map')} className="hover:underline">거리 비교 맵</button>
          </div>
        </div>
      </footer>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(result) => {
          setCurrentResult(result);
          setActiveTab('report');
        }}
        onClearHistory={handleClearHistory}
        onDeleteOne={handleDeleteOneHistory}
      />
    </div>
  );
}
