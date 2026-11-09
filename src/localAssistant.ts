import { OBJECT_DEFAULT_SIZES, OBJECT_TYPE_LABELS, type ObjectType, type PlanData, type ZoneType } from "./types";
import { normalizePlan } from "./normalizePlan";

export interface LocalInput {
  turns: { role: "user" | "assistant"; text: string }[];
  plan: PlanData | null;
  materials: string;
}

export interface LocalReply {
  kind: "answer" | "clarify" | "plan" | "refuse";
  message: string;
  questions: string[];
  assumptions: string[];
  plan: ReturnType<typeof normalizePlan>;
}

const DOMAIN = /черт[её]ж|планир|план\b|зал|отделен|почт|оп[сc]|окн|касс|стеллаж|зон[аыуе]|оборудован|проход|вход|очеред|камер|метр|расстанов|посыл|пандус|сейф|кресл|ожидан|хранен|офис|оператор|стойк|терминал|мфу|принтер|весы|ящик|табло|рабоч/i;
const DESIGN = /спроектир|соберите|собери|сделай(?:те)?\s+(?:черт|план|отделен)|новый\s+черт|построй|начерти|переделай|создай\s+план|готов\w*\s+черт|по\s+требован|по\s+файл|на\s+основе/i;
const ASSUME = /на\s+тво[её]\s+усмотрен|типов\w+|сам\s+реши|как\s+считаешь|допустим\s+сам|типовое\s+отделение/i;

const EQUIPMENT: { type: ObjectType; pattern: RegExp }[] = [
  { type: "cash_window", pattern: /кассов\w*\s+окн|окн\w*\s+обслуживан/i },
  { type: "workplace", pattern: /рабоч\w*\s+мест|оператор/i },
  { type: "waiting_seat", pattern: /мест\w*\s+ожидан|кресл|скам/i },
  { type: "shelf", pattern: /стеллаж/i },
  { type: "parcel_shelf", pattern: /шкаф\w*\s+для\s+посыл/i },
  { type: "camera", pattern: /камер/i },
  { type: "safe", pattern: /сейф/i },
  { type: "sorting_table", pattern: /сортир/i },
  { type: "queue_terminal", pattern: /электронн\w*\s+очеред|терминал\s+очеред/i },
  { type: "printer", pattern: /принтер|мфу/i },
  { type: "scales", pattern: /вес[ыа]/i },
  { type: "ramp", pattern: /пандус/i },
  { type: "mailbox", pattern: /почтовы\w*\s+ящик|абонентск/i },
  { type: "info_board", pattern: /табло|информационн\w*\s+стенд/i },
  { type: "payment_terminal", pattern: /терминал\s+оплат/i },
  { type: "fire_alarm", pattern: /пожарн/i },
  { type: "security_system", pattern: /охранн|сигнализац/i },
];

function corpus(input: LocalInput): string {
  return [...input.turns.map((turn) => turn.text), input.materials].join("\n");
}

function onTopic(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  if (DOMAIN.test(last) || input.materials.trim()) return true;
  if (ASSUME.test(last)) return true;
  if (input.turns.length > 1 && /^\s*(\d+([.,]\d+)?)(\s*[xх×на]\s*\d+([.,]\d+)?)?/.test(last)) return true;
  return false;
}

function wantsDesign(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  return DESIGN.test(last) || (DESIGN.test(corpus(input)) && input.materials.trim().length > 0 && /файл|прилож|требован|оборудован/i.test(last));
}

function numberNear(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function dimensions(text: string): { width: number; height: number } | null {
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:м|метра|метров)?\s*[xх×]\s*(\d+(?:[.,]\d+)?)\s*м/i,
    /(\d+(?:[.,]\d+)?)\s*на\s*(\d+(?:[.,]\d+)?)\s*м/i,
    /длин[аы][^\d]{0,16}(\d+(?:[.,]\d+)?)[^\d]{0,24}ширин[аы][^\d]{0,16}(\d+(?:[.,]\d+)?)/i,
    /ширин[аы][^\d]{0,16}(\d+(?:[.,]\d+)?)[^\d]{0,24}длин[аы][^\d]{0,16}(\d+(?:[.,]\d+)?)/i,
    /помещени\w+[^\d]{0,24}(\d+(?:[.,]\d+)?)\s*[xх×на]\s*(\d+(?:[.,]\d+)?)/i,
    /зал[^\d]{0,24}(\d+(?:[.,]\d+)?)\s*[xх×на]\s*(\d+(?:[.,]\d+)?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const width = Number(match[1].replace(",", "."));
    const height = Number(match[2].replace(",", "."));
    if (width >= 4 && height >= 4 && width <= 80 && height <= 60) return { width, height };
  }
  return null;
}

