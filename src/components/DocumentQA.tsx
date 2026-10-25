import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, QAMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw,
  ArrowRight,
  CornerDownLeft,
  XCircle,
  Square
} from 'lucide-react';
import { marked } from 'marked';

interface DocumentQAProps {
  result: AnalysisResult;
  variant?: 'inline' | 'split' | 'drawer' | 'full';
  queuedQuestion?: string | null;
  onClearQueuedQuestion?: () => void;
  onCloseDrawer?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export const DocumentQA: React.FC<DocumentQAProps> = ({ 
  result, 
  variant = 'inline',
  queuedQuestion,
  onClearQueuedQuestion,
  onCloseDrawer,
  onSubmittingChange
}) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Notify parent of submitting status (for background tab indicators)
  useEffect(() => {
    if (onSubmittingChange) {
      onSubmittingChange(isSubmitting);
    }
  }, [isSubmitting, onSubmittingChange]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Handle queued questions from document sections (Click-to-Ask)
  useEffect(() => {
    if (queuedQuestion) {
      setInputValue(queuedQuestion);
      textareaRef.current?.focus();
      if (onClearQueuedQuestion) {
        onClearQueuedQuestion();
      }
    }
  }, [queuedQuestion, onClearQueuedQuestion]);

  // Cancel question handler
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSubmitting(false);

    // Append cancellation notification in chat
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-cancel-${Date.now()}`,
        sender: 'assistant',
        text: '⏹️ **답변 생성이 취소되었습니다.** 궁금한 점이 있으시면 다시 질문해 주세요.',
        timestamp: Date.now(),
      },
    ]);
  };

  // Keyboard shortcut: Escape cancels in-flight question
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSubmitting) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSubmitting]);

  // Dynamic tailored question chips by document type
  const getCategorizedQuestions = () => {
    if (result.documentType === 'TYPE_A') {
      return [
        { label: '자격 순위', text: '부모님이 주택을 보유하고 있어도 신청 가능한가요?' },
        { label: '비용 절감', text: '보증금을 최대로 증액하면 월 임대료는 얼마까지 줄어드나요?' },
        { label: '일정 확인', text: '서류제출 대상자로 선정되면 언제까지 서류를 내야 하나요?' },
        { label: '소득 산정', text: '소득 기준은 세전 금액인가요, 아니면 건강보험료 기준인가요?' },
        { label: '자가 진단', text: '제 나이와 월급여, 무주택 기간을 적어드릴 테니 1순위 가능 여부를 판정해 주세요.' },
      ];
    } else if (result.documentType === 'TYPE_B') {
      return [
        { label: '시행 시점', text: '소득 요건 완화는 정확히 언제부터 신청할 수 있나요?' },
        { label: '대환 가능', text: '기존에 받은 높은 금리의 주택담보대출도 대환 가능한가요?' },
        { label: '청약 개편', text: '부부가 동일 단지에 동시 청약해도 무효 처리가 안 되나요?' },
        { label: '소득 커트라인', text: '맞벌이 부부 소득 2억원 산정 시 상여금도 포함되나요?' },
      ];
    } else {
      return [
        { label: '핵심 액션', text: '이 정책에서 내가 가장 먼저 신청하거나 조치해야 할 것은?' },
        { label: '수혜 자격', text: '청년 우대 혜택을 받기 위해 필요한 인증이나 서류는?' },
        { label: '적용 범위', text: '소급 적용이 가능한지 여부와 유의사항을 알려주세요.' },
      ];
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if (isSubmitting) {
      handleCancel();
    }
    setMessages([]);
  };

  const handleSend = async (questionText?: string) => {
    const question = (questionText || inputValue).trim();
    if (!question || isSubmitting) return;

    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: QAMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          documentContext: {
            title: result.title,
            type: result.documentType,
            markdownReport: result.markdownReport,
            badges: result.keyBadges,
            typeAData: result.typeAData,
            typeBData: result.typeBData,
            typeCData: result.typeCData,
          },
          previousQa: messages.slice(-4).map((m) => ({
            question: m.sender === 'user' ? m.text : '',
            answer: m.sender === 'assistant' ? m.text : '',
          })),
        }),
      });

      const data = await response.json();
      if (data.success && data.answer) {
        const assistantMsg: QAMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          timestamp: Date.now(),
          suggestedFollowUps: data.suggestedFollowUps || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || '답변 생성 실패');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled, message already handled
        return;
      }
      const errorMsg: QAMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `죄송합니다. 답변을 불러오는 중 오류가 발생했습니다: ${err.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If Shift + Enter: Allow natural newline in textarea
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    // If plain Enter (without Shift): Send message!
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const questions = getCategorizedQuestions();
  const isSplit = variant === 'split';
  const isDrawer = variant === 'drawer';
  const isFull = variant === 'full';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col ${
      isSplit ? 'h-full border-l-2 border-l-blue-500' : isDrawer ? 'h-full' : isFull ? 'p-6 sm:p-8 min-h-[700px]' : 'p-5 sm:p-7'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-slate-200 ${
        isSplit || isDrawer ? 'p-4 bg-slate-50' : 'pb-4 mb-4'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                분석 결과 기반 실시간 질의응답
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                수석 분석관 AI 직통
              </span>
              {isSubmitting && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  답변 생성 중...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              "{result.title}" 공고 내용을 바탕으로 장문 사연, 세부 자격, 대출 한도를 즉시 검토해 드립니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSubmitting && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="현재 진행 중인 답변 생성 취소 (단축키: Esc)"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>질문 취소</span>
            </button>
          )}

          {messages.length > 0 && !isSubmitting && (
            <button
              onClick={handleResetChat}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="대화 내역 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">대화 초기화</span>
            </button>
          )}
          {isDrawer && onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
            >
              닫기
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${isSplit || isDrawer ? 'p-4 overflow-hidden' : ''}`}>
        {/* Quick Recommended Questions Chips */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>자주 묻는 핵심 질문 바로가기 (클릭 시 자동 질문):</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                disabled={isSubmitting}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 group-hover:bg-blue-200 text-slate-700 group-hover:text-blue-800">
                  {q.label}
                </span>
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages List Area */}
        <div className={`space-y-4 mb-4 overflow-y-auto p-4 bg-slate-50/70 rounded-xl border border-slate-200 ${
          isSplit || isDrawer ? 'flex-1 min-h-[300px]' : isFull ? 'flex-1 min-h-[420px]' : 'max-h-[520px]'
        }`}>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-600" />
              <p className="text-sm font-semibold text-slate-700">
                "{result.title}"에 대해 자유롭게 질문해 보세요!
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                본인의 나이, 월평균 소득, 부모님 주택 소유 여부, 거주지 등 <strong>긴 장문 사연</strong>을 그대로 붙여넣으셔도 AI 수석 분석관이 공고 기준과 대조하여 명쾌하게 답해드립니다.
              </p>
              <div className="mt-3 text-[11px] text-blue-600 bg-blue-50/80 inline-block px-3 py-1 rounded-full border border-blue-100">
                💡 <strong>Shift + Enter</strong>로 줄바꿈하여 편하게 장문으로 작성하실 수 있습니다.
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[88%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <div>
                        <div
                          className="prose prose-xs max-w-none 
                            prose-p:my-1.5 prose-p:leading-relaxed
                            prose-strong:text-slate-900 prose-strong:font-bold prose-strong:bg-yellow-100 prose-strong:px-1 prose-strong:rounded
                            prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5
                            prose-table:my-2 prose-table:text-xs prose-th:bg-slate-100 prose-th:p-1.5 prose-td:p-1.5
                          "
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(msg.text, { async: false }) as string,
                          }}
                        />

                        {/* Copy button */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>수석 분석관 공식 소견</span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">복사완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>답변 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}
                  </div>

                  {/* Smart Suggested Follow-up Questions */}
                  {msg.sender === 'assistant' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-2.5 pl-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400">연관 후속 질문:</span>
                      {msg.suggestedFollowUps.map((fu, fuIdx) => (
                        <button
                          key={fuIdx}
                          onClick={() => handleSend(fu)}
                          disabled={isSubmitting}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer text-left flex items-center gap-1"
                        >
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span>{fu}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isSubmitting && (
            <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Bot className="w-4 h-4 text-blue-600 animate-spin" />
                <span>공고 원문 및 관련 법령·지침을 대조하여 답변을 작성하고 있습니다...</span>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Square className="w-3 h-3 fill-red-600" />
                <span>취소 (Esc)</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Multiline Input Bar with Shift+Enter Support */}
        <div className="mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isSubmitting) {
                handleCancel();
              } else {
                handleSend();
              }
            }}
            className="relative rounded-2xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-2 shadow-xs"
          >
            <textarea
              ref={textareaRef}
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="공고에 대해 궁금한 점을 장문으로 입력하세요 (예: 나이, 월급, 가족수, 무주택 사연을 적어주시면 맞춤 진단해 드립니다.)&#10;※ Shift + Enter: 줄바꿈 / Enter: 질문 전송"
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 focus:outline-hidden resize-y min-h-[64px] max-h-[220px] text-slate-800 placeholder:text-slate-400 leading-relaxed font-sans"
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-slate-200/60 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-500">
                  <CornerDownLeft className="w-3 h-3 text-blue-600" />
                  <span><strong>Enter</strong> 전송</span>
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  <strong>Shift + Enter</strong> 줄바꿈 (장문 입력 가능)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {inputValue.length}자
                </span>

                {isSubmitting ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>취소하기</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      inputValue.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>질문 전송</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
