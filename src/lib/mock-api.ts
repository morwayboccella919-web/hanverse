import type { User, Question, AssessmentStatus, AssessmentReport, AssessmentSummary, PracticeDetail, PracticeResult } from "./types";

export type { User, Question, AssessmentStatus, AssessmentReport, AssessmentSummary, PracticeDetail, PracticeResult } from "./types";

// ===== Mock Data =====
const mockUser: User = {
  id: "u_001",
  email: "learner@hanverse.app",
  display_name: "小明",
  hsk_level: 3,
  credits_remaining: 8,
  streak_days: 7,
  max_streak: 14,
  last_active_date: new Date().toISOString().split("T")[0],
  total_xp: 1250,
  created_at: "2024-01-15T00:00:00Z",
};

const mockQuestions: Question[] = [
  { id: "q_001", text: "你好，请问这个多少钱？", pinyin: "Ni hao, qingwen zhege duoshao qian?", hsk_level: 1, category: "daily", syllable_count: 9 },
  { id: "q_002", text: "我每天早上六点起床。", pinyin: "Wo meitian zaoshang liu dian qichuang.", hsk_level: 1, category: "daily", syllable_count: 10 },
  { id: "q_003", text: "她唱歌非常好听。", pinyin: "Ta changge feichang haoting.", hsk_level: 2, category: "leisure", syllable_count: 8 },
  { id: "q_004", text: "他比我高一点。", pinyin: "Ta bi wo gao yidian.", hsk_level: 2, category: "comparison", syllable_count: 6 },
  { id: "q_005", text: "会议改到明天下午三点。", pinyin: "Huiyi gai dao mingtian xiawu san dian.", hsk_level: 3, category: "business", syllable_count: 10 },
  { id: "q_006", text: "我觉得学中文最难的是声调。", pinyin: "Wo juede xue Zhongwen zui nan de shi shengdiao.", hsk_level: 3, category: "education", syllable_count: 15 },
  { id: "q_007", text: "这个问题我们需要仔细考虑一下。", pinyin: "Zhege wenti women xuyao zixi kaolu yixia.", hsk_level: 4, category: "business", syllable_count: 15 },
  { id: "q_008", text: "兵马俑被认为是世界第八大奇迹。", pinyin: "Bingmayong bei renwei shi shijie di-ba da qiji.", hsk_level: 4, category: "culture", syllable_count: 16 },
  { id: "q_009", text: "环境保护已经成为全球性的议题。", pinyin: "Huanjing baohu yijing chengwei quanqiuxing de yiti.", hsk_level: 5, category: "society", syllable_count: 16 },
  { id: "q_010", text: "中医理论强调阴阳平衡与气血运行。", pinyin: "Zhongyi lilun qiangdiao yinyang pingheng yu qixue yunxing.", hsk_level: 5, category: "culture", syllable_count: 17 },
];

const assessmentStore: Record<string, AssessmentStatus> = {};
const reportStore: Record<string, AssessmentReport> = {};

function makeAssessment(id: string): { status: AssessmentStatus; report: AssessmentReport } {
  const status: AssessmentStatus = { id, status: "processing", created_at: new Date().toISOString() };
  const report: AssessmentReport = {
    id, status: "done",
    pronunciation_score: 72 + Math.floor(Math.random() * 20),
    tone_score: 65 + Math.floor(Math.random() * 25),
    fluency_score: 70 + Math.floor(Math.random() * 20),
    overall_score: 0, hsk_estimate: "HSK 3", cefr_estimate: "A2",
    error_phonemes: {
      "zh": { count: 2, score: 60 }, "ch": { count: 1, score: 70 },
      "sh": { count: 1, score: 75 }, "r": { count: 3, score: 45 }, "u": { count: 2, score: 55 },
    },
    explanation: "发音整体清晰。注意卷舌音 zh/ch/sh 的发音位置，以及 u 音的圆唇程度。声调方面，第二声和第三声的区分需要加强。",
    report_data: {
      phoneme_timeline: [
        { char: "你", expected: "ni3", actual: "ni2", score: 85 },
        { char: "好", expected: "hao3", actual: "hao3", score: 92 },
      ],
      tone_heatmap: [
        { label: "第一声", score: 82 }, { label: "第二声", score: 68 },
        { label: "第三声", score: 71 }, { label: "第四声", score: 85 }, { label: "轻声", score: 90 },
      ],
    },
    created_at: new Date().toISOString(),
  };
  report.overall_score = Math.round((report.pronunciation_score + report.tone_score + report.fluency_score) / 3);
  status.overall = report.overall_score;
  status.hsk_estimate = report.hsk_estimate;
  return { status, report };
}

const practiceStore: Record<string, PracticeDetail> = {};
const practiceResultStore: Record<string, PracticeResult> = {};

function makePractice(practiceId: string): PracticeDetail {
  return {
    id: practiceId, completed: false,
    tasks: [
      { type: "discrimination", instruction: "听录音，选择正确的声调组合：你好", options: ["3-3", "2-3", "3-2", "2-2"], answer: "3-3" },
      { type: "shadowing", instruction: "跟读以下句子，尽量模仿语调和节奏：你今天吃了什么？" },
      { type: "fluency", instruction: "用中文描述你最近一次旅行经历（30秒）" },
    ],
  };
}

// ===== Fetch Interceptor =====
let interceptorInstalled = false;

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 400));
}

function parsePath(url: string) {
  const u = new URL(url, "http://localhost");
  return { path: u.pathname, searchParams: u.searchParams };
}