function countOf(text: string, pattern: RegExp): number | null {
  return numberNear(text, pattern);
}

function zone(id: string, name: string, type: ZoneType, x: number, y: number, w: number, h: number) {
  return {
    id,
    name,
    type,
    points: [
      { x, y },
      { x: round(x + w), y },
      { x: round(x + w), y: round(y + h) },
      { x, y: round(y + h) },
    ],
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildPlan(spec: {
  name: string;
  width: number;
  height: number;
  windows: number;
  seats: number;
  shelves: number;
  workplaces: number;
  cameras: number;
  extras: ObjectType[];
}) {
  const width = spec.width;
  const height = spec.height;
  const entranceW = Math.min(4, round(width * 0.28));
  const entranceH = Math.min(3.2, round(height * 0.34));
  const serviceH = Math.min(4.2, round(height * 0.42));
  const serviceX = entranceW;
  const storageX = round(width * 0.55);

  const zones = [
    zone("zone-entrance", "Входная группа", "entrance", 0, 0, entranceW, entranceH),
    zone("zone-waiting", "Зона ожидания", "waiting", 0, entranceH, serviceX, Math.max(2, serviceH - entranceH + 1.2)),
    zone("zone-service", "Зона обслуживания", "service", serviceX, 0, round(width - serviceX), serviceH),
    zone("zone-storage", "Зона хранения", "storage", storageX, serviceH, round(width - storageX), round(height - serviceH)),
    zone("zone-office", "Офисная зона", "office", 0, serviceH + 0.4, storageX, round(height - serviceH - 0.4)),
  ];

  const objects: any[] = [];
  const push = (type: ObjectType, name: string, x: number, y: number, zoneId: string) => {
    const size = OBJECT_DEFAULT_SIZES[type];
    objects.push({
      id: `obj-${objects.length + 1}`,
      type,
      name,
      x: round(x),
      y: round(y),
      width: size.width,
      height: size.height,
      rotation: 0,
      zoneId,
      attributes: {},
    });
  };

  const windows = Math.max(1, Math.min(8, spec.windows));
  for (let index = 0; index < windows; index++) {
    push("cash_window", `Кассовое окно №${index + 1}`, serviceX + 0.6 + index * 2, 0.5, "zone-service");
    push("workplace", `Рабочее место оператора №${index + 1}`, serviceX + 0.5 + index * 2, 2.1, "zone-service");
  }

  if (spec.workplaces > windows) {
    for (let index = windows; index < spec.workplaces; index++) {
      push("workplace", `Рабочее место №${index + 1}`, 0.6 + (index - windows) * 1.8, serviceH + 1, "zone-office");
    }
  }

  const seats = Math.max(2, spec.seats);
  for (let index = 0; index < seats; index++) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    push("waiting_seat", `Место ожидания №${index + 1}`, 0.4 + column * 0.9, entranceH + 0.4 + row * 0.9, "zone-waiting");
  }

  push("queue_terminal", "Терминал электронной очереди", 0.4, 0.4, "zone-entrance");
  push("ramp", "Пандус", Math.max(0.2, entranceW - 1.4), 0.3, "zone-entrance");

  const shelves = Math.max(2, spec.shelves);
  for (let index = 0; index < shelves; index++) {
    push("shelf", `Стеллаж ${index + 1}`, storageX + 0.4, serviceH + 0.4 + index * 0.9, "zone-storage");
  }
  push("sorting_table", "Стол сортировки", storageX + 0.4, height - 1.6, "zone-storage");
  push("safe", "Сейф", 0.5, height - 1.2, "zone-office");
  push("printer", "МФУ оператора", serviceX + 0.4, 3.1, "zone-service");

  const cameras = Math.max(2, spec.cameras);
  push("camera", "Камера у входа", 0.3, 0.3, "zone-entrance");
  if (cameras > 1) push("camera", "Камера зоны обслуживания", width - 0.6, 0.4, "zone-service");
  if (cameras > 2) push("camera", "Камера хранения", width - 0.6, height - 0.6, "zone-storage");

  for (const extra of spec.extras) {
    if (objects.some((object) => object.type === extra)) continue;
    push(extra, OBJECT_TYPE_LABELS[extra], 1.2, height - 1.4, "zone-office");
  }

  return {
    name: spec.name,
    room: { name: "Зал отделения", width, height },
    zones,
    objects,
  };
}

function advice(plan: PlanData): string {
  const windows = plan.objects.filter((object) => object.type === "cash_window");
  const seats = plan.objects.filter((object) => object.type === "waiting_seat");
  const cameras = plan.objects.filter((object) => object.type === "camera");
  const shelves = plan.objects.filter((object) => object.type === "shelf" || object.type === "parcel_shelf");
  const uncovered = plan.zones.filter(
    (zoneItem) => zoneItem.type !== "corridor" && !cameras.some((camera) => camera.zoneId === zoneItem.id),
  );

  const lines = [`Сейчас зал «${plan.room.name}» ${plan.room.width}×${plan.room.height} м, объектов ${plan.objects.length}.`];

  if (windows.length) {
    const xs = windows.map((object) => object.x);
    const span = Math.max(...xs) - Math.min(...xs);
    lines.push(
      windows.length === 1
        ? `${windows[0].name} стоит у ${windows[0].x.toFixed(1)}, ${windows[0].y.toFixed(1)} м. Для очереди оставьте перед ним проход не меньше 1.2 м.`
        : `Кассовые окна (${windows.length}) стоят в ряд. Разнос по фронту ${span.toFixed(1)} м. Лучше держать их на одной линии, вход и ожидание спереди, а рабочие места операторов сразу за окнами.`,
    );
  } else {
    lines.push("Кассовых окон на чертеже нет. Для отделения их ставят одной линейкой напротив входа, с проходом от 1.2 м.");
  }

  lines.push(
    seats.length < Math.max(4, windows.length * 2)
      ? `Мест ожидания ${seats.length} — мало для ${windows.length || "нескольких"} окон. Добавьте места в зоне ожидания.`
      : `Мест ожидания ${seats.length}: этого достаточно, если они не стоят в проходе к окнам.`,
  );

  if (uncovered.length) {
    lines.push(`Без камеры остались зоны: ${uncovered.map((zoneItem) => zoneItem.name).join(", ")}.`);
  }
  if (shelves.length && plan.zones.some((zoneItem) => zoneItem.type === "storage")) {
    lines.push("Стеллажи держите в зоне хранения за линейкой окон, чтобы посетитель не проходил через посылки.");
  }

  return lines.join("\n");
}

function describe(plan: PlanData, question: string): string {
  const askedWindows = /окн/i.test(question);
  const askedWhere = /где|координат|стоят|располож/i.test(question);

  if (askedWindows) {
    const windows = plan.objects.filter((object) => object.type === "cash_window" || /окн/i.test(object.name));
    if (!windows.length) return `На чертеже «${plan.name}» кассовых окон нет.`;
    return `На чертеже «${plan.name}» ${windows.length} кассовых окон:\n${windows.map((object) => `• ${object.name} — ${object.x.toFixed(1)} м от левого края, ${object.y.toFixed(1)} м от верхнего`).join("\n")}`;
  }

  if (askedWhere) {
    const nouns = plan.objects.filter((object) => question.toLowerCase().includes(object.name.toLowerCase().slice(0, 6)));
    const pool = nouns.length ? nouns : plan.objects.slice(0, 8);
    return pool.map((object) => `${object.name}: ${object.x.toFixed(1)}, ${object.y.toFixed(1)} м`).join("\n");
  }

  if (/как лучше|узк|поправ|оптим|совет|улучш/i.test(question)) return advice(plan);

  const byType = new Map<string, number>();
  for (const object of plan.objects) byType.set(object.type, (byType.get(object.type) ?? 0) + 1);
  const summary = [...byType.entries()].map(([type, count]) => `${OBJECT_TYPE_LABELS[type as ObjectType]} — ${count}`).join(", ");

  return `Чертёж «${plan.name}»: зал ${plan.room.width}×${plan.room.height} м. Зоны: ${plan.zones.map((zoneItem) => zoneItem.name).join(", ")}. Оборудование: ${summary}.\n\n${advice(plan)}`;
}

export function localReply(input: LocalInput): LocalReply {
  if (!onTopic(input)) {
    return {
      kind: "refuse",
      message: "Я отвечаю только про чертёж и планировку отделения: зоны, оборудование, проходы и файлы с требованиями. Задайте вопрос по залу или пришлите перечень.",
      questions: [],
      assumptions: [],
      plan: null,
    };
  }

  const text = corpus(input);
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  const plan = input.plan;

  if (!wantsDesign(input)) {
    if (!plan) {
      return {
        kind: "answer",
        message: "Открытого чертежа нет. Опишите зал или приложите требования, и я соберу план.",
        questions: [],
        assumptions: [],
        plan: null,
      };
    }
    return { kind: "answer", message: describe(plan, last), questions: [], assumptions: [], plan: null };
  }

  const assume = ASSUME.test(text);
  const size = dimensions(text);
  const windows = countOf(text, /(\d+)\s*(?:кассовых\s+окна|кассовых\s+окон|окна|окон)\b/i) ?? countOf(text, /(\d+)\s*операционн\w*\s+окн/i);
  const seats = countOf(text, /(\d+)\s*(?:мест\w*\s+ожидан\w*|кресел|кресла|скамей)/i);
  const shelves = countOf(text, /(\d+)\s*стеллаж/i);
  const mentioned = EQUIPMENT.filter((item) => item.pattern.test(text)).map((item) => item.type);
  const hasEquipment = windows !== null || seats !== null || shelves !== null || mentioned.length > 0 || /оборудован/i.test(text);

  const questions: string[] = [];
  if (!size && !assume) questions.push("Какие длина и ширина зала в метрах?");
  if (windows === null && !hasEquipment && !assume) questions.push("Сколько кассовых окон и какое оборудование обязательно должно стоять?");

  if (questions.length) {
    return {
      kind: "clarify",
      message: `Чтобы собрать чертёж, не хватает данных.\n${questions.map((question, index) => `${index + 1}. ${question}`).join("\n")}`,
      questions,
      assumptions: [],
      plan: null,
    };
  }

  const assumptions: string[] = [];
  const width = size?.width ?? 14;
  const height = size?.height ?? 9;
  const windowCount = windows ?? (mentioned.includes("cash_window") ? 3 : 3);

  if (!size) assumptions.push("Зал 14×9 м — типовое небольшое отделение.");
  if (windows === null) assumptions.push(`Кассовых окон: ${windowCount}.`);
  if (seats === null) assumptions.push("Места ожидания — по два на каждое окно.");
  if (shelves === null) assumptions.push("В хранении четыре стеллажа, стол сортировки и сейф в офисе.");

  const draft = buildPlan({
    name: /отделен[^\n]{0,40}/i.exec(input.materials)?.[0]?.trim() || "Проект отделения по требованиям",
    width,
    height,
    windows: windowCount,
    seats: seats ?? windowCount * 2,
    shelves: shelves ?? 4,
    workplaces: countOf(text, /(\d+)\s*рабоч\w*\s+мест/i) ?? windowCount,
    cameras: countOf(text, /(\d+)\s*камер/i) ?? 3,
    extras: mentioned,
  });

  const normalized = normalizePlan(draft);
  return {
    kind: "plan",
    message: normalized
      ? `Собрал чертёж «${normalized.name}»: зал ${normalized.room.width}×${normalized.room.height} м, ${normalized.zones.length} зон, ${normalized.objects.length} объектов. Окна стоят одной линией, ожидание у входа, хранение и офис за ними.`
      : "Не удалось собрать чертёж из этих данных.",
    questions: [],
    assumptions,
    plan: normalized,
  };
}