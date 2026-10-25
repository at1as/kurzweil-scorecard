"use client";
import { createContext, useContext, type AnchorHTMLAttributes } from "react";
import type { Reading } from "@/lib/evidence-model";
import { recordUrl, type Selection } from "@/lib/evidence-navigation";
export const EvidenceContext = createContext<
  ((selection: Selection, trigger: HTMLElement) => void) | null
>(null);

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
