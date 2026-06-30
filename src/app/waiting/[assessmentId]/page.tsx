"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { AssessmentStatus } from "@/lib/types";

const PHASES = [
  { label: "上传音频", pct: 20 },
  { label: "语音识别", pct: 40 },
  { label: "发音分析", pct: 60 },
  { label: "语调评估", pct: 80 },
  { label: "生成报告", pct: 95 },
];

export default function WaitingPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`);
        const data: AssessmentStatus = await res.json();
        setStatus(data);
        if (data.status === "done") {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => router.push(`/report/${assessmentId}`), 800);
        } else if (data.status === "failed") {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch { /* retry */ }
    };

    poll();
    timerRef.current = setInterval(poll, 1500);

    const phaseInterval = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PHASES.length - 1));
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(phaseInterval);
    };
  }, [assessmentId, router]);

  const currentPhase = PHASES[Math.min(phaseIndex, PHASES.length - 1)];

  if (status?.status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="mx-4 max-w-sm text-center">
          <CardContent className="py-8">
            <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">分析失败</h2>
            <p className="text-gray-500 mb-6">抱歉，音频处理时出现了问题</p>
            <Link href="/questions">
              <Button className="bg-gradient-to-r from-red-500 to-orange-500">重新选择题目</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-red-200 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-200">
            {status?.status === "done" ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
            ) : (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {status?.status === "done" ? "分析完成！" : "AI 正在分析你的发音…"}
        </h2>
        <p className="text-gray-500 mb-8">{currentPhase.label}…</p>

        <Progress value={currentPhase.pct} className="h-2 mb-4 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" />

        <div className="flex justify-center gap-6 text-sm text-gray-400">
          {PHASES.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${i <= phaseIndex ? "bg-red-500" : "bg-gray-200"}`} />
              <span className="text-[10px]">{p.label}</span>
            </div>
          ))}
        </div>

        {status?.status === "done" && (
          <p className="mt-6 text-sm text-green-500 animate-pulse">即将跳转到报告…</p>
        )}
      </div>
    </div>
  );
}
