import React from 'react';
import { AnalysisResult } from '../types';
import { X, History, Trash2, ArrowRight, Calendar, Building2 } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisResult[];
  onSelectResult: (result: AnalysisResult) => void;
  onClearHistory: () => void;
  onDeleteOne: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
  onDeleteOne,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">분석 문서 기록</h3>
              <p className="text-xs text-slate-500">최근 분석한 공고 및 정책 문서 보관함 ({history.length}건)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1"
              >
                전체 삭제
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">아직 분석한 문서 기록이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">공고문이나 정책 문서를 입력하여 분석해 보세요.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        item.documentType === 'TYPE_A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.documentType === 'TYPE_B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.typeLabel}
                    </span>
                    {item.issuingAgency && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.issuingAgency}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1 mb-1">
                    {item.title}
                  </h4>

                  {item.keyBadges && item.keyBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.keyBadges.slice(0, 3).map((b, bIdx) => (
                        <span key={bIdx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {b.label}: <strong>{b.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={() => onDeleteOne(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    title="불러오기"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
