import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useAppState } from "../store";
import {
  askLayoutAssistant,
  validatePlanDraft,
  type AssistantKind,
} from "../aiAssistant.functions";
import { normalizePlan } from "../normalizePlan";
import type { PlanData } from "../types";

interface ChatFile {
  id: string;
  name: string;
  kind: "text" | "image" | "pdf" | "docx";
  text?: string;
  imageDataUrl?: string;
  binaryBase64?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  fileNames?: string[];
  kind?: AssistantKind;
  questions?: string[];
  assumptions?: string[];
  plan?: PlanData;
  error?: boolean;
}

const STORAGE_KEY = "prostranstvo.assistant.history.v1";

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota errors */
  }
}

const STARTERS = [
  "Разбери текущий чертёж: где узкие места и что поправить?",
  "Как лучше поставить кассовые окна относительно входа?",
  "Спроектируй чертёж по требованиям из файла",
];

const TEXT_EXT = new Set(["txt", "md", "csv", "json", "xml", "svg", "log", "tsv"]);

function extension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function toChatFile(file: File): Promise<ChatFile> {
  const ext = extension(file.name);
  const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return { id, name: file.name, kind: "image", imageDataUrl: await readImage(file) };
  }
  if (ext === "pdf") {
    return { id, name: file.name, kind: "pdf", binaryBase64: await readBase64(file) };
  }
  if (ext === "docx") {
    return { id, name: file.name, kind: "docx", binaryBase64: await readBase64(file) };
  }
  if (TEXT_EXT.has(ext) || file.type.startsWith("text/")) {
    return { id, name: file.name, kind: "text", text: (await file.text()).slice(0, 20000) };
  }
  throw new Error(file.name);
}

