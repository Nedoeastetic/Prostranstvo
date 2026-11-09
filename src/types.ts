export interface Point {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  width: number; // в метрах
  height: number; // в метрах
  walls: Point[]; // внешние стены
}

export interface FunctionalZone {
  id: string;
  name: string;
  type: ZoneType;
  points: Point[]; // полигон зоны
  color: string;
}

export type ZoneType =
  | 'service'
  | 'storage'
  | 'office'
  | 'waiting'
  | 'technical'
  | 'entrance'
  | 'corridor';

export type ObjectType =
  | 'workplace'
  | 'cash_window'
  | 'terminal'
  | 'printer'
  | 'shelf'
  | 'waiting_seat'
  | 'camera'
  | 'engineering'
  | 'counter'
  | 'safe'
  | 'sorting_table'
  | 'custom'
  | 'payment_terminal'
  | 'mailbox'
  | 'queue_terminal'
  | 'info_board'
  | 'media_panel'
  | 'bench'
  | 'desk_cutout'
  | 'chair'
  | 'computer'
  | 'cash_terminal'
  | 'mfp_printer'
  | 'label_printer'
  | 'security_system'
  | 'fire_alarm'
  | 'socket'
  | 'parcel_shelf'
  | 'scales'
  | 'goods_shelf'
  | 'info_stand'
  | 'ramp';

export interface CustomObjectType {
  id: string;
  name: string;
  icon: string; // SVG path или emoji
  defaultWidth: number;
  defaultHeight: number;
  defaultColor: string;
  category: string;
}

export interface EquipmentObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number; // позиция в метрах
  y: number;
  width: number; // в метрах
  height: number;
  rotation: number; // градусы
  zoneId: string | null;
  attributes: Record<string, string>;
  color: string;
}

export interface PlanData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  room: Room;
  zones: FunctionalZone[];
  objects: EquipmentObject[];
}

export interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  objectId?: string;
  zoneId?: string;
  position?: Point;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  affectedZones: string[];
  affectedObjects: string[];
  impact: string;
  assumption?: string;
  action?: {
    type: 'add_object' | 'move_object' | 'remove_object' | 'add_zone';
    data: any;
  };
}

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  service: 'Зона обслуживания',
  storage: 'Зона хранения',
  office: 'Офисная зона',
  waiting: 'Зона ожидания',
  technical: 'Техническая зона',
  entrance: 'Входная группа',
  corridor: 'Коридор',
};

export const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  service: '#3B82F6',
  storage: '#8B5CF6',
  office: '#10B981',
  waiting: '#F59E0B',
  technical: '#6B7280',
  entrance: '#EC4899',
  corridor: '#94A3B8',
};

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  workplace: 'Рабочее место',
  cash_window: 'Кассовое окно',
  terminal: 'Терминал',
  printer: 'Принтер',
  shelf: 'Стеллаж',
  waiting_seat: 'Место ожидания',
  camera: 'Камера видеонаблюдения',
  engineering: 'Инженерное оборудование',
  counter: 'Стойка',
  safe: 'Сейф',
  sorting_table: 'Стол сортировки',
  custom: 'Пользовательский объект',
  payment_terminal: 'Стойка с терминалом оплаты',
  mailbox: 'Почтовый ящик',
  queue_terminal: 'Терминал управления очередью',
  info_board: 'Информационное табло',
  media_panel: 'Медиапанель',
  bench: 'Скамья',
  desk_cutout: 'Рабочий стол с выемкой',
  chair: 'Кресло',
  computer: 'Компьютер',
  cash_terminal: 'Кассовый терминал',
  mfp_printer: 'Принтер / МФУ',
  label_printer: 'Принтер для этикеток',
  security_system: 'Охранно-тревожная сигнализация',
  fire_alarm: 'Пожарная сигнализация',
  socket: 'Розетка',
  parcel_shelf: 'Шкаф для посылок',
  scales: 'Весы',
  goods_shelf: 'Стеллаж для товаров',
  info_stand: 'Информационный стенд',
  ramp: 'Пандус',
};

