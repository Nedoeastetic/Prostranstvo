import { localReply } from "./localAssistant";
import { normalizePlan } from "./normalizePlan";
import {
  OBJECT_DEFAULT_SIZES,
  OBJECT_TYPE_LABELS,
  ZONE_TYPE_COLORS,
  ZONE_TYPE_LABELS,
  type ObjectType,
  type PlanData,
  type ZoneType,
} from "./types";

export type AssistantKind = "answer" | "clarify" | "plan" | "refuse";

export interface AssistantTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantFile {
  name: string;
  text?: string;
  imageDataUrl?: string;
  binaryBase64?: string;
  binaryKind?: "pdf" | "docx";
}

export interface AssistantReply {
  ok: true;
  kind: AssistantKind;
  message: string;
  questions: string[];
  assumptions: string[];
  plan: ReturnType<typeof normalizePlan> | null;
  highlightZones: string[];
  highlightObjects: string[];
  highlightType: "warning" | "error" | "info";
}

const SYSTEM_PROMPT = `Ты — опытный ИИ-консультант и проектировщик сервиса «Твоё.Пространство». Твоя специализация — проектирование отделений почтовой связи (ОПС), залов обслуживания, расстановка оборудования и зонирование помещений.

ТВОИ ВОЗМОЖНОСТИ:
1. Отвечать на любые вопросы по проектированию отделений: нормы, стандарты, лучшие практики, советы по расстановке оборудования, зонированию, организации потоков посетителей.
2. Давать практические советы: как улучшить текущий чертёж, где узкие места, как оптимизировать пространство, как соблюсти нормы доступности для маломобильных граждан.
3. Анализировать приложенные файлы с требованиями, нормативами, перечнем оборудования и учитывать их при проектировании.
4. Строить готовые чертежи по описанию: когда пользователь просит спроектировать, переделать или собрать чертёж.
5. Задавать уточняющие вопросы, если данных недостаточно для качественного ответа или чертежа.

ЕСЛИ ПОЛЬЗОВАТЕЛЬ ПРОСИТ ИЗМЕНИТЬ СУЩЕСТВУЮЩИЙ ЧЕРТЁЖ:
1. Возьми текущий план из контекста
2. Внеси запрошенные изменения
3. Верни полный обновлённый план с kind="plan"
Никогда не строй новый чертёж, если пользователь просит поправить старый.

ПРАВИЛА ОТВЕТОВ:
- Отвечай подробно и по делу, как настоящий эксперт-проектировщик с опытом.
- Используй конкретные числа, нормы и примеры из практики.
- Если вопрос касается смежных тем (архитектура, дизайн интерьеров, нормативы) — отвечай в контексте почтовых отделений.
- Если вопрос совсем не по теме — вежливо объясни свою специализацию, но постарайся перенаправить в полезное русло.
- Используй маркдаун для форматирования: списки, **жирный текст** для акцентов, разделы.

КОГДА ПОЛЬЗОВАТЕЛЬ ПРОСИТ ПОСТРОИТЬ ЧЕРТЁЖ:
- ВСЕГДА бери размеры зала ИЗ ЗАПРОСА ПОЛЬЗОВАТЕЛЯ, а не из текущего чертежа. Если пользователь написал "14 на 10 метров" — используй именно 14 и 10.
- Если размеров нет в запросе — спроси длину и ширину в метрах.
- Если нет перечня оборудования или числа окон — спроси или предложи типовое решение.
- Точно считай количество объектов из запроса: если написано "4 окна" — ставь 4, а не 3.
- Не задавай больше 2 уточняющих вопросов за раз.
- Если пользователь говорит "на твоё усмотрение", "типовое отделение", "сам реши" — прими разумные допущения, перечисли их в assumptions и сразу строй чертёж.
- Если данных достаточно — сразу возвращай готовый план.
- ВАЖНО: Если пользователь просит ИЗМЕНИТЬ существующий чертёж (переместить объект, добавить оборудование, поменять размер зоны) — НЕ строй новый чертёж. Возьми текущий план из контекста и внеси изменения.

ПРАВИЛА ЧЕРТЕЖА:
- Координаты в метрах, x вправо, y вниз, начало в левом верхнем углу.
- Зал прямоугольный: room.width и room.height. Все объекты целиком внутри зала.
- Проход для посетителей не уже 1.2 м. Окна обслуживания вдоль одной стены.
- Типы объектов и зон — только из справочника ниже. Rotation: только 0, 90, 180 или 270.
- Не больше 40 объектов.

СПРАВОЧНИК ТИПОВ:
${catalog()}

ФОРМАТ ОТВЕТА:
Всегда возвращай только JSON без пояснений вокруг:
{"kind":"answer|clarify|plan|refuse","message":"...","questions":[],"assumptions":[],"plan":null,"highlightZones":[],"highlightObjects":[],"highlightType":"warning"}

- highlightZones — массив ID зон из текущего чертежа (только реальные id из контекста, не выдумывай zone-waiting если в плане другие id)
- highlightObjects — массив ID объектов из текущего чертежа
- highlightType: "warning" (жёлтый) — предупреждение, "error" (красный) — ошибка/нарушение нормы, "info" (синий) — просто акцент

Используй подсветку когда:
- Указываешь на проблему (узкий проход, нарушение нормы) — highlightType="error"
- Даёшь рекомендацию по улучшению — highlightType="warning"
- Просто обращаешь внимание на элемент — highlightType="info"

- kind="answer" — обычный ответ на вопрос, совет или анализ
- kind="clarify" — нужны уточнения, в questions список вопросов (максимум 2)
- kind="plan" — готовый чертёж, в поле plan объект плана
- kind="refuse" — вопрос совсем не по теме (используй редко)

plan при kind="plan" — объект:
{"name":"строка","room":{"name":"строка","width":число,"height":число},"zones":[{"id":"zone-1","name":"строка","type":"entrance|waiting|service|storage|office|technical|corridor","points":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":0,"y":1}]}],"objects":[{"id":"obj-1","type":"cash_window","name":"строка","x":0,"y":0,"width":1.2,"height":0.7,"rotation":0,"zoneId":"zone-1","attributes":{"Ключ":"значение"}}]}

ОБРАБОТКА КОМАНД МОДИФИКАЦИИ:
Если пользователь просит переместить, подвинуть, изменить объект на существующем чертеже:
1. Найди объект по названию в текущем плане
2. Определи целевую позицию (угол зоны, край, центр)
3. Верни обновлённый план с kind="plan"
4. В message опиши, что было изменено
5. НЕ строй новый чертёж с нуля, если пользователь просит поправить старый

Примеры команд модификации:
- "Перемести сейф в верхний правый угол офисной зоны"
- "Подвинь кассовые окна ближе к входу"
- "Сделай зону ожидания больше"
- "Добавь ещё 2 кресла в зону ожидания"

Пример в промпте показывает только форму. Числа и расположение бери из задачи, не копируй пример.`;

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}\n…[обрезано]` : value;
}

function catalog(): string {
  const objects = (Object.keys(OBJECT_TYPE_LABELS) as ObjectType[])
    .map((type) => {
      const size = OBJECT_DEFAULT_SIZES[type];
      return `- ${type}: ${OBJECT_TYPE_LABELS[type]}, обычно ${size.width}×${size.height} м`;
    })
    .join("\n");
  const zones = (Object.keys(ZONE_TYPE_LABELS) as ZoneType[])
    .map((type) => `- ${type}: ${ZONE_TYPE_LABELS[type]}, цвет ${ZONE_TYPE_COLORS[type]}`)
    .join("\n");
  return `Типы объектов:\n${objects}\n\nТипы зон:\n${zones}`;
}

function compactPlan(plan: unknown): string {
  if (!plan || typeof plan !== "object") return "Чертёж не открыт.";
  const source = plan as PlanData;
  if (!source.room || !Array.isArray(source.objects) || !Array.isArray(source.zones)) {
    return "Чертёж не открыт.";
  }
  return JSON.stringify({
    name: source.name,
    room: {
      name: source.room.name,
      width: source.room.width,
      height: source.room.height,
    },
    zones: source.zones.slice(0, 12).map((zone) => ({
      id: zone.id,
      name: zone.name,
      type: zone.type,
      points: zone.points,
    })),
    objects: source.objects.slice(0, 80).map((object) => ({
      id: object.id,
      type: object.type,
      name: object.name,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotation: object.rotation,
      zoneId: object.zoneId,
      attributes: object.attributes,
    })),
  });
}

function asKind(value: unknown): AssistantKind {
  return value === "answer" || value === "clarify" || value === "plan" || value === "refuse"
    ? value
    : "answer";
}

function asPlanDraft(value: unknown): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function parseReply(raw: string): Omit<AssistantReply, "ok"> {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return {
      kind: "answer",
      message: clip(raw.trim(), 4000),
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((item): item is string => typeof item === "string").slice(0, 2)
      : [];
    const assumptions = Array.isArray(parsed.assumptions)
      ? parsed.assumptions.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [];
    const highlightZones = Array.isArray(parsed.highlightZones)
      ? parsed.highlightZones.filter((item): item is string => typeof item === "string")
      : [];
    const highlightObjects = Array.isArray(parsed.highlightObjects)
      ? parsed.highlightObjects.filter((item): item is string => typeof item === "string")
      : [];
    const highlightType =
      parsed.highlightType === "error" ||
      parsed.highlightType === "warning" ||
      parsed.highlightType === "info"
        ? parsed.highlightType
        : "info";
    const kind = asKind(parsed.kind);
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? clip(parsed.message.trim(), 5000)
        : kind === "refuse"
          ? "Я специализируюсь на проектировании отделений почтовой связи."
          : "Не удалось сформулировать ответ.";
    return {
      kind,
      message,
      questions,
      assumptions,
      plan: kind === "plan" ? asPlanDraft(parsed.plan) : null,
      highlightZones,
      highlightObjects,
      highlightType,
    };
  } catch {
    return {
      kind: "answer",
      message: clip(raw.trim(), 4000),
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }
}

export async function askLayoutAssistant(input: {
  turns: AssistantTurn[];
  plan: PlanData | null;
  files: AssistantFile[];
}): Promise<AssistantReply | { ok: false; error: string }> {
  const fileNotes: string[] = [];
  const images: string[] = [];

  for (const file of input.files) {
    if (file.text) fileNotes.push(`--- Файл «${file.name}» ---\n${file.text}`);
    if (file.imageDataUrl) {
      images.push(file.imageDataUrl);
      fileNotes.push(`--- Изображение «${file.name}» приложено, смотри его ---`);
    }
    if (file.binaryBase64 && file.binaryKind) {
      fileNotes.push(`--- Файл «${file.name}» (${file.binaryKind}) приложен. ---`);
    }
  }

  const messages: { role: "system" | "user" | "assistant"; content: any }[] = [
    { role: "system", content: `${SYSTEM_PROMPT}` },
  ];

  input.turns.forEach((turn, index) => {
    const isLast = index === input.turns.length - 1;
    if (turn.role === "assistant" || !isLast) {
      messages.push({ role: turn.role, content: turn.text });
      return;
    }
    const text = [
      input.plan ? `Текущий чертёж:\n${compactPlan(input.plan)}` : "",
      `Сообщение пользователя:\n${turn.text}`,
      fileNotes.length ? `Приложенные материалы:\n${fileNotes.join("\n\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (images.length === 0) {
      messages.push({ role: "user", content: text });
    } else {
      messages.push({
        role: "user",
        content: [
          { type: "text", text },
          ...images.slice(0, 2).map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      });
    }
  });

  const buildLocalFallback = (): AssistantReply => {
    const materials = fileNotes.join("\n\n");
    const local = localReply({ turns: input.turns, plan: input.plan, materials });
    return {
      ok: true,
      kind: local.kind,
      message: local.message,
      questions: local.questions,
      assumptions: local.assumptions,
      plan: local.plan,
      // ВАЖНО: пробрасываем подсветку из localReply
      highlightZones: local.highlightZones ?? [],
      highlightObjects: local.highlightObjects ?? [],
      highlightType: local.highlightType ?? "info",
    };
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages,
        temperature: 0.7,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn("[askLayoutAssistant] Pollinations API failed, status:", response.status);
      return buildLocalFallback();
    }

    const body = await response.json();
    const content = body.choices?.[0]?.message?.content ?? "";

    if (!content.trim()) {
      console.warn("[askLayoutAssistant] Pollinations вернул пустой ответ");
      return buildLocalFallback();
    }

    const parsed = parseReply(content);

    // Если API не вернул подсветку, а это анализ чертежа — дополняем локальным advice
    const needsLocalHighlight =
      parsed.kind === "answer" &&
      parsed.highlightZones.length === 0 &&
      parsed.highlightObjects.length === 0 &&
      input.plan &&
      /узк|поправ|оптим|совет|улучш|рекоменд|проверь|анализ|разбер/i.test(
        input.turns[input.turns.length - 1]?.text ?? "",
      );

    if (needsLocalHighlight) {
      const local = localReply({
        turns: input.turns,
        plan: input.plan,
        materials: fileNotes.join("\n\n"),
      });
      return {
        ok: true,
        ...parsed,
        plan: parsed.plan ? normalizePlan(parsed.plan) : null,
        highlightZones: local.highlightZones,
        highlightObjects: local.highlightObjects,
        highlightType: local.highlightType,
      };
    }

    return {
      ok: true,
      ...parsed,
      plan: parsed.plan ? normalizePlan(parsed.plan) : null,
    };
  } catch (error) {
    console.error("[askLayoutAssistant] Ошибка Pollinations:", error);
    return buildLocalFallback();
  }
}

