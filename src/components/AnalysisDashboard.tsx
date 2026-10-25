import React, { useState } from 'react';
import { 
  AnalysisResult, 
  DocumentType, 
  ScheduleItem 
} from '../types';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Building, 
  Home, 
  FileCheck, 
  Layers, 
  ArrowRight, 
  ExternalLink,
  Download,
  Share2,
  CalendarPlus,
  HelpCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MessageSquare,
  Columns,
  Maximize2,
  MapPin,
  Compass
} from 'lucide-react';
import { downloadIcsCalendar, createGoogleCalendarUrl } from '../utils/calendar';
import { MarkdownViewer } from './MarkdownViewer';
import { DocumentQA } from './DocumentQA';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onTriggerQuestion?: (question: string) => void;
  onNavigateTab?: (tab: 'input' | 'report' | 'qa' | 'calendar' | 'map') => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result,
  onTriggerQuestion,
  onNavigateTab 
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'markdown' | 'split' | 'qa'>('dashboard');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [queuedQuestion, setQueuedQuestion] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskSection = (questionText: string) => {
    if (onTriggerQuestion) {
      onTriggerQuestion(questionText);
    }
    setQueuedQuestion(questionText);
    if (activeView === 'dashboard') {
      setActiveView('split');
    }
  };

  // Type styling
  const getTypeBadgeStyle = (type: DocumentType) => {
    switch (type) {
      case 'TYPE_A':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          gradient: 'from-emerald-600 to-teal-700',
          name: 'LH 임대·분양 및 주거복지 모집 공고',
        };
      case 'TYPE_B':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          gradient: 'from-blue-600 to-indigo-700',
          name: '부동산 정책 및 제도 개편 문서',
        };
      case 'TYPE_C':
      default:
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          gradient: 'from-purple-600 to-violet-700',
          name: '일반 정부 문서 및 정책 보도자료',
        };
    }
  };

  const badgeStyle = getTypeBadgeStyle(result.documentType);

  return (
    <div className="space-y-6">
      {/* Top Banner & Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`h-2.5 bg-gradient-to-r ${badgeStyle.gradient}`} />
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle.bg}`}>
                <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`}></span>
                {result.typeLabel}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {badgeStyle.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {result.issuingAgency && (
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {result.issuingAgency}
                </span>
              )}
              {result.announcementDate && (
                <span className="text-slate-500">
                  발표/공고: {result.announcementDate}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
            {result.title}
          </h2>

          {/* Quick Metrics Badges */}
          {result.keyBadges && result.keyBadges.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              {result.keyBadges.map((badge, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                    {badge.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate block">
                    {badge.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="px-5 sm:px-7 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between py-2.5 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              대시보드 브리핑 뷰
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="문서 결과와 질의응답을 나란히 한 화면에서 확인"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>나란히 보며 질의하기 (분할 뷰)</span>
            </button>
            <button
              onClick={() => setActiveView('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'markdown'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              정통 마크다운 보고서 뷰
            </button>
            <button
              onClick={() => setActiveView('qa')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'qa'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>실시간 질의응답 창만 보기</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAskSection('이 공고의 전반적인 핵심 사항과 내가 가장 주의해야 할 포인트를 요약해줘.')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>분석 결과 질문하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'qa' ? (
        <DocumentQA 
          result={result} 
          variant="inline"
          queuedQuestion={queuedQuestion}
          onClearQueuedQuestion={() => setQueuedQuestion(null)}
        />
      ) : activeView === 'markdown' ? (
        <MarkdownViewer markdown={result.markdownReport} title={result.title} />
      ) : activeView === 'split' ? (
        /* ===================== SIDE-BY-SIDE SPLIT VIEW ===================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6 max-h-[85vh] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
              <span>좌측 분석 내용을 보며 우측 질의창에서 바로 질문할 수 있습니다.</span>
              <button
                onClick={() => setActiveView('dashboard')}
                className="text-blue-600 font-bold hover:underline"
              >
                전체화면
              </button>
            </div>
            {renderDashboardContent()}
          </div>

          <div className="lg:col-span-6 sticky top-20 self-start">
            <DocumentQA
              result={result}
              variant="split"
              queuedQuestion={queuedQuestion}
              onClearQueuedQuestion={() => setQueuedQuestion(null)}
            />
          </div>
        </div>
      ) : (
        /* ===================== STANDARD DASHBOARD VIEW ===================== */
        renderDashboardContent()
      )}
    </div>
  );

  function renderDashboardContent() {
    return (
      <div className="space-y-6">
        {/* ===================== [유형 A] LH 공고 및 주택/청년 지원 모집 공고 ===================== */}
        {result.documentType === 'TYPE_A' && result.typeAData && (
          <div className="space-y-6">
            {/* 1. 신청 일정 타임라인 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">신청 일정 (핵심 타임라인)</h3>
                    <p className="text-xs text-slate-500">접수 시작~마감, 서류제출, 당첨자 발표일 등 누락 없는 핵심 일정</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAskSection('이 공고의 신청 접수 기간과 서류 제출 기한, 당첨자 발표일 일정에 대해 상세히 설명해줘.')}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    title="일정에 대해 질문하기"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>일정 질문하기</span>
                  </button>

                  <button
                    onClick={() => downloadIcsCalendar(result.title, result.typeAData?.schedules || [])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    title="캘린더 파일(.ics)로 저장하여 스마트폰/PC 캘린더에 일정 등록"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.ics 저장</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                {result.typeAData.schedules.map((schedule, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border relative transition-all ${
                      schedule.isImportant
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    {schedule.isImportant && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                        필수 체크
                      </span>
                    )}
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      STEP 0{idx + 1}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                      {schedule.phase}
                    </h4>
                    <p className="text-xs font-semibold text-emerald-800 bg-white/80 px-2 py-1 rounded border border-emerald-100 inline-block mb-1.5">
                      {schedule.date}
                    </p>
                    {schedule.note && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {schedule.note}
                      </p>
                    )}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <a
                        href={createGoogleCalendarUrl(result.title, schedule)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        <span>Google 캘린더 등록</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 모집 대상 및 자격 요건 (커트라인) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">모집 대상 및 자격 요건 (커트라인)</h3>
                      <p className="text-xs text-slate-500">연령, 소득·자산 기준, 무주택 여부 등 핵심 심사 요건</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAskSection('이 공고의 연령, 무주택, 소득·자산 커트라인 자격 요건을 내가 충족하는지 질문하고 싶어.')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>자격 요건 질문</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {result.typeAData.eligibility.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mb-1.5">
                        {item.category}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                        {item.criteria}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 내 자격 10초 자가진단 (Interactive Checklist) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white p-5 sm:p-7 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">내 자격 10초 자가진단</h3>
                        <p className="text-xs text-slate-300">공고 기준 충족 여부를 체크해 보세요</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {(result.typeAData.selfChecklist || [
                      { id: 'sc-1', question: '공고일 기준 무주택자(본인 명의 주택 없음)인가요?' },
                      { id: 'sc-2', question: '공고에 명시된 연령 기준에 부합하나요?' },
                      { id: 'sc-3', question: '해당 순위의 가구원 소득 기준을 초과하지 않나요?' },
                      { id: 'sc-4', question: '총자산 및 자동차 가액 기준을 만족하나요?' }
                    ]).map((item) => {
                      const isChecked = !!checkedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isChecked
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                              : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <div className="mt-0.5 text-emerald-400">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm leading-snug">
                            {item.question}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    체크 완료: <strong>{Object.values(checkedItems).filter(Boolean).length}</strong> 개 항목
                  </span>
                  <button
                    onClick={() => handleAskSection('내 나이와 소득, 주택 소유 상태를 알려줄 테니 이 공고에 적격한지 계산해줘.')}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>자격 정밀 상담</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. 공급 물량 및 임대 조건 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">공급 물량 및 임대 조건 (숫자 완벽 정리)</h3>
                    <p className="text-xs text-slate-500">보증금, 월세, 임대 기간, 공급 호수 구체적 수치</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 공고의 보증금 및 월세 상호전환(보증금을 올리고 월세를 깎는 조건)이 어떻게 되는지 계산해줘.')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>임대료/보증금 질문</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">총 공급 호수</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {result.typeAData.supplyAndTerms.totalUnits || '공고 본문 참조'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">임대 거주 기간</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {result.typeAData.supplyAndTerms.leasePeriod || '기본 2년 (재계약 가능)'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">보증금 및 월세 수준</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-700">
                    {result.typeAData.supplyAndTerms.depositAndRent || '시세 대비 40~50%'}
                  </span>
                </div>
              </div>

              {result.typeAData.supplyAndTerms.conditionsTable && result.typeAData.supplyAndTerms.conditionsTable.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-2.5 font-semibold">순위/유형</th>
                        <th className="p-2.5 font-semibold">임대 보증금</th>
                        <th className="p-2.5 font-semibold">월 임대료</th>
                        <th className="p-2.5 font-semibold">비고/옵션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {result.typeAData.supplyAndTerms.conditionsTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{row.type}</td>
                          <td className="p-2.5 font-semibold text-blue-700">{row.deposit}</td>
                          <td className="p-2.5 font-semibold text-emerald-700">{row.rent}</td>
                          <td className="p-2.5 text-slate-500">{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Map Shortcut Card: 거리 비교 맵 바로가기 배너 */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                    Google Maps 연동
                  </span>
                  <span className="text-xs text-blue-300 font-semibold">
                    공급 위치 & 직주근접 분석
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>내 기준 주소 vs 공급 단지 거리 & 통학·출퇴근 시간 비교</span>
                </h4>
                <p className="text-xs text-blue-200 max-w-xl">
                  직장이나 집 주소를 입력하면 이번 공고의 공급 주택 위치와의 직선거리 및 예상 대중교통 시간을 지도에서 바로 확인하고 정렬할 수 있습니다.
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('map')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>거리 비교 맵 열기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 5. 신청 방법 및 필수 서류 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">신청 방법 및 필수 제출서류</h3>
                    <p className="text-xs text-slate-500">인터넷 접수처(LH 청약플러스 등) 및 서류제출 안내</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 공고 지원 시 꼭 준비해야 할 서류 목록과 온라인 발급 주의사항을 알려줘.')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>제출서류 질문</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <span className="text-xs font-semibold text-indigo-900 block mb-1">공식 접수처</span>
                    <p className="text-sm font-bold text-slate-900">
                      {result.typeAData.applicationMethod.channel}
                    </p>
                    {result.typeAData.applicationMethod.urlOrApp && (
                      <p className="text-xs text-blue-600 mt-1">
                        {result.typeAData.applicationMethod.urlOrApp}
                      </p>
                    )}
                  </div>

                  {result.typeAData.applicationMethod.steps && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-2">신청 진행 순서:</span>
                      <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700">
                        {result.typeAData.applicationMethod.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">서류제출 대상자 필수 서류:</span>
                  <ul className="space-y-2">
                    {(result.typeAData.applicationMethod.requiredDocuments || [
                      '주민등록표등본 및 초본',
                      '가족관계증명서 (상세)',
                      '무주택서약서 및 개인정보동의서'
                    ]).map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== [유형 B] 부동산 정책 및 제도 변경 문서 ===================== */}
        {result.documentType === 'TYPE_B' && result.typeBData && (
          <div className="space-y-6">
            {/* 1. 정책 핵심 한 줄 요약 */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
                  KEY POLICY SUMMARY
                </span>
                <button
                  onClick={() => handleAskSection('이 정책 변경안의 핵심 요약과 시행 일정에 대해 더 자세히 풀어 설명해줘.')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-blue-100 flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>요약 내용 질문</span>
                </button>
              </div>
              <h3 className="text-lg sm:text-xl font-bold leading-relaxed mb-3">
                "{result.typeBData.coreOneLiner}"
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200 pt-3 border-t border-white/10">
                <span>시행 일정: <strong>{result.typeBData.effectiveDate}</strong></span>
                {result.issuingAgency && (
                  <span>· 주관 부처: <strong>{result.issuingAgency}</strong></span>
                )}
              </div>
            </div>

            {/* 2. 주요 대상 및 수혜자 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">주요 수혜 및 규제 적용 대상</h3>
                    <p className="text-xs text-slate-500">누구에게 혜택이 가거나 규제가 적용되는지 구체적 타깃</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('내가 이 정책의 수혜 대상자(또는 규제 대상자)에 포함되는지 확인해줘.')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>수혜 자격 질문</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.typeBData.targetBeneficiaries.map((target, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-900 font-semibold text-xs sm:text-sm border border-blue-200/80 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{target}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. 주요 변경 내용 비교표 (Before vs After) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">주요 변경 내용 비교표 (기존 vs 변경)</h3>
                    <p className="text-xs text-slate-500">대출 한도, 금리, 청약 조건, 세제 혜택 등 구체적 수치 비교</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 비교표에 나온 변경 사항 중에서 일반 무주택자나 신혼부부에게 가장 파급력이 큰 변화는 무엇인가요?')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>수치 비교 질문</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-3 text-left font-bold w-1/4">구분 / 항목</th>
                      <th className="p-3 text-left font-semibold text-slate-500 w-1/3">기존 제도</th>
                      <th className="p-3 text-left font-bold text-blue-800 w-1/3">개편안 (변경 후)</th>
                      <th className="p-3 text-left font-semibold text-slate-600">핵심 포인트</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {result.typeBData.comparisonTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.item}</td>
                        <td className="p-3 text-slate-500 bg-slate-50/50">{row.before}</td>
                        <td className="p-3 font-bold text-blue-700 bg-blue-50/30">
                          {row.after}
                        </td>
                        <td className="p-3 text-xs text-emerald-700 font-semibold">
                          {row.highlight || '개선'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.typeBData.keyNotes && result.typeBData.keyNotes.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block mb-1">유의사항 및 세부지침:</span>
                  {result.typeBData.keyNotes.map((note, idx) => (
                    <p key={idx}>• {note}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== [유형 C] 그 외 일반 정부 문서 및 긴 글 ===================== */}
        {result.documentType === 'TYPE_C' && result.typeCData && (
          <div className="space-y-6">
            {/* 1. 전체 요약 (3~4문장 압축) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">전체 핵심 압축 요약 (3~4문장)</h3>
                    <p className="text-xs text-slate-500">문서의 목적과 핵심 골자를 명쾌하게 정리</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 3~4문장 요약 외에 실무자가 반드시 알아야 할 비하인드나 핵심 정책 목표를 추가 설명해줘.')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>요약 내용 질문</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {result.typeCData.summaryLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/40 border border-purple-100">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 핵심 포인트 (Bullet Points) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">실무자·개인 필수 인지 핵심 포인트</h3>
                    <p className="text-xs text-slate-500">놓치면 손해보는 주요 혜택 및 세부 사항</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 핵심 포인트 중 일반 국민이 놓치기 쉬운 불이익이나 주의사항이 있다면 무엇인가요?')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>핵심 포인트 질문</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {result.typeCData.keyPoints.map((point, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      {point.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      {point.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 향후 조치 / 체크리스트 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">향후 조치 / 액션 아이템 체크리스트</h3>
                    <p className="text-xs text-slate-500">내가 지금 취해야 할 후속 조치 목록</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAskSection('이 체크리스트 항목을 실행하기 위해 필요한 구체적 웹사이트나 절차를 단계별로 알려줘.')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>액션 플랜 질문</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {result.typeCData.actionChecklist.map((item, idx) => {
                  const id = `action-${idx}`;
                  const isChecked = !!checkedItems[id];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={isChecked ? 'text-emerald-600' : 'text-slate-400'}>
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs sm:text-sm ${isChecked ? 'line-through text-slate-500' : 'font-medium'}`}>
                          {item.action}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.timing && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {item.timing}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
