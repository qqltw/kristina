/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  MapPin,
  CheckSquare,
  Download,
  ExternalLink,
  AlertTriangle,
  Info,
  RefreshCw,
  Globe,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Palette,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Violation {
  code: string;
  risk: string;
  description: string;
  fix: string;
}

interface SeoIssue {
  element: string;
  status: string;
  description: string;
  fix: string;
}

interface GeoIssue {
  name: string;
  status: string;
  description: string;
  fix: string;
}

interface ChecklistItem {
  step: string;
  title: string;
  action: string;
}

interface AuditData {
  score: number;
  summary: string;
  violationsFZ152: Violation[];
  seoIssues: SeoIssue[];
  geoIssues: GeoIssue[];
  checklist: ChecklistItem[];
  asset_info?: {
    type: "website" | "instagram" | "vk" | "telegram";
    url: string;
    audit_date: string;
  };
}

interface ResponsePayload {
  success: boolean;
  fallback: boolean;
  data: AuditData;
  html: string;
  pdfBase64: string | null;
  filename: string;
}

const loadingTexts = [
  "Подключаемся к сайту и проверяем формы по ФЗ-152...",
  "Сканируем мета-теги и структуру заголовков SEO...",
  "Анализируем GEO-привязку и локальные маркеры...",
  "ИИ формирует финальный PDF-отчет..."
];

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [result, setResult] = useState<ResponsePayload | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "fz152" | "seo" | "geo" | "checklist">("overview");
  
  // Social input integration states
  const [vkEnabled, setVkEnabled] = useState(false);
  const [tgEnabled, setTgEnabled] = useState(false);
  const [instEnabled, setInstEnabled] = useState(false);
  const [vkUrl, setVkUrl] = useState("");
  const [tgUrl, setTgUrl] = useState("");
  const [instUrl, setInstUrl] = useState("");

  // Programmer checklist completed steps tracking
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const isSocial = !!(result?.data?.asset_info?.type && result?.data?.asset_info?.type !== "website");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setStatusIndex((prev) => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const startAudit = async (targetUrl: string) => {
    if (!targetUrl) {
      setError("Пожалуйста, введите корректный URL-адрес.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: targetUrl,
          vkUrl: vkEnabled ? vkUrl : "",
          tgUrl: tgEnabled ? tgUrl : "",
          instUrl: instEnabled ? instUrl : ""
        })
      });

      if (!response.ok) {
        throw new Error(`Произошла ошибка при обработке: ${response.statusText}`);
      }

      const payload: ResponsePayload = await response.json();
      if (payload.success) {
        setResult(payload);
        // If headless PDF generated successfully, download it automatically
        if (payload.pdfBase64) {
          triggerDownload(payload.pdfBase64, payload.filename);
        }
      } else {
        throw new Error("Не удалось получить корректный отчет аудита.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Не удалось загрузить аудит. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    startAudit(url);
  };

  const triggerDownload = (base64: string, filename: string) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Ошибка при сборке бинарного PDF:", err);
    }
  };

  const printReport = () => {
    if (!result?.html) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(result.html);
      printWindow.document.close();
      // Wait for content references to load and hit print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  const toggleStep = (stepTitle: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepTitle]: !prev[stepTitle]
    }));
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col selection:bg-[#2c2a27]/10 text-[#2c2a27]">
      {/* Absolute background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#e8e4dc_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

      {/* Main Container */}
      <div className="relative flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 md:px-8 py-10 z-10">
        
        {/* Navigation / Brand Header */}
        <nav className="flex justify-between items-center mb-16 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2c2a27] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#fdfbf7] rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#2c2a27]">DonTech Audit</span>
          </div>
        </nav>

        {/* Floating Report Preview Decoration (Artistic Decor) */}
        {!result && !loading && (
          <div className="absolute right-[-40px] top-1/4 transform rotate-6 opacity-30 select-none pointer-events-none hidden xl:block">
            <div className="w-[280px] h-[360px] glass-card rounded-xl p-6">
              <div className="w-full h-4 bg-[#fdfbf7] rounded mb-4"></div>
              <div className="w-2/3 h-2 bg-[#fdfbf7] rounded mb-8"></div>
              <div className="space-y-3">
                <div className="w-full h-20 border border-[#e8e4dc] rounded bg-[#fdfbf7]/50"></div>
                <div className="w-full h-20 border border-[#e8e4dc] rounded bg-[#fdfbf7]/50"></div>
              </div>
            </div>
          </div>
        )}

        {/* Content Toggle between Submit Search & Result Dashboard */}
        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!result && !loading ? (
              /* INPUT FORM HOME VIEW */
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl w-full mx-auto text-center relative"
              >
                <div className="mb-6 inline-flex p-2 rounded-2xl bg-white border border-[#e8e4dc]/60 shadow-sm text-xs font-semibold text-[#706b64] gap-2 items-center">
                  <ShieldCheck className="w-4 h-4 text-[#2c2a27]" />
                  Автономная ИИ-система Manus от DonTech
                </div>

                <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-[1.1] text-[#2c2a27]">
                  Технико-юридический аудит<br />
                  <span className="text-[#706b64]">на базе искусственного интеллекта Manus.</span>
                </h1>

                <p className="text-base text-[#706b64] max-w-lg mx-auto mb-10 leading-relaxed font-normal">
                  Полностью автономный анализ веб-платформы на соответствие требованиям ФЗ-152, стандартов SEO Яндекс/Google и локальных факторов GEO. Готовый PDF-отчет за 30 секунд.
                </p>

                <form onSubmit={handleAudit} className="glass-card rounded-2xl p-2.5 flex flex-col md:flex-row gap-3 shadow-xl mb-6">
                  <div className="relative flex-1 flex items-center pl-4 bg-transparent">
                    <Globe className="w-5 h-5 text-[#706b64] mr-3" />
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent outline-none text-base font-normal placeholder-[#b0aba4] text-[#2c2a27]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-gradient px-8 py-4 rounded-xl font-medium text-sm cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
                  >
                    {vkEnabled || tgEnabled || instEnabled
                      ? "Проверить сайт и соцсети"
                      : url.toLowerCase().includes("vk.com")
                      ? "Проверить сообщество"
                      : url.toLowerCase().includes("t.me")
                      ? "Проверить канал"
                      : url.toLowerCase().includes("instagram.com")
                      ? "Проверить аккаунт"
                      : "Проверить сайт"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* "проверить еще" - Social Platforms Quick Links / Additional Inputs */}
                <div className="mb-8 text-center">
                  <span className="text-xs font-semibold text-[#8a8379] uppercase tracking-widest block mb-3">
                    проверить еще
                  </span>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVkEnabled((prev) => !prev)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-sm active:scale-95 border ${
                        vkEnabled
                          ? "bg-[#4a76a8] text-white border-[#4a76a8]"
                          : "bg-white text-[#4a76a8] border-[#e8e4dc] hover:bg-[#4a76a8]/5"
                      }`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M15.011 2h-6.022C4.945 2 2 4.945 2 8.989v6.022C2 19.055 4.945 22 8.989 22h6.022c4.044 0 7.034-2.945 7.034-6.989V8.989C22.045 4.945 19.055 2 15.011 2zm2.96 11.838c.677.653 1.408 1.241 2.023 1.956.402.468.75.986.993 1.564.249.59.037 1.157-.468 1.189l-2.969.006c-.845-.008-1.5-.39-2.008-.985-.386-.454-.73-.941-1.096-1.411-.225-.29-.44-.582-.71-.818-.28-.242-.519-.17-.674.135-.164.32-.232.673-.257 1.026-.06.84-.716 1.066-1.42 1.054a7.19 7.19 0 01-4.88-2.607c-1.393-1.611-2.404-3.486-3.321-5.433-.186-.395-.035-.745.385-.75h3l.006.002c.314.015.54.148.653.468.53 1.488 1.218 2.89 2.146 4.144.184.249.37.493.633.642.23.13.415.05.514-.2.179-.447.234-.917.253-1.394.025-.63-.092-1.246-.425-1.787-.205-.333-.53-.481-.884-.576a.185.185 0 01-.061-.314c.23-.332.559-.49.967-.492h2.247c.54.041.748.334.808.877v2.967c-.015.344.089.691.311.905.148.143.324.086.416-.017.653-.73 1.168-1.545 1.62-2.4C17.729 9.38 18 8.65 18 .16c.365.053.484.281.56.51.135.408.283.81.423 1.218z" />
                      </svg>
                      VKontakte
                    </button>
                    <button
                      type="button"
                      onClick={() => setTgEnabled((prev) => !prev)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-sm active:scale-95 border ${
                        tgEnabled
                          ? "bg-[#0088cc] text-white border-[#0088cc]"
                          : "bg-white text-[#0088cc] border-[#e8e4dc] hover:bg-[#0088cc]/5"
                      }`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.65-.52.36-.97.53-1.33.52-.4-.01-1.18-.23-1.75-.41-.7-.23-1.26-.35-1.21-.74.03-.2.28-.41.77-.63 3.03-1.32 5.05-2.19 6.07-2.61 2.89-1.18 3.49-1.39 3.88-1.39.09 0 .28.02.4.12.1.09.13.21.14.31-.01.07-.01.14-.02.2z" />
                      </svg>
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstEnabled((prev) => !prev)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-sm active:scale-95 border ${
                        instEnabled
                          ? "bg-[#e1306c] text-white border-[#e1306c]"
                          : "bg-white text-[#e1306c] border-[#e8e4dc] hover:bg-[#e1306c]/5"
                      }`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                      Instagram
                    </button>
                  </div>
                </div>

                {/* Additional Slideout Inputs */}
                <AnimatePresence>
                  {(vkEnabled || tgEnabled || instEnabled) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-8 max-w-xl mx-auto space-y-3.5 text-left"
                    >
                      <span className="text-xs font-bold text-[#8a8379] tracking-wider uppercase block mb-1">
                        Ссылки на соцсети для совместного аудита
                      </span>

                      {vkEnabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 bg-white border border-[#e8e4dc] p-3.5 rounded-xl shadow-xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#4a76a8]/10 text-[#4a76a8] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M15.011 2h-6.022C4.945 2 2 4.945 2 8.989v6.022C2 19.055 4.945 22 8.989 22h6.022c4.044 0 7.034-2.945 7.034-6.989V8.989C22.045 4.945 19.055 2 15.011 2zm2.96 11.838c.677.653 1.408 1.241 2.023 1.956.402.468.75.986.993 1.564.249.59.037 1.157-.468 1.189l-2.969.006c-.845-.008-1.5-.39-2.008-.985-.386-.454-.73-.941-1.096-1.411-.225-.29-.44-.582-.71-.818-.28-.242-.519-.17-.674.135-.164.32-.232.673-.257 1.026-.06.84-.716 1.066-1.42 1.054a7.19 7.19 0 01-4.88-2.607c-1.393-1.611-2.404-3.486-3.321-5.433-.186-.395-.035-.745.385-.75h3l.006.002c.314.015.54.148.653.468.53 1.488 1.218 2.89 2.146 4.144.184.249.37.493.633.642.23.13.415.05.514-.2.179-.447.234-.917.253-1.394.025-.63-.092-1.246-.425-1.787-.205-.333-.53-.481-.884-.576a.185.185 0 01-.061-.314c.23-.332.559-.49.967-.492h2.247c.54.041.748.334.808.877v2.967c-.015.344.089.691.311.905.148.143.324.086.416-.017.653-.73 1.168-1.545 1.62-2.4C17.729 9.38 18 8.65 18 .16c.365.053.484.281.56.51.135.408.283.81.423 1.218z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Ссылка на ВКонтакте (например: https://vk.com/group)"
                            value={vkUrl}
                            onChange={(e) => setVkUrl(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-[#2c2a27] placeholder-[#b0aba4]"
                          />
                        </motion.div>
                      )}

                      {tgEnabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 bg-white border border-[#e8e4dc] p-3.5 rounded-xl shadow-xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.65-.52.36-.97.53-1.33.52-.4-.01-1.18-.23-1.75-.41-.7-.23-1.26-.35-1.21-.74.03-.2.28-.41.77-.63 3.03-1.32 5.05-2.19 6.07-2.61 2.89-1.18 3.49-1.39 3.88-1.39.09 0 .28.02.4.12.1.09.13.21.14.31-.01.07-.01.14-.02.2z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Ссылка на Telegram-канал (например: https://t.me/channel)"
                            value={tgUrl}
                            onChange={(e) => setTgUrl(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-[#2c2a27] placeholder-[#b0aba4]"
                          />
                        </motion.div>
                      )}

                      {instEnabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 bg-white border border-[#e8e4dc] p-3.5 rounded-xl shadow-xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#e1306c]/10 text-[#e1306c] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Ссылка на Instagram (например: https://instagram.com/profile)"
                            value={instUrl}
                            onChange={(e) => setInstUrl(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-[#2c2a27] placeholder-[#b0aba4]"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 text-xs font-semibold mt-2 mb-6 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    {error}
                  </motion.p>
                )}

                {/* Aesthetic Apple features display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
                  <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] text-left shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-4 border border-red-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2c2a27] mb-1">ФЗ-152 Парсинг</h3>
                    <p className="text-xs text-[#706b64] leading-relaxed">
                      Глубокий разбор форм, Политику, куки согласий, чекбоксы и критичность штрафов до 150 000 руб.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] text-left shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-100">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2c2a27] mb-1">SEO Санитария</h3>
                    <p className="text-xs text-[#706b64] leading-relaxed">
                      Диагностика структуры H1-H6, описания Description, тегов Alt и Open Graph разметки.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] text-left shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2c2a27] mb-1">GEO Локация</h3>
                    <p className="text-xs text-[#706b64] leading-relaxed">
                      Проверка микроразметки Schema LocalBusiness, встройки Яндекс/2ГИС Карт и региональных номеров.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : loading ? (
              /* DYNAMIC PROGRESS LOADER VIEW (Artistic Flair Layout) */
              <motion.div
                key="loading-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-xl w-full mx-auto text-center"
              >
                <div className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 animate-pulse"></div>

                  {/* Simulated Triple Dot Step indicator in Artistic style */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex space-x-1.5">
                        <div className={`w-2 h-2 rounded-full bg-[#2c2a27] transition-all duration-300 ${statusIndex >= 0 ? "scale-110 opacity-100" : "opacity-30"}`}></div>
                        <div className={`w-2 h-2 rounded-full bg-[#2c2a27] transition-all duration-300 ${statusIndex >= 1 ? "scale-110 opacity-100" : "opacity-30"}`}></div>
                        <div className={`w-2 h-2 rounded-full bg-[#2c2a27] transition-all duration-300 ${statusIndex >= 2 ? "scale-110 opacity-100" : "opacity-30"}`}></div>
                        <div className={`w-2 h-2 rounded-full bg-[#2c2a27] transition-all duration-300 ${statusIndex >= 3 ? "scale-110 opacity-100" : "opacity-30"}`}></div>
                      </div>
                      <span className="text-sm font-medium animate-pulse text-[#2c2a27]">{loadingTexts[statusIndex]}</span>
                    </div>

                    {/* Styled Underline loader */}
                    <div className="w-full h-[2px] bg-[#e8e4dc] relative my-6">
                      <div
                        className="absolute left-0 top-0 h-full bg-[#2c2a27] transition-all duration-1000"
                        style={{
                          width: `${
                            statusIndex === 0
                              ? "25%"
                              : statusIndex === 1
                              ? "50%"
                              : statusIndex === 2
                              ? "75%"
                              : "95%"
                          }`
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between w-full mt-2 text-[10px] uppercase tracking-widest font-semibold flex-wrap gap-2 text-left">
                      <span className={statusIndex >= 0 ? "text-[#2c2a27] font-bold" : "text-[#b0aba4]"}>Сканирование</span>
                      <span className={statusIndex >= 1 ? "text-[#2c2a27] font-bold" : "text-[#b0aba4]"}>Анализ ФЗ-152</span>
                      <span className={statusIndex >= 2 ? "text-[#2c2a27] font-bold" : "text-[#b0aba4]"}>GEO-маркеры</span>
                      <span className={statusIndex >= 3 ? "text-[#2c2a27] font-bold" : "text-[#b0aba4]"}>Генерация PDF</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#706b64] mt-8 pt-4 border-t border-[#f3efe6] font-semibold">
                    <span>Подключение к {url}</span>
                    <span>Режим: ИИ Manus Pro</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* AUDIT RESULT DASHBOARD */
              <motion.div
                key="result-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-8 pb-16"
              >
                {/* Result Top Action Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#e8e4dc] pb-6 no-print">
                  <div>
                    <span className="text-xs font-bold text-[#706b64] uppercase tracking-widest p-1">Результаты сканирования</span>
                    <h2 className="text-2xl font-black text-[#2c2a27] mt-1 flex items-center gap-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-[#706b64]">{url}</span>
                      <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="referrer noopener" className="text-[#706b64] hover:text-[#2c2a27]">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </h2>
                  </div>

                  {/* Export Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setResult(null);
                        setCompletedSteps({});
                      }}
                      className="border border-[#e8e4dc] bg-white hover:bg-[#fcfbf9] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Новая проверка
                    </button>
                    {result?.pdfBase64 ? (
                      <button
                        onClick={() => triggerDownload(result.pdfBase64!, result.filename)}
                        className="bg-[#2c2a27] hover:bg-black text-[#fdfbf7] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Скачать PDF
                      </button>
                    ) : null}
                    <button
                      onClick={printReport}
                      className="bg-white border border-[#e8e4dc] text-[#2c2a27] hover:bg-neutral-50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Печать отчета
                    </button>
                  </div>
                </div>

                {/* Score Summary Banner */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Gauge score */}
                  <div className="md:col-span-1 bg-white border border-[#e8e4dc] rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#706b64] mb-3">{isSocial ? "Оценка ресурса" : "Оценка сайта"}</span>
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                      {/* Circle Background tracker */}
                      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#f3efe6" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={result!.data.score >= 75 ? "#10b981" : result!.data.score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - result!.data.score / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-4xl font-black text-[#2c2a27] tracking-tight">{result!.data.score}</span>
                        <span className="text-xs text-[#706b64] block font-semibold mt-0.5">из 100</span>
                      </div>
                    </div>
                    <p className={`text-xs font-bold mt-4 px-3 py-1 rounded-full ${
                      result!.data.score >= 75 
                        ? "bg-emerald-50 text-emerald-700" 
                        : result!.data.score >= 50 
                        ? "bg-amber-50 text-amber-700" 
                        : "bg-red-50 text-red-700"
                    }`}>
                      {result!.data.score >= 75 ? "Характеристики высокие" : result!.data.score >= 50 ? "Оценка удовлетворительная" : "Требуются критические правки"}
                    </p>
                  </div>

                  {/* Executive summary statement */}
                  <div className="md:col-span-3 bg-white border border-[#e8e4dc] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-[#2c2a27]" />
                        <h3 className="text-base font-bold text-[#2c2a27]">Анализ ИИ-аудитора Manus (DonTech)</h3>
                      </div>
                      <p className="text-sm text-[#4a4641] leading-relaxed font-normal">
                        {result!.data.summary}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 border-t border-[#f3efe6] pt-4 text-xs font-semibold text-[#706b64]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        {isSocial ? "Оформление" : "Критические ошибки"}: {result!.data.violationsFZ152.length}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        {isSocial ? "Контент" : "SEO Предупреждения"}: {result!.data.seoIssues.filter(s => s.status !== "Норма").length}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        {isSocial ? "Виральность" : "GEO Доработки"}: {result!.data.geoIssues.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Tabs & Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Left Navigation Rails */}
                  <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 no-print">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 cursor-pointer ${
                        activeTab === "overview"
                          ? "bg-[#2c2a27] text-white"
                          : "bg-white border border-[#e8e4dc] text-[#706b64] hover:text-[#2c2a27]"
                      }`}
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      Сводка отчета
                    </button>
                    <button
                      onClick={() => setActiveTab("fz152")}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 cursor-pointer ${
                        activeTab === "fz152"
                          ? "bg-[#2c2a27] text-white"
                          : "bg-white border border-[#e8e4dc] text-[#706b64] hover:text-[#2c2a27]"
                      }`}
                    >
                      {isSocial ? (
                        <Palette className="w-4 h-4 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                      )}
                      {isSocial ? "Оформление" : "Нарушения ФЗ-152"} ({result!.data.violationsFZ152.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("seo")}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 cursor-pointer ${
                        activeTab === "seo"
                          ? "bg-[#2c2a27] text-white"
                          : "bg-white border border-[#e8e4dc] text-[#706b64] hover:text-[#2c2a27]"
                      }`}
                    >
                      {isSocial ? (
                        <FileText className="w-4 h-4 shrink-0" />
                      ) : (
                        <Search className="w-4 h-4 shrink-0" />
                      )}
                      {isSocial ? "Контент" : "Показатели SEO"} ({result!.data.seoIssues.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("geo")}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 cursor-pointer ${
                        activeTab === "geo"
                          ? "bg-[#2c2a27] text-white"
                          : "bg-white border border-[#e8e4dc] text-[#706b64] hover:text-[#2c2a27]"
                      }`}
                    >
                      {isSocial ? (
                        <Sparkles className="w-4 h-4 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 shrink-0" />
                      )}
                      {isSocial ? "Виральность" : "GEO Локация"} ({result!.data.geoIssues.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("checklist")}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 cursor-pointer ${
                        activeTab === "checklist"
                          ? "bg-[#2c2a27] text-white"
                          : "bg-white border border-[#e8e4dc] text-[#706b64] hover:text-[#2c2a27]"
                      }`}
                    >
                      <CheckSquare className="w-4 h-4 shrink-0" />
                      Чек-лист разработчика ({result!.data.checklist.length})
                    </button>
                  </div>

                  {/* Tab Contents Panel */}
                  <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                      {activeTab === "overview" && (
                        <motion.div
                          key="tab-overview"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex flex-col gap-6"
                        >
                          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-base font-bold text-[#2c2a27] mb-4">Основные инсайты проверки</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl">
                                <span className="text-[11px] font-bold text-[#706b64] uppercase tracking-wider block mb-1">{isSocial ? "Дизайн и репутация" : "Срочные меры"}</span>
                                <p className="text-xs text-[#4a4641] leading-relaxed">
                                  {isSocial ? "Оптимальное визуальное оформление и УТП снижают процент отказов и обеспечивают стремительный рост конверсии в подписку." : "Требуется немедленно согласовать формы согласно ФЗ-152, чтобы исключить риски блокировки ресурса и судебных претензий."}
                                </p>
                              </div>
                              <div className="p-4 bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl">
                                <span className="text-[11px] font-bold text-[#706b64] uppercase tracking-wider block mb-1">Фокус оптимизации</span>
                                <p className="text-xs text-[#4a4641] leading-relaxed">
                                  {isSocial ? "Качественная проработка регулярного контента и внедрение виральных механик вовлечения вызовут органический приток новых клиентов." : "SEO и иерархия заголовков H1-H3 на главной странице снижают шансы войти в топ без дополнительных расходов на контекстную рекламу."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Quick checklist teaser */}
                          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-base font-bold text-[#2c2a27] mb-3">{isSocial ? "Основные зоны улучшения" : "Состояние юридических рисков"}</h3>
                            <div className="space-y-3.5 mt-2">
                              {result!.data.violationsFZ152.map((viol, index) => (
                                <div key={index} className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <span className="text-xs font-bold text-[#2c2a27]">{viol.code}</span>
                                    <span className="text-xs text-[#706b64] font-medium hidden md:inline">{viol.description.substring(0, 60)}...</span>
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                    {viol.risk}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "fz152" && (
                        <motion.div
                          key="tab-fz152"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className={`p-5 rounded-2xl flex items-start gap-4 ${
                            isSocial 
                              ? "bg-[#faf8f5] border border-[#e8e4dc] text-[#2c2a27]" 
                              : "bg-red-50 border border-red-100 text-red-800"
                          }`}>
                            {isSocial ? (
                              <Palette className="w-5 h-5 shrink-0 mt-0.5 text-[#706b64]" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h4 className="text-sm font-bold">
                                {isSocial ? "Эстетика и структура коммерческого профиля" : "Опасность штрафов Роскомнадзора"}
                              </h4>
                              <p className={`text-xs leading-relaxed mt-1 ${isSocial ? "text-[#706b64]" : "text-red-700/95"}`}>
                                {isSocial 
                                  ? "Внешнее оформление вашей коммерческой страницы, Bio и мультиссылок — это первое, что видит потенциальный клиент. Избыток визуального шума, плохая навигация или сокрытие юр. реквизитов ведут к упущению горячих продаж." 
                                  : "На текущий момент штрафы для юридических лиц за отсутствие согласий или некорректно оформленные политики обработки составляют до 150 000 руб за каждый повторный инцидент. Рекомендуется закрыть требования по ФЗ-152 в приоритетном порядке."}
                              </p>
                            </div>
                          </div>

                          {result!.data.violationsFZ152.map((v, i) => (
                            <div key={i} className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between border-b border-[#f3efe6] pb-3 mb-4">
                                <span className="text-xs font-bold text-[#706b64] tracking-wider uppercase">{v.code || "ДИЗАЙН"}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                  v.risk === "Критический" || v.risk === "critical" || v.risk === "high"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                }`}>
                                  {v.risk === "Критический" || v.risk === "critical" || v.risk === "high" ? "Критический" : "Умеренный"} Риск
                                </span>
                              </div>
                              <p className="text-sm font-medium text-[#2c2a27] mb-4">{v.description}</p>
                              
                              <div className="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#706b64] mb-2.5">
                                  {isSocial ? "Инструкция по визуальному фиксу" : "Практический фикс для программиста"}
                                </div>
                                <pre className="text-xs font-mono text-[#4a4641] overflow-x-auto whitespace-pre-wrap selection:bg-[#2c2a27]/20 leading-relaxed">
                                  {v.fix}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "seo" && (
                        <motion.div
                          key="tab-seo"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {result!.data.seoIssues.map((item, i) => (
                            <div key={i} className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between border-b border-[#f3efe6] pb-3 mb-4">
                                <span className="text-xs font-bold text-[#706b64] tracking-wider uppercase">{item.element || "КОНТЕНТ"}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                  item.status === "Критично" || item.status === "critical" || item.status === "high"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : item.status === "Предупреждение" || item.status === "warning"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}>
                                  {item.status === "Критично" || item.status === "critical" || item.status === "high"
                                    ? "Критично"
                                    : item.status === "Предупреждение" || item.status === "warning"
                                    ? "Предупреждение"
                                    : "Оптимально"}
                                </span>
                              </div>
                              <p className="text-sm text-[#4a4641] mb-4">{item.description}</p>

                              <div className="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#706b64] mb-2">
                                  {isSocial ? "Рекомендации по улучшению контента" : "Метод решения"}
                                </div>
                                <pre className="text-xs font-mono text-[#4a4641] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                  {item.fix}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "geo" && (
                        <motion.div
                          key="tab-geo"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {result!.data.geoIssues.map((geo, i) => (
                            <div key={i} className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between border-b border-[#f3efe6] pb-3 mb-4">
                                <span className="text-xs font-bold text-[#706b64] tracking-wider uppercase">{geo.name || "ВИРАЛЬНОСТЬ"}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                  geo.status === "Критично" || geo.status === "critical" || geo.status === "high"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : "bg-teal-50 text-teal-700 border border-teal-100"
                                }`}>
                                  {geo.status === "Критично" || geo.status === "critical" || geo.status === "high" ? "Критично" : "Оптимально"}
                                </span>
                              </div>
                              <p className="text-sm text-[#4a4641] mb-4">{geo.description}</p>

                              <div className="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#706b64] mb-2">
                                  {isSocial ? "Внедрение вирусного охвата" : "Действие"}
                                </div>
                                <pre className="text-xs font-mono text-[#4a4641] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                  {geo.fix}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "checklist" && (
                        <motion.div
                          key="tab-checklist"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm"
                        >
                          <h3 className="text-base font-bold text-[#2c2a27] mb-2">
                            {isSocial ? "Дорожная карта улучшений" : "Дорожная карта программиста"}
                          </h3>
                          <p className="text-xs text-[#706b64] mb-6">
                            {isSocial 
                              ? "Отмечайте решенные задачи по оформлению, регулярному контенту и механикам виральности." 
                              : "Отмечайте решенные задачи и закройте все уязвимости на веб-платформе последовательно."}
                          </p>
                          
                          <div className="divide-y divide-[#f3efe6]">
                            {result!.data.checklist.map((step, i) => {
                              const isChecked = completedSteps[step.title] || false;
                              return (
                                <div
                                  key={i}
                                  onClick={() => toggleStep(step.title)}
                                  className="flex items-start gap-4 py-4 cursor-pointer hover:bg-neutral-50/50 px-2 transition-colors duration-150 rounded-lg"
                                >
                                  <div className="mt-0.5 shrink-0">
                                    <div className={`w-5 h-5 rounded border ${
                                      isChecked 
                                        ? "bg-[#2c2a27] border-[#2c2a27] text-white flex items-center justify-center animate-scale-up" 
                                        : "border-[#e8e4dc] bg-white text-transparent"
                                    }`}>
                                      {isChecked ? "✔" : ""}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-[#706b64] tracking-widest uppercase">{step.step}</span>
                                      {isChecked && (
                                        <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded">
                                          Выполнено
                                        </span>
                                      )}
                                    </div>
                                    <h4 className={`text-sm font-bold mt-0.5 ${isChecked ? "line-through text-[#706b64]" : "text-[#2c2a27]"}`}>
                                      {step.title}
                                    </h4>
                                    <p className="text-xs text-[#706b64] mt-1.5 leading-relaxed font-normal">
                                      {step.action}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Brand Footer */}
        <footer className="mt-25 border-t border-[#e8e4dc] pt-10 flex flex-col md:flex-row justify-between items-start md:items-end no-print gap-8">
          <div className="flex flex-wrap gap-12 text-left">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#706b64] mb-1 font-bold">Статус системы</div>
              <div className="text-sm font-medium flex items-center gap-2 text-[#2c2a27]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Все узлы активны
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#706b64] mb-1 font-bold">Аудитов сегодня</div>
              <div className="text-sm font-medium text-[#2c2a27]">1,429 проверок</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#706b64] mb-1 font-bold">Регион соответствия</div>
              <div className="text-sm font-medium text-[#2c2a27]">РФ и СНГ (RU-CERT)</div>
            </div>
          </div>
          <div className="text-[11px] text-[#b0aba4] tracking-wide mt-4 md:mt-0 font-medium">
            &copy; {new Date().getFullYear()} DONTECH AUDIT SYSTEM. ALL RIGHTS RESERVED.
          </div>
        </footer>
      </div>
    </div>
  );
}