type MockResponse = { status: number; body: unknown };

export function installMockApi(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const mock = await routeMock(url, method, init);
    if (mock) {
      return new Response(JSON.stringify(mock.body), { status: mock.status, headers: { "Content-Type": "application/json" } });
    }
    return originalFetch(input, init);
  };
}

async function routeMock(url: string, method: string, init?: RequestInit): Promise<MockResponse | null> {
  const { path, searchParams } = parsePath(url);
  await delay();

  if (method === "POST" && path === "/api/auth/login") {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    return { status: 200, body: { access_token: "mock_token_" + Date.now(), user: { ...mockUser, email: body.email || mockUser.email } } };
  }

  if (method === "GET" && path === "/api/auth/me") {
    return { status: 200, body: mockUser };
  }

  if (method === "GET" && path === "/api/questions") {
    const hsk = searchParams.get("hsk");
    const category = searchParams.get("category");
    let filtered = [...mockQuestions];
    if (hsk) filtered = filtered.filter(q => q.hsk_level === parseInt(hsk));
    if (category) filtered = filtered.filter(q => q.category === category);
    return { status: 200, body: filtered };
  }

  const qMatch = path.match(/^\/api\/questions\/(.+)$/);
  if (method === "GET" && qMatch) {
    const found = mockQuestions.find(q => q.id === qMatch[1]);
    return found ? { status: 200, body: found } : { status: 404, body: { error: "Not found" } };
  }

  if (method === "POST" && path === "/api/assessments") {
    const assessmentId = "asmt_" + Date.now();
    const { status, report } = makeAssessment(assessmentId);
    status.status = "pending";
    assessmentStore[assessmentId] = status;
    reportStore[assessmentId] = report;
    setTimeout(() => {
      if (assessmentStore[assessmentId]) {
        assessmentStore[assessmentId].status = "done";
        assessmentStore[assessmentId].overall = report.overall_score;
        assessmentStore[assessmentId].hsk_estimate = report.hsk_estimate;
      }
    }, 4000);
    return { status: 200, body: { assessment_id: assessmentId } };
  }

  const asmtMatch = path.match(/^\/api\/assessments\/([^/]+)$/);
  if (method === "GET" && asmtMatch) {
    const id = asmtMatch[1];
    const st = assessmentStore[id];
    if (!st) return { status: 404, body: { error: "Not found" } };
    if (st.status === "pending") st.status = "processing";
    return { status: 200, body: { ...st } };
  }

  const reportMatch = path.match(/^\/api\/assessments\/(.+)\/report$/);
  if (method === "GET" && reportMatch) {
    const rpt = reportStore[reportMatch[1]];
    return rpt ? { status: 200, body: rpt } : { status: 404, body: { error: "Not found" } };
  }

  if (method === "GET" && path === "/api/assessments/history") {
    const history: AssessmentSummary[] = Object.values(reportStore).map(r => ({ id: r.id, overall_score: r.overall_score, hsk_estimate: r.hsk_estimate, created_at: r.created_at }));
    return { status: 200, body: history };
  }

  if (method === "POST" && path === "/api/practice/generate") {
    const practiceId = "prac_" + Date.now();
    practiceStore[practiceId] = makePractice(practiceId);
    return { status: 200, body: { practice_id: practiceId } };
  }

  const pracMatch = path.match(/^\/api\/practice\/([^/]+)$/);
  if (method === "GET" && pracMatch) {
    const pd = practiceStore[pracMatch[1]];
    return pd ? { status: 200, body: pd } : { status: 404, body: { error: "Not found" } };
  }

  const submitMatch = path.match(/^\/api\/practice\/(.+)\/submit\/(\d+)$/);
  if (method === "POST" && submitMatch) {
    const pd = practiceStore[submitMatch[1]];
    if (!pd) return { status: 404, body: { error: "Not found" } };
    const idx = parseInt(submitMatch[2]);
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const task = pd.tasks[idx];
    if (!task) return { status: 404, body: { error: "Task not found" } };
    let correct = false;
    let feedback = "";
    if (task.type === "discrimination") {
      correct = body.answer === task.answer;
      feedback = correct ? "正确！声调组合是 3-3。" : `不对哦，正确答案是 ${task.answer}。`;
    } else if (task.type === "shadowing") {
      correct = Math.random() > 0.3;
      feedback = correct ? "跟读得很好，语调很自然！" : "再试一次，注意模仿语调的起伏。";
    } else {
      correct = Math.random() > 0.3;
      feedback = correct ? "表达流畅，内容丰富！" : "可以尝试用更完整的句子来表达。";
    }
    if (idx === pd.tasks.length - 1) {
      pd.completed = true;
      practiceResultStore[submitMatch[1]] = { scores: pd.tasks.map(() => Math.floor(Math.random() * 30 + 70)), xp_earned: 50 + Math.floor(Math.random() * 100) };
    }
    return { status: 200, body: { correct, feedback } };
  }

  const resultMatch = path.match(/^\/api\/practice\/(.+)\/result$/);
  if (method === "GET" && resultMatch) {
    const pr = practiceResultStore[resultMatch[1]];
    return pr ? { status: 200, body: pr } : { status: 404, body: { error: "Not found" } };
  }

  if (method === "POST" && path === "/api/payments/create") {
    return { status: 200, body: { stripe_session_url: "https://checkout.stripe.com/mock/session_" + Date.now() } };
  }

  if (method === "POST" && path === "/api/share/generate") {
    return { status: 200, body: { image_url: "/mock-share-card.png" } };
  }

  return null;
}
