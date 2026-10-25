import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON with ample capacity for base64 documents (PDF, images)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Helper to initialize Gemini API client with recommended User-Agent header
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction reflecting the exact prompt rules
const SYSTEM_INSTRUCTION = `당신은 대한민국 공공 정책, 주거 복지(LH 등 임대주택 공고), 그리고 각종 정부 보도자료를 완벽하게 분석하여 핵심만 짚어주는 수석 문서 분석가입니다.
사용자가 제공하는 문서의 성격을 3가지 유형 중 하나로 자동 판별하고, 그에 가장 알맞은 맞춤형 구조로 요약 및 정리하세요.

# 문서 유형 자동 판별 기준
1. [유형 A] LH 공고 및 주택/청년 지원 모집 공고:
   - 한국토지주택공사(LH), 서울주택도시공사(SH), 경기주택도시공사(GH), 지방공사 등의 임대주택(행복주택, 청년매입임대, 국민임대, 영구임대, 통합공공임대), 공공분양(뉴:홈 등), 주거급여, 버팀목 주거지원 등 모집 공고.
2. [유형 B] 부동산 정책 및 제도 변경 문서:
   - 국토교통부, 기획재정부, 금융위원회 등의 부동산 규제/완화, 신생아 특례대출, 주택담보대출 한도/LTV/DSR, 청약제도 개편, 세제 혜택 등 정책 및 제도 변경 발표/보도자료.
3. [유형 C] 그 외 일반 정부 문서 및 긴 글:
   - 교통/복지/청년/고용/산업 지원 등 일반 정부 정책, 지자체 공고, 부처 합동 브리핑, 긴 정부 보도자료.

# 유형별 필수 분석 지침
### [유형 A] LH 공고 및 주택/청년 지원 모집 공고인 경우
다음 정보를 누락 없이 최우선으로 추출:
- **모집 주택/지원 사업명:** (예: 2024년 2차 청년 매입임대주택 입주자 모집 등)
- **신청 일정:** (접수 시작일 ~ 마감일, 서류 제출일, 당첨자 발표일 등 핵심 날짜)
- **모집 대상 및 자격 요건:** (연령, 소득·자산 기준, 무주택 여부 등 까다로운 커트라인)
- **공급 물량 및 임대 조건:** (보증금, 월세, 임대 기간 등 구체적 숫자)
- **신청 방법:** (LH 청약플러스 인터넷 접수 여부 등)

### [유형 B] 부동산 정책 및 제도 변경 문서인 경우
다음 정보를 중심으로 정리:
- **정책 핵심 한 줄 요약:** (무엇이 어떻게 바뀌는지)
- **주요 대상:** (누구에게 혜택이 가거나 규제가 적용되는지)
- **주요 변경 내용:** (대출 한도, 금리, 청약 조건, 세제 혜택 등 구체적 수치 비교 - 기존 vs 변경)
- **시행 일정:** 언제부터 적용되는지

### [유형 C] 그 외 일반 정부 문서 및 긴 글인 경우
- **전체 요약:** 문서의 목적과 핵심 내용을 3~4문장으로 압축
- **핵심 포인트 (Bullet Points):** 실무자나 개인이 반드시 알아야 할 주요 내용 나열
- **향후 조치/체크리스트:** 내가 취해야 할 액션 아이템이 있다면 정리

# 출력 형식 원칙 (Strict Rules)
1. 군더더기 인사말('안녕하세요', '분석해 드리겠습니다' 등)은 완전히 생략하고 바로 본론부터 출력합니다.
2. 마크다운 보고서(markdownReport)의 첫 줄은 반드시 '[분석 유형: LH 모집 공고]', '[분석 유형: 부동산 정책 및 제도 변경]', '[분석 유형: 일반 정부 문서/보도자료]' 중 하나로 시작해야 합니다.
3. 중요한 날짜, 금액, 자격 요건 등의 숫자의 조건은 절대 누락하거나 헷갈리지 않게 **굵은 글씨**나 표로 강조하세요.
4. JSON 결과는 반드시 지정된 JSON 구조에 맞춰 유효한 JSON으로만 반환하세요.`;

