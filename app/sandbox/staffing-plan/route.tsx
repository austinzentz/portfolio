import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Route } from "./+types/route";
import type { RouteHandle } from "~/root";
import { title } from "~/lib/site";
import { useLocalState } from "../use-local-state";
import { CATEGORIES, isPlan, PILL, SEED, STAFF, type Category, type Plan, type Staff } from "./data";

export const meta: Route.MetaFunction = () => [
  { title: title("Next-year staffing plan", "Sandbox") },
  {
    name: "description",
    content: "A small demo: drag staff into next year's positions to see which vacancies a school will have.",
  },
];

export const handle = { layout: "wide", parent: { to: "/sandbox", label: "Sandbox" } } satisfies RouteHandle;

const POOL = "pool";
const OUT = "out";
const slotId = (positionId: string) => `pos:${positionId}`;
const byId = new Map(STAFF.map((x) => [x.id, x]));

/** Move one person to a new place. Whoever held a target position goes back to the unplaced list. */
function move(plan: Plan, staffId: string, target: string): Plan {
  const assignments = Object.fromEntries(Object.entries(plan.assignments).filter(([, v]) => v !== staffId));
  const notReturning = plan.notReturning.filter((x) => x !== staffId);
  if (target === OUT) notReturning.push(staffId);
  else if (target.startsWith("pos:")) assignments[target.slice(4)] = staffId;
  return { ...plan, assignments, notReturning };
}

/** What the assign sheet is open for: a person ("where do they go?") or an empty position ("who fills it?"). */
type Picker = { kind: "person"; staffId: string } | { kind: "slot"; positionId: string } | null;

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Prefer whatever is under the pointer; fall back to overlap (keyboard dragging has no pointer).
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

