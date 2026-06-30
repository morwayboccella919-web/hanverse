"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, Square, Play, Loader2 } from "lucide-react";
import type { Question } from "@/lib/types";

export default function RecordPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<"idle" | "recording" | "review" | "uploading">("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch(`/api/questions/${questionId}`)
      .then((r) => r.json())
      .then(setQuestion)
      .catch(() => setError("加载题目失败"));
  }, [questionId]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("review");
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setError("无法访问麦克风，请检查浏览器权限");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const upload = useCallback(async () => {
    if (!audioBlob || !question) return;
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("question_id", question.id);
      const res = await fetch("/api/assessments", { method: "POST", body: formData });
      const { assessment_id } = await res.json();
      router.push(`/waiting/${assessment_id}`);
    } catch {
      setError("上传失败，请重试");
      setStatus("review");
    }
  }, [audioBlob, question, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="mx-4 max-w-sm text-center">
          <CardContent className="py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/questions"><Button variant="outline">返回题库</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/questions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">朗读录音</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card className="mb-8 border-2 border-red-100 bg-white">
          <CardContent className="p-6 text-center">
            <Badge className="mb-3 bg-red-100 text-red-700 border-0">HSK {question.hsk_level}</Badge>
            <p className="text-2xl font-bold text-gray-900 mb-2">{question.text}</p>
            <p className="text-gray-400">{question.pinyin}</p>
          </CardContent>
        </Card>

        <div className="text-center">
          {status === "idle" && (
            <Button
              size="lg"
              onClick={startRecording}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-xl shadow-red-200"
            >
              <Mic className="w-12 h-12 text-white" />
            </Button>
          )}

          {status === "recording" && (
            <div>
              <div className="w-28 h-28 mx-auto rounded-full bg-red-500 animate-pulse flex items-center justify-center shadow-xl shadow-red-200">
                <Mic className="w-12 h-12 text-white" />
              </div>
              <p className="mt-4 text-red-500 font-semibold animate-pulse">录音中…</p>
              <Button
                size="lg"
                variant="outline"
                onClick={stopRecording}
                className="mt-4 rounded-full border-red-300 text-red-600"
              >
                <Square className="w-5 h-5 mr-2" />
                停止录音
              </Button>
            </div>
          )}

          {status === "review" && audioUrl && (
            <div className="space-y-6">
              <div className="w-28 h-28 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Play className="w-12 h-12 text-green-500" />
              </div>
              <audio controls src={audioUrl} className="mx-auto w-full max-w-sm" />
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setStatus("idle"); setAudioBlob(null); setAudioUrl(null); }}>
                  重新录制
                </Button>
                <Button
                  onClick={upload}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  上传评分
                </Button>
              </div>
            </div>
          )}

          {status === "uploading" && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-orange-400" />
              <p className="mt-4 text-gray-500">正在上传 & 分析中…</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
