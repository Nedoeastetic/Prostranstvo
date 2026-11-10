import type { PlanData } from "./types";

export function normalizePlan(draft: any): PlanData | null {
  if (!draft || !draft.room || !draft.room.width || !draft.room.height) {
    return null;
  }

  const width = Number(draft.room.width);
  const height = Number(draft.room.height);

  if (width <= 0 || height <= 0) return null;

  const zones = (draft.zones || []).map((z: any, i: number) => ({
    id: z.id || `zone-${i + 1}`,
    name: z.name || `Зона ${i + 1}`,
    type: z.type || "corridor",
    points: (z.points || []).map((p: any) => ({
      x: Math.max(0, Math.min(width, Number(p.x) || 0)),
      y: Math.max(0, Math.min(height, Number(p.y) || 0)),
    })),
    color: z.color || undefined,
  }));

  const objects = (draft.objects || []).map((obj: any, i: number) => {
    const w = Math.max(0.2, Number(obj.width) || 0.5);
    const h = Math.max(0.2, Number(obj.height) || 0.5);
    const x = Math.max(0, Math.min(width - w, Number(obj.x) || 0));
    const y = Math.max(0, Math.min(height - h, Number(obj.y) || 0));
    
    return {
      id: obj.id || `obj-${i + 1}`,
      type: obj.type || "workplace",
      name: obj.name || "Объект",
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(w * 10) / 10,
      height: Math.round(h * 10) / 10,
      rotation: [0, 90, 180, 270].includes(Number(obj.rotation)) ? Number(obj.rotation) : 0,
      zoneId: obj.zoneId || null,
      attributes: obj.attributes || {},
    };
  });

  return {
    id:
      draft.id || 
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    name: draft.name || "Новый чертёж",
    room: {
      id: draft.room.id || "room-1",
      name: draft.room.name || "Зал",
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      walls: draft.room.walls || [],
    },
    zones,
    objects,
    createdAt: draft.createdAt || new Date().toISOString(), // Добавлено
    updatedAt: draft.updatedAt || new Date().toISOString(), // Добавлено
  };
}