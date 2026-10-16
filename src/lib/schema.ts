import { z } from 'zod';

// Block names in the order a product page can render them
export const BLOCK_NAMES = [
  'hero',
  'problem',
  'questions',
  'tour',
  'architecture',
  'flow',
  'demo',
  'kpi',
  'day',
  'rollup',
  'value',
  'deck',
  'cta',
] as const;

// Content keys each block needs; cta falls back to site.cta
const BLOCK_DATA: Record<(typeof BLOCK_NAMES)[number], string[]> = {
  hero: ['hero'],
  problem: ['problem'],
  questions: ['promise', 'questions'],
  tour: ['tour'],
  architecture: ['architecture'],
  flow: ['flow'],
  demo: ['demo'],
  kpi: ['kpi'],
  day: ['day'],
  rollup: ['rollup'],
  value: ['benefits', 'foundations'],
  deck: ['deck'],
  cta: [],
};

const text = z.string().min(1);
const asset = z.strictObject({ src: text, alt: text });
const link = z.strictObject({ label: text, href: text });
const count = z.number().int().nonnegative();

// Copy keys of the internal project page; every key must exist in content/site.json ui.project
export const PROJECT_UI_KEYS = [
  'kicker', 'heading', 'subtitle', 'synced', 'gaugeLabel', 'gaugeAria', 'gaugeNote',
  'healthLabel', 'towerAria', 'healthAtRisk', 'healthOnTrack', 'atRiskOne', 'atRiskMany', 'onTrackReason',
  'waitingOne', 'waitingMany', 'activityStatus', 'activitiesCount', 'mixAria',
  'statusComplete', 'statusProgress', 'statusIdle',
  'readPhases', 'readActivities', 'readOpen', 'readLog',
  'phasesTitle', 'phasesIntro', 'addPhase', 'phaseLabel', 'phaseActions', 'phaseActionsAria', 'phaseShowAria',
  'phaseCount', 'phaseEmpty', 'menuEditPhase', 'menuMoveEarlier', 'menuMoveLater', 'menuDeletePhase',
  'activitiesTitle', 'activitiesAria', 'selectHint', 'addActivity', 'cycleLabel', 'openOne', 'openMany',
  'logOne', 'logMany', 'actionsTip', 'actionsAria', 'menuView', 'menuAddLog', 'menuRaise', 'menuEditActivity',
  'menuReset', 'menuDeleteActivity', 'noActivities',
  'archTitle', 'archIntro', 'layerSuffix', 'keyObjects', 'talksTo',
  'qaTitle', 'qaIntro', 'filterAria', 'filterAll', 'filterOpen', 'filterDecisions',
  'colNumber', 'colQuestion', 'colAnswer', 'colActivity', 'colStatus', 'colDelete',
  'asked', 'answered', 'answerPlaceholder', 'statusOpen', 'statusAnswered',
  'decisionOff', 'decisionOn', 'decisionLocked', 'wholeProject', 'wholeProjectLong', 'deleteRow',
  'deleteQuestionAria', 'questionAria', 'answerAria', 'activityForAria', 'newQuestionAria', 'newActivityAria',
  'newQuestionPlaceholder', 'newHint', 'emptyAll', 'emptyOpen', 'emptyDecisions',
  'undoText', 'undo', 'dismiss',
  'modalClose', 'modalDefinition', 'modalNoDefinition', 'modalLinked', 'modalLogbook', 'modalNoEntries',
  'modalEntryType', 'modalEntry', 'modalEntryPlaceholder', 'modalActivityName', 'modalDefinitionPlaceholder',
  'modalSystems', 'modalPhaseName', 'modalGoal', 'modalGoalPlaceholder', 'modalKickerPhases',
  'modalKickerActivities', 'phaseKicker', 'questionKicker', 'titleEditQuestion', 'modalQuestion', 'modalAnswer',
  'errQuestion', 'submitAnswer', 'menuEditQuestion', 'menuDeleteQuestion', 'questionActions', 'titleLog', 'titleNewActivity', 'titleEditActivity', 'titleEditPhase',
  'titleNewPhase', 'titleDeletePhase', 'titleDeleteActivity', 'saveEntry', 'createActivity', 'saveChanges',
  'savePhase', 'createPhase', 'deletePhaseButton', 'deleteActivityButton', 'deletePhaseText',
  'deleteActivityText', 'errEntry', 'errName', 'errPhase',
  'systemPlc', 'systemOptix', 'systemNodered', 'systemInflux', 'systemPython', 'systemSql',
  'logDefinition', 'logUpdate', 'logDecision', 'logBlocker',
] as const;

const UiSchema = z.strictObject({
  skipToContent: text,
  homeAria: text,
  backToProducts: text,
  mainNavAria: text,
  pageNavAria: text,
  viewsNavAria: text,
  talkToUs: text,
  explore: text,
  projectView: text,
  internalBanner: text,
  productTab: text,
  projectTab: text,
  runsOn: text,
  howOften: text,
  downloadPdf: text,
  viewSlides: text,
  twin: z.strictObject({ title: text, enlarge: text, restore: text }),
  demo: z.strictObject({
    lineOee: text,
    availability: text,
    performance: text,
    quality: text,
    scheduled: text,
    unplannedStops: text,
    plannedStops: text,
    events: text,
    unknown: text,
    unplanned: text,
    planned: text,
    minutes: text,
    running: text,
    faulted: text,
    faultAlert: text,
    overview: text,
    restart: text,
    steps: z.array(text).length(4),
  }),
  project: z.strictObject(Object.fromEntries(PROJECT_UI_KEYS.map((key) => [key, text]))),
});

const ProductCardSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('available'),
    slug: text,
    statusLabel: text,
    category: text,
    name: text,
    summary: text,
    highlights: z.array(text).min(1),
    image: asset,
    featured: z.boolean().optional(),
  }),
  z.strictObject({
    status: z.enum(['in-development', 'planned']),
    slug: z.null(),
    statusLabel: text,
    category: text.optional(),
    name: text,
    summary: text,
    image: asset.optional(),
  }),
]);

export const SiteSchema = z.strictObject({
  name: text,
  logo: z.strictObject({ light: text, dark: text, alt: text }),
  nav: z.array(link),
  hero: z.strictObject({ label: text, title: text, subtitle: text, background: text }),
  products: z.array(ProductCardSchema),
  about: z.strictObject({ title: text, body: text, image: asset, draft: z.boolean().optional() }),
  cta: z.strictObject({ title: text, body: text, button: text, href: text }),
  footer: z.strictObject({ legal: text }),
  ui: UiSchema,
});

const HeroSchema = z.strictObject({
  label: text,
  title: text,
  subtitle: text,
  ctaPrimary: link,
  ctaSecondary: link,
  media: z.strictObject({
    type: z.literal('video'),
    poster: text,
    posterAlt: text,
    mp4: text.optional(),
    webm: text.optional(),
    caption: text.optional(),
    pending: z.boolean().optional(),
  }),
  background: text,
});

// Each point is a chapter: "at" is the second of the looping clip where it starts
const TourSchema = z.strictObject({
  title: text,
  intro: text,
  video: z.strictObject({ src: text, poster: text, alt: text }),
  points: z.array(z.strictObject({ title: text, body: text, at: count })).min(1),
});

const ArchitectureSchema = z
  .strictObject({
    title: text,
    intro: text,
    defaultLayer: text,
    layers: z.array(
      z.strictObject({
        id: text,
        zone: text,
        name: text,
        tech: text,
        cadence: text,
        detail: text,
      }),
    ).min(1),
  })
  .refine((a) => a.layers.some((l) => l.id === a.defaultLayer), {
    message: 'defaultLayer must match a layer id',
    path: ['defaultLayer'],
  });

const DemoSchema = z.strictObject({
  title: text,
  intro: text,
  disclaimer: text,
  shiftMinutes: z.number().int().positive(),
  performance: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  machines: z.array(
    z.strictObject({ id: text, name: text, station: text, role: text, faultable: z.boolean().optional() }),
  ).min(1),
  seedEvents: z.array(
    z.strictObject({ time: text, machine: text, minutes: count, reason: text, planned: z.boolean() }),
  ),
  fault: z.strictObject({ machine: text, time: text, minutes: count, button: text, prompt: text, repeatEvery: count }),
  reasons: z.array(z.strictObject({ id: text, label: text, planned: z.boolean() })).min(1),
  messages: z.strictObject({ idle: text, unknown: text, restart: text, restarted: text }),
  v2: z.strictObject({ engine: text, reference: text }).optional(),
});

