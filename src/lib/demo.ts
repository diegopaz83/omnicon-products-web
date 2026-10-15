import type { Product } from './schema';

export type Demo = NonNullable<Product['demo']>;

export interface DemoState {
  fault: boolean;
  // Id from demo.reasons, or null while the stop is unexplained
  reason: string | null;
  // True once the operator restarts the line; the stop stays in the log
  restarted: boolean;
}

export const INITIAL_STATE: DemoState = { fault: false, reason: null, restarted: false };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

// Apply SPEC §6 formulas: A = (shift - planned - unplanned) / (shift - planned)
export function computeMetrics(demo: Demo, state: DemoState) {
  const reason = demo.reasons.find((item) => item.id === state.reason);
  const seed = demo.seedEvents;
  // An unexplained stop counts as unplanned until a person picks a reason
  const faultPlanned = state.fault && reason?.planned ? demo.fault.minutes : 0;
  const faultUnplanned = state.fault && !reason?.planned ? demo.fault.minutes : 0;
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

// Machine 2 stays Faulted until the operator restarts the line
export function machineStatus(demo: Demo, state: DemoState, machineName: string): 'running' | 'faulted' {
  const faulted = state.fault && !state.restarted && machineName === demo.fault.machine;
  return faulted ? 'faulted' : 'running';
}

export function messageKey(demo: Demo, state: DemoState): keyof Demo['messages'] {
  if (!state.fault) return 'idle';
  if (!state.reason) return 'unknown';
  return state.restarted ? 'restarted' : 'restart';
}
