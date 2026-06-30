"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, BarChart3, Zap, TrendingUp, ArrowRight, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-red-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          HanVerse
        </span>
        <div className="flex gap-3">
          <Link href="/questions">
            <Button variant="ghost" className="text-gray-700">开始练习</Button>
          </Link>
          <Link href="/payment">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              充值
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-200 border-0 px-4 py-1.5 text-sm">
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          AI 驱动 · 即时反馈
        </Badge>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
          用AI给你的
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            {" "}中文口语{" "}
          </span>
          打分
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          录音一句话，AI 即刻分析你的发音、声调和流利度。
          <br />
          精准到每个音节，像母语者一样说中文。
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link href="/questions">
            <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-lg px-8 py-6 rounded-2xl shadow-lg shadow-red-200">
              <Mic className="w-5 h-5 mr-2" />
              免费体验
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/payment">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-2xl border-2">
              查看套餐
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: "50K+", label: "学习者", icon: TrendingUp },
            { value: "4.9", label: "App Store 评分", icon: Star },
            { value: "99.7%", label: "AI 准确率", icon: BarChart3 },
          ].map(({ value, label, icon: Icon }) => (
            <Card key={label} className="bg-white/70 backdrop-blur border-gray-100">
              <CardContent className="py-6">
                <Icon className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          三步提升口语
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "选择句子", desc: "按 HSK 等级浏览题库，挑选适合你的句子开始练习", icon: Mic },
            { step: "2", title: "录音朗读", desc: "用麦克风录制你的朗读，AI 实时分析每个音节的发音", icon: Zap },
            { step: "3", title: "查看报告", desc: "获取发音、声调、流利度三维评分 + 针对性练习推荐", icon: BarChart3 },
          ].map(({ step, title, desc, icon: Icon }) => (
            <Card key={step} className="bg-white border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-red-500" />
                </div>
                <div className="text-sm text-orange-500 font-semibold mb-2">Step {step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        HanVerse © 2024 · AI-powered Mandarin speaking practice
      </footer>
    </div>
  );
}