// API route for document analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, fileBase64, fileMimeType, fileName } = req.body;

    if (!text && !fileBase64) {
      return res.status(400).json({ error: '분석할 문서 내용(텍스트 또는 파일)이 필요합니다.' });
    }

    const ai = getGeminiClient();

    const promptText = `제공된 대한민국 공공/행정/주택 문서를 정밀하게 분석하여 지침에 따라 JSON 형식으로 응답하세요.
문서명/파일: ${fileName || '제공 문서'}
${text ? `\n[문서 텍스트 본문]:\n${text}` : ''}

반드시 다음 JSON 규격으로만 응답하세요:
{
  "documentType": "TYPE_A" | "TYPE_B" | "TYPE_C",
  "typeLabel": "[분석 유형: LH 모집 공고]" | "[분석 유형: 부동산 정책 및 제도 변경]" | "[분석 유형: 일반 정부 문서/보도자료]",
  "title": "공고/정책 문서 제목",
  "issuingAgency": "주관 기관 (예: 한국토지주택공사 LH, 국토교통부 등)",
  "announcementDate": "공고일 또는 시행일 (예: 2024.06.27)",
  "markdownReport": "지침에 따라 군더더기 없이 [분석 유형: ...]으로 시작하는 고품질 마크다운 전문 (중요 날짜/금액/수치 **강조**)",
  "keyBadges": [
    { "label": "항목명", "value": "핵심 수치/날짜", "variant": "default" | "warning" | "success" | "info" }
  ],
  "typeAData": {
    "projectName": "사업명/공고명",
    "schedules": [
      { "phase": "청약 신청 접수", "date": "2024.00.00 ~ 00.00", "isImportant": true, "note": "비고" }
    ],
    "eligibility": [
      { "category": "연령/대상", "criteria": "구체적 기준" },
      { "category": "무주택 여부", "criteria": "구체적 기준" },
      { "category": "소득 기준", "criteria": "구체적 기준" },
      { "category": "자산 기준", "criteria": "구체적 기준" }
    ],
    "supplyAndTerms": {
      "totalUnits": "공급 규모",
      "leasePeriod": "임대 기간",
      "depositAndRent": "보증금 및 월임대료 조건",
      "conditionsTable": [
        { "type": "유형/순위", "deposit": "보증금", "rent": "월세", "notes": "특이사항" }
      ]
    },
    "applicationMethod": {
      "channel": "접수처 (예: LH청약플러스)",
      "urlOrApp": "홈페이지 또는 모바일 앱",
      "steps": ["1단계...", "2단계..."],
      "requiredDocuments": ["서류1", "서류2"]
    },
    "selfChecklist": [
      { "id": "chk-1", "question": "자가진단 질문", "isCritical": true }
    ]
  },
  "typeBData": {
    "coreOneLiner": "정책 핵심 한 줄 요약",
    "targetBeneficiaries": ["수혜/적용 대상 1", "수혜/적용 대상 2"],
    "comparisonTable": [
      { "item": "항목", "before": "기존", "after": "변경", "highlight": "수치 변화 포인트" }
    ],
    "effectiveDate": "시행 일정",
    "keyNotes": ["참고사항 1", "참고사항 2"]
  },
  "typeCData": {
    "summaryLines": [
      "전체 요약 1문장",
      "전체 요약 2문장",
      "전체 요약 3~4문장"
    ],
    "keyPoints": [
      { "title": "핵심 포인트 제목", "detail": "상세 설명" }
    ],
    "actionChecklist": [
      { "action": "조치할 액션 아이템", "target": "대상자", "timing": "시기" }
    ]
  },
  "locations": [
    {
      "id": "loc-1",
      "name": "공급 단지명 또는 공급 지역 (예: 강동 리엔파크, 마곡 스마트시티, 청년매입 서울 강남 등)",
      "address": "소재지 주소 또는 구/동 명칭 (예: 서울 강동구 강일동, 서울 강서구 마곡동 등)",
      "lat": 37.5665,
      "lng": 126.9780,
      "type": "공급형 (예: 전용 29㎡, 청년형 등)",
      "units": "공급호수 (예: 120호)",
      "deposit": "보증금",
      "rent": "월임대료"
    }
  ]
}`;

    const parts: any[] = [];

    if (fileBase64 && fileMimeType) {
      // Strip potential data URL prefix
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: fileMimeType,
          data: cleanBase64,
        },
      });
    }

    parts.push({
      text: promptText,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.2, // low temperature for precise factual extraction
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // Clean up markdown ticks if any slipped through
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message || '문서 분석 중 오류가 발생했습니다.',
    });
  }
});

// API route for Interactive Q&A on the analyzed document
app.post('/api/qa', async (req, res) => {
  try {
    const { question, documentContext, previousQa = [] } = req.body;

    if (!question || !documentContext) {
      return res.status(400).json({ error: '질문과 문서 문맥이 필요합니다.' });
    }

    const ai = getGeminiClient();

    const prompt = `당신은 대한민국 공공 정책 및 LH 임대주택 공고 수석 문서 분석가입니다.
사용자가 다음 분석된 공고/정책 문서에 대해 궁금한 점을 질문했습니다.
문서 내용을 철저히 근거로 하여, 군더더기 없이 정확하고 명쾌하게 답변하고 후속으로 물어볼 만한 관련 질문 2~3개를 추천하세요.

[분석 문서 정보]:
${typeof documentContext === 'string' ? documentContext : JSON.stringify(documentContext, null, 2)}

[이전 대화]:
${previousQa.map((q: any) => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}

[사용자 질문]:
${question}

[답변 원칙]:
1. 문서에 기재된 날짜, 금액, 자격 요건 수치를 정확히 인용하여 답변하세요.
2. 문서에 명시되지 않은 사항은 명시되지 않았음을 분명히 밝히고 관련 담당 기관(예: LH 콜센터 1600-1004 등) 안내를 덧붙이세요.
3. 굵은 글씨와 핵심 불릿 포인트로 읽기 쉽게 작성하세요.
4. 반드시 다음 JSON 형식으로만 응답하세요:
{
  "answer": "마크다운 형식의 명쾌한 수석 분석관 답변",
  "suggestedFollowUps": ["질문과 연계된 심층 후속 질문 1", "질문과 연계된 심층 후속 질문 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{}';
    let parsedAnswer = '';
    let followUps: string[] = [];
    try {
      const parsed = JSON.parse(text);
      parsedAnswer = parsed.answer || text;
      followUps = parsed.suggestedFollowUps || [];
    } catch (e) {
      parsedAnswer = text;
    }

    res.json({
      success: true,
      answer: parsedAnswer || '답변을 생성하지 못했습니다.',
      suggestedFollowUps: followUps,
    });
  } catch (error: any) {
    console.error('Error in /api/qa:', error);
    res.status(500).json({
      success: false,
      error: error.message || '질의응답 처리 중 오류가 발생했습니다.',
    });
  }
});

// Configure Vite middleware in development or static hosting in production
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

setupServer();