function MarkdownText({ text }: { text: string }) {
  const html = useMemo(() => {
    let result = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    result = result.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>',
    );
    result = result.replace(
      /`(.+?)`/g,
      '<code class="rounded bg-slate-800 px-1 py-0.5 text-xs text-blue-200">$1</code>',
    );
    result = result.replace(/(?:^|\n)((?:[-•] .+(?:\n|$))+)/g, (_match, block: string) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^[-•] /, "")}</li>`)
        .join("");
      return `<ul class="list-disc pl-5 space-y-1 my-2">${items}</ul>`;
    });
    result = result.replace(/(?:^|\n)((?:\d+\. .+(?:\n|$))+)/g, (_match, block: string) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol class="list-decimal pl-5 space-y-1 my-2">${items}</ol>`;
    });
    result = result
      .split(/\n\n+/)
      .map((paragraph) => {
        if (paragraph.startsWith("<ul") || paragraph.startsWith("<ol")) return paragraph;
        return `<p class="my-1">${paragraph.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");
    return result;
  }, [text]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function PlanPreview({ plan }: { plan: PlanData }) {
  const padding = 6;
  const maxW = 220;
  const maxH = 140;
  const scale = Math.min(maxW / plan.room.width, maxH / plan.room.height);
  const width = plan.room.width * scale + padding * 2;
  const height = plan.room.height * scale + padding * 2;

  const zoneColors: Record<string, string> = {
    entrance: "#3b82f6",
    waiting: "#8b5cf6",
    service: "#f59e0b",
    storage: "#10b981",
    office: "#6366f1",
    technical: "#64748b",
    corridor: "#475569",
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto rounded-lg bg-[#0a0a0a]"
      role="img"
      aria-label={`Мини-превью чертежа «${plan.name}»`}
    >
      <rect
        x={padding}
        y={padding}
        width={plan.room.width * scale}
        height={plan.room.height * scale}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={1}
      />
      {plan.zones.map((zone) => {
        const points = zone.points
          .map((point) => `${padding + point.x * scale},${padding + point.y * scale}`)
          .join(" ");
        const color = zoneColors[zone.type] ?? "#475569";
        return (
          <polygon
            key={zone.id}
            points={points}
            fill={color}
            fillOpacity={0.25}
            stroke={color}
            strokeWidth={0.5}
          />
        );
      })}
      {plan.objects.map((obj) => (
        <rect
          key={obj.id}
          x={padding + obj.x * scale}
          y={padding + obj.y * scale}
          width={Math.max(1, obj.width * scale)}
          height={Math.max(1, obj.height * scale)}
          fill="#e2e8f0"
          fillOpacity={0.85}
          stroke="#94a3b8"
          strokeWidth={0.3}
          rx={0.5}
        />
      ))}
    </svg>
  );
}

export default function AIAssistant() {
  const { state, dispatch } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<ChatFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const contextInfo = useMemo(() => {
    const plan = state.currentPlan;
    if (!plan) return null;
    return {
      name: plan.name,
      width: plan.room.width,
      height: plan.room.height,
      objects: plan.objects.length,
      zones: plan.zones.length,
    };
  }, [state.currentPlan]);

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list).slice(0, 4 - files.length);
    const next: ChatFile[] = [];
    const rejected: string[] = [];
    for (const file of incoming) {
      if (file.size > 3_500_000) {
        rejected.push(`${file.name}: файл больше 3.5 МБ`);
        continue;
      }
      try {
        next.push(await toChatFile(file));
      } catch {
        rejected.push(`${file.name}: нужен TXT, CSV, JSON, MD, PDF, DOCX или изображение`);
      }
    }
    setFiles((current) => [...current, ...next].slice(0, 4));
    setNotice(rejected.join(" · "));
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (busy || (!content && files.length === 0)) return;
    const attached = files;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: content || "Посмотри приложенные файлы и, если данных хватает, собери чертёж.",
      fileNames: attached.map((file) => file.name),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setDraft("");
    setFiles([]);
    setNotice("");
    setBusy(true);
    try {
      const result = await askLayoutAssistant({
        turns: history.map((message) => ({
          role: message.role,
          text:
            message.role === "assistant" && message.plan
              ? `${message.text}\n[Уже предложен чертёж «${message.plan.name}», ${message.plan.room.width}×${message.plan.room.height} м, объектов: ${message.plan.objects.length}.]`
              : message.text,
        })),
        plan: state.currentPlan,
        files: attached.map((file) => ({
          name: file.name,
          text: file.text,
          imageDataUrl: file.imageDataUrl,
          binaryBase64: file.binaryBase64,
          binaryKind: file.kind === "pdf" || file.kind === "docx" ? file.kind : undefined,
        })),
      });
      if (!result.ok) {
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", text: result.error, error: true },
        ]);
        return;
      }
      const plan = result.kind === "plan" ? normalizePlan(result.plan) : undefined;
      const fallback =
        result.kind === "plan" && !plan
          ? "Собрать чертёж не получилось: не хватает размеров зала или состав оборудования неоднозначен. Напишите длину и ширину в метрах и что обязательно должно стоять в зале."
          : result.message;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: fallback,
          kind: plan ? "plan" : result.kind === "plan" ? "clarify" : result.kind,
          questions: plan ? [] : result.questions,
          assumptions: result.assumptions,
          plan: plan ?? undefined,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Не получилось связаться с ассистентом. Попробуйте ещё раз.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const applyPlan = (plan: PlanData) => {
    dispatch({ type: "SET_PLAN", payload: plan });
    dispatch({ type: "SET_TAB", payload: "editor" });
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#141414]">
      <div className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">ИИ-ассистент</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Спросите про открытый чертёж, попросите совет по расстановке или приложите требования —
              ассистент соберёт готовый план. Чужие темы он не разбирает.
            </p>
          </div>
          <button
            type="button"
            onClick={clearHistory}
            disabled={messages.length === 0 || busy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-40"
            title="Очистить историю и начать новый диалог"
          >
            <MessageSquarePlus size={14} />
            Новый диалог
          </button>
        </div>
        {contextInfo && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-1.5 text-xs text-slate-300">
            <Info size={12} className="text-blue-400" />
            <span>
              Чертёж «{contextInfo.name}» · {contextInfo.width}×{contextInfo.height} м · зон{" "}
              {contextInfo.zones} · объектов {contextInfo.objects}
            </span>
          </div>
        )}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-[#1e1e1e] p-5">
            <p className="text-sm text-slate-300">
              Перед новым чертежом ассистент спросит размеры зала и состав оборудования, если этого
              нет в сообщении или файлах.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-blue-500 hover:bg-white/5"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const kindStyle =
            message.role === "assistant" && !message.error
              ? message.kind === "refuse"
                ? "border-l-4 border-l-red-500"
                : message.kind === "clarify"
                  ? "border-l-4 border-l-amber-500"
                  : message.kind === "plan"
                    ? "border-l-4 border-l-emerald-500"
                    : ""
              : "";

          return (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${kindStyle} ${
                  message.role === "user"
                    ? "bg-[#0052CC] text-white"
                    : message.error
                      ? "border border-red-900 bg-red-950/40 text-red-100"
                      : "border border-slate-800 bg-[#1e1e1e] text-slate-100"
                }`}
              >
                {message.role === "assistant" && !message.error && message.kind && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                    {message.kind === "refuse" && (
                      <>
                        <AlertCircle size={12} className="text-red-400" />
                        <span>Вне темы</span>
                      </>
                    )}
                    {message.kind === "clarify" && (
                      <>
                        <Lightbulb size={12} className="text-amber-400" />
                        <span>Уточнение</span>
                      </>
                    )}
                    {message.kind === "plan" && (
                      <>
                        <Sparkles size={12} className="text-emerald-400" />
                        <span>Готовый чертёж</span>
                      </>
                    )}
                    {message.kind === "answer" && (
                      <>
                        <Info size={12} className="text-blue-400" />
                        <span>Ответ</span>
                      </>
                    )}
                  </div>
                )}

                <MarkdownText text={message.text} />

                {message.fileNames && message.fileNames.length > 0 && (
                  <p className="mt-2 text-xs opacity-80">{message.fileNames.join(", ")}</p>
                )}

                {message.assumptions && message.assumptions.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-2 text-xs text-slate-300">
                    {message.assumptions.map((item) => (
                      <li key={item}>Допущение: {item}</li>
                    ))}
                  </ul>
                )}

                {message.questions && message.questions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
                    {message.questions.map((question, index) => (
                      <div key={question} className="flex items-start gap-2">
                        <span className="shrink-0 text-xs text-amber-200">{index + 1}.</span>
                        <button
                          type="button"
                          onClick={() => setDraft(question)}
                          className="flex-1 rounded-lg border border-amber-900/50 bg-amber-950/20 px-2.5 py-1.5 text-left text-xs text-amber-100 transition-colors hover:bg-amber-950/40"
                          title="Подставить в поле ввода"
                        >
                          {question}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.plan && (
                  <div className="mt-3 rounded-xl border border-slate-700 bg-[#141414] p-3 text-slate-200">
                    <p className="font-medium text-white">{message.plan.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {message.plan.room.width}×{message.plan.room.height} м · зон{" "}
                      {message.plan.zones.length} · объектов {message.plan.objects.length}
                    </p>
                    <div className="mt-3">
                      <PlanPreview plan={message.plan} />
                    </div>
                    {(() => {
                      const validation = validatePlanDraft(message.plan);
                      if (validation.warnings.length === 0) return null;
                      return (
                        <div className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-100">
                          <p className="font-medium">Проверка плана:</p>
                          <ul className="mt-1 space-y-0.5">
                            {validation.warnings.slice(0, 5).map((warning) => (
                              <li key={warning}>• {warning}</li>
                            ))}
                            {validation.warnings.length > 5 && (
                              <li>…и ещё {validation.warnings.length - 5}</li>
                            )}
                          </ul>
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => applyPlan(message.plan!)}
                      className="mt-3 rounded-lg bg-[#0052CC] px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Открыть чертёж в редакторе
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Ассистент думает…
          </div>
        )}
      </div>

      <form
        className="border-t border-slate-800 bg-[#1a1a1a] px-4 py-3 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length > 0) void addFiles(event.dataTransfer.files);
        }}
      >
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <span
                key={file.id}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200"
              >
                <FileText size={12} />
                <span className="max-w-40 truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Убрать ${file.name}`}
                  onClick={() =>
                    setFiles((current) => current.filter((item) => item.id !== file.id))
                  }
                  className="text-slate-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {notice && <p className="mb-2 text-xs text-amber-300">{notice}</p>}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept=".txt,.md,.csv,.json,.xml,.svg,.pdf,.docx,.png,.jpg,.jpeg,.webp,.gif,text/plain,application/pdf"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= 4 || busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-200 hover:bg-white/5 disabled:opacity-40"
            aria-label="Приложить файл"
            title="Требования, перечень оборудования, PDF, DOCX или фото"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            placeholder="Вопрос по чертежу или просьба собрать план…"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-slate-700 bg-[#141414] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={busy || (!draft.trim() && files.length === 0)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0052CC] text-white hover:bg-blue-700 disabled:opacity-40"
            aria-label="Отправить"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}