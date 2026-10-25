"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Reading } from "@/lib/evidence-model";

import dynamic from "next/dynamic";
import { type Selection } from "@/lib/evidence-navigation";
import { EvidenceContext } from "./evidence-link";
export { EvidenceLink } from "./evidence-link";
const EvidencePanel = dynamic(
  () => import("./evidence-dialog").then((m) => m.EvidencePanel),
  { ssr: false },
);
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

function panelUrl(selection: Selection) {
  const url = new URL(window.location.href);
  url.searchParams.set("evidence", selection.id);
  if (selection.reading === "reference")
    url.searchParams.delete("evidenceReading");
  else url.searchParams.set("evidenceReading", selection.reading);
  return url;
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