export default function StaffingPlan() {
  const [plan, setPlan, reset] = useLocalState("sandbox:staffing-plan:v1", SEED, isPlan);
  const [dragging, setDragging] = useState<Staff | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const justDragged = useRef(false);

  // Mouse can always drag. Touch drags only on wide screens: on a phone the list and the positions are
  // screens apart, so a touch there is a tap (opens the assign sheet) or a scroll, never an accidental drag.
  // Keyboard users press Enter on a card, which opens the same sheet.
  const wideScreen = useMediaQuery("(min-width: 1024px)");
  const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 4 } });
  const touch = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } });
  // Always pass two slots (null when off): React needs the same number of sensors on every render.
  const sensors = useSensors(mouse, wideScreen ? touch : null);

  const { pool, stats } = useMemo(() => {
    const placed = new Set([...Object.values(plan.assignments), ...plan.notReturning]);
    const pool = STAFF.filter((x) => !placed.has(x.id));
    const filled = plan.positions.filter((x) => plan.assignments[x.id]).length;
    return {
      pool,
      stats: {
        filled,
        total: plan.positions.length,
        vacant: plan.positions.length - filled,
        leaving: plan.notReturning.length,
      },
    };
  }, [plan]);

  const placeLabel = (id: string | undefined) => {
    if (!id) return "nowhere";
    if (id === POOL) return "the unplaced list";
    if (id === OUT) return "Not returning";
    return plan.positions.find((x) => slotId(x.id) === id)?.title ?? "a position";
  };
  const nameOf = (id: string | number) => byId.get(String(id))?.name ?? "Staff member";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) => `${nameOf(active.id)} is over ${placeLabel(over?.id as string | undefined)}.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} moved to ${placeLabel(over.id as string)}.`
        : `${nameOf(active.id)} was dropped. No change.`,
    onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} stays where they were.`,
  };

  const onDragStart = (e: DragStartEvent) => setDragging(byId.get(String(e.active.id)) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    // A drop can end with a click on the card; don't let that also open the sheet.
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false));
    if (e.over) setPlan((p) => move(p, String(e.active.id), String(e.over!.id)));
  };

  const addPosition = (category: Category) =>
    setPlan((p) => ({
      ...p,
      positions: [...p.positions, { id: crypto.randomUUID(), category, title: "New position" }],
    }));
  const renamePosition = (id: string, title: string) =>
    setPlan((p) => ({ ...p, positions: p.positions.map((x) => (x.id === id ? { ...x, title } : x)) }));
  const removePosition = (id: string) =>
    setPlan((p) => {
      const { [id]: _, ...assignments } = p.assignments;
      return { ...p, positions: p.positions.filter((x) => x.id !== id), assignments };
    });
  const unplace = (staffId: string) => setPlan((p) => move(p, staffId, POOL));
  const pickPerson = (staffId: string) => {
    if (!justDragged.current) setPicker({ kind: "person", staffId });
  };
  const pickSlot = (positionId: string) => setPicker({ kind: "slot", positionId });
  const assign = (staffId: string, target: string) => {
    setPlan((p) => move(p, staffId, target));
    setPicker(null);
  };

  return (
    <div className="font-sans">
      <h1 className="font-serif text-3xl font-medium tracking-tight">Next-year staffing plan</h1>
      {/* Same columns as the app below (19rem staff list, 2.5rem gap, then the rest split in half),
          so the note's left edge lines up with the "Unplaced staff" stat and its right edge with the page. */}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[19rem_2.5rem_minmax(0,1fr)_minmax(0,1fr)] lg:gap-0">
        <p className="max-w-[42rem] text-muted lg:col-span-3 lg:pr-10">
          This year's staff at a made-up elementary school are on the left. Drag each person into the position they'll
          hold next year, or into <em>Not returning</em> at the bottom (or tap a person or an empty position to choose
          from a list). It helps a school leader and their central office support team stay on the same page about
          vacancies, offer letters, and returner status.
        </p>
        <aside
          aria-label="About this demo"
          className="max-w-[42rem] border-t border-rule pt-4 text-sm leading-relaxed text-muted lg:self-start lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
        >
          <p>
            This demo uses fake data, and dnd-kit to achieve the drag-and-drop function. A real version pushes and pulls
            from the district's HR system and e-signature platform for official offers.
          </p>
        </aside>
      </div>

      <DndContext
        id="staffing-plan"
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
        accessibility={{ announcements }}
      >
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10">
          <Pool staff={pool} onPick={pickPerson} />

          <div>
            <div className="flex items-start justify-between gap-4">
              <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-4">
                {[
                  ["Filled", `${stats.filled} of ${stats.total}`],
                  ["Vacancies", stats.vacant],
                  ["Unplaced staff", pool.length],
                  ["Not returning", stats.leaving],
                ].map(([label, value]) => (
                  <div key={label} className="bg-bg px-3 py-3 sm:px-4">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-1 text-base font-medium tabular-nums sm:text-lg">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mt-2 text-right">
              <button type="button" onClick={reset} className="text-sm text-muted hover:text-fg">
                Reset demo
              </button>
            </p>

            <div className="mt-4 space-y-10">
              {CATEGORIES.map((category) => {
                const positions = plan.positions.filter((x) => x.category === category);
                const open = positions.filter((x) => !plan.assignments[x.id]).length;
                return (
                  <section key={category} aria-labelledby={`cat-${category}`}>
                    <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
                      <h2 id={`cat-${category}`} className="text-sm font-medium tracking-[0.08em] text-muted uppercase">
                        {category}
                      </h2>
                      <span className="text-xs text-muted tabular-nums">
                        {positions.length === 0 ? "No positions" : open === 0 ? "All filled" : `${open} open`}
                      </span>
                    </div>
                    <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {positions.map((position) => {
                        const holder = plan.assignments[position.id];
                        return (
                          <Slot
                            key={position.id}
                            positionId={position.id}
                            title={position.title}
                            staff={holder ? byId.get(holder) : undefined}
                            onRename={(t) => renamePosition(position.id, t)}
                            onRemove={() => removePosition(position.id)}
                            onUnplace={unplace}
                            onPickPerson={pickPerson}
                            onPickSlot={() => pickSlot(position.id)}
                          />
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      onClick={() => addPosition(category)}
                      className="mt-3 text-sm text-accent hover:underline"
                    >
                      + Add position
                    </button>
                  </section>
                );
              })}

              <NotReturning
                staff={plan.notReturning.map((id) => byId.get(id)).filter((x): x is Staff => !!x)}
                onUnplace={unplace}
                onPick={pickPerson}
              />
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>{dragging && <CardBody staff={dragging} lifted />}</DragOverlay>
      </DndContext>

      <AssignSheet picker={picker} plan={plan} pool={pool} onAssign={assign} onClose={() => setPicker(null)} />
    </div>
  );
}

function Pool({ staff, onPick }: { staff: Staff[]; onPick: (staffId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL });
  return (
    <aside
      ref={setNodeRef}
      aria-label="Current staff, not yet placed"
      className={`flex max-h-[24rem] flex-col rounded-md border bg-surface lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start ${
        isOver ? "border-accent" : "border-rule"
      }`}
    >
      <div className="flex items-baseline justify-between border-b border-rule px-3 py-2.5">
        <h2 className="text-sm font-medium tracking-[0.08em] text-muted uppercase">Current staff</h2>
        <span className="text-xs text-muted tabular-nums">{staff.length} unplaced</span>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2">
        {staff.map((x) => (
          <li key={x.id}>
            <StaffCard staff={x} onPick={() => onPick(x.id)} />
          </li>
        ))}
        {staff.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted">Everyone has a place next year.</li>
        )}
      </ul>
    </aside>
  );
}

function Slot({
  positionId,
  title,
  staff,
  onRename,
  onRemove,
  onUnplace,
  onPickPerson,
  onPickSlot,
}: {
  positionId: string;
  title: string;
  staff?: Staff;
  onRename: (title: string) => void;
  onRemove: () => void;
  onUnplace: (staffId: string) => void;
  onPickPerson: (staffId: string) => void;
  onPickSlot: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId(positionId) });
  return (
    <li
      ref={setNodeRef}
      className={`rounded-md border p-2 transition-colors ${
        isOver ? "border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--bg))]" : "border-rule bg-bg"
      }`}
    >
      <div className="flex items-center gap-1">
        <input
          aria-label="Position title"
          value={title}
          onChange={(e) => onRename(e.target.value)}
          className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-medium hover:border-rule focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove position ${title}`}
          className="rounded px-1.5 text-muted hover:text-fg"
        >
          ×
        </button>
      </div>
      <div className="mt-1.5">
        {staff ? (
          <StaffCard staff={staff} onUnplace={() => onUnplace(staff.id)} onPick={() => onPickPerson(staff.id)} />
        ) : (
          <button
            type="button"
            onClick={onPickSlot}
            aria-label={`Fill ${title}`}
            className="flex h-[3.625rem] w-full items-center justify-center rounded border border-dashed border-rule text-xs text-muted hover:border-accent hover:text-fg"
          >
            {isOver ? "Drop to fill" : "Vacant"}
          </button>
        )}
      </div>
    </li>
  );
}

function NotReturning({
  staff,
  onUnplace,
  onPick,
}: {
  staff: Staff[];
  onUnplace: (staffId: string) => void;
  onPick: (staffId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: OUT });
  return (
    <section aria-labelledby="cat-out">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
        <h2 id="cat-out" className="text-sm font-medium tracking-[0.08em] text-muted uppercase">
          Not returning
        </h2>
        <span className="text-xs text-muted tabular-nums">{staff.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`mt-3 min-h-24 rounded-md border border-dashed p-2 transition-colors ${
          isOver ? "border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--bg))]" : "border-rule"
        }`}
      >
        {staff.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Drag anyone who won't be back next year here, or tap them and choose Not returning.
          </p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {staff.map((x) => (
              <li key={x.id}>
                <StaffCard staff={x} onUnplace={() => onUnplace(x.id)} onPick={() => onPick(x.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StaffCard({ staff, onUnplace, onPick }: { staff: Staff; onUnplace?: () => void; onPick: () => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: staff.id });
  return (
    <div className={`relative ${isDragging ? "opacity-30" : ""}`}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        // dnd-kit's default description tells keyboard users to press Space to drag; here Enter or Space opens the sheet.
        aria-describedby={undefined}
        aria-roledescription="staff member"
        aria-label={`${staff.name}, ${staff.title}, ${staff.performance}. Choose where they'll be next year.`}
        onClick={onPick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        className="cursor-grab touch-manipulation rounded active:cursor-grabbing"
      >
        <CardBody staff={staff} padRight={!!onUnplace} />
      </div>
      {onUnplace && (
        <button
          type="button"
          onClick={onUnplace}
          aria-label={`Move ${staff.name} back to unplaced`}
          title="Back to current staff"
          className="absolute top-1.5 right-1.5 rounded px-1.5 text-sm text-muted hover:text-fg"
        >
          ↩
        </button>
      )}
    </div>
  );
}

function CardBody({ staff, lifted, padRight }: { staff: Staff; lifted?: boolean; padRight?: boolean }) {
  return (
    <div
      className={`rounded border border-rule bg-bg px-2.5 py-2 ${padRight ? "pr-8" : ""} ${
        lifted ? "cursor-grabbing shadow-lg ring-1 ring-accent" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{staff.name}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${PILL[staff.performance]}`}>
          {staff.performance}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted">{staff.title}</div>
    </div>
  );
}

function AssignSheet({
  picker,
  plan,
  pool,
  onAssign,
  onClose,
}: {
  picker: Picker;
  plan: Plan;
  pool: Staff[];
  onAssign: (staffId: string, target: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (picker && !dialog.open) dialog.showModal();
    if (!picker && dialog.open) dialog.close();
  }, [picker]);

  const person = picker?.kind === "person" ? byId.get(picker.staffId) : undefined;
  const position = picker?.kind === "slot" ? plan.positions.find((x) => x.id === picker.positionId) : undefined;
  const holderOf = (positionId: string) => {
    const id = plan.assignments[positionId];
    return id ? byId.get(id) : undefined;
  };

  const option =
    "flex w-full items-center justify-between gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-surface focus-visible:bg-surface disabled:cursor-default disabled:hover:bg-transparent";

  return (
    <dialog
      ref={ref}
      aria-labelledby="assign-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself; clicks inside land on its children.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-hidden rounded-t-xl border border-rule bg-bg p-0 text-fg shadow-xl backdrop:bg-black/40 sm:m-auto sm:max-h-[80dvh] sm:max-w-md sm:rounded-xl"
    >
      {(person || position) && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3">
            <div className="min-w-0">
              <h2 id="assign-title" className="font-serif text-lg font-medium tracking-tight">
                {person ? `Where will ${person.name} be next year?` : `Who fills ${position!.title}?`}
              </h2>
              {person && (
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {person.title}
                  <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${PILL[person.performance]}`}>
                    {person.performance}
                  </span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 rounded px-2 py-1 text-lg leading-none text-muted hover:text-fg"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {person &&
              (() => {
                const isOut = plan.notReturning.includes(person.id);
                const isPlaced = isOut || Object.values(plan.assignments).includes(person.id);
                return (
                  <>
                    {CATEGORIES.map((category) => {
                      const positions = plan.positions.filter((x) => x.category === category);
                      if (positions.length === 0) return null;
                      return (
                        <section key={category} className="mb-2">
                          <h3 className="px-3 pt-2 pb-1 text-xs font-medium tracking-[0.08em] text-muted uppercase">
                            {category}
                          </h3>
                          <ul>
                            {positions.map((pos) => {
                              const holder = holderOf(pos.id);
                              const current = holder?.id === person.id;
                              return (
                                <li key={pos.id}>
                                  <button
                                    type="button"
                                    disabled={current}
                                    onClick={() => onAssign(person.id, slotId(pos.id))}
                                    className={option}
                                  >
                                    <span className="truncate">{pos.title}</span>
                                    <span className="shrink-0 text-xs text-muted">
                                      {current ? (
                                        "Current pick"
                                      ) : holder ? (
                                        <>Replaces {holder.name}</>
                                      ) : (
                                        <span className="text-accent">Vacant</span>
                                      )}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      );
                    })}
                    <div className="mt-1 border-t border-rule pt-2">
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={() => onAssign(person.id, OUT)}
                        className={option}
                      >
                        <span>Not returning</span>
                        {isOut && <span className="text-xs text-muted">Current pick</span>}
                      </button>
                      {isPlaced && (
                        <button type="button" onClick={() => onAssign(person.id, POOL)} className={option}>
                          <span>Back to current staff (undecided)</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

            {position && (
              <>
                {pool.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted">
                    Everyone already has a place. Move someone back to current staff first, or leave this one vacant.
                  </p>
                ) : (
                  <>
                    <p className="px-3 pt-1 pb-2 text-xs text-muted">Showing staff who don't have a place yet.</p>
                    <ul>
                      {pool.map((x) => (
                        <li key={x.id}>
                          <button type="button" onClick={() => onAssign(x.id, slotId(position.id))} className={option}>
                            <span className="min-w-0">
                              <span className="block truncate">{x.name}</span>
                              <span className="block truncate text-xs text-muted">{x.title}</span>
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${PILL[x.performance]}`}
                            >
                              {x.performance}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