export const OBJECT_TYPE_ICONS: Record<ObjectType, string> = {
  workplace: '🖥️',
  cash_window: '💰',
  terminal: '🖳',
  printer: '🖨️',
  shelf: '📦',
  waiting_seat: '💺',
  camera: '📹',
  engineering: '⚙️',
  counter: '🪑',
  safe: '🔒',
  sorting_table: '📋',
  custom: '🔷',
  payment_terminal: '💳',
  mailbox: '📮',
  queue_terminal: '🎫',
  info_board: '📺',
  media_panel: '📱',
  bench: '🪑',
  desk_cutout: '🗄️',
  chair: '💺',
  computer: '💻',
  cash_terminal: '🖥️',
  mfp_printer: '🖨️',
  label_printer: '🏷️',
  security_system: '🚨',
  fire_alarm: '🔥',
  socket: '🔌',
  parcel_shelf: '📦',
  scales: '⚖️',
  goods_shelf: '🛍️',
  info_stand: 'ℹ️',
  ramp: '♿',
};

export const OBJECT_DEFAULT_SIZES: Record<ObjectType, { width: number; height: number }> = {
  workplace: { width: 1.4, height: 0.8 },
  cash_window: { width: 1.2, height: 0.7 },
  terminal: { width: 0.5, height: 0.5 },
  printer: { width: 0.6, height: 0.5 },
  shelf: { width: 1.5, height: 0.5 },
  waiting_seat: { width: 0.5, height: 0.5 },
  camera: { width: 0.3, height: 0.3 },
  engineering: { width: 0.8, height: 0.6 },
  counter: { width: 2.0, height: 0.6 },
  safe: { width: 0.6, height: 0.5 },
  sorting_table: { width: 2.0, height: 1.0 },
  custom: { width: 1.0, height: 1.0 },
  payment_terminal: { width: 0.6, height: 0.5 },
  mailbox: { width: 0.4, height: 0.6 },
  queue_terminal: { width: 0.5, height: 0.5 },
  info_board: { width: 1.2, height: 0.1 },
  media_panel: { width: 1.0, height: 0.1 },
  bench: { width: 1.5, height: 0.5 },
  desk_cutout: { width: 1.4, height: 0.8 },
  chair: { width: 0.5, height: 0.5 },
  computer: { width: 0.5, height: 0.4 },
  cash_terminal: { width: 0.4, height: 0.3 },
  mfp_printer: { width: 0.6, height: 0.5 },
  label_printer: { width: 0.4, height: 0.3 },
  security_system: { width: 0.3, height: 0.3 },
  fire_alarm: { width: 0.2, height: 0.2 },
  socket: { width: 0.1, height: 0.1 },
  parcel_shelf: { width: 1.5, height: 0.5 },
  scales: { width: 0.5, height: 0.5 },
  goods_shelf: { width: 1.2, height: 0.5 },
  info_stand: { width: 0.8, height: 0.4 },
  ramp: { width: 1.2, height: 2.0 },
};

export const OBJECT_DEFAULT_COLORS: Record<ObjectType, string> = {
  workplace: '#2563EB',
  cash_window: '#DC2626',
  terminal: '#7C3AED',
  printer: '#059669',
  shelf: '#D97706',
  waiting_seat: '#DB2777',
  camera: '#4B5563',
  engineering: '#64748B',
  counter: '#0891B2',
  safe: '#1E293B',
  sorting_table: '#65A30D',
  custom: '#6366F1',
  payment_terminal: '#7C3AED',
  mailbox: '#DC2626',
  queue_terminal: '#F59E0B',
  info_board: '#3B82F6',
  media_panel: '#8B5CF6',
  bench: '#DB2777',
  desk_cutout: '#2563EB',
  chair: '#6B7280',
  computer: '#1E40AF',
  cash_terminal: '#DC2626',
  mfp_printer: '#059669',
  label_printer: '#059669',
  security_system: '#EF4444',
  fire_alarm: '#F97316',
  socket: '#6B7280',
  parcel_shelf: '#D97706',
  scales: '#64748B',
  goods_shelf: '#D97706',
  info_stand: '#3B82F6',
  ramp: '#94A3B8',
};

