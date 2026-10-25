import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  ClipboardPaste, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/samples';

interface DocumentInputProps {
  onAnalyze: (payload: { text?: string; fileBase64?: string; fileMimeType?: string; fileName?: string }) => void;
  isLoading: boolean;
  loadingStepText: string;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  onAnalyze,
  isLoading,
  loadingStepText,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'samples'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    base64: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setSelectedSampleId(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Check if it's text, pdf, or image
    const mime = file.type || 'text/plain';
    const reader = new FileReader();

    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTextInput(content);
        setSelectedFile({
          file,
          base64: btoa(unescape(encodeURIComponent(content))),
          mimeType: 'text/plain',
          name: file.name,
        });
        setActiveTab('text');
      };
      reader.readAsText(file);
    } else {
      // PDF or Image
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedFile({
          file,
          base64,
          mimeType: mime,
          name: file.name,
        });
        setActiveTab('file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: SampleDocument) => {
    setTextInput(sample.content);
    setSelectedSampleId(sample.id);
    setSelectedFile(null);
    setActiveTab('text');
  };

  const handleClear = () => {
    setTextInput('');
    setSelectedFile(null);
    setSelectedSampleId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (selectedFile && activeTab === 'file') {
      onAnalyze({
        fileBase64: selectedFile.base64,
        fileMimeType: selectedFile.mimeType,
        fileName: selectedFile.name,
        text: textInput.trim() || undefined,
      });
    } else if (textInput.trim()) {
      const activeSample = SAMPLE_DOCUMENTS.find(s => s.id === selectedSampleId);
      onAnalyze({
        text: textInput.trim(),
        fileName: activeSample ? activeSample.title : '사용자 입력 공고문',
      });
    }
  };

  const canSubmit = (activeTab === 'file' && !!selectedFile) || (textInput.trim().length > 20);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Tab Switcher Header */}
      <div className="bg-slate-50/80 px-4 pt-3 pb-0 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>텍스트 직접 입력</span>
            {textInput.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>PDF/문서 파일 업로드</span>
            {selectedFile && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>검증된 실제 공고 샘플 ({SAMPLE_DOCUMENTS.length})</span>
          </button>
        </div>

        {/* Clean & Quick Stats */}
        <div className="flex items-center gap-3 pb-2 text-xs text-slate-500">
          {(textInput || selectedFile) && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-red-50"
              title="입력 내용 초기화"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        {activeTab === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="documentText" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>공고문 전문 또는 보도자료 내용 붙여넣기</span>
                {selectedSampleId && (
                  <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    선택된 샘플: {SAMPLE_DOCUMENTS.find(s => s.id === selectedSampleId)?.typeTag}
                  </span>
                )}
              </label>
              <span className="text-xs text-slate-400">
                {textInput.length.toLocaleString()} 자
              </span>
            </div>

            <textarea
              id="documentText"
              value={textInput}
              onChange={handleTextChange}
              rows={9}
              placeholder="LH 청년매입임대/행복주택 공고문 전문, 국토교통부 부동산 정책 발표문, 또는 정부 보도자료 원문을 이곳에 복사하여 붙여넣으세요.&#10;&#10;수석 분석가가 자동으로 유형(A: LH·주거지원 / B: 부동산 정책·제도 변경 / C: 일반 행정 보도자료)을 판별하여 최적의 양식으로 정리합니다."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-mono leading-relaxed resize-y bg-slate-50/50 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
            />

            {/* Quick Helper Samples bar */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">빠른 테스트 샘플:</span>
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedSampleId === sample.id
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sample.typeTag.split(':')[0]} · {sample.title.slice(0, 18)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div>
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    {(selectedFile.file.size / 1024).toFixed(1)} KB · 파일 준비 완료
                  </p>
                  <span className="text-xs text-blue-600 underline">다른 파일로 교체하기</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <FileUp className="w-7 h-7" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    공고문 PDF 또는 텍스트 파일을 드래그하여 올려놓으세요
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                    LH 청약 공고 PDF 원본, 정부 보도자료 문서(TXT/PDF), 또는 공고 캡처 이미지(PNG/JPG)를 Gemini 3.8 멀티모달 엔진이 직접 분석합니다.
                  </p>
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-sm hover:bg-blue-700">
                    컴퓨터에서 파일 찾기
                  </span>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>선택된 파일: <strong>{selectedFile.name}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  제거
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-3">
              유형별 실제 대한민국 정책 및 모집 공고 예시를 선택하면, 실전 분석 결과를 즉시 체험하실 수 있습니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedSampleId === sample.id
                      ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        sample.type === 'TYPE_A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sample.type === 'TYPE_B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {sample.typeTag}
                    </span>
                    <span className="text-[11px] text-slate-400">{sample.agency}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{sample.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                    {sample.description}
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>이 공고문 불러와서 분석하기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action CTA Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>3대 유형(LH공고 / 정책제도 개편 / 일반 정부문서) 자동 맞춤 분석</span>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              canSubmit && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{loadingStepText || '수석 문서 분석관 정밀 분석 진행 중...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>수석 분석가에게 정밀 분석 요청</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
