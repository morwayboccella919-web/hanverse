export interface User {
  id: string;
  email: string;
  display_name: string;
  hsk_level: number;
  credits_remaining: number;
  streak_days: number;
  max_streak: number;
  last_active_date: string;
  total_xp: number;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  pinyin: string;
  hsk_level: number;
  category: string;
  syllable_count: number;
}

export interface AssessmentStatus {
  id: string;
  status: "pending" | "processing" | "done" | "failed";
  overall?: number;
  hsk_estimate?: string;
  created_at: string;
}

export interface AssessmentReport {
  id: string;
  status: string;
  pronunciation_score: number;
  tone_score: number;
  fluency_score: number;
  overall_score: number;
  hsk_estimate: string;
  cefr_estimate: string;
  error_phonemes: Record<string, { count: number; score: number }>;
  explanation: string;
  report_data: {
    phoneme_timeline: Array<{ char: string; expected: string; actual: string; score: number }>;
    tone_heatmap: Array<{ label: string; score: number }>;
  };
  created_at: string;
}

export interface AssessmentSummary {
  id: string;
  overall_score: number;
  hsk_estimate: string;
  created_at: string;
}

export interface Task {
  type: "discrimination" | "shadowing" | "fluency";
  instruction: string;
  options?: string[];
  answer?: string;
}

export interface PracticeDetail {
  id: string;
  tasks: Task[];
  completed: boolean;
}

export interface PracticeResult {
  scores: number[];
  xp_earned: number;
}
