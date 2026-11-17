import {
  OBJECT_DEFAULT_SIZES,
  OBJECT_TYPE_LABELS,
  type ObjectType,
  type PlanData,
  type ZoneType,
} from "./types";
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
  highlightZones: string[];
  highlightObjects: string[];
  highlightType: "warning" | "error" | "info";
}

const DOMAIN =
  /черт[её]ж|планир|план|зал|отделен|почт|опс|окн|касс|стеллаж|зон[аыуе]|оборудован|проход|вход|очеред|камер|метр|расстанов|посыл|пандус|сейф|кресл|ожидан|хранен|офис|оператор|стойк|терминал|мфу|принтер|весы|ящик|табло|рабоч|норм|стандарт|совет|рекоменд|раскладк|планировк|клиент|посетител|доступн|маломобил|сп\s*59|гост/i;

const DESIGN =
  /спроектир|соберите|собери|сделай(?:те)?\s+(?:черт|план|отделен|расклад)|новый\s+черт|построй|начерти|переделай|создай\s+план|готов\w*\s+черт|по\s+требован|по\s+файл|на\s+основе|нарисуй|размести|расставь|сгенерируй\s+план|типовое\s+опс|типовое\s+отделен/i;

const ASSUME =
  /на\s+тво[её]\s+усмотрен|типов\w+|сам\s+реши|как\s+считаешь|допустим\s+сам|типовое\s+отделение|на\s+твоё\s+усмотрение|как\s+обычно|стандартн\w*\s+отделен/i;

const ADVICE =
  /как\s+лучше|узк|поправ|оптим|совет|улучш|рекоменд|что\s+не\s+так|проверь|анализ|разбер[иы]|оцен[иь]|аудит|найди\s+ошиб|нарушен|норм\w*\s+соблюд|что\s+улучш|где\s+проблем|слабые\s+места|критика|прокомментируй\s+план/i;

const DESCRIBE =
  /что\s+на\s+чертеж|что\s+стоит|где\s+наход|опиши|расскажи\s+про|сколько\s+объект|перечисл|какие\s+зоны|состав\s+оборудован|инвентар/i;

const MODIFY =
  /перемест|подвинь|сдвинь|перенес|перестав|постав[ьи]|задвинь|перелож|кинь|поменяй мест|измени позиц|поменяй угол|сделай больше|сделай меньше|увеличь|уменьши|добавь|убери|удали|поменяй размер|сдвинь\s+(левее|правее|выше|ниже)/i;

const CORNER_KEYS = [
  "верхний левый угол",
  "верхний правый угол",
  "нижний левый угол",
  "нижний правый угол",
  "левый край",
  "правый край",
  "центр",
] as const;

const EQUIPMENT: { type: ObjectType; pattern: RegExp }[] = [
  { type: "cash_window", pattern: /кассов\w*\s+окн|окн\w*\s+обслуживан|операционн\w*\s+окн/i },
  { type: "workplace", pattern: /рабоч\w*\s+мест|оператор|стол\s+оператор/i },
  { type: "waiting_seat", pattern: /мест\w*\s+ожидан|кресл|скам|сид[её]н/i },
  { type: "shelf", pattern: /стеллаж|полк/i },
  { type: "parcel_shelf", pattern: /шкаф\w*\s+для\s+посыл|посылочн/i },
  { type: "camera", pattern: /камер|видеонаблюд/i },
  { type: "safe", pattern: /сейф/i },
  { type: "sorting_table", pattern: /сортир|стол\s+сортир/i },
  { type: "queue_terminal", pattern: /электронн\w*\s+очеред|терминал\s+очеред|талон/i },
  { type: "printer", pattern: /принтер|мфу/i },
  { type: "scales", pattern: /вес[ыа]/i },
  { type: "ramp", pattern: /пандус/i },
  { type: "mailbox", pattern: /почтов\w*\s+ящик|абонентск/i },
  { type: "info_board", pattern: /табло|информационн\w*\s+стенд/i },
  { type: "payment_terminal", pattern: /терминал\s+оплат/i },
  { type: "fire_alarm", pattern: /пожарн/i },
  { type: "security_system", pattern: /охранн|сигнализац/i },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function corpus(input: LocalInput): string {
  return [...input.turns.map((turn) => turn.text), input.materials].join("\n");
}

function onTopic(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  if (DOMAIN.test(last) || input.materials.trim()) return true;
  if (ASSUME.test(last)) return true;
  if (MODIFY.test(last)) return true;
  if (input.turns.length > 1 && /^\s*(\d+([.,]\d+)?)\s*[xх×на]\s*\d+([.,]\d+)?/.test(last))
    return true;
  return false;
}

function wantsDesign(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  return (
    DESIGN.test(last) ||
    (DESIGN.test(corpus(input)) &&
      input.materials.trim().length > 0 &&
      /файл|прилож|требован|оборудован/i.test(last))
  );
}

function wantsAdvice(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  return ADVICE.test(last);
}

function wantsDescription(input: LocalInput): boolean {
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  return DESCRIBE.test(last);
}

function numberNear(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function dimensions(text: string): { width: number; height: number } | null {
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:на|[xх×])\s*(\d+(?:[.,]\d+)?)(?:\s*(?:м|метра|метров))?/i,
    /размер\w*\s+(\d+(?:[.,]\d+)?)\s*(?:на|[xх×])\s*(\d+(?:[.,]\d+)?)/i,
    /длин[аы][^д]{0,16}(\d+(?:[.,]\d+)?)[^д]{0,24}ширин[аы][^д]{0,16}(\d+(?:[.,]\d+)?)/i,
    /ширин[аы][^д]{0,16}(\d+(?:[.,]\d+)?)[^д]{0,24}длин[аы][^д]{0,16}(\d+(?:[.,]\d+)?)/i,
    /помещен\w+[^д]{0,24}(\d+(?:[.,]\d+)?)\s*(?:на|[xх×])\s*(\d+(?:[.,]\d+)?)/i,
    /зал[^д]{0,24}(\d+(?:[.,]\d+)?)\s*(?:на|[xх×])\s*(\d+(?:[.,]\d+)?)/i,
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

function zone(
  id: string,
  name: string,
  type: ZoneType,
  x: number,
  y: number,
  w: number,
  h: number,
) {
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

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[«»"'.,:;!?()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /(ыми|ими|ого|его|ому|ему|ой|ей|ая|яя|ое|ее|ые|ие|ых|их|ам|ям|ом|ем|у|ю|а|я|е|и|ы)$/i,
      "",
    );
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

/** Разбор команд перемещения: «перемести X в Y», «поставь X в угол», «сейф в правый угол офиса» */
function parseMoveCommand(
  text: string,
): { objectName: string; targetLocation: string } | null {
  const normalized = text.trim().replace(/\s+/g, " ");

  const verbRe =
    /^(перемести|перемест|подвинь|сдвинь|перенеси|переставь|переместить|перенести|поставь|постави|задвинь|переложи|кинь)\s+/i;

  let rest = normalized;
  if (verbRe.test(normalized)) {
    rest = normalized.replace(verbRe, "").trim();
  } else {
    // без глагола: «сейф в верхний правый угол офиса»
    const bare = normalized.match(
      /^(.+?)\s+(?:в|на)\s+((?:верхн|нижн|лев|прав|центр|угол|край|зон).+)$/i,
    );
    if (!bare) return null;
    return { objectName: bare[1].trim(), targetLocation: bare[2].trim() };
  }

  if (!rest) return null;

  const prepRe = /\s+(в|на)\s+/i;
  const prepMatch = rest.match(prepRe);
  if (!prepMatch || prepMatch.index === undefined) {
    // «сдвинь стеллаж правее» / «левее» / «выше» / «ниже»
    const dir = rest.match(/^(.+?)\s+(левее|правее|выше|ниже)$/i);
    if (dir) {
      return { objectName: dir[1].trim(), targetLocation: dir[2].toLowerCase() };
    }
    return null;
  }

  const objectName = rest.slice(0, prepMatch.index).trim();
  const targetLocation = rest.slice(prepMatch.index + prepMatch[0].length).trim();
  if (!objectName || !targetLocation) return null;
  return { objectName, targetLocation };
}

function findZoneIdByLocation(
  plan: PlanData,
  location: string,
  fallbackZoneId: string | null,
): string | null {
  const loc = location.toLowerCase();
  for (const z of plan.zones) {
    if (namesMatch(loc, z.name) || namesMatch(loc, z.type)) {
      return z.id;
    }
  }
  const typeHints: { re: RegExp; type: ZoneType }[] = [
    { re: /вход/, type: "entrance" },
    { re: /ожидан/, type: "waiting" },
    { re: /обслужив|сервис|касс/, type: "service" },
    { re: /хранен|склад|посыл/, type: "storage" },
    { re: /офис|back/, type: "office" },
    { re: /техн/, type: "technical" },
    { re: /коридор|проход/, type: "corridor" },
  ];
  for (const hint of typeHints) {
    if (hint.re.test(loc)) {
      const found = plan.zones.find((z) => z.type === hint.type);
      if (found) return found.id;
    }
  }
  return fallbackZoneId;
}

function findCornerKey(location: string): (typeof CORNER_KEYS)[number] | null {
  const loc = location.toLowerCase();
  for (const key of CORNER_KEYS) {
    if (loc.includes(key)) return key;
  }
  if (/лев.*верх|верх.*лев/.test(loc)) return "верхний левый угол";
  if (/прав.*верх|верх.*прав/.test(loc)) return "верхний правый угол";
  if (/лев.*ниж|ниж.*лев/.test(loc)) return "нижний левый угол";
  if (/прав.*ниж|ниж.*прав/.test(loc)) return "нижний правый угол";
  if (/центр/.test(loc)) return "центр";
  if (/лев/.test(loc)) return "левый край";
  if (/прав/.test(loc)) return "правый край";
  return null;
}

function bboxOfPoints(points: { x: number; y: number }[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function bboxOfObjects(objects: { x: number; y: number; width: number; height: number }[]) {
  if (!objects.length) return null;
  return {
    minX: Math.min(...objects.map((o) => o.x)),
    maxX: Math.max(...objects.map((o) => o.x + o.width)),
    minY: Math.min(...objects.map((o) => o.y)),
    maxY: Math.max(...objects.map((o) => o.y + o.height)),
  };
}

function gapBetween(
  a: { minX: number; maxX: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minY: number; maxY: number },
): number {
  const gapX = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const gapY = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
  const overlapX = a.minX < b.maxX && a.maxX > b.minX;
  const overlapY = a.minY < b.maxY && a.maxY > b.minY;
  if (overlapX && overlapY) return 0;
  if (overlapX) return gapY;
  if (overlapY) return gapX;
  return Math.hypot(gapX, gapY);
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
  const serviceX = round(width * 0.45);
  const serviceH = round(height * 0.45);
  const entranceW = serviceX;
  const entranceH = round(height * 0.25);
  const waitingH = round(height * 0.35);
  const officeY = entranceH + waitingH;
  const officeH = height - officeY;
  const storageX = serviceX;
  const storageY = serviceH;
  const storageW = width - serviceX;
  const storageH = height - serviceH;

  const zones = [
    zone("zone-entrance", "Входная группа", "entrance", 0, 0, entranceW, entranceH),
    zone("zone-waiting", "Зона ожидания", "waiting", 0, entranceH, serviceX, waitingH),
    zone("zone-office", "Офисная зона", "office", 0, officeY, serviceX, officeH),
    zone("zone-service", "Зона обслуживания", "service", serviceX, 0, storageW, serviceH),
    zone("zone-storage", "Зона хранения", "storage", storageX, storageY, storageW, storageH),
  ];

  const objects: any[] = [];

  const objectsOverlap = (a: any, b: any): boolean => {
    const padding = 0.15;
    return !(
      a.x + a.width + padding <= b.x ||
      b.x + b.width + padding <= a.x ||
      a.y + a.height + padding <= b.y ||
      b.y + b.height + padding <= a.y
    );
  };

  const hasCollision = (x: number, y: number, w: number, h: number): boolean => {
    const testObj = { x, y, width: w, height: h };
    return objects.some((obj) => objectsOverlap(testObj, obj));
  };

  const getZoneBoundsLocal = (z: any) => {
    const xs = z.points.map((p: any) => p.x);
    const ys = z.points.map((p: any) => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const smartPush = (
    type: ObjectType,
    name: string,
    preferredX: number,
    preferredY: number,
    zoneId: string,
    maxAttempts = 20,
  ): boolean => {
    const size = OBJECT_DEFAULT_SIZES[type];
    const w = size.width;
    const h = size.height;
    if (
      preferredX >= 0.2 &&
      preferredY >= 0.2 &&
      preferredX + w <= width - 0.2 &&
      preferredY + h <= height - 0.2 &&
      !hasCollision(preferredX, preferredY, w, h)
    ) {
      objects.push({
        id: `obj-${objects.length + 1}`,
        type,
        name,
        x: round(preferredX),
        y: round(preferredY),
        width: w,
        height: h,
        rotation: 0,
        zoneId,
        attributes: {},
      });
      return true;
    }
    const z = zones.find((zn) => zn.id === zoneId);
    if (!z) return false;
    const zb = getZoneBoundsLocal(z);
    const startX = zb.minX + 0.2;
    const startY = zb.minY + 0.2;
    const endX = zb.maxX - w - 0.2;
    const endY = zb.maxY - h - 0.2;
    if (endX < startX || endY < startY) return false;
    for (let i = 0; i < maxAttempts; i++) {
      const testX = startX + Math.random() * (endX - startX);
      const testY = startY + Math.random() * (endY - startY);
      if (!hasCollision(testX, testY, w, h)) {
        objects.push({
          id: `obj-${objects.length + 1}`,
          type,
          name,
          x: round(testX),
          y: round(testY),
          width: w,
          height: h,
          rotation: 0,
          zoneId,
          attributes: {},
        });
        return true;
      }
    }
    return false;
  };

  const windows = Math.max(1, Math.min(8, spec.windows));
  const windowSpacing = (storageW - 1.0) / Math.max(1, windows);
  for (let i = 0; i < windows; i++) {
    const wx = serviceX + 0.5 + i * windowSpacing;
    smartPush("cash_window", `Кассовое окно №${i + 1}`, wx, 0.5, "zone-service");
    smartPush("workplace", `Рабочее место оператора №${i + 1}`, wx, 2.0, "zone-service");
  }

  const extraWorkplaces = Math.max(0, spec.workplaces - windows);
  for (let i = 0; i < extraWorkplaces; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    smartPush(
      "workplace",
      `Рабочее место №${i + 1}`,
      0.5 + col * 2.0,
      officeY + 0.5 + row * 1.5,
      "zone-office",
    );
  }

  const seats = Math.max(2, spec.seats);
  const seatCols = 3;
  const seatSpacingX = (serviceX - 0.4) / seatCols;
  for (let i = 0; i < seats; i++) {
    const col = i % seatCols;
    const row = Math.floor(i / seatCols);
    const sx = 0.3 + col * seatSpacingX;
    const sy = entranceH + 0.3 + row * 1.0;
    if (sy + 0.5 < officeY) {
      smartPush("waiting_seat", `Место ожидания №${i + 1}`, sx, sy, "zone-waiting");
    }
  }

  smartPush(
    "queue_terminal",
    "Терминал электронной очереди",
    serviceX * 0.5,
    entranceH * 0.5,
    "zone-entrance",
  );
  smartPush("ramp", "Пандус", 0.3, entranceH * 0.6, "zone-entrance");

  const shelves = Math.max(2, spec.shelves);
  const shelfCols = 2;
  const shelfSpacingX = (storageW - 0.8) / shelfCols;
  for (let i = 0; i < shelves; i++) {
    const col = i % shelfCols;
    const row = Math.floor(i / shelfCols);
    const shx = storageX + 0.4 + col * shelfSpacingX;
    const shy = storageY + 0.4 + row * 1.0;
    if (shy + 0.5 < height - 0.2) {
      smartPush("shelf", `Стеллаж ${i + 1}`, shx, shy, "zone-storage");
    }
  }

  smartPush("sorting_table", "Стол сортировки", storageX + 0.5, height - 1.5, "zone-storage");
  smartPush("safe", "Сейф", serviceX - 1.2, officeY + 0.5, "zone-office");
  smartPush("printer", "МФУ оператора", serviceX + 0.5, serviceH - 1.2, "zone-service");

  const cameras = Math.max(2, spec.cameras);
  smartPush("camera", "Камера у входа", 0.3, 0.3, "zone-entrance");
  if (cameras > 1)
    smartPush("camera", "Камера зоны обслуживания", width - 0.5, 0.3, "zone-service");
  if (cameras > 2)
    smartPush("camera", "Камера хранения", width - 0.5, height - 0.5, "zone-storage");
  if (cameras > 3) smartPush("camera", "Камера офиса", 0.3, officeY + 0.3, "zone-office");

  for (const extra of spec.extras) {
    if (objects.some((o) => o.type === extra)) continue;
    smartPush(extra, OBJECT_TYPE_LABELS[extra], 1.2, height - 1.4, "zone-office");
  }

  return {
    name: spec.name,
    room: { name: "Зал отделения", width, height },
    zones,
    objects,
  };
}

function advice(plan: PlanData): {
  message: string;
  highlightZones: string[];
  highlightObjects: string[];
  highlightType: "warning" | "error" | "info";
} {
  const windows = plan.objects.filter((o) => o.type === "cash_window");
  const seats = plan.objects.filter((o) => o.type === "waiting_seat");
  const cameras = plan.objects.filter((o) => o.type === "camera");
  const shelves = plan.objects.filter((o) => o.type === "shelf" || o.type === "parcel_shelf");
  const uncovered = plan.zones.filter(
    (z) => z.type !== "corridor" && !cameras.some((c) => c.zoneId === z.id),
  );
  const highlightZones: string[] = [];
  const highlightObjects: string[] = [];
  const lines: string[] = [];

  const serviceZone = plan.zones.find((z) => z.type === "service");
  const waitingZone = plan.zones.find((z) => z.type === "waiting");
  const storageZone = plan.zones.find((z) => z.type === "storage");

  lines.push(
    pick([
      `📐 Зал «${plan.room.name}»: ${plan.room.width}×${plan.room.height} м, объектов ${plan.objects.length}.`,
      `📐 Смотрю чертёж «${plan.name || plan.room.name}» — ${plan.room.width}×${plan.room.height} м, ${plan.objects.length} объектов, ${plan.zones.length} зон.`,
      `📐 Текущая раскладка: ${plan.room.width}×${plan.room.height} м, единиц оборудования — ${plan.objects.length}.`,
    ]),
  );

  if (windows.length) {
    const xs = windows.map((o) => o.x);
    const span = Math.max(...xs) - Math.min(...xs);
    if (windows.length === 1) {
      lines.push(
        pick([
          `🪟 ${windows[0].name} — ${windows[0].x.toFixed(1)}, ${windows[0].y.toFixed(1)} м. Перед ним держите свободный проход ≥ 1.2 м.`,
          `🪟 Одно окно («${windows[0].name}»). Для очереди оставьте перед ним не меньше 1.2 м.`,
        ]),
      );
    } else {
      lines.push(
        pick([
          `🪟 Кассовых окон: ${windows.length}, разнос по фронту ${span.toFixed(1)} м. Удобнее одна линия: ожидание спереди, операторы сразу за окнами.`,
          `🪟 Окон ${windows.length} в ряд (фронт ~${span.toFixed(1)} м). Не «ломайте» линию — иначе очередь путается.`,
        ]),
      );
    }
    windows.forEach((w) => highlightObjects.push(w.id));
  } else {
    lines.push(
      pick([
        "🔴 Кассовых окон на чертеже нет — отделение без окон обслуживания неработоспособно.",
        "🔴 Не вижу кассовых окон. Без них зона обслуживания пустая.",
      ]),
    );
    if (serviceZone) highlightZones.push(serviceZone.id);
  }

  const seatsNeeded = Math.max(4, windows.length * 2);
  if (seats.length < seatsNeeded) {
    lines.push(
      pick([
        `🔴 Мест ожидания ${seats.length} — мало для ${windows.length || "нескольких"} окон (ориентир ≥ ${seatsNeeded}).`,
        `🔴 В ожидании только ${seats.length} мест. Для ${windows.length || "N"} окон лучше не меньше ${seatsNeeded}.`,
      ]),
    );
    if (waitingZone) highlightZones.push(waitingZone.id);
    seats.forEach((s) => highlightObjects.push(s.id));
  } else {
    lines.push(
      pick([
        `✅ Мест ожидания ${seats.length} — для текущих окон хватает.`,
        `✅ По сидячим местам порядок: ${seats.length} шт.`,
      ]),
    );
  }

  if (uncovered.length) {
    lines.push(
      pick([
        `🟡 Без камеры: ${uncovered.map((z) => z.name).join(", ")}.`,
        `🟡 Видеонаблюдение не покрывает: ${uncovered.map((z) => z.name).join(", ")}.`,
      ]),
    );
    uncovered.forEach((z) => highlightZones.push(z.id));
  } else {
    lines.push("✅ Камеры закрывают все основные зоны.");
  }

  if (shelves.length && storageZone) {
    lines.push(
      pick([
        "🟡 Стеллажи логичнее держать в зоне хранения, за линией окон — чтобы клиентский проход не перекрывался.",
        "🟡 Проверьте, что стеллажи не вылезают в клиентскую зону: хранение — отдельно от очереди.",
      ]),
    );
    shelves.forEach((s) => highlightObjects.push(s.id));
    highlightZones.push(storageZone.id);
  }

  if (windows.length > 0 && waitingZone && waitingZone.points?.length) {
    const winBox = bboxOfObjects(windows);
    const waitBox = bboxOfPoints(waitingZone.points);
    if (winBox) {
      const gap = gapBetween(winBox, waitBox);
      if (gap < 1.2) {
        lines.push(
          pick([
            `🔴 Проход окна ↔ ожидание ≈ ${gap.toFixed(2)} м (норма ≥ 1.2 м, СП 59.13330.2020).`,
            `🔴 Между окнами и зоной ожидания всего ~${gap.toFixed(2)} м — уже нормы 1.2 м.`,
          ]),
        );
        highlightZones.push(waitingZone.id);
        windows.forEach((w) => {
          if (!highlightObjects.includes(w.id)) highlightObjects.push(w.id);
        });
      }
    }
  }

  lines.push(
    pick([
      "💡 Если нужно, могу предложить конкретные сдвиги объектов или собрать вариант раскладки заново.",
      "💡 Могу точечно подвинуть объекты по команде или пересобрать план под ваши размеры.",
      "💡 Напишите, что правим в первую очередь: окна, ожидание или хранение.",
    ]),
  );

  let highlightType: "warning" | "error" | "info" = "info";
  if (highlightZones.length > 0 || highlightObjects.length > 0) {
    const hasCritical = lines.some((l) => l.includes("🔴"));
    highlightType = hasCritical ? "error" : "warning";
  }

  return {
    message: lines.join("\n\n"),
    highlightZones: [...new Set(highlightZones)],
    highlightObjects: [...new Set(highlightObjects)],
    highlightType,
  };
}

function describe(
  plan: PlanData,
  question: string,
): {
  message: string;
  highlightZones: string[];
  highlightObjects: string[];
  highlightType: "warning" | "error" | "info";
} {
  const askedWindows = /окн/i.test(question);
  const askedWhere = /где|координат|стоят|располож/i.test(question);

  if (askedWindows) {
    const windows = plan.objects.filter((o) => o.type === "cash_window" || /окн/i.test(o.name));
    if (!windows.length) {
      const serviceZone = plan.zones.find((z) => z.type === "service");
      return {
        message: pick([
          `На чертеже «${plan.name}» кассовых окон нет.`,
          `Кассовых окон в «${plan.name}» не нашёл.`,
        ]),
        highlightZones: serviceZone ? [serviceZone.id] : [],
        highlightObjects: [],
        highlightType: "error",
      };
    }
    return {
      message: `На чертеже «${plan.name}» ${windows.length} кассовых окон:\n${windows
        .map(
          (o) =>
            `• ${o.name} — ${o.x.toFixed(1)} м от левого края, ${o.y.toFixed(1)} м от верхнего`,
        )
        .join("\n")}`,
      highlightZones: [],
      highlightObjects: windows.map((w) => w.id),
      highlightType: "info",
    };
  }

  if (askedWhere) {
    const nouns = plan.objects.filter((o) =>
      question.toLowerCase().includes(o.name.toLowerCase().slice(0, 6)),
    );
    const pool = nouns.length ? nouns : plan.objects.slice(0, 8);
    return {
      message: pool.map((o) => `${o.name}: ${o.x.toFixed(1)}, ${o.y.toFixed(1)} м`).join("\n"),
      highlightZones: [],
      highlightObjects: pool.map((o) => o.id),
      highlightType: "info",
    };
  }

  if (ADVICE.test(question)) return advice(plan);

  const byType = new Map<string, number>();
  for (const o of plan.objects) byType.set(o.type, (byType.get(o.type) ?? 0) + 1);
  const summary = [...byType.entries()]
    .map(([t, c]) => `${OBJECT_TYPE_LABELS[t as ObjectType] ?? t} — ${c}`)
    .join(", ");
  const adviceResult = advice(plan);
  return {
    message: pick([
      `Чертёж «${plan.name}»: зал ${plan.room.width}×${plan.room.height} м.\nЗоны: ${plan.zones.map((z) => z.name).join(", ")}.\nОборудование: ${summary}.\n\n${adviceResult.message}`,
      `Кратко по «${plan.name}» (${plan.room.width}×${plan.room.height} м):\n• зоны — ${plan.zones.map((z) => z.name).join(", ")}\n• состав — ${summary}\n\n${adviceResult.message}`,
    ]),
    highlightZones: adviceResult.highlightZones,
    highlightObjects: adviceResult.highlightObjects,
    highlightType: adviceResult.highlightType,
  };
}

function getZoneBounds(
  plan: PlanData,
  zoneId: string,
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  const z = plan.zones.find((zn) => zn.id === zoneId);
  if (!z) return null;
  return bboxOfPoints(z.points);
}

function calculateCornerPosition(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  corner: string,
  objWidth: number,
  objHeight: number,
): { x: number; y: number } {
  const padding = 0.3;
  switch (corner) {
    case "верхний левый угол":
      return { x: bounds.minX + padding, y: bounds.minY + padding };
    case "верхний правый угол":
      return { x: bounds.maxX - objWidth - padding, y: bounds.minY + padding };
    case "нижний левый угол":
      return { x: bounds.minX + padding, y: bounds.maxY - objHeight - padding };
    case "нижний правый угол":
      return { x: bounds.maxX - objWidth - padding, y: bounds.maxY - objHeight - padding };
    case "левый край":
      return {
        x: bounds.minX + padding,
        y: (bounds.minY + bounds.maxY) / 2 - objHeight / 2,
      };
    case "правый край":
      return {
        x: bounds.maxX - objWidth - padding,
        y: (bounds.minY + bounds.maxY) / 2 - objHeight / 2,
      };
    case "центр":
      return {
        x: (bounds.minX + bounds.maxX) / 2 - objWidth / 2,
        y: (bounds.minY + bounds.maxY) / 2 - objHeight / 2,
      };
    default:
      return { x: bounds.minX + padding, y: bounds.minY + padding };
  }
}

function findObjectIndex(plan: PlanData, objectName: string): number | "ambiguous" {
  const query = objectName.toLowerCase().trim();

  const exact = plan.objects
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => o.name.toLowerCase() === query);
  if (exact.length === 1) return exact[0].i;
  if (exact.length > 1) return "ambiguous";

  const includes = plan.objects
    .map((o, i) => ({ o, i }))
    .filter(
      ({ o }) =>
        o.name.toLowerCase().includes(query) ||
        query.includes(o.name.toLowerCase()) ||
        namesMatch(o.name, query) ||
        o.type.toLowerCase().includes(query.replace(/\s+/g, "_")),
    );

  if (includes.length === 0 && /стеллаж|полк/i.test(query)) {
    const shelves = plan.objects
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => o.type === "shelf" || o.type === "parcel_shelf");
    if (shelves.length === 1) return shelves[0].i;
    if (shelves.length > 1) return "ambiguous";
  }

  if (includes.length === 1) return includes[0].i;
  if (includes.length > 1) return "ambiguous";
  return -1;
}

function modifyPlan(
  plan: PlanData,
  userRequest: string,
): { plan: PlanData; message: string; movedObjectId?: string } | null {
  const parsed = parseMoveCommand(userRequest);
  if (!parsed) {
    console.warn("[modifyPlan] не разобрал команду:", userRequest);
    return null;
  }

  const objectName = parsed.objectName.toLowerCase().trim();
  const targetLocation = parsed.targetLocation.toLowerCase().trim();

  const objIndex = findObjectIndex(plan, objectName);
  if (objIndex === "ambiguous") {
    const candidates = plan.objects
      .filter(
        (o) =>
          o.name.toLowerCase().includes(objectName) ||
          namesMatch(o.name, objectName) ||
          (/стеллаж|полк/i.test(objectName) &&
            (o.type === "shelf" || o.type === "parcel_shelf")),
      )
      .map((o) => o.name)
      .slice(0, 5);
    return {
      plan,
      message: pick([
        `Нашёл несколько объектов по «${objectName}»: ${candidates.join(", ")}. Укажите точное название.`,
        `Уточните, какой именно: ${candidates.join(", ")}.`,
      ]),
    };
  }
  if (objIndex === -1) {
    return {
      plan,
      message: pick([
        `Не нашёл объект «${objectName}» на чертеже.`,
        `Объекта «${objectName}» в текущем плане нет. Проверьте имя на чертеже.`,
      ]),
    };
  }

  const obj = plan.objects[objIndex];
  const objW =
    typeof obj.width === "number"
      ? obj.width
      : (OBJECT_DEFAULT_SIZES[obj.type as ObjectType]?.width ?? 1);
  const objH =
    typeof obj.height === "number"
      ? obj.height
      : (OBJECT_DEFAULT_SIZES[obj.type as ObjectType]?.height ?? 1);

  // Относительные сдвиги: левее / правее / выше / ниже
  if (/^(левее|правее|выше|ниже)$/i.test(targetLocation)) {
    const step = 0.5;
    let newX = obj.x;
    let newY = obj.y;
    if (targetLocation === "левее") newX -= step;
    if (targetLocation === "правее") newX += step;
    if (targetLocation === "выше") newY -= step;
    if (targetLocation === "ниже") newY += step;
    newX = Math.max(0, Math.min(plan.room.width - objW, newX));
    newY = Math.max(0, Math.min(plan.room.height - objH, newY));
    const newObjects = [...plan.objects];
    newObjects[objIndex] = { ...obj, x: round(newX), y: round(newY) };
    return {
      plan: { ...plan, objects: newObjects, updatedAt: new Date().toISOString() },
      message: `✅ Сдвинул «${obj.name}» ${targetLocation}: (${round(newX).toFixed(1)}, ${round(newY).toFixed(1)}) м.`,
      movedObjectId: obj.id,
    };
  }

  const targetZoneId = findZoneIdByLocation(plan, targetLocation, obj.zoneId);
  if (!targetZoneId) {
    return { plan, message: `Не удалось определить зону для «${obj.name}».` };
  }

  const bounds = getZoneBounds(plan, targetZoneId);
  if (!bounds) return { plan, message: "Не нашёл зону для размещения." };

  const corner = findCornerKey(targetLocation);
  let newX: number;
  let newY: number;
  if (corner) {
    const pos = calculateCornerPosition(bounds, corner, objW, objH);
    newX = pos.x;
    newY = pos.y;
  } else {
    const pos = calculateCornerPosition(bounds, "центр", objW, objH);
    newX = pos.x;
    newY = pos.y;
  }

  newX = Math.max(0, Math.min(plan.room.width - objW, newX));
  newY = Math.max(0, Math.min(plan.room.height - objH, newY));

  const newObjects = [...plan.objects];
  newObjects[objIndex] = {
    ...obj,
    x: round(newX),
    y: round(newY),
    zoneId: targetZoneId,
  };
  const newPlan: PlanData = {
    ...plan,
    objects: newObjects,
    updatedAt: new Date().toISOString(),
  };
  const z = plan.zones.find((zn) => zn.id === targetZoneId);
  const zoneName = z?.name || "зоне";
  const where = corner ? `${corner} (${zoneName})` : zoneName;
  return {
    plan: newPlan,
    message: pick([
      `✅ Переместил «${obj.name}» в ${where}. Координаты: (${round(newX).toFixed(1)}, ${round(newY).toFixed(1)}) м.`,
      `✅ «${obj.name}» теперь в ${where} — (${round(newX).toFixed(1)}, ${round(newY).toFixed(1)}) м.`,
    ]),
    movedObjectId: obj.id,
  };
}

function getGeneralNormsAnswer(text: string): string | null {
  if (/минимальн.*ширин.*проход|проход.*минимальн|ширин.*прохода|проход.*1[.,]?2/i.test(text)) {
    return pick([
      `Согласно СП 59.13330.2020:\n\n1. **Минимальная ширина прохода** между кассовыми окнами и зоной ожидания — **не менее 1.2 м**.\n2. Основной проход к окнам — **от 1.5 м**.\n3. Перед каждым окном — свободная глубина ≥ 1.2 м.\n\n💡 Сначала разметьте проходы, потом остальное оборудование.`,
      `По доступности (СП 59.13330.2020) ориентиры такие:\n• проход у окон ≥ **1.2 м**\n• главный проход ≥ **1.5 м**\n• зона перед окном ≥ **1.2 м** в глубину\n\nЕсли на чертеже уже есть окна и ожидание — напишите «проверь проходы», разберу по факту.`,
    ]);
  }
  if (/оптимизац.*маленьк.*зал|совет.*маленьк.*зал|как оптимизировать|мало\s+места/i.test(text)) {
    return pick([
      `Для маленького зала (до ~40 м²):\n\n1. **Окна в одну линию** вдоль стены — центр свободен для очереди.\n2. **Многоярусные стеллажи** и совмещение стойки с терминалом.\n3. **Зоны без перегородок** — цвет пола/свет вместо стен.\n\n💡 Не пересекайте потоки «вход–выход» и «клиент–сотрудник».`,
      `Короткий чеклист для тесного ОПС:\n• окна — одной линейкой\n• ожидание — компактно, но ≥ 1.2 м до окон\n• хранение — глубже залов, не в клиентском проходе\n• 1 камера на зону минимум\n\nМогу собрать типовой план под ваши метры — напишите размер зала.`,
    ]);
  }
  if (/сколько\s+мест\s+ожидан|норм.*ожидан|кресл/i.test(text)) {
    return `Практический ориентир: **2 места ожидания на 1 кассовое окно**, но не меньше 4 на небольшое отделение. В час пик этого обычно хватает, если очередь электронная.`;
  }
  return null;
}

export function localReply(input: LocalInput): LocalReply {
  if (!onTopic(input)) {
    return {
      kind: "refuse",
      message: pick([
        "Я отвечаю только про чертёж и планировку отделения почтовой связи.",
        "Этот вопрос вне темы ОПС и раскладки зала. Спросите про зоны, окна, проходы или соберём план.",
      ]),
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }

  const text = corpus(input);
  const last = input.turns[input.turns.length - 1]?.text ?? "";
  const plan = input.plan;

  const generalAnswer = getGeneralNormsAnswer(last);
  if (generalAnswer) {
    return {
      kind: "answer",
      message: generalAnswer,
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }

  if (MODIFY.test(last) && plan) {
    const result = modifyPlan(plan, last);
    if (result) {
      return {
        kind: result.movedObjectId ? "plan" : "answer",
        message: result.message,
        questions: [],
        assumptions: [],
        plan: result.movedObjectId ? normalizePlan(result.plan) : null,
        highlightZones: [],
        highlightObjects: result.movedObjectId ? [result.movedObjectId] : [],
        highlightType: "info",
      };
    }
    // Попытка bare-move без глагола из MODIFY уже в parseMoveCommand;
    // если не вышло — подсказка с примерами
    return {
      kind: "answer",
      message: pick([
        "Не распознал команду. Примеры:\n• «Перемести стеллаж в верхний правый угол зоны хранения»\n• «Поставь сейф в угол офиса»\n• «Сдвинь окно левее»",
        "Нужна более чёткая команда. Например: «Подвинь стеллаж 1 в центр зоны хранения» или «Сейф в правый угол офисной зоны».",
      ]),
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }

  // Команда вида «сейф в угол…» без глагола из MODIFY
  if (plan && parseMoveCommand(last) && !wantsDesign(input)) {
    const result = modifyPlan(plan, last);
    if (result?.movedObjectId) {
      return {
        kind: "plan",
        message: result.message,
        questions: [],
        assumptions: [],
        plan: normalizePlan(result.plan),
        highlightZones: [],
        highlightObjects: [result.movedObjectId],
        highlightType: "info",
      };
    }
  }

  if (wantsAdvice(input) && plan) {
    const r = advice(plan);
    return {
      kind: "answer",
      message: r.message,
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: r.highlightZones,
      highlightObjects: r.highlightObjects,
      highlightType: r.highlightType,
    };
  }

  if (wantsDescription(input) && plan) {
    const r = describe(plan, last);
    return {
      kind: "answer",
      message: r.message,
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: r.highlightZones,
      highlightObjects: r.highlightObjects,
      highlightType: r.highlightType,
    };
  }

  if (!wantsDesign(input)) {
    if (!plan) {
      return {
        kind: "answer",
        message: pick([
          "Открытого чертежа нет. Опишите зал или приложите требования.",
          "Чертёж не открыт. Напишите размеры зала и число окон — соберу план.",
        ]),
        questions: [],
        assumptions: [],
        plan: null,
        highlightZones: [],
        highlightObjects: [],
        highlightType: "info",
      };
    }
    const r = describe(plan, last);
    return {
      kind: "answer",
      message: r.message,
      questions: [],
      assumptions: [],
      plan: null,
      highlightZones: r.highlightZones,
      highlightObjects: r.highlightObjects,
      highlightType: r.highlightType,
    };
  }

  const assume = ASSUME.test(text);
  const size = dimensions(text);
  const windows =
    countOf(text, /(\d+)\s*кассов\w*\s*окн\w*/i) ??
    countOf(text, /(\d+)\s*операционн\w*\s*окн\w*/i) ??
    countOf(text, /(\d+)\s*окон\s*обслуживан/i) ??
    countOf(text, /(\d+)\s*окн/i);
  const seats = countOf(text, /(\d+)\s*(?:мест\w*\s+ожидан\w*|кресел|кресла|скамей)/i);
  const shelves = countOf(text, /(\d+)\s*стеллаж/i);
  const mentioned = EQUIPMENT.filter((item) => item.pattern.test(text)).map((item) => item.type);
  const hasEquipment =
    windows !== null ||
    seats !== null ||
    shelves !== null ||
    mentioned.length > 0 ||
    /оборудован/i.test(text);

  const questions: string[] = [];
  if (!size && !assume) questions.push("Какие длина и ширина зала в метрах?");
  if (windows === null && !hasEquipment && !assume)
    questions.push("Сколько кассовых окон и какое оборудование обязательно должно стоять?");

  if (questions.length) {
    return {
      kind: "clarify",
      message: `Чтобы собрать чертёж, не хватает данных:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      questions,
      assumptions: [],
      plan: null,
      highlightZones: [],
      highlightObjects: [],
      highlightType: "info",
    };
  }

  const assumptions: string[] = [];
  const width = size?.width ?? 14;
  const height = size?.height ?? 9;
  const windowCount = windows ?? 3;

  if (!size) assumptions.push("Зал 14×9 м — типовое небольшое отделение.");
  if (windows === null) assumptions.push(`Кассовых окон: ${windowCount}.`);
  if (seats === null) assumptions.push("Места ожидания — по два на каждое окно.");
  if (shelves === null)
    assumptions.push("В хранении четыре стеллажа, стол сортировки и сейф в офисе.");

  const draft = buildPlan({
    name: /отделен[^n]{0,40}/i.exec(input.materials)?.[0]?.trim() || "Проект отделения по требованиям",
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
      ? pick([
          `✅ Собрал чертёж «${normalized.name}»: ${normalized.room.width}×${normalized.room.height} м, ${normalized.zones.length} зон, ${normalized.objects.length} объектов.`,
          `✅ Готово: «${normalized.name}», зал ${normalized.room.width}×${normalized.room.height} м — ${normalized.objects.length} объектов в ${normalized.zones.length} зонах.`,
        ])
      : "Не удалось собрать чертёж.",
    questions: [],
    assumptions,
    plan: normalized,
    highlightZones: [],
    highlightObjects: [],
    highlightType: "info",
  };
}