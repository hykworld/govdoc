import { 
  FileText, 
  Sparkles, 
  History, 
  Printer, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  UploadCloud,
  MapPin
} from 'lucide-react';

export type MainTabType = 'input' | 'report' | 'qa' | 'calendar' | 'map';

interface NavbarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onOpenHistory: () => void;
  onSelectSample: () => void;
  historyCount: number;
  hasResult: boolean;
  isQaAnswering?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHistory,
  onSelectSample,
  historyCount,
  hasResult,
  isQaAnswering = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onSelectTab('input')}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  onClick={() => onSelectTab('input')}
                  className="font-bold text-lg text-slate-900 tracking-tight cursor-pointer hover:text-blue-700"
                >
                  GovDoc AI
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  수석 문서 분석관
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                대한민국 공공정책 · LH 임대주택 공고 정밀 분석
              </p>
            </div>
          </div>

          {/* Quick Actions Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title="실제 공고문 샘플 불러오기"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">추천 샘플</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors relative cursor-pointer"
              title="분석 내역 열람"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">기록</span>
              {historyCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            {hasResult && (
              <button
                onClick={() => window.print()}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer print:hidden"
                title="리포트 인쇄 또는 PDF 저장"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>인쇄/PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Top-Level Clean Navigation Tabs Bar (Clean Responsive Wrap without Ugly Scrollbars) */}
        <nav 
          aria-label="메인 기능 탭"
          className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-slate-100 py-2 sm:py-2.5"
        >
          {/* Tab 1: 공고 문서 분석 */}
          <button
            type="button"
            onClick={() => onSelectTab('input')}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'input' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
            }`}>
              1
            </span>
            <UploadCloud className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'input' ? 'text-white' : 'text-blue-600'}`} />
            <span className="whitespace-nowrap">공고 문서 분석</span>
          </button>

          {/* Tab 2: 수석 분석 보고서 */}
          <button
            type="button"
            onClick={() => onSelectTab('report')}
            disabled={!hasResult}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : hasResult
                ? 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 hover:border-slate-300 cursor-pointer'
                : 'bg-slate-50/40 text-slate-300 border border-slate-100 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'report' 
                ? 'bg-white/20 text-white' 
                : hasResult 
                ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300' 
                : 'bg-slate-100 text-slate-300'
            }`}>
              2
            </span>
            <BarChart3 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'report' ? 'text-white' : hasResult ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span className="whitespace-nowrap">수석 분석 보고서</span>
            {hasResult && activeTab !== 'report' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>

          {/* Tab 3: 실시간 질의응답 */}
          <button
            type="button"
            onClick={() => onSelectTab('qa')}
            disabled={!hasResult}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'qa'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : hasResult
                ? 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 hover:border-slate-300 cursor-pointer'
                : 'bg-slate-50/40 text-slate-300 border border-slate-100 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'qa' 
                ? 'bg-white/20 text-white' 
                : hasResult 
                ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300' 
                : 'bg-slate-100 text-slate-300'
            }`}>
              3
            </span>
            <MessageSquare className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'qa' ? 'text-white' : hasResult ? 'text-blue-600' : 'text-slate-300'}`} />
            <span className="whitespace-nowrap">실시간 질의응답</span>
            {isQaAnswering ? (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse ${
                activeTab === 'qa' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'qa' ? 'bg-blue-600' : 'bg-amber-500'}`}></span>
                <span>작성 중</span>
              </span>
            ) : hasResult && activeTab !== 'qa' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            ) : null}
          </button>

          {/* Tab 4: 공고 일정 & 캘린더 */}
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            disabled={!hasResult}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : hasResult
                ? 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 hover:border-slate-300 cursor-pointer'
                : 'bg-slate-50/40 text-slate-300 border border-slate-100 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'calendar' 
                ? 'bg-white/20 text-white' 
                : hasResult 
                ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300' 
                : 'bg-slate-100 text-slate-300'
            }`}>
              4
            </span>
            <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'calendar' ? 'text-white' : hasResult ? 'text-indigo-600' : 'text-slate-300'}`} />
            <span className="whitespace-nowrap">공고 일정 & 캘린더</span>
            {hasResult && activeTab !== 'calendar' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            )}
          </button>

          {/* Tab 5: 공급 위치 맵 & 거리 비교 */}
          <button
            type="button"
            onClick={() => onSelectTab('map')}
            disabled={!hasResult}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                : hasResult
                ? 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 hover:border-slate-300 cursor-pointer'
                : 'bg-slate-50/40 text-slate-300 border border-slate-100 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'map' 
                ? 'bg-white/20 text-white' 
                : hasResult 
                ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300' 
                : 'bg-slate-100 text-slate-300'
            }`}>
              5
            </span>
            <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'map' ? 'text-white' : hasResult ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span className="whitespace-nowrap">위치 맵 & 거리 비교</span>
            {hasResult && activeTab !== 'map' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
