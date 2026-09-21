import { ObjectType } from '../types';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function drawWorkplace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.2;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Monitor
  ctx.strokeRect(pad, pad, iw, ih * 0.65);
  // Stand
  ctx.beginPath();
  ctx.moveTo(w / 2, pad + ih * 0.65);
  ctx.lineTo(w / 2, pad + ih * 0.85);
  ctx.stroke();
  // Base
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.25, pad + ih * 0.85);
  ctx.lineTo(pad + iw * 0.75, pad + ih * 0.85);
  ctx.stroke();
}

function drawCashWindow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.2;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad, iw, ih);
  // Divider line
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih * 0.35);
  ctx.lineTo(pad + iw, pad + ih * 0.35);
  ctx.stroke();
  // Circle
  ctx.beginPath();
  ctx.arc(w / 2, pad + ih * 0.65, Math.min(iw, ih) * 0.12, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTerminal(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.2;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad, iw, ih);
  // Screen lines
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.15, pad + ih * 0.25);
  ctx.lineTo(pad + iw * 0.85, pad + ih * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.15, pad + ih * 0.5);
  ctx.lineTo(pad + iw * 0.85, pad + ih * 0.5);
  ctx.stroke();
  // Button
  ctx.beginPath();
  ctx.arc(w / 2, pad + ih * 0.78, Math.min(iw, ih) * 0.08, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPrinter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Top tray
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.2, pad);
  ctx.lineTo(pad + iw * 0.2, pad + ih * 0.3);
  ctx.lineTo(pad + iw * 0.8, pad + ih * 0.3);
  ctx.lineTo(pad + iw * 0.8, pad);
  ctx.stroke();
  // Body
  ctx.strokeRect(pad, pad + ih * 0.3, iw, ih * 0.45);
  // Output tray
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.2, pad + ih * 0.75);
  ctx.lineTo(pad + iw * 0.2, pad + ih);
  ctx.lineTo(pad + iw * 0.8, pad + ih);
  ctx.lineTo(pad + iw * 0.8, pad + ih * 0.75);
  ctx.stroke();
}

function drawShelf(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Outer
  ctx.strokeRect(pad, pad, iw, ih);
  // Shelves
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih * 0.33);
  ctx.lineTo(pad + iw, pad + ih * 0.33);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih * 0.66);
  ctx.lineTo(pad + iw, pad + ih * 0.66);
  ctx.stroke();
}

function drawWaitingSeat(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.2;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Back
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.15, pad + ih);
  ctx.lineTo(pad + iw * 0.15, pad + ih * 0.2);
  ctx.arc(w / 2, pad + ih * 0.2, iw * 0.35, Math.PI, 0);
  ctx.lineTo(pad + iw * 0.85, pad + ih);
  ctx.stroke();
  // Seat line
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih);
  ctx.lineTo(pad + iw, pad + ih);
  ctx.stroke();
}

function drawCamera(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad + ih * 0.2, iw * 0.7, ih * 0.6);
  // Lens triangle
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.7, pad + ih * 0.3);
  ctx.lineTo(pad + iw, pad + ih * 0.15);
  ctx.lineTo(pad + iw, pad + ih * 0.85);
  ctx.lineTo(pad + iw * 0.7, pad + ih * 0.7);
  ctx.stroke();
}

function drawEngineering(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.25;
  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  // Gear teeth
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * r * 0.55;
    const y1 = cy + Math.sin(angle) * r * 0.55;
    const x2 = cx + Math.cos(angle) * r;
    const y2 = cy + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawCounter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad, iw, ih);
  // Middle line
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih * 0.5);
  ctx.lineTo(pad + iw, pad + ih * 0.5);
  ctx.stroke();
}

function drawSafe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad, iw, ih);
  // Dial
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(iw, ih) * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  // Cross
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2 - Math.min(iw, ih) * 0.15);
  ctx.lineTo(w / 2, h / 2 + Math.min(iw, ih) * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2 - Math.min(iw, ih) * 0.15, h / 2);
  ctx.lineTo(w / 2 + Math.min(iw, ih) * 0.15, h / 2);
  ctx.stroke();
}

function drawSortingTable(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  // Body
  ctx.strokeRect(pad, pad, iw, ih);
  // Dividers
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.33, pad);
  ctx.lineTo(pad + iw * 0.33, pad + ih);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad + iw * 0.66, pad);
  ctx.lineTo(pad + iw * 0.66, pad + ih);
  ctx.stroke();
}

function drawCustom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = Math.min(w, h) * 0.15;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const cx = w / 2;
  const cy = h / 2;
  // Hexagon
  ctx.beginPath();
  ctx.moveTo(cx, pad);
  ctx.lineTo(pad + iw, pad + ih * 0.25);
  ctx.lineTo(pad + iw, pad + ih * 0.75);
  ctx.lineTo(cx, pad + ih);
  ctx.lineTo(pad, pad + ih * 0.75);
  ctx.lineTo(pad, pad + ih * 0.25);
  ctx.closePath();
  ctx.stroke();
  // Center lines
  ctx.beginPath();
  ctx.moveTo(cx, pad);
  ctx.lineTo(cx, pad + ih);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad, pad + ih * 0.25);
  ctx.lineTo(pad + iw, pad + ih * 0.25);
  ctx.stroke();
}

const iconDrawers: Record<ObjectType, DrawFn> = {
  workplace: drawWorkplace,
  cash_window: drawCashWindow,
  terminal: drawTerminal,
  printer: drawPrinter,
  shelf: drawShelf,
  waiting_seat: drawWaitingSeat,
  camera: drawCamera,
  engineering: drawEngineering,
  counter: drawCounter,
  safe: drawSafe,
  sorting_table: drawSortingTable,
  custom: drawCustom,
};

export function drawObjectIcon(
  ctx: CanvasRenderingContext2D,
  type: ObjectType,
  w: number,
  h: number,
  color: string = '#ffffff'
) {
  const drawer = iconDrawers[type];
  if (!drawer) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawer(ctx, w, h);
  ctx.restore();
}
