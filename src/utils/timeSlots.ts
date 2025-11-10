// Generador simple de horarios por día en horario LOCAL
// Configurable por variables de entorno, con valores por defecto.

export interface SlotConfig {
  dateYMD: string; // YYYY-MM-DD en horario local
  openHour?: number; // hora de apertura (0-23)
  closeHour?: number; // hora de cierre (0-23, exclusivo)
  intervalMinutes?: number; // intervalo entre slots
  closedWeekdays?: number[]; // días cerrados (0=Domingo ... 6=Sábado)
}

export function generateSlots(cfg: SlotConfig): string[] {
  const {
    dateYMD,
    openHour = Number(process.env.NEXT_PUBLIC_OPEN_HOUR ?? 9),
    closeHour = Number(process.env.NEXT_PUBLIC_CLOSE_HOUR ?? 19),
    intervalMinutes = Number(process.env.NEXT_PUBLIC_SLOT_MINUTES ?? 60),
    closedWeekdays = readClosedWeekdaysFromEnv(process.env.NEXT_PUBLIC_CLOSED_WEEKDAYS) ?? [0],
  } = cfg;

  // Parsear YYYY-MM-DD en horario local
  const [yy, mm, dd] = dateYMD.split("-").map((v) => parseInt(v, 10));
  const base = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
  const wd = base.getDay();
  if (closedWeekdays.includes(wd)) return [];

  const slots: string[] = [];
  const start = new Date(base);
  start.setHours(openHour, 0, 0, 0);
  const end = new Date(base);
  end.setHours(closeHour, 0, 0, 0);

  const cur = new Date(start);
  while (cur < end) {
    const hh = String(cur.getHours()).padStart(2, "0");
    const mmStr = String(cur.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mmStr}`);
    cur.setMinutes(cur.getMinutes() + intervalMinutes);
  }

  return slots;
}

export function isPastSlot(dateYMD: string, timeHHMM: string): boolean {
  try {
    const [yy, mm, dd] = dateYMD.split("-").map((v) => parseInt(v, 10));
    const [hh, mi] = timeHHMM.split(":").map((v) => parseInt(v, 10));
    const d = new Date(yy, mm - 1, dd, hh, mi, 0, 0);
    return d.getTime() < Date.now();
  } catch {
    return false;
  }
}

function readClosedWeekdaysFromEnv(val?: string): number[] | null {
  if (!val) return null;
  try {
    const parts = String(val).split(/[,\s]+/).filter(Boolean);
    const nums = parts.map((p) => {
      const n = parseInt(p, 10);
      return isNaN(n) ? null : Math.max(0, Math.min(6, n));
    }).filter((n): n is number => n !== null);
    return nums.length ? nums : null;
  } catch {
    return null;
  }
}