"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Mic, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/types";

const HSK_LEVELS = [1, 2, 3, 4, 5];
const CATEGORIES = ["daily", "leisure", "business", "education", "culture", "comparison", "society"];
const CATEGORY_LABELS: Record<string, string> = {
  daily: "日常", leisure: "休闲", business: "商务", education: "教育",
  culture: "文化", comparison: "比较", society: "社会",
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filtered, setFiltered] = useState<Question[]>([]);
  const [hskLevel, setHskLevel] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (hskLevel) params.set("hsk", String(hskLevel));
    if (category) params.set("category", category);
    fetch(`/api/questions?${params.toString()}`)
      .then((r) => r.json())
      .then(setQuestions);
  }, [hskLevel, category]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(questions); return; }
    setFiltered(
      questions.filter(
        (q) =>
          q.text.includes(search) ||
          q.pinyin.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [questions, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">选择句子</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索句子或拼音…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-gray-200"
          />
        </div>

        {/* HSK Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge
            variant={hskLevel === null ? "default" : "outline"}
            className={`cursor-pointer ${hskLevel === null ? "bg-red-500 hover:bg-red-600" : "border-gray-300"}`}
            onClick={() => setHskLevel(null)}
          >
            全部
          </Badge>
          {HSK_LEVELS.map((l) => (
            <Badge
              key={l}
              variant={hskLevel === l ? "default" : "outline"}
              className={`cursor-pointer ${hskLevel === l ? "bg-red-500 hover:bg-red-600" : "border-gray-300"}`}
              onClick={() => setHskLevel(l)}
            >
              HSK {l}
            </Badge>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Badge
            variant={category === null ? "default" : "outline"}
            className={`cursor-pointer ${category === null ? "bg-orange-500 hover:bg-orange-600" : "border-gray-300"}`}
            onClick={() => setCategory(null)}
          >
            全部类别
          </Badge>
          {CATEGORIES.map((c) => (
            <Badge
              key={c}
              variant={category === c ? "default" : "outline"}
              className={`cursor-pointer ${category === c ? "bg-orange-500 hover:bg-orange-600" : "border-gray-300"}`}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </Badge>
          ))}
        </div>

        {/* Question List */}
        <div className="space-y-3">
          {(search ? filtered : questions).map((q) => (
            <Link key={q.id} href={`/record/${q.id}`}>
              <Card className="hover:shadow-md hover:border-red-200 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 mb-1">{q.text}</p>
                    <p className="text-sm text-gray-400 mb-1">{q.pinyin}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">HSK {q.hsk_level}</Badge>
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[q.category] || q.category}</Badge>
                      <span className="text-xs text-gray-400">{q.syllable_count} 音节</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!search && questions.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>加载题目中…</p>
          </div>
        )}
      </main>
    </div>
  );
}
