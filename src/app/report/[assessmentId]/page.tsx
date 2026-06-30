"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Share2, Zap } from "lucide-react";
import type { AssessmentReport } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const option = {
    series: [{
      type: "gauge",
      startAngle: 200,
      endAngle: -20,
      center: ["50%", "60%"],
      radius: "90%",
      min: 0, max: 100,
      axisLine: { lineStyle: { width: 12, color: [[value / 100, color], [1, "#eee"]] } },
      pointer: { length: "60%", width: 6, itemStyle: { color: color } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { valueAnimation: true, fontSize: 28, fontWeight: "bold", color: "#333", offsetCenter: [0, "55%"] },
      data: [{ value, name: label }],
    }],
  };
  return <ReactECharts option={option} style={{ height: 180 }} />;
}

export default function ReportPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const router = useRouter();
  const [report, setReport] = useState<AssessmentReport | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/${assessmentId}/report`)
      .then((r) => r.json())
      .then(setReport);
  }, [assessmentId]);

  const generatePractice = async () => {
    const res = await fetch("/api/practice/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
    const { practice_id } = await res.json();
    router.push(`/practice/${practice_id}`);
  };

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  const toneHeatmapOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: report.report_data.tone_heatmap.map((t) => t.label) },
    yAxis: { type: "value", max: 100 },
    series: [{
      data: report.report_data.tone_heatmap.map((t) => t.score),
      type: "bar",
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#f97316" },
            { offset: 1, color: "#ef4444" },
          ],
        },
      },
    }],
    grid: { top: 10, bottom: 20, left: 30, right: 10 },
  };

  const phonemeOption = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: report.report_data.phoneme_timeline.map((p) => p.char),
      axisLabel: { fontSize: 16, fontWeight: "bold" },
    },
    yAxis: { type: "value", max: 100 },
    series: [{
      data: report.report_data.phoneme_timeline.map((p) => p.score),
      type: "bar",
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params: { value: number }) => {
          const v = params.value;
          if (v >= 90) return "#22c55e";
          if (v >= 75) return "#f59e0b";
          return "#ef4444";
        },
      },
    }],
    grid: { top: 10, bottom: 20, left: 30, right: 10 },
  };

  const scoreColor = report.overall_score >= 85 ? "text-green-500" : report.overall_score >= 70 ? "text-orange-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/questions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 flex-1">口语报告</h1>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Overall Score */}
        <Card className="border-2 border-red-100">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">综合评分</p>
            <p className={`text-6xl font-extrabold ${scoreColor}`}>{report.overall_score}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge className="bg-red-100 text-red-700 border-0">{report.hsk_estimate}</Badge>
              <Badge variant="outline">CEFR {report.cefr_estimate}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Score Gauges */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <ScoreGauge value={report.pronunciation_score} label="发音" color="#ef4444" />
              <p className="text-center text-sm font-medium text-gray-700">发音</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <ScoreGauge value={report.tone_score} label="声调" color="#f97316" />
              <p className="text-center text-sm font-medium text-gray-700">声调</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <ScoreGauge value={report.fluency_score} label="流利" color="#8b5cf6" />
              <p className="text-center text-sm font-medium text-gray-700">流利度</p>
            </CardContent>
          </Card>
        </div>

        {/* Tone Heatmap */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">声调分析</h3>
            <ReactECharts option={toneHeatmapOption} style={{ height: 200 }} />
          </CardContent>
        </Card>

        {/* Phoneme Timeline */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">逐字评分</h3>
            <ReactECharts option={phonemeOption} style={{ height: 200 }} />
          </CardContent>
        </Card>

        {/* Error Phonemes */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-3">发音问题</h3>
            <div className="space-y-2">
              {Object.entries(report.error_phonemes).map(([phoneme, info]) => (
                <div key={phoneme} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-mono text-lg font-bold text-gray-900">{phoneme}</span>
                    <span className="text-xs text-gray-400 ml-2">×{info.count} 处</span>
                  </div>
                  <Badge variant={info.score >= 70 ? "outline" : "destructive"}>
                    {info.score}分
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-900 mb-2">AI 点评</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{report.explanation}</p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          onClick={generatePractice}
          size="lg"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-lg py-6 rounded-2xl shadow-lg shadow-red-200"
        >
          <Zap className="w-5 h-5 mr-2" />
          开始针对性练习
        </Button>
      </main>
    </div>
  );
}
