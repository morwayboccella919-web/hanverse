"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, Star, Zap, Crown } from "lucide-react";

const PACKAGES = [
  { id: "single", name: "单次评分", credits: 1, price: "¥6", popular: false, icon: Zap, gradient: "from-gray-500 to-gray-400" },
  { id: "5pack", name: "5次装", credits: 5, price: "¥25", savings: "省 ¥5", popular: true, icon: Sparkles, gradient: "from-red-500 to-orange-500" },
  { id: "10pack", name: "10次装", credits: 10, price: "¥45", savings: "省 ¥15", popular: false, icon: Star, gradient: "from-orange-500 to-yellow-500" },
  { id: "30pack", name: "30次装", credits: 30, price: "¥120", savings: "省 ¥60", popular: false, icon: Crown, gradient: "from-purple-500 to-pink-500" },
  { id: "100pack", name: "100次装", credits: 100, price: "¥350", savings: "省 ¥250", popular: false, icon: Crown, gradient: "from-blue-500 to-cyan-500" },
];

export default function PaymentPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: string) => {
    setLoading(pkg);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg }),
      });
      const { stripe_session_url } = await res.json();
      // Mock: show alert instead of redirecting to Stripe
      alert(`Mock Stripe Redirect:\n${stripe_session_url}\n\n积分会在支付后自动到账。`);
    } catch {
      alert("支付失败，请重试");
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">充值积分</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">解锁你的中文潜力</h2>
          <p className="text-gray-500">每次评分消耗 1 积分，选择适合你的套餐</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <Card
                key={pkg.id}
                className={`relative transition-all hover:shadow-lg ${
                  isPopular ? "border-2 border-red-400 shadow-md shadow-red-100 scale-[1.02]" : "border-gray-200"
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white border-0 px-3 py-1">
                    最受欢迎
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center shadow-lg`}>
                    <pkg.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mb-1">{pkg.price}</p>
                  <p className="text-sm text-gray-400 mb-1">{pkg.credits} 次评分</p>
                  {pkg.savings && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 mb-3">
                      {pkg.savings}
                    </Badge>
                  )}
                  {!pkg.savings && <div className="mb-3" />}
                  <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" />AI 发音评分</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" />声调 & 流利度分析</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" />详细报告 & 练习</li>
                  </ul>
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading === pkg.id}
                    className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white ${isPopular ? "py-6 text-lg" : ""}`}
                  >
                    {loading === pkg.id ? "处理中…" : "立即购买"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center text-sm text-gray-400">
          <p>积分永不过期 · 支持支付宝 / 微信 / Stripe</p>
        </div>
      </main>
    </div>
  );
}
