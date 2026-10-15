import type { Product } from './schema';

export type Demo = NonNullable<Product['demo']>;

export interface DemoState {
  // One entry per breakdown this shift, oldest first: reason id, or null while unexplained
  stops: (string | null)[];
  // True while the line is stopped; it closes when the operator restarts the line
  open: boolean;
}

export const INITIAL_STATE: DemoState = { stops: [], open: false };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

// Reason of the breakdown that is open or was last recorded
export function currentReason(state: DemoState): string | null {
  return state.stops.length ? state.stops[state.stops.length - 1] : null;
}

// Apply SPEC §6 formulas: A = (shift - planned - unplanned) / (shift - planned)
export function computeMetrics(demo: Demo, state: DemoState) {
  const seed = demo.seedEvents;
  // Each breakdown counts as planned only when its reason is planned; unexplained counts as unplanned
  const faults = state.stops.map((id) => demo.reasons.find((item) => item.id === id));
  const faultPlanned = sum(faults.filter((reason) => reason?.planned).map(() => demo.fault.minutes));
  const faultUnplanned = sum(faults.filter((reason) => !reason?.planned).map(() => demo.fault.minutes));
  const planned = sum(seed.filter((e) => e.planned).map((e) => e.minutes)) + faultPlanned;
  const unplanned = sum(seed.filter((e) => !e.planned).map((e) => e.minutes)) + faultUnplanned;

  const availability = (demo.shiftMinutes - planned - unplanned) / (demo.shiftMinutes - planned);
  const oee = availability * demo.performance * demo.quality;

  return {
    availability: (availability * 100).toFixed(1),
    performance: (demo.performance * 100).toFixed(1),
    quality: (demo.quality * 100).toFixed(1),
    oee: (oee * 100).toFixed(1),
    planned,
    unplanned,
  };
}

// Machine 2 stays Faulted while a breakdown is open
export function machineStatus(demo: Demo, state: DemoState, machineName: string): 'running' | 'faulted' {
  const faulted = state.open && machineName === demo.fault.machine;
  return faulted ? 'faulted' : 'running';
}

export function messageKey(demo: Demo, state: DemoState): keyof Demo['messages'] {
  if (!state.open) return state.stops.length ? 'restarted' : 'idle';
  if (currentReason(state) === null) return 'unknown';
  return 'restart';
}

// Time of the nth breakdown of the shift: the first at fault.time, then every fault.repeatEvery minutes
export function faultTime(demo: Demo, index: number): string {
  const [hours, minutes] = demo.fault.time.split(':').map(Number);
  const total = hours * 60 + minutes + index * demo.fault.repeatEvery;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
