import React, { useState } from 'react';
import { AnalysisResult, ScheduleItem } from '../types';
import { 
  Calendar as CalendarIcon, 
  CalendarPlus, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';
import { downloadIcsCalendar, createGoogleCalendarUrl } from '../utils/calendar';

interface CalendarManagerProps {
  result: AnalysisResult | null;
  onSelectTab: (tab: 'input' | 'report' | 'qa' | 'calendar') => void;
}

export const CalendarManager: React.FC<CalendarManagerProps> = ({ result, onSelectTab }) => {
  const [syncedEvents, setSyncedEvents] = useState<Record<string, boolean>>({});

  const schedules: ScheduleItem[] = result?.typeAData?.schedules || 
    (result?.announcementDate ? [{ phase: '정책 공고/시행일', date: result.announcementDate, isImportant: true }] : []);

  // Calculate D-Day
  const getDDay = (dateStr: string) => {
    const match = dateStr.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (!match) return null;

    const targetDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-Day (오늘)';
    if (diffDays > 0) return `D-${diffDays}`;
    return `마감 (D+${Math.abs(diffDays)})`;
  };

  const handleMarkSync = (phase: string) => {
    setSyncedEvents(prev => ({ ...prev, [phase]: true }));
  };

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm my-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-base mb-1">
          분석된 공고 일정이 없습니다
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          먼저 공고문이나 정책 보도자료를 분석하시면 접수 시작~마감, 서류제출, 당첨 발표 등 모든 핵심 일정을 캘린더로 연동해 드립니다.
        </p>
        <button
          onClick={() => onSelectTab('input')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
        >
          공고문 분석하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                일정 통합 관리
              </span>
              <span className="text-xs text-slate-300">
                {result.issuingAgency || '공식 주관처'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              {result.title}
            </h2>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              청약 접수 마감 시간을 놓치면 추가 접수가 불가능합니다. Google 캘린더나 휴대폰 캘린더에 일정을 즉시 등록하여 놓치지 마세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => downloadIcsCalendar(result.title, schedules)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              title="아이폰/갤럭시/PC 캘린더 앱에 전체 일정 일괄 등록"
            >
              <Download className="w-4 h-4" />
              <span>전체 일정 .ics 파일 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Calendar Connection Card */}
      <div className="bg-white rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                로그인 및 인증 없이 1초 즉시 등록
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                개인정보 권한 불필요
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              별도의 복잡한 계정 로그인이나 권한 승인 없이, 각 일정의 <strong>[Google 캘린더 등록]</strong> 버튼을 누르면 구글 캘린더 일정 작성 창에 공고 일정과 내용이 자동으로 채워집니다. 상단의 <strong>[.ics 저장]</strong>으로 스마트폰 캘린더에도 일괄 추가 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Timeline Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">공고 전체 타임라인 & 단계별 캘린더 등록</h3>
          </div>
          <span className="text-xs text-slate-400">
            총 {schedules.length}개 핵심 일정 추출됨
          </span>
        </div>

        {schedules.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            본 문서에서는 명시적인 타임라인 일정이 추출되지 않았습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule, idx) => {
              const dday = getDDay(schedule.date);
              const isSynced = syncedEvents[schedule.phase];
              const isPast = dday && dday.startsWith('마감');

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    schedule.isImportant
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-slate-900">
                          {schedule.phase}
                        </h4>
                        {schedule.isImportant && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                            필수 마감
                          </span>
                        )}
                        {dday && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            dday.includes('오늘')
                              ? 'bg-red-600 text-white animate-pulse'
                              : isPast
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {dday}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-blue-800">
                        {schedule.date}
                      </p>
                      {schedule.note && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          비고: {schedule.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <a
                      href={createGoogleCalendarUrl(result.title, schedule)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleMarkSync(schedule.phase)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSynced
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      {isSynced ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Google 캘린더 추가됨</span>
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Google 캘린더 등록</span>
                        </>
                      )}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
