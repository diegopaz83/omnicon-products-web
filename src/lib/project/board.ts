import type { Project } from '../schema';

// Pure state and actions for the project control room; no DOM access
export type Activity = Project['activities'][number];
export type Phase = Project['phases'][number];
export type Question = Project['questions'][number];
export type Node = Project['architecture'][number];
export type LogType = Activity['log'][number]['type'];
export type Status = Activity['status'];

export type Modal =
  | { kind: 'view'; id: string }
  | { kind: 'log'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'new' }
  | { kind: 'phase'; id: string | null }
  | { kind: 'delete'; target: 'phase' | 'act'; id: string };

export interface Form {
  text: string;
  name: string;
  def: string;
  sys: Activity['systems'];
  pName: string;
  pGoal: string;
}

export interface State {
  phases: Phase[];
  activities: Activity[];
  questions: Question[];
  // Question numbers in display order
  order: number[];
  filter: 'all' | 'open' | 'dec';
  phase: string;
  node: string;
  menu: string | null;
  modal: Modal | null;
  form: Form;
  entryType: LogType;
  newQuestion: string;
  // Activity id for new questions; empty means the whole project
  newActivity: string;
  nextNum: number;
  seq: number;
  undo: { question: Question; index: number } | null;
  error: string | null;
  today: string;
}

export const WEIGHT: Record<Status, number> = { complete: 1, progress: 0.5, idle: 0 };
export const LOG_TYPES: LogType[] = ['Definition', 'Update', 'Decision', 'Blocker'];
const NEXT: Record<Status, Status> = { idle: 'progress', progress: 'complete', complete: 'idle' };

export const isOpen = (q: Question) => q.answer.trim() === '';

// Open questions first, then by number; called only when the list changes, never while typing
export function sortRows(list: Question[]): number[] {
  return list
    .slice()
    .sort((x, y) => (Number(isOpen(x)) - Number(isOpen(y))) || (x.num - y.num))
    .map((q) => q.num);
}

const matches = (filter: State['filter'], q: Question) =>
  filter === 'all' ? true : filter === 'open' ? isOpen(q) : q.decision && !isOpen(q);

function reorder(s: State, filter = s.filter): State {
  return { ...s, filter, order: sortRows(s.questions.filter((q) => matches(filter, q))) };
}

export function createState(project: Project): State {
  const started = project.activities.find((a) => a.status === 'progress');
  const phase = started?.phase ?? project.phases[0]?.id ?? '';
  const state: State = {
    phases: project.phases.map((p) => ({ ...p })),
    activities: project.activities.map((a) => ({ ...a, systems: [...a.systems], log: [...a.log] })),
    questions: project.questions.map((q) => ({ ...q })),
    order: [],
    filter: 'all',
    phase,
    node: project.architecture.find((n) => n.id === 'core')?.id ?? project.architecture[0]?.id ?? '',
    menu: null,
    modal: null,
    form: { text: '', name: '', def: '', sys: [], pName: '', pGoal: '' },
    entryType: 'Update',
    newQuestion: '',
    newActivity: '',
    nextNum: Math.max(0, ...project.questions.map((q) => q.num)) + 1,
    seq: 100,
    undo: null,
    error: null,
    today: project.meta.updated,
  };
  return reorder(state);
}

// Visible question rows in display order
export function visibleRows(s: State): Question[] {
  const byNum = new Map(s.questions.map((q) => [q.num, q]));
  return s.order.map((num) => byNum.get(num)).filter((q): q is Question => Boolean(q));
}

export function phaseOf(s: State, id: string | null | undefined): Phase | undefined {
  return s.phases.find((p) => p.id === id);
}

export function activityOf(s: State, id: string | null | undefined): Activity | undefined {
  return s.activities.find((a) => a.id === id);
}

