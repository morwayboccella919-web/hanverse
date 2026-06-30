"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ChevronRight, Trophy, Mic, Volume2, Clock } from "lucide-react";
import type { PracticeDetail, Task, PracticeResult } from "@/lib/types";

const TASK_ICONS = { discrimination: Volume2, shadowing: Mic, fluency: Clock };
const TASK_COLORS = { discrimination: "bg-blue-100 text-blue-700", shadowing: "bg-purple-100 text-purple-700", fluency: "bg-green-100 text-green-700" };
const TASK_LABELS = { discrimination: "听力辨别", shadowing: "跟读模仿", fluency: "流利表达" };

export default function PracticePage() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const [detail, setDetail] = useState<PracticeDetail | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/practice/${practiceId}`)
      .then((r) => r.json())
      .then(setDetail);
  }, [practiceId]);

  const currentTask: Task | null = detail?.tasks[taskIndex] ?? null;
  const isLast = detail ? taskIndex >= detail.tasks.length - 1 : false;
  const showResult = result !== null && (!detail || detail.completed);

  const submit = useCallback(async () => {
    if (!currentTask || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/practice/${practiceId}/submit/${taskIndex}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: selected }),
      });
      const data = await res.json();
      setFeedback(data);

      if (isLast) {
        setTimeout(async () => {
          const rres = await fetch(`/api/practice/${practiceId}/result`);
          setResult(await rres.json());
          setTaskIndex((i) => i + 1);
        }, 1500);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }, [currentTask, practiceId, taskIndex, selected, isLast, submitting]);

  const nextTask = () => {
    setSelected(null);
    setFeedback(null);
    setTaskIndex((i) => i + 1);
  };

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/questions">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">练习完成！</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">太棒了！</h2>
          <p className="text-gray-500 mb-8">你获得了 <span className="font-bold text-orange-500">+{result.xp_earned} XP</span></p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {result.scores.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{TASK_LABELS[detail.tasks[i]?.type || "discrimination"]}</p>
                  <p className="text-2xl font-bold text-green-600">{s}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link href="/report">
            <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500">返回报告</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (!currentTask) return null;

  const TaskIcon = TASK_ICONS[currentTask.type];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link href={`/report/${practiceId.replace("prac_", "asmt_")}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 flex-1">针对性练习</h1>
            <Badge className={TASK_COLORS[currentTask.type]}>{TASK_LABELS[currentTask.type]}</Badge>
          </div>
          <Progress value={((taskIndex) / detail.tasks.length) * 100} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" />
          <p className="text-xs text-gray-400 mt-1">Task {taskIndex + 1}/{detail.tasks.length}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-2 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center shrink-0">
                <TaskIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">{TASK_LABELS[currentTask.type]}</p>
                <p className="text-lg font-medium text-gray-900">{currentTask.instruction}</p>
              </div>
            </div>

            {/* Discrimination: choose options */}
            {currentTask.type === "discrimination" && currentTask.options && (
              <div className="space-y-3">
                {currentTask.options.map((opt) => (
                  <button
                    key={opt}
                    disabled={!!feedback}
                    onClick={() => setSelected(opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      feedback
                        ? opt === currentTask.answer
                          ? "border-green-500 bg-green-50"
                          : opt === selected
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                        : selected === opt
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    <span className="font-mono text-lg">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Shadowing / Fluency: placeholder */}
            {currentTask.type !== "discrimination" && (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 mx-auto text-red-300 mb-3" />
                <p className="text-gray-500 text-sm">
                  {currentTask.type === "shadowing" ? "准备跟读，开始录音…" : "准备口述，开始录音…"}
                </p>
                {!feedback && (
                  <Button
                    onClick={() => { setSelected("done"); submit(); }}
                    className="mt-4 bg-gradient-to-r from-red-500 to-orange-500"
                  >
                    模拟完成
                  </Button>
                )}
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`mt-4 p-4 rounded-xl ${feedback.correct ? "bg-green-50" : "bg-orange-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {feedback.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-orange-500" />
                  )}
                  <span className={`font-semibold ${feedback.correct ? "text-green-700" : "text-orange-700"}`}>
                    {feedback.correct ? "正确！" : "再试试"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{feedback.feedback}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex justify-end gap-3">
              {!feedback && currentTask.type === "discrimination" && (
                <Button
                  onClick={submit}
                  disabled={!selected || submitting}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  提交
                </Button>
              )}
              {feedback && !isLast && (
                <Button onClick={nextTask} className="bg-gradient-to-r from-red-500 to-orange-500">
                  下一题 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
