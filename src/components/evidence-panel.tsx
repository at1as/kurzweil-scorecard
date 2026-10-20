"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, Copy, X } from "lucide-react";
import type { Reading } from "@/lib/evidence-model";
import type { EvidenceSummary } from "@/lib/evidence-summary";
import { PUBLIC_READINGS } from "@/lib/publication";
import { Badge, External } from "./ui";

type Selection = { id: string; reading: Reading };
const EvidenceContext = createContext<
  ((selection: Selection, trigger: HTMLElement) => void) | null
>(null);
const cache = new Map<string, EvidenceSummary>();
const readings: Reading[] = ["reference", "strict", "broader"];
function selectionFromUrl(): Selection | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("evidence");
  if (!id || !/^[A-Z0-9-]+$/.test(id)) return null;
  const reading = params.get("evidenceReading");
  return {
    id,
    reading: readings.includes(reading as Reading)
      ? (reading as Reading)
      : "reference",
  };
}
function recordUrl({ id, reading }: Selection) {
  return `/predictions/${id}/${reading === "reference" ? "" : `?reading=${reading}`}`;
}
function panelUrl(selection: Selection) {
  const url = new URL(window.location.href);
  url.searchParams.set("evidence", selection.id);
  if (selection.reading === "reference")
    url.searchParams.delete("evidenceReading");
  else url.searchParams.set("evidenceReading", selection.reading);
  return url;
}
export function EvidenceLink({
  predictionId,
  reading = "reference",
  onClick,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  predictionId: string;
  reading?: Reading;
}) {
  const open = useContext(EvidenceContext);
  return (
    <a
      {...props}
      href={recordUrl({ id: predictionId, reading })}
      aria-haspopup={open ? "dialog" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (
          !open ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target ||
          props.download
        )
          return;
        event.preventDefault();
        open({ id: predictionId, reading }, event.currentTarget);
      }}
    >
      {children}
    </a>
  );
}

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<Selection | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const sync = () => setSelection(selectionFromUrl());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  function open(next: Selection, element: HTMLElement) {
    if (!selection) {
      trigger.current = element;
      window.history.pushState(
        { ...window.history.state, evidencePanelEntry: true },
        "",
        panelUrl(next),
      );
    } else {
      window.history.replaceState(window.history.state, "", panelUrl(next));
    }
    setSelection(next);
  }
  function close() {
    if (window.history.state?.evidencePanelEntry) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("evidence");
      url.searchParams.delete("evidenceReading");
      window.history.replaceState(window.history.state, "", url);
      setSelection(null);
    }
  }
  function changeReading(reading: Reading) {
    if (!selection) return;
    const next = { ...selection, reading };
    window.history.replaceState(window.history.state, "", panelUrl(next));
    setSelection(next);
  }
  return (
    <EvidenceContext.Provider value={open}>
      {children}
      {selection && (
        <EvidencePanel
          selection={selection}
          onClose={close}
          onReading={changeReading}
          returnFocus={() => trigger.current?.focus({ preventScroll: true })}
        />
      )}
    </EvidenceContext.Provider>
  );
}