// Derived counts and health used by the header, phases and activities
export function derive(s: State) {
  const counts: Record<Status, number> = { idle: 0, progress: 0, complete: 0 };
  let weight = 0;
  let logs = 0;
  for (const a of s.activities) {
    counts[a.status] += 1;
    weight += WEIGHT[a.status];
    logs += a.log.length;
  }
  const total = s.activities.length;
  const open = s.questions.filter(isOpen).length;
  const atRisk = s.activities.filter(
    (a) => a.status === 'progress' && s.questions.some((q) => q.activity === a.id && isOpen(q)),
  ).length;
  const phases = s.phases.map((phase, index) => {
    const list = s.activities.filter((a) => a.phase === phase.id);
    const done = list.filter((a) => a.status === 'complete').length;
    const prog = list.filter((a) => a.status === 'progress').length;
    const w = list.reduce((sum, a) => sum + WEIGHT[a.status], 0);
    const key: Status = list.length && done === list.length ? 'complete' : prog > 0 || done > 0 ? 'progress' : 'idle';
    return {
      phase,
      index,
      list,
      done,
      prog,
      pct: list.length ? Math.round((w / list.length) * 100) : 0,
      key,
      idle: Math.max(list.length - done - prog, list.length ? 0 : 1),
    };
  });
  return {
    counts,
    total,
    logs,
    pct: total ? Math.round((weight / total) * 100) : 0,
    open,
    atRisk,
    phases,
    phasesDone: phases.filter((p) => p.list.length && p.done === p.list.length).length,
  };
}

export function toggleMenu(s: State, id: string): State {
  return { ...s, menu: s.menu === id ? null : id };
}

export function selectPhase(s: State, id: string): State {
  return { ...s, phase: id, menu: null };
}

export function selectNode(s: State, id: string): State {
  return { ...s, node: id };
}

export function setFilter(s: State, filter: State['filter']): State {
  return reorder(s, filter);
}

export function cycleActivity(s: State, id: string): State {
  return {
    ...s,
    menu: null,
    activities: s.activities.map((a) => (a.id === id ? { ...a, status: NEXT[a.status] } : a)),
  };
}

export function resetActivity(s: State, id: string): State {
  return { ...s, menu: null, activities: s.activities.map((a) => (a.id === id ? { ...a, status: 'idle' } : a)) };
}

export function movePhase(s: State, id: string, delta: number): State {
  const index = s.phases.findIndex((p) => p.id === id);
  const target = index + delta;
  const phases = s.phases.slice();
  if (index >= 0 && target >= 0 && target < phases.length) {
    [phases[index], phases[target]] = [phases[target], phases[index]];
  }
  return { ...s, phases, menu: null };
}

// Form values are set without re-rendering so typing keeps its focus
export function setForm(s: State, patch: Partial<Form>): State {
  return { ...s, form: { ...s.form, ...patch }, error: null };
}

export function openModal(s: State, modal: Modal): State {
  const form: Form = { text: '', name: '', def: '', sys: [], pName: '', pGoal: '' };
  if (modal.kind === 'edit') {
    const a = activityOf(s, modal.id);
    if (a) Object.assign(form, { name: a.name, def: a.definition, sys: [...a.systems] });
  } else if (modal.kind === 'new') {
    // Blank form
  } else if (modal.kind === 'phase' && modal.id) {
    const p = phaseOf(s, modal.id);
    if (p) Object.assign(form, { pName: p.name, pGoal: p.goal });
  }
  return { ...s, modal, form, menu: null, error: null };
}

export function closeModal(s: State): State {
  return { ...s, modal: null, form: { ...s.form, text: '' }, error: null };
}

export function saveLog(s: State, id: string): State {
  const text = s.form.text.trim();
  if (!text) return { ...s, error: 'errEntry' };
  const entry = { date: s.today, type: s.entryType, text };
  const activities = s.activities.map((a) => (a.id === id ? { ...a, log: [entry, ...a.log] } : a));
  return { ...s, activities, modal: { kind: 'view', id }, form: { ...s.form, text: '' }, error: null };
}

// Save a new or edited activity in the selected phase
export function saveActivity(s: State, modal: Modal): State {
  const name = s.form.name.trim();
  if (!name) return { ...s, error: 'errName' };
  const def = s.form.def.trim();
  if (modal.kind === 'new') {
    const activity: Activity = {
      id: `n${s.seq}`,
      phase: s.phase,
      name,
      status: 'idle',
      systems: [...s.form.sys],
      definition: def,
      log: [],
    };
    return closeModal({ ...s, activities: [...s.activities, activity], seq: s.seq + 1 });
  }
  if (modal.kind === 'edit') {
    const activities = s.activities.map((a) =>
      a.id === modal.id ? { ...a, name, definition: def, systems: [...s.form.sys] } : a,
    );
    return closeModal({ ...s, activities });
  }
  return s;
}

// Save a new or edited phase; a new phase becomes the selected one
export function savePhase(s: State, id: string | null): State {
  const name = s.form.pName.trim();
  if (!name) return { ...s, error: 'errPhase' };
  const goal = s.form.pGoal.trim();
  if (id) {
    return closeModal({
      ...s,
      phases: s.phases.map((p) => (p.id === id ? { ...p, name, goal } : p)),
    });
  }
  const phaseId = `ph${s.seq}`;
  return closeModal({
    ...s,
    phases: [...s.phases, { id: phaseId, name, goal }],
    phase: phaseId,
    seq: s.seq + 1,
  });
}

// Remove a phase with its activities; linked questions stay, without an activity
export function deletePhase(s: State, id: string): State {
  const gone = new Set(s.activities.filter((a) => a.phase === id).map((a) => a.id));
  const phases = s.phases.filter((p) => p.id !== id);
  return closeModal({
    ...s,
    phases,
    activities: s.activities.filter((a) => a.phase !== id),
    questions: s.questions.map((q) => (q.activity && gone.has(q.activity) ? { ...q, activity: null } : q)),
    phase: s.phase === id ? (phases[0]?.id ?? '') : s.phase,
  });
}

export function deleteActivity(s: State, id: string): State {
  return closeModal({
    ...s,
    activities: s.activities.filter((a) => a.id !== id),
    questions: s.questions.map((q) => (q.activity === id ? { ...q, activity: null } : q)),
  });
}

// Preset the activity in the new-question row and show the filter that includes it
export function raiseQuestion(s: State, activityId: string): State {
  return { ...reorder({ ...s, filter: 'all' }, 'all'), newActivity: activityId, menu: null };
}

export function setNewQuestion(s: State, text: string): State {
  return { ...s, newQuestion: text };
}

export function setNewActivity(s: State, id: string): State {
  return { ...s, newActivity: id };
}

// Answer changes derive status: empty answer means Open, and it clears the decision
export function patchQuestion(s: State, num: number, patch: Partial<Question>): State {
  const questions = s.questions.map((q) => {
    if (q.num !== num) return q;
    const next = { ...q, ...patch };
    const answered = next.answer.trim() !== '';
    return {
      ...next,
      answered: answered ? (next.answered ?? s.today) : null,
      decision: answered ? next.decision : false,
    };
  });
  return { ...s, questions };
}

export function toggleDecision(s: State, num: number): State {
  const q = s.questions.find((item) => item.num === num);
  if (!q || isOpen(q)) return s;
  return patchQuestion(s, num, { decision: !q.decision });
}

// Add one row per item; the row takes the activity chosen in the new-question row
export function addQuestions(s: State, items: { question: string; answer: string }[]): State {
  let num = s.nextNum;
  const made: Question[] = items.map((item) => {
    const answer = item.answer.trim();
    return {
      num: num++,
      question: item.question.trim(),
      answer,
      activity: s.newActivity || null,
      decision: false,
      asked: s.today,
      answered: answer ? s.today : null,
    };
  });
  return reorder({ ...s, questions: [...s.questions, ...made], nextNum: num, newQuestion: '', undo: null });
}

export function deleteQuestion(s: State, num: number): State {
  const index = s.questions.findIndex((q) => q.num === num);
  if (index < 0) return s;
  const question = s.questions[index];
  return reorder({
    ...s,
    questions: s.questions.filter((q) => q.num !== num),
    undo: { question, index },
  });
}

export function restoreQuestion(s: State): State {
  if (!s.undo) return s;
  const questions = s.questions.slice();
  questions.splice(Math.min(s.undo.index, questions.length), 0, s.undo.question);
  return reorder({ ...s, questions, undo: null });
}

export function dismissUndo(s: State): State {
  return { ...s, undo: null };
}

// Split pasted text into rows: one question per line, tab-separated answer; null means not a multi-row paste
export function parsePaste(text: string): { question: string; answer: string }[] | null {
  if (text.indexOf('\n') < 0 && text.indexOf('\t') < 0) return null;
  const rows = text
    .split(/\r?\n/)
    .map((line) => {
      const cells = line.split('\t');
      return { question: unquote(cells[0] ?? ''), answer: unquote(cells[1] ?? '') };
    })
    .filter((row) => row.question.trim() !== '');
  return rows.length ? rows : null;
}

// Spreadsheet cells wrap text in quotes and double inner quotes
function unquote(value: string): string {
  const t = value.trim();
  if (t.length > 1 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/""/g, '"');
  return t;
}
