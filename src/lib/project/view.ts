import {
  activityOf,
  derive,
  isOpen,
  LOG_TYPES,
  phaseOf,
  visibleRows,
  type Activity,
  type LogType,
  type Modal,
  type Node,
  type Question,
  type State,
  type Status,
} from './board';

// HTML for the control room; every user or copy string passes through esc
export type Ui = Record<string, string>;
export type Region = 'cluster' | 'phases' | 'activities' | 'arch' | 'qaFilters' | 'qaBody' | 'undo' | 'modal';

export const SYS: Record<string, { bg: string; fg: string }> = {
  plc: { bg: '#E3ECFF', fg: '#0A3FA8' },
  optix: { bg: '#DDF7FC', fg: '#005A68' },
  nodered: { bg: '#FFEBD6', fg: '#8A4500' },
  influx: { bg: '#EDE6FF', fg: '#4B22B8' },
  python: { bg: '#E2ECF6', fg: '#23476F' },
  sql: { bg: '#E0E3FF', fg: '#2A2491' },
};

const STATUS_STYLE: Record<Status, { bg: string; fg: string; lamp: string }> = {
  complete: { bg: '#CFF5E3', fg: '#0B5A3A', lamp: '#2ED18B' },
  progress: { bg: '#D7ECFF', fg: '#0A4BB8', lamp: '#00B8D9' },
  idle: { bg: '#E9EEF4', fg: '#42526A', lamp: '#8FA0B8' },
};

const LOG_STYLE: Record<LogType, [string, string]> = {
  Definition: ['#EDE6FF', '#4B22B8'],
  Update: ['#D7ECFF', '#0A4BB8'],
  Decision: ['#CFF5E3', '#0B5A3A'],
  Blocker: ['#FFE3C2', '#8A4500'],
};

const STATUS_KEY: Record<Status, string> = { complete: 'statusComplete', progress: 'statusProgress', idle: 'statusIdle' };
const SYSTEM_KEY: Record<string, string> = {
  plc: 'systemPlc',
  optix: 'systemOptix',
  nodered: 'systemNodered',
  influx: 'systemInflux',
  python: 'systemPython',
  sql: 'systemSql',
};
const NEXT_STATUS: Record<Status, Status> = { idle: 'progress', progress: 'complete', complete: 'idle' };

// Icon paths from the approved canvas
const ICONS: Record<string, string[]> = {
  plus: ['M12 5v14M5 12h14'],
  kebab: [],
  check: ['M5 12l5 5L20 7'],
  close: ['M6 6l12 12M18 6L6 18'],
  chevron: ['M9 6l6 6-6 6'],
  up: ['M7 14l5-5 5 5'],
  trash: ['M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  left: ['M15 6l-6 6 6 6'],
  right: ['M9 6l6 6-6 6'],
  eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z', 'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z'],
  log: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6M12 12v6M9 15h6'],
  question: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M9.5 9a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 3.6M12 17h.01'],
  reset: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  down: ['M6 9l6 6 6-6'],
};

const NODE_ICONS: Record<string, string[]> = {
  field: ['M7 7h10v10H7z', 'M10 10h4v4h-4z', 'M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4'],
  edge: ['M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4', 'M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2'],
  historian: ['M3 12h4l3-7 4 14 3-7h4', 'M3 20h18'],
  etl: ['M4 5h6v5H4z', 'M14 14h6v5h-6z', 'M7 10v3a3 3 0 0 0 3 3h4M12 13.5l2 2.5-2 2.5'],
  core: ['M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z', 'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'],
  ops: ['M3 4h18v12H3z', 'M8 20h8M12 16v4', 'M7 12l3-3 2 2 4-4'],
};

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Replace {name} placeholders with raw values, then escape the whole string once
function fill(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

const t = (ui: Ui, key: string, vars?: Record<string, string | number>) => esc(fill(ui[key] ?? key, vars));

const svg = (name: string, size = 18, stroke = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${(ICONS[name] ?? []).map((d) => `<path d="${d}"></path>`).join('')}</svg>`;

const kebab = (size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" fill="currentColor"></circle><circle cx="12" cy="12" r="1.8" fill="currentColor"></circle><circle cx="12" cy="19" r="1.8" fill="currentColor"></circle></svg>`;

const phaseNo = (s: State, id: string) => s.phases.findIndex((p) => p.id === id) + 1;

const statusName = (ui: Ui, status: Status) => t(ui, STATUS_KEY[status]);

// Gauge ticks along the arc, lit up to the completion percent
function ticks(pct: number): string {
  let out = '';
  for (let i = 0; i <= 20; i++) {
    const ang = Math.PI - (i * Math.PI) / 20;
    const major = i % 5 === 0;
    const r1 = major ? 82 : 86;
    const r2 = 91;
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    const color = i * 5 <= pct ? '#6FD8F0' : '#2D527D';
    out += `<line x1="${(120 + r1 * c).toFixed(1)}" y1="${(124 - r1 * sn).toFixed(1)}" x2="${(120 + r2 * c).toFixed(1)}" y2="${(124 - r2 * sn).toFixed(1)}" stroke="${color}" stroke-width="${major ? 1.6 : 1}" stroke-linecap="round"></line>`;
  }
  return out;
}

function renderCluster(s: State, ui: Ui): string {
  const d = derive(s);
  const atRisk = d.atRisk > 0;
  const health = atRisk
    ? { label: t(ui, 'healthAtRisk'), color: '#FFB547', reason: t(ui, d.atRisk === 1 ? 'atRiskOne' : 'atRiskMany', { count: d.atRisk }), lamp: ['#3A1F2B', '#FFB547', '#123A33'], glow: ['none', 'drop-shadow(0 0 6px #FFB547)', 'none'] }
    : { label: t(ui, 'healthOnTrack'), color: '#2ED18B', reason: t(ui, 'onTrackReason', { progress: d.counts.progress }), lamp: ['#3A1F2B', '#3A3320', '#2ED18B'], glow: ['none', 'none', 'drop-shadow(0 0 6px #2ED18B)'] };
  const readouts = [
    { label: t(ui, 'readPhases'), value: `${d.phasesDone}/${s.phases.length}`, color: '#F2F7FC', divider: 'none' },
    { label: t(ui, 'readActivities'), value: String(d.counts.complete), color: '#2ED18B' },
    { label: t(ui, 'readOpen'), value: String(d.open), color: '#FFB547' },
    { label: t(ui, 'readLog'), value: String(d.logs), color: '#00DCFA' },
  ];
  const seg = (n: number) => `flex:${n} 1 0`;
  const waitingLabel = t(ui, d.open === 1 ? 'waitingOne' : 'waitingMany');
  const waiting = d.open > 0
    ? `<button type="button" class="pb-wait tip" data-tip="${waitingLabel}" aria-label="${d.open} ${waitingLabel}" data-act="waiting"><span class="pb-wait-count num">${d.open}</span></button>`
    : '';
  return `
<div class="pb-cluster">
  <div class="pb-gauge">
    <span class="pb-label">${t(ui, 'gaugeLabel')}</span>
    <div class="pb-gauge-dial">
      <svg width="100%" viewBox="0 0 240 140" role="img" aria-label="${t(ui, 'gaugeAria', { pct: d.pct })}">
        <defs><linearGradient id="pb-arc" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#00DCFA"></stop><stop offset="1" stop-color="#7543FF"></stop></linearGradient></defs>
        <path d="M20 124 A100 100 0 0 1 220 124" fill="none" stroke="#17395F" stroke-width="5" stroke-linecap="round"></path>
        <path d="M20 124 A100 100 0 0 1 220 124" fill="none" stroke="url(#pb-arc)" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${d.pct} 100"></path>
        ${ticks(d.pct)}
        <text x="16" y="139" fill="#5F7CA3" font-size="9">0</text>
        <text x="216" y="139" fill="#5F7CA3" font-size="9">100</text>
        <g transform="rotate(${(d.pct * 1.8).toFixed(1)} 120 124)"><path d="M120 122.6 L40 124 L120 125.4 Z" fill="#DCE8F5"></path></g>
        <circle cx="120" cy="124" r="5" fill="#00DCFA"></circle>
      </svg>
      <div class="pb-gauge-value"><span class="num">${d.pct}<span class="pb-unit">%</span></span></div>
    </div>
    <span class="pb-note">${t(ui, 'gaugeNote')}</span>
  </div>
  <div class="pb-tower">
    <svg width="30" height="92" viewBox="0 0 30 92" role="img" aria-label="${t(ui, 'towerAria', { label: health.label })}">
      <rect x="3" y="2" width="24" height="78" rx="12" fill="#0B2547" stroke="#24476F"></rect>
      <circle cx="15" cy="17" r="7" fill="${health.lamp[0]}" style="filter:${health.glow[0]}"></circle>
      <circle cx="15" cy="41" r="7" fill="${health.lamp[1]}" style="filter:${health.glow[1]}"></circle>
      <circle cx="15" cy="65" r="7" fill="${health.lamp[2]}" style="filter:${health.glow[2]}"></circle>
      <rect x="13" y="80" width="4" height="10" fill="#24476F"></rect>
    </svg>
    <div class="pb-tower-text">
      <span class="pb-label">${t(ui, 'healthLabel')}</span>
      <span class="pb-health" style="color:${health.color}">${health.label}</span>
      <span class="pb-reason">${health.reason}</span>
      ${waiting}
    </div>
  </div>
  <div class="pb-mix">
    <div class="pb-mix-head"><span class="pb-label">${t(ui, 'activityStatus')}</span><span class="num pb-label">${t(ui, 'activitiesCount', { count: s.activities.length })}</span></div>
    <div class="pb-mix-bar" role="img" aria-label="${t(ui, 'mixAria', { complete: d.counts.complete, progress: d.counts.progress, idle: d.counts.idle })}">
      <div style="${seg(d.counts.complete)};background:#2ED18B"></div>
      <div style="${seg(d.counts.progress)};background:#00DCFA"></div>
      <div style="${seg(d.counts.idle)};background:#3A5A82"></div>
    </div>
    <div class="pb-legend">
      <span><i style="background:#2ED18B"></i>${t(ui, 'statusComplete')} <b class="num">${d.counts.complete}</b></span>
      <span><i style="background:#00DCFA"></i>${t(ui, 'statusProgress')} <b class="num">${d.counts.progress}</b></span>
      <span><i style="background:#3A5A82"></i>${t(ui, 'statusIdle')} <b class="num">${d.counts.idle}</b></span>
    </div>
    <div class="pb-readouts">
      ${readouts.map((r) => `<div class="pb-readout" style="${r.divider === 'none' ? '' : 'border-left:1px solid #1B3D6A'}"><span class="num" style="color:${r.color}">${r.value}</span><span class="pb-label">${r.label}</span></div>`).join('')}
    </div>
  </div>
</div>`;
}

function renderPhases(s: State, ui: Ui): string {
  const d = derive(s);
  const cards = d.phases
    .map((p) => {
      const on = p.phase.id === s.phase;
      const menu = s.menu === `p:${p.phase.id}`;
      const st = STATUS_STYLE[p.key];
      const label = t(ui, 'phaseLabel', { n: p.index + 1 });
      const count = p.list.length ? t(ui, 'phaseCount', { done: p.done, total: p.list.length }) : t(ui, 'phaseEmpty');
      const ring = p.key === 'complete' ? '#2ED18B' : '#0A58EB';
      return `
<div class="pb-phase${on ? ' is-on' : ''}">
  <div class="pb-phase-top">
    <span class="pb-phase-no">${label}</span>
    <button type="button" class="pb-icon tip" data-tip="${t(ui, 'phaseActions')}" data-act="phase-menu" data-id="${esc(p.phase.id)}" aria-label="${t(ui, 'phaseActionsAria', { name: p.phase.name })}" aria-haspopup="menu" aria-expanded="${menu}">${kebab(16)}</button>
  </div>
  <button type="button" class="pb-phase-pick" data-act="phase-pick" data-id="${esc(p.phase.id)}" aria-pressed="${on}" aria-label="${t(ui, 'phaseShowAria', { n: p.index + 1, name: p.phase.name })}">
    <span class="pb-ring"><svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><g transform="rotate(-90 48 48)"><circle cx="48" cy="48" r="40" fill="#FFFFFF" stroke="#E8EEF5" stroke-width="4"></circle><circle cx="48" cy="48" r="40" fill="none" stroke="${ring}" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="${p.pct} 100"></circle></g></svg><span class="num pb-ring-value">${p.pct}<span>%</span></span></span>
    <span class="pb-status-pill" style="background:${st.bg};color:${st.fg}"><i style="background:${st.lamp}"></i>${statusName(ui, p.key)}</span>
    <span class="pb-phase-name">${esc(p.phase.name)}</span>
    <span class="pb-phase-count">${count}</span>
    <span class="pb-segments" aria-hidden="true"><span style="flex:${p.done} 1 0;background:#2ED18B"></span><span style="flex:${p.prog} 1 0;background:#00B8D9"></span><span style="flex:${p.idle} 1 0;background:#DCE4EE"></span></span>
  </button>
  ${menu ? `
  <div role="menu" class="pb-menu pb-menu-phase" aria-label="${t(ui, 'phaseActionsAria', { name: p.phase.name })}">
    <button type="button" role="menuitem" class="pb-icon tip" data-tip="${t(ui, 'menuEditPhase')}" aria-label="${t(ui, 'menuEditPhase')}" data-act="phase-edit" data-id="${esc(p.phase.id)}">${svg('edit', 17)}</button>
    <button type="button" role="menuitem" class="pb-icon tip" data-tip="${t(ui, 'menuMoveEarlier')}" aria-label="${t(ui, 'menuMoveEarlier')}" data-act="phase-move" data-id="${esc(p.phase.id)}" data-dir="-1">${svg('left', 17)}</button>
    <button type="button" role="menuitem" class="pb-icon tip" data-tip="${t(ui, 'menuMoveLater')}" aria-label="${t(ui, 'menuMoveLater')}" data-act="phase-move" data-id="${esc(p.phase.id)}" data-dir="1">${svg('right', 17)}</button>
    <span class="pb-sep"></span>
    <button type="button" role="menuitem" class="pb-icon tip is-danger" data-tip="${t(ui, 'menuDeletePhase')}" aria-label="${t(ui, 'menuDeletePhase')}" data-act="phase-delete" data-id="${esc(p.phase.id)}">${svg('trash', 17)}</button>
  </div>` : ''}
</div>`;
    })
    .join('');
  return `
<div class="pb-head-row">
  <div class="pb-head-copy">
    <h2>${t(ui, 'phasesTitle')}</h2>
    <p>${t(ui, 'phasesIntro')}</p>
  </div>
  <button type="button" class="pb-add tip" data-tip="${t(ui, 'addPhase')}" aria-label="${t(ui, 'addPhase')}" data-act="phase-add">${svg('plus', 18, 2.4)}</button>
</div>
<div class="pb-phase-row">${cards}</div>`;
}

function renderActivities(s: State, ui: Ui): string {
  const phase = phaseOf(s, s.phase);
  const list = s.activities.filter((a) => a.phase === s.phase);
  const rows = list
    .map((a) => {
      const st = STATUS_STYLE[a.status];
      const logCount = a.log.length;
      const open = s.questions.filter((q) => q.activity === a.id && isOpen(q)).length;
      const menu = s.menu === a.id;
      const next = NEXT_STATUS[a.status];
      const systems = a.systems
        .map((k) => `<span class="pb-sys" style="background:${SYS[k].bg};color:${SYS[k].fg}">${t(ui, SYSTEM_KEY[k])}</span>`)
        .join('');
      return `
<div class="pb-act">
  <button type="button" class="pb-cycle" data-act="act-cycle" data-id="${esc(a.id)}" aria-label="${t(ui, 'cycleLabel', { status: statusName(ui, a.status), next: statusName(ui, next) })}" style="background:${st.bg};color:${st.fg}">
    <span><i style="background:${st.lamp}"></i>${statusName(ui, a.status)}</span>${svg('chevron', 14, 2.5)}
  </button>
  <div class="pb-act-body">
    <span class="pb-act-name">${esc(a.name)}</span>
    <span class="pb-act-def">${esc(a.definition)}</span>
    <span class="pb-chips">${systems}${open > 0 ? `<span class="pb-chip-open">${t(ui, open === 1 ? 'openOne' : 'openMany', { count: open })}</span>` : ''}</span>
  </div>
  <div class="pb-act-end">
    ${logCount > 0 ? `<span class="pb-log-count num" role="img" aria-label="${t(ui, logCount === 1 ? 'logOne' : 'logMany', { count: logCount })}">${logCount > 99 ? '99+' : logCount}</span>` : ''}
    <button type="button" class="pb-kebab tip${menu ? ' is-open' : ''}" data-tip="${t(ui, 'actionsTip')}" data-act="act-menu" data-id="${esc(a.id)}" aria-label="${t(ui, 'actionsAria', { name: a.name })}" aria-haspopup="menu" aria-expanded="${menu}">${kebab(18)}</button>
  </div>
  ${menu ? activityMenu(ui, a) : ''}
</div>`;
    })
    .join('');
  return `
<section class="pb-acts" aria-label="${t(ui, 'activitiesAria', { name: phase?.name ?? '' })}">
  <div class="pb-acts-head">
    <div class="pb-acts-copy">
      <h3>${phase ? t(ui, 'activitiesTitle', { n: phaseNo(s, phase.id), name: phase.name }) : ''}</h3>
      <span>${phase ? esc(phase.goal) : ''}</span>
    </div>
    <div class="pb-acts-tools">
      <span class="pb-hint">${t(ui, 'selectHint')}</span>
      <button type="button" class="pb-add tip" data-tip="${t(ui, 'addActivity')}" aria-label="${t(ui, 'addActivity')}" data-act="act-add">${svg('plus', 18, 2.4)}</button>
    </div>
  </div>
  ${rows || `<p class="pb-empty">${t(ui, 'noActivities')}</p>`}
</section>`;
}

function activityMenu(ui: Ui, a: Activity): string {
  const item = (tip: string, act: string, icon: string, danger = false) =>
    `<button type="button" role="menuitem" class="pb-icon tip${danger ? ' is-danger' : ''}" data-tip="${t(ui, tip)}" aria-label="${t(ui, tip)}" data-act="${act}" data-id="${esc(a.id)}">${svg(icon, 18)}</button>`;
  return `
<div role="menu" class="pb-menu pb-menu-act" aria-label="${t(ui, 'actionsAria', { name: a.name })}">
  ${item('menuView', 'act-view', 'eye')}
  ${item('menuAddLog', 'act-log', 'log')}
  ${item('menuRaise', 'act-raise', 'question')}
  ${item('menuEditActivity', 'act-edit', 'edit')}
  ${item('menuReset', 'act-reset', 'reset')}
  <span class="pb-sep"></span>
  ${item('menuDeleteActivity', 'act-delete', 'trash', true)}
</div>`;
}

function renderArch(s: State, ui: Ui, nodes: Node[]): string {
  const selected = nodes.find((n) => n.id === s.node) ?? nodes[0];
  const buttons = nodes
    .map((n, i) => {
      const on = n.id === selected?.id;
      const sys = SYS[n.system];
      const body = `
<button type="button" class="pb-node${on ? ' is-on' : ''}" data-act="node" data-id="${esc(n.id)}" aria-pressed="${on}">
  <span class="pb-node-layer">${esc(n.layer)}</span>
  <span class="pb-node-chip" style="background:${sys.bg};color:${sys.fg}"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${(NODE_ICONS[n.id] ?? []).map((d) => `<path d="${d}"></path>`).join('')}</svg></span>
  <span class="pb-node-name">${esc(n.name)}</span>
  <span class="pb-node-role">${esc(n.role)}</span>
  <span class="pb-cadence">${esc(n.cadence)}</span>
</button>`;
      const link = i < nodes.length - 1
        ? `<div class="pb-link" aria-hidden="true"><span>${esc(n.link)}</span><div class="pb-flow"></div></div>`
        : '';
      return body + link;
    })
    .join('');
  const detail = selected
    ? `
<div class="pb-detail">
  <div class="pb-detail-main">
    <div class="pb-detail-tags"><span class="pb-tech" style="background:${SYS[selected.system].bg};color:${SYS[selected.system].fg}">${esc(selected.tech)}</span><span class="pb-label">${t(ui, 'layerSuffix', { layer: selected.layer })}</span></div>
    <h3>${esc(selected.name)}</h3>
    <p>${esc(selected.detail)}</p>
  </div>
  <div class="pb-detail-side">
    <span class="pb-detail-key">${t(ui, 'keyObjects')}</span>
    <div class="pb-objects">${selected.objects.map((o) => `<span>${esc(o)}</span>`).join('')}</div>
    <span class="pb-detail-key">${t(ui, 'talksTo')}</span>
    <span class="pb-link-full">${esc(selected.linkFull)}</span>
  </div>
</div>`
    : '';
  return `
<div class="pb-arch-head">
  <h2>${t(ui, 'archTitle')}</h2>
  <p>${t(ui, 'archIntro')}</p>
</div>
<div class="pb-arch-row">${buttons}</div>
${detail}`;
}

function filterButtons(s: State, ui: Ui): string {
  const openCount = s.questions.filter(isOpen).length;
  const decCount = s.questions.filter((q) => q.decision && !isOpen(q)).length;
  const items: [State['filter'], string, number][] = [
    ['all', 'filterAll', s.questions.length],
    ['open', 'filterOpen', openCount],
    ['dec', 'filterDecisions', decCount],
  ];
  return items
    .map(([key, label, count]) => {
      const on = s.filter === key;
      const amber = key === 'open' && openCount > 0;
      const badge = on ? (amber ? '#FFB547' : '#00DCFA') : (amber ? '#FFE3C2' : '#EEF3F8');
      const badgeFg = on ? '#001C3F' : (amber ? '#8A4500' : '#42526A');
      return `<button type="button" class="pb-filter${on ? ' is-on' : ''}" data-act="filter" data-value="${key}" aria-pressed="${on}">${t(ui, label)}<span class="num pb-badge" style="background:${badge};color:${badgeFg}">${count}</span></button>`;
    })
    .join('');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}` : '';
}

// Row values that change while typing; the textareas themselves are never re-rendered
export function qaRowState(s: State, q: Question, ui: Ui) {
  const open = isOpen(q);
  const decided = q.decision && !open;
  const edge = open ? '#FFB547' : decided ? '#3530A5' : '#2ED18B';
  const answered = q.answered && !open ? ` · ${t(ui, 'answered', { date: fmtDate(q.answered) })}` : '';
  const st = open
    ? { bg: '#FFE3C2', fg: '#8A4500', dot: '#FFB547', label: t(ui, 'statusOpen') }
    : { bg: '#CFF5E3', fg: '#0B5A3A', dot: '#2ED18B', label: t(ui, 'statusAnswered') };
  const decTip = open ? t(ui, 'decisionLocked') : decided ? t(ui, 'decisionOn') : t(ui, 'decisionOff');
  return {
    rowStyle: `background:${open ? '#FFF9F1' : '#FFFFFF'};box-shadow:inset 3px 0 0 ${edge}`,
    dates: `${t(ui, 'asked', { date: fmtDate(q.asked) })}${answered}`,
    // Raw text: the client sets it as a data attribute value
    shadow: open ? ui.answerPlaceholder : q.answer,
    answerClass: open ? ' is-empty' : '',
    statusCell: `<div class="pb-status-cell"><span class="pb-status" style="background:${st.bg};color:${st.fg}"><i style="background:${st.dot}"></i>${st.label}</span><button type="button" class="pb-dec tip${decided ? ' is-on' : ''}" data-tip="${decTip}" aria-label="${decTip}" data-act="q-dec" data-num="${q.num}" aria-pressed="${decided}" aria-disabled="${open}" style="opacity:${open ? 0.45 : 1}">${svg('check', 13, 3)}</button></div>`,
  };
}

function qaRow(s: State, q: Question, ui: Ui): string {
  const r = qaRowState(s, q, ui);
  const n = q.num;
  // Question text is always locked inline; the answer and activity lock once answered
  const open = isOpen(q);
  const menuOpen = s.menu === `q:${n}`;
  return `
<tr class="pb-qa-row${open ? '' : ' is-answered'}" data-num="${n}" style="${r.rowStyle}">
  <td class="pb-c-n num">${n}</td>
  <td class="pb-c-q">
    <div class="pb-grow" data-value="${esc(q.question)} "><textarea class="pb-cell" rows="1" readonly data-field="q" data-num="${n}" aria-label="${t(ui, 'questionAria', { num: n })}">${esc(q.question)}</textarea></div>
    <div class="pb-dates" data-dates>${r.dates}</div>
  </td>
  <td class="pb-c-a">
    <div class="pb-grow" data-shadow data-value="${esc(r.shadow)} "><textarea class="pb-cell${r.answerClass}" rows="1"${open ? '' : ' readonly'} data-field="a" data-num="${n}" aria-label="${t(ui, 'answerAria', { num: n })}" placeholder="${t(ui, 'answerPlaceholder')}">${esc(q.answer)}</textarea></div>
  </td>
  <td class="pb-c-act"><span class="tip" data-tip="${esc(activityTip(s, q, ui))}"><select class="pb-act-pill" data-change="q-act" data-num="${n}"${open ? '' : ' disabled'} aria-label="${t(ui, 'activityForAria', { num: n })}" style="background-color:${q.activity ? '#E7EEFA' : '#F1F4F8'};color:${q.activity ? '#0A3FA8' : '#6B7D96'}">${activityOptions(s, ui, q.activity ?? '')}</select></span></td>
  <td class="pb-c-st" data-status>${r.statusCell}</td>
  <td class="pb-c-del">
    <button type="button" class="pb-kebab tip${menuOpen ? ' is-open' : ''}" data-tip="${t(ui, 'actionsTip')}" data-act="q-menu" data-num="${n}" aria-label="${t(ui, 'questionActions', { num: n })}" aria-haspopup="menu" aria-expanded="${menuOpen}">${kebab(18)}</button>
    ${menuOpen ? `
    <div role="menu" class="pb-menu pb-menu-q" aria-label="${t(ui, 'questionActions', { num: n })}">
      <button type="button" role="menuitem" class="pb-icon tip" data-tip="${t(ui, 'menuEditQuestion')}" aria-label="${t(ui, 'menuEditQuestion')}" data-act="q-edit" data-num="${n}">${svg('edit', 17)}</button>
      <span class="pb-sep"></span>
      <button type="button" role="menuitem" class="pb-icon tip is-danger" data-tip="${t(ui, 'menuDeleteQuestion')}" aria-label="${t(ui, 'menuDeleteQuestion')}" data-act="q-del" data-num="${n}">${svg('trash', 17)}</button>
    </div>` : ''}
  </td>
</tr>`;
}

function activityTip(s: State, q: Question, ui: Ui): string {
  const a = activityOf(s, q.activity);
  if (!a) return t(ui, 'wholeProjectLong');
  return `Phase ${phaseNo(s, a.phase)}: ${a.name}`;
}

// Activity choices for a question; selected is an activity id, empty for the whole project
function activityOptions(s: State, ui: Ui, selected: string): string {
  const items = s.activities
    .map((a) => `<option value="${esc(a.id)}"${a.id === selected ? ' selected' : ''}>${esc(`Phase ${phaseNo(s, a.phase)} · ${a.name}`)}</option>`)
    .join('');
  return `<option value=""${selected === '' ? ' selected' : ''}>${t(ui, 'wholeProject')}</option>${items}`;
}

function renderQaBody(s: State, ui: Ui): string {
  const rows = visibleRows(s);
  const empty = rows.length === 0 ? `<tr><td colspan="6" class="pb-qa-empty">${t(ui, s.filter === 'all' ? 'emptyAll' : s.filter === 'open' ? 'emptyOpen' : 'emptyDecisions')}</td></tr>` : '';
  return `
<table class="pb-qa">
  <colgroup><col class="pb-col-n"><col><col><col class="pb-col-act"><col class="pb-col-st"><col class="pb-col-del"></colgroup>
  <thead>
    <tr>
      <th scope="col" class="pb-c-n">${t(ui, 'colNumber')}</th>
      <th scope="col">${t(ui, 'colQuestion')}</th>
      <th scope="col">${t(ui, 'colAnswer')}</th>
      <th scope="col">${t(ui, 'colActivity')}</th>
      <th scope="col">${t(ui, 'colStatus')}</th>
      <th scope="col" class="pb-sr"><span>${t(ui, 'colDelete')}</span></th>
    </tr>
  </thead>
  <tbody>
    ${rows.map((q) => qaRow(s, q, ui)).join('')}
    ${empty}
    <tr class="pb-qa-new">
      <td class="pb-c-n"><span class="pb-plus">${svg('plus', 16, 2.4)}</span></td>
      <td colspan="2" class="pb-c-q2">
        <div class="pb-grow" data-value="${esc(s.newQuestion)} "><textarea id="pb-qa-new" class="pb-cell is-new" rows="1" data-field="new" aria-label="${t(ui, 'newQuestionAria')}" placeholder="${t(ui, 'newQuestionPlaceholder')}">${esc(s.newQuestion)}</textarea></div>
        <div class="pb-new-hint">${t(ui, 'newHint')}</div>
      </td>
      <td class="pb-c-act"><select class="pb-act-pill is-new" data-change="new-act" aria-label="${t(ui, 'newActivityAria')}">${activityOptions(s, ui, s.newActivity)}</select></td>
      <td colspan="2"></td>
    </tr>
  </tbody>
</table>`;
}

function renderUndo(s: State, ui: Ui): string {
  if (!s.undo) return '';
  return `
<div role="status" class="pb-undo">
  <span>${t(ui, 'undoText', { num: s.undo.question.num })}</span>
  <button type="button" class="pb-undo-btn" data-act="undo">${t(ui, 'undo')}</button>
  <button type="button" class="pb-undo-x" data-act="undo-dismiss" aria-label="${t(ui, 'dismiss')}">${svg('close', 14, 2.5)}</button>
</div>`;
}

function modalBody(s: State, ui: Ui, m: Modal): { kicker: string; title: string; confirm?: string; body: string; confirmAct?: string } | null {
  if (m.kind === 'view' || m.kind === 'log') {
    const a = activityOf(s, m.id);
    if (!a) return null;
    const st = STATUS_STYLE[a.status];
    const kicker = t(ui, 'phaseKicker', { n: phaseNo(s, a.phase), name: phaseOf(s, a.phase)?.name ?? '' });
    if (m.kind === 'log') {
      const types = LOG_TYPES.map((type) => {
        const on = s.entryType === type;
        const [bg, fg] = LOG_STYLE[type];
        return `<button type="button" class="pb-type${on ? ' is-on' : ''}" data-act="modal-type" data-value="${type}" aria-pressed="${on}" style="border-color:${on ? fg : '#D3DEEB'};background:${on ? bg : '#FFFFFF'};color:${fg}">${t(ui, `log${type}`)}</button>`;
      }).join('');
      return {
        kicker,
        title: t(ui, 'titleLog', { name: a.name }),
        confirm: t(ui, 'saveEntry'),
        confirmAct: 'modal-confirm',
        body: `
<span class="pb-form-label">${t(ui, 'modalEntryType')}</span>
<div class="pb-types">${types}</div>
<label class="pb-form-label" for="pb-f-text">${t(ui, 'modalEntry')}</label>
<textarea id="pb-f-text" class="pb-input" rows="5" data-form="text" placeholder="${t(ui, 'modalEntryPlaceholder')}">${esc(s.form.text)}</textarea>`,
      };
    }
    const qs = s.questions.filter((q) => q.activity === a.id);
    const logs = a.log
      .map((l) => {
        const [bg, fg] = LOG_STYLE[l.type];
        return `<div class="pb-log"><div class="pb-log-meta"><span class="pb-log-type" style="background:${bg};color:${fg}">${t(ui, `log${l.type}`)}</span><span class="pb-log-date">${fmtDate(l.date)}</span></div><p>${esc(l.text)}</p></div>`;
      })
      .join('');
    const linked = qs.length
      ? `<div class="pb-block"><span class="pb-form-label">${t(ui, 'modalLinked')}</span>${qs
          .map((q) => {
            const open = isOpen(q);
            return `<div class="pb-linked"><span class="pb-status" style="background:${open ? '#FFE3C2' : '#CFF5E3'};color:${open ? '#8A4500' : '#0B5A3A'}">${t(ui, open ? 'statusOpen' : 'statusAnswered')}</span>${esc(q.question)}</div>`;
          })
          .join('')}</div>`
      : '';
    return {
      kicker,
      title: esc(a.name),
      body: `
<div class="pb-chips">
  <button type="button" class="pb-cycle is-inline" data-act="modal-cycle" data-id="${esc(a.id)}" aria-label="${t(ui, 'cycleLabel', { status: statusName(ui, a.status), next: statusName(ui, NEXT_STATUS[a.status]) })}" style="background:${st.bg};color:${st.fg}"><span><i style="background:${st.lamp}"></i>${statusName(ui, a.status)}</span></button>
  ${a.systems.map((k) => `<span class="pb-sys" style="background:${SYS[k].bg};color:${SYS[k].fg}">${t(ui, SYSTEM_KEY[k])}</span>`).join('')}
</div>
<div class="pb-block pb-definition"><span class="pb-form-label">${t(ui, 'modalDefinition')}</span><p>${a.definition ? esc(a.definition) : t(ui, 'modalNoDefinition')}</p></div>
${linked}
<div class="pb-logbook-head"><span class="pb-form-label">${t(ui, 'modalLogbook')}</span><button type="button" class="pb-icon tip" data-tip="${t(ui, 'menuAddLog')}" aria-label="${t(ui, 'menuAddLog')}" data-act="modal-to-log" data-id="${esc(a.id)}">${svg('plus', 16, 2.4)}</button></div>
<div class="pb-logs">${logs || `<p class="pb-muted">${t(ui, 'modalNoEntries')}</p>`}</div>`,
    };
  }
  if (m.kind === 'question') {
    const q = s.questions.find((item) => item.num === m.num);
    if (!q) return null;
    return {
      kicker: t(ui, 'questionKicker', { num: q.num }),
      title: t(ui, 'titleEditQuestion'),
      confirm: t(ui, 'saveChanges'),
      confirmAct: 'modal-confirm',
      body: `
<label class="pb-form-label" for="pb-f-qtext">${t(ui, 'modalQuestion')}</label>
<textarea id="pb-f-qtext" class="pb-input" rows="3" data-form="qText">${esc(s.form.qText)}</textarea>
<label class="pb-form-label" for="pb-f-qanswer">${t(ui, 'modalAnswer')}</label>
<textarea id="pb-f-qanswer" class="pb-input" rows="3" data-form="qAnswer" placeholder="${t(ui, 'answerPlaceholder')}">${esc(s.form.qAnswer)}</textarea>
<label class="pb-form-label" for="pb-f-qact">${t(ui, 'colActivity')}</label>
<select id="pb-f-qact" class="pb-input" data-form="qAct">${activityOptions(s, ui, s.form.qAct)}</select>`,
    };
  }
  if (m.kind === 'edit' || m.kind === 'new') {
    const phase = phaseOf(s, s.phase);
    const kicker = t(ui, 'phaseKicker', { n: phaseNo(s, s.phase), name: phase?.name ?? '' });
    const pick = Object.keys(SYS)
      .map((k) => {
        const on = (s.form.sys as string[]).includes(k);
        return `<button type="button" class="pb-sys-pick${on ? ' is-on' : ''}" data-act="modal-sys" data-value="${k}" aria-pressed="${on}" style="${on ? `background:${SYS[k].bg};color:${SYS[k].fg};border-color:${SYS[k].fg}` : ''}">${t(ui, SYSTEM_KEY[k])}</button>`;
      })
      .join('');
    return {
      kicker,
      title: t(ui, m.kind === 'new' ? 'titleNewActivity' : 'titleEditActivity'),
      confirm: t(ui, m.kind === 'new' ? 'createActivity' : 'saveChanges'),
      confirmAct: 'modal-confirm',
      body: `
<label class="pb-form-label" for="pb-f-name">${t(ui, 'modalActivityName')}</label>
<input id="pb-f-name" class="pb-input" type="text" data-form="name" value="${esc(s.form.name)}">
<label class="pb-form-label" for="pb-f-def">${t(ui, 'modalDefinition')}</label>
<textarea id="pb-f-def" class="pb-input" rows="3" data-form="def" placeholder="${t(ui, 'modalDefinitionPlaceholder')}">${esc(s.form.def)}</textarea>
<span class="pb-form-label">${t(ui, 'modalSystems')}</span>
<div class="pb-sys-group">${pick}</div>`,
    };
  }
  if (m.kind === 'phase') {
    const isNew = m.id === null;
    return {
      kicker: t(ui, 'modalKickerPhases'),
      title: t(ui, isNew ? 'titleNewPhase' : 'titleEditPhase'),
      confirm: t(ui, isNew ? 'createPhase' : 'savePhase'),
      confirmAct: 'modal-confirm',
      body: `
<label class="pb-form-label" for="pb-f-pname">${t(ui, 'modalPhaseName')}</label>
<input id="pb-f-pname" class="pb-input" type="text" data-form="pName" value="${esc(s.form.pName)}">
<label class="pb-form-label" for="pb-f-pgoal">${t(ui, 'modalGoal')}</label>
<textarea id="pb-f-pgoal" class="pb-input" rows="2" data-form="pGoal" placeholder="${t(ui, 'modalGoalPlaceholder')}">${esc(s.form.pGoal)}</textarea>`,
    };
  }
  // Delete confirmation: the body button removes the item
  const isPhase = m.target === 'phase';
  const text = isPhase
    ? t(ui, 'deletePhaseText', { name: phaseOf(s, m.id)?.name ?? '', count: s.activities.filter((a) => a.phase === m.id).length })
    : t(ui, 'deleteActivityText', { name: activityOf(s, m.id)?.name ?? '', count: activityOf(s, m.id)?.log.length ?? 0 });
  return {
    kicker: t(ui, isPhase ? 'modalKickerPhases' : 'modalKickerActivities'),
    title: t(ui, isPhase ? 'titleDeletePhase' : 'titleDeleteActivity'),
    body: `
<p class="pb-delete-text">${text}</p>
<button type="button" class="pb-danger" data-act="modal-delete">${svg('trash', 16, 2.2)}${t(ui, isPhase ? 'deletePhaseButton' : 'deleteActivityButton')}</button>`,
  };
}

function renderModal(s: State, ui: Ui): string {
  if (!s.modal) return '';
  const m = modalBody(s, ui, s.modal);
  if (!m) return '';
  const confirm = m.confirm
    ? `<button type="button" class="pb-icon tip is-confirm" data-tip="${m.confirm}" aria-label="${m.confirm}" data-act="${m.confirmAct}">${svg('check', 19, 2.6)}</button>`
    : '';
  return `
<div class="pb-overlay">
  <div role="dialog" aria-modal="true" aria-labelledby="pb-modal-title" class="pb-dialog">
    <div class="pb-dialog-head">
      <div class="pb-dialog-title">
        <span class="pb-label">${m.kicker}</span>
        <h2 id="pb-modal-title">${m.title}</h2>
      </div>
      <div class="pb-dialog-tools">
        ${confirm}
        <button type="button" class="pb-icon tip" data-tip="${t(ui, 'modalClose')}" aria-label="${t(ui, 'modalClose')}" data-act="modal-close">${svg('close', 18, 2.5)}</button>
      </div>
    </div>
    ${s.error ? `<p role="alert" class="pb-error">${t(ui, s.error)}</p>` : ''}
    ${m.body}
  </div>
</div>`;
}

// Every region the client can refresh, keyed by its data-region name
export function regions(s: State, ui: Ui, nodes: Node[]): Record<Region, string> {
  return {
    cluster: renderCluster(s, ui),
    phases: renderPhases(s, ui),
    activities: renderActivities(s, ui),
    arch: renderArch(s, ui, nodes),
    qaFilters: filterButtons(s, ui),
    qaBody: renderQaBody(s, ui),
    undo: renderUndo(s, ui),
    modal: renderModal(s, ui),
  };
}