function outcomeLabel(outcome: string) {
  const labels: Record<string, string> = {
    FULFILLED: "Fulfilled",
    FULL: "Fulfilled",
    PARTLY_FULFILLED: "Partly fulfilled",
    PARTIAL: "Partly fulfilled",
    NOT_FULFILLED: "Not fulfilled",
    NOT_DUE: "Not yet due",
    UNDATED: "No deadline",
    UNREVIEWED: "Unreviewed",
    UNASSESSABLE: "Unscorable",
  };
  return labels[outcome] ?? outcome.toLowerCase().replaceAll("_", " ");
}
function EvidencePanel({
  selection,
  onClose,
  onReading,
  returnFocus,
}: {
  selection: Selection;
  onClose: () => void;
  onReading: (reading: Reading) => void;
  returnFocus: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<EvidenceSummary | null>(
    cache.get(selection.id) ?? null,
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const restoreFocus = useRef(returnFocus);
  useEffect(() => {
    const element = dialog.current!;
    const body = document.body;
    const scroll = { x: window.scrollX, y: window.scrollY };
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const previousStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    body.style.position = "fixed";
    body.style.top = `-${scroll.y}px`;
    body.style.left = `-${scroll.x}px`;
    body.style.width = "100%";
    body.style.paddingRight = `${gutter}px`;
    element.showModal();
    return () => {
      element.close();
      Object.assign(body.style, previousStyle);
      window.scrollTo({ left: scroll.x, top: scroll.y, behavior: "instant" });
      // History traversal can focus a URL fragment after React closes the dialog.
      // Restore the initiating row once that browser navigation has finished.
      requestAnimationFrame(() => {
        window.history.scrollRestoration = previousRestoration;
        if (!document.querySelector("dialog[open]")) {
          window.scrollTo({
            left: scroll.x,
            top: scroll.y,
            behavior: "instant",
          });
          restoreFocus.current();
        }
      });
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    setCopyStatus("");
    content.current?.scrollTo({ top: 0, behavior: "instant" });
    dialog.current
      ?.querySelector<HTMLButtonElement>(".evidence-close")
      ?.focus({ preventScroll: true });
    const cached = cache.get(selection.id);
    setRecord(cached ?? null);
    if (!cached) {
      fetch(`/evidence/${selection.id}/summary.json`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("Unavailable");
          return response.json() as Promise<EvidenceSummary>;
        })
        .then((value) => {
          if (!controller.signal.aborted) {
            cache.set(value.id, value);
            setRecord(value);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        });
    }
    return () => controller.abort();
  }, [selection.id, attempt]);
  const current = record?.id === selection.id ? record : null;
  const view = current?.views[selection.reading];
  const fullUrl = recordUrl(selection);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(fullUrl, window.location.origin).href,
      );
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Could not copy. Use the full record link below.");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="evidence-drawer"
      aria-labelledby="evidence-heading"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header className="evidence-drawer-toolbar">
        <span>Prediction & evidence</span>
        <button
          type="button"
          onClick={onClose}
          className="evidence-close"
          aria-label="Close evidence"
        >
          <X size={20} aria-hidden="true" />
          <span>Close</span>
        </button>
      </header>
      <div
        ref={content}
        className="evidence-drawer-content"
        aria-busy={!current && !failed}
      >
        {current && view ? (
          <>
            <div className="evidence-kicker">
              {current.id} <span> / </span> {current.category}
            </div>
            <h2 id="evidence-heading">{current.claim}</h2>
            {current.legacy ? (
              <div className="evidence-legacy">
                <strong>Original intake · not scored</strong>
                <p>{current.legacy.reason}</p>
                {current.legacy.canonicalIds.length > 0 && (
                  <p>
                    Reviewed records:{" "}
                    {current.legacy.canonicalIds.map((id) => (
                      <EvidenceLink key={id} predictionId={id}>
                        {id}
                      </EvidenceLink>
                    ))}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="evidence-reading-row">
                  <Badge verdict={view.verdict} />
                  {current.hasInterpretations && (
                    <label className="inline-select">
                      Interpretation
                      <select
                        aria-label="Evidence interpretation"
                        value={selection.reading}
                        onChange={(e) => onReading(e.target.value as Reading)}
                      >
                        {readings.map((r) => (
                          <option key={r} value={r}>
                            {PUBLIC_READINGS[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <dl className="evidence-facts">
                  <div>
                    <dt>Target</dt>
                    <dd>{view.deadline ?? "Undated"}</dd>
                  </div>
                  <div>
                    <dt>At deadline</dt>
                    <dd>{outcomeLabel(view.atDeadline)}</dd>
                  </div>
                  <div>
                    <dt>By review</dt>
                    <dd>{outcomeLabel(view.atReview)}</dd>
                  </div>
                </dl>
                <p className="evidence-snapshot">
                  Reviewed through {current.asOf}
                  {!view.eligible && " · Outside deadline-based scores"}
                </p>
                <section className="evidence-reading">
                  <h3>Why this judgment</h3>
                  <p>
                    {view.rationale ??
                      "No supported judgment has been assigned yet."}
                  </p>
                </section>
                <section className="evidence-criterion">
                  <h3>What counts</h3>
                  <p>
                    {view.criterion ??
                      "Success criteria have not been established."}
                  </p>
                  {view.changedConditions.length > 0 && (
                    <div className="evidence-changes">
                      <strong>Changed conditions</strong>
                      <ul>
                        {view.changedConditions.map((condition) => (
                          <li key={condition}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </>
            )}
            <section className="evidence-source-section">
              <h3>Outcome sources</h3>
              {view.evidence.length ? (
                <ul className="evidence-source-list">
                  {view.evidence.map((source) => (
                    <li key={source.id}>
                      <External href={source.url}>
                        {source.title.replace(/\*/g, "")}
                      </External>
                      <span className="evidence-source-meta">
                        {source.publishedAt ?? "Date not recorded"} ·{" "}
                        {source.stance.toLowerCase()}
                      </span>
                      <details>
                        <summary>What this source supports</summary>
                        <p>{source.note}</p>
                        <small>Source checked {source.accessedAt}</small>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No outcome sources are attached to this record.</p>
              )}
            </section>
            <details className="evidence-attribution">
              <summary>The original claim & source</summary>
              <p className="evidence-wording-label">
                {current.wordingKind === "VERIFIED_QUOTE"
                  ? "Verified quotation"
                  : "Paraphrase · not a verified quotation"}
              </p>
              <p className="evidence-original">{current.originalWording}</p>
              {current.sources.map((source) => (
                <div className="evidence-attribution-source" key={source.id}>
                  {source.url ? (
                    <External href={source.url}>
                      {source.title.replace(/\*/g, "")}
                    </External>
                  ) : (
                    <strong>{source.title}</strong>
                  )}
                  <p>{source.locator}</p>
                  <small>
                    {source.publicationYear ?? "Year unknown"}
                    {!source.publicationYearVerified &&
                      " · Attributed year; not independently confirmed"}
                  </small>
                </div>
              ))}
              <p className="evidence-caveat">{current.sourceCaveat}</p>
            </details>
          </>
        ) : (
          <div className="evidence-load-state">
            <h2 id="evidence-heading">
              {failed ? "Evidence couldn’t load" : "Loading evidence…"}
            </h2>
            {failed && (
              <>
                <p>You can retry or open the full record.</p>
                <button
                  className="button"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <footer className="evidence-drawer-footer">
        <button type="button" onClick={copyLink}>
          {copyStatus === "Link copied" ? (
            <Check size={15} />
          ) : (
            <Copy size={15} />
          )}{" "}
          Copy record link
        </button>
        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
          Full record & history <ArrowUpRight size={15} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <span
          role="status"
          className={
            copyStatus && copyStatus !== "Link copied"
              ? "evidence-copy-error"
              : "sr-only"
          }
        >
          {copyStatus}
        </span>
      </footer>
    </dialog>
  );
}