export const ProductSchema = z
  .strictObject({
    slug: text,
    name: text,
    seo: z.strictObject({ title: text, description: text }),
    nav: z.array(link),
    blocks: z.array(z.enum(BLOCK_NAMES)).min(1),

    hero: HeroSchema.optional(),
    problem: z
      .strictObject({ title: text, statements: z.array(text).min(1), image: asset })
      .optional(),
    promise: text.optional(),
    questions: z
      .array(z.strictObject({ icon: text, title: text, body: text }))
      .optional(),
    tour: TourSchema.optional(),
    architecture: ArchitectureSchema.optional(),
    flow: z
      .strictObject({
        title: text,
        steps: z.array(
          z.strictObject({ label: text, name: text, body: text, human: z.boolean().optional() }),
        ).min(1),
        rule: text,
      })
      .optional(),
    demo: DemoSchema.optional(),
    kpi: z
      .strictObject({
        title: text,
        intro: text,
        factors: z.array(
          z.strictObject({ letter: text, name: text, question: text, loss: text }),
        ).length(3),
        example: z.strictObject({ value: text, body: text }),
      })
      .optional(),
    day: z
      .strictObject({
        title: text,
        phases: z.array(z.strictObject({ name: text, items: z.array(text).min(1) })).length(3),
      })
      .optional(),
    rollup: z
      .strictObject({
        title: text,
        body: text,
        cuts: z.array(text).min(1),
        levels: z.array(z.strictObject({ name: text, body: text })).length(3),
      })
      .optional(),
    benefits: z
      .strictObject({
        title: text,
        items: z.array(z.strictObject({ icon: text, title: text, body: text })).min(1),
      })
      .optional(),
    foundations: z
      .array(z.strictObject({ strong: text, text: text }))
      .optional(),
    deck: z
      .strictObject({
        title: text,
        body: text,
        pdf: text,
        slidesUrl: text,
        pending: z.boolean().optional(),
      })
      .optional(),
    cta: z.strictObject({ title: text, body: text, button: text, href: text }).optional(),
  })
  .superRefine((product, ctx) => {
    const data = product as Record<string, unknown>;
    for (const block of product.blocks) {
      for (const key of BLOCK_DATA[block]) {
        if (data[key] === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: `block "${block}" is listed but "${key}" is missing`,
            path: ['blocks'],
          });
        }
      }
    }
  });

const SystemKey = z.enum(['plc', 'optix', 'nodered', 'influx', 'python', 'sql']);
const ActivityStatus = z.enum(['idle', 'progress', 'complete']);
const LogType = z.enum(['Definition', 'Update', 'Decision', 'Blocker']);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const ProjectSchema = z
  .strictObject({
    slug: text,
    internal: z.literal(true),
    title: text,
    meta: z.strictObject({ designVersion: text, pilot: text, updated: isoDate, synced: text }),
    phases: z.array(z.strictObject({ id: text, name: text, goal: text })).min(1),
    activities: z.array(
      z.strictObject({
        id: text,
        phase: text,
        name: text,
        status: ActivityStatus,
        systems: z.array(SystemKey),
        definition: z.string(),
        log: z.array(z.strictObject({ date: isoDate, type: LogType, text })),
      }),
    ),
    // Question numbers are the row keys; activity null means the whole project
    questions: z.array(
      z.strictObject({
        num: count,
        question: text,
        answer: z.string(),
        activity: text.nullable(),
        decision: z.boolean(),
        asked: isoDate,
        answered: isoDate.nullable(),
      }),
    ),
    architecture: z.array(
      z.strictObject({
        id: z.enum(['field', 'edge', 'historian', 'etl', 'core', 'ops']),
        system: SystemKey,
        layer: text,
        name: text,
        role: text,
        cadence: text,
        tech: text,
        link: z.string(),
        linkFull: text,
        detail: text,
        objects: z.array(text).min(1),
      }),
    ),
  })
  .superRefine((project, ctx) => {
    const phases = new Set(project.phases.map((phase) => phase.id));
    const activities = new Set(project.activities.map((activity) => activity.id));
    const nums = new Set<number>();
    project.activities.forEach((activity, index) => {
      if (!phases.has(activity.phase)) {
        ctx.addIssue({ code: 'custom', message: `unknown phase "${activity.phase}"`, path: ['activities', index, 'phase'] });
      }
    });
    project.questions.forEach((question, index) => {
      const answered = question.answer.trim() !== '';
      const path = ['questions', index];
      if (nums.has(question.num)) {
        ctx.addIssue({ code: 'custom', message: `duplicate question num ${question.num}`, path });
      }
      nums.add(question.num);
      if (question.activity !== null && !activities.has(question.activity)) {
        ctx.addIssue({ code: 'custom', message: `unknown activity "${question.activity}"`, path: [...path, 'activity'] });
      }
      if (answered !== (question.answered !== null)) {
        ctx.addIssue({ code: 'custom', message: 'answered date must be set exactly when the answer is not empty', path });
      }
      if (question.decision && !answered) {
        ctx.addIssue({ code: 'custom', message: 'a decision needs an answer', path });
      }
    });
  });

export type Site = z.infer<typeof SiteSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProductCard = Site['products'][number];
export type BlockName = (typeof BLOCK_NAMES)[number];
