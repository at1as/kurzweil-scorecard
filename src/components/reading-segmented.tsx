"use client";
import { READINGS, type Reading } from "@/lib/evidence-model";
import { PUBLIC_READINGS } from "@/lib/publication";

export function ReadingSegmented({
  value,
  onChange,
  label = "Reading",
  ariaLabel = "Interpretation",
}: {
  value: Reading;
  onChange: (reading: Reading) => void;
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="snapshot-tier-bar">
      <span className="snapshot-tier-label">{label}</span>
      <div
        className="segmented tier-segmented"
        role="group"
        aria-label={ariaLabel}
      >
        {READINGS.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
          >
            {PUBLIC_READINGS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