export interface PlanValidation {
  valid: boolean;
  warnings: string[];
}

export function validatePlanDraft(plan: any): PlanValidation {
  const warnings: string[] = [];
  if (!plan || !plan.room || !Array.isArray(plan.objects) || !Array.isArray(plan.zones)) {
    return { valid: false, warnings: ["План неполный: отсутствуют зоны или объекты"] };
  }
  const width = plan.room.width ?? 0;
  const height = plan.room.height ?? 0;
  if (!width || !height || width < 2 || height < 2) {
    warnings.push("Размеры зала не заданы или слишком малы");
  }
  for (const obj of plan.objects) {
    if (
      typeof obj.x !== "number" ||
      typeof obj.y !== "number" ||
      typeof obj.width !== "number" ||
      typeof obj.height !== "number"
    ) {
      continue;
    }
    if (obj.x < -0.01 || obj.y < -0.01) {
      warnings.push(`«${obj.name}» имеет отрицательные координаты`);
    }
    if (width > 0 && obj.x + obj.width > width + 0.05) {
      warnings.push(`«${obj.name}» выходит за правую границу зала`);
    }
    if (height > 0 && obj.y + obj.height > height + 0.05) {
      warnings.push(`«${obj.name}» выходит за нижнюю границу зала`);
    }
  }
  for (let i = 0; i < plan.objects.length; i++) {
    for (let j = i + 1; j < plan.objects.length; j++) {
      const a = plan.objects[i];
      const b = plan.objects[j];
      if (
        typeof a.x !== "number" ||
        typeof b.x !== "number" ||
        typeof a.y !== "number" ||
        typeof b.y !== "number" ||
        typeof a.width !== "number" ||
        typeof b.width !== "number" ||
        typeof a.height !== "number" ||
        typeof b.height !== "number"
      ) {
        continue;
      }
      const overlapX = a.x < b.x + b.width - 0.05 && a.x + a.width > b.x + 0.05;
      const overlapY = a.y < b.y + b.height - 0.05 && a.y + a.height > b.y + 0.05;
      if (overlapX && overlapY) {
        warnings.push(`«${a.name}» и «${b.name}» перекрываются`);
      }
    }
  }
  return { valid: warnings.length === 0, warnings };
}