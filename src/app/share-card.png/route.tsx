import { ImageResponse } from "next/og";
import { AS_OF, AS_OF_LABEL, predictions } from "@/lib/data";
import { categoryResults } from "@/lib/publication";

export const dynamic = "force-static";

export function GET() {
  const fields = categoryResults(
    predictions,
    ["Computing hardware", "Robotics & transportation", "Biology & medicine"],
    AS_OF,
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#f8f7f1",
        color: "#252f29",
        padding: "45px 58px 34px",
        borderTop: "10px solid #34523f",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 21,
          letterSpacing: 2,
        }}
      >
        <span>THE KURZWEIL SCORECARD</span>
        <span style={{ fontSize: 19, letterSpacing: 0, color: "#5e685c" }}>
          jasonwillems.com
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 52 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 560,
            fontSize: 76,
            lineHeight: 1.06,
            letterSpacing: -3,
          }}
        >
          <span>Where was Ray</span>
          <span>Kurzweil right?</span>
          <span
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              letterSpacing: 0,
              marginTop: 30,
              color: "#5e685c",
            }}
          >
            Predictions and outcomes, by field
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 415,
            gap: 28,
          }}
        >
          <span style={{ fontSize: 19, color: "#5e685c" }}>
            Fully realized, on time or late
          </span>
          {fields.map((field) => (
            <div
              key={field.name}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 21,
                }}
              >
                <span>
                  {field.name === "Robotics & transportation"
                    ? "Robotics & transport"
                    : field.name === "Biology & medicine"
                      ? "Biology & medicine"
                      : "Computing hardware"}
                </span>
                <span>
                  {field.realized} / {field.due}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: 19,
                  background: "#e5e7dc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${(field.realized / field.due) * 100}%`,
                    height: "100%",
                    background: "#34523f",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #d3d7ca",
          paddingTop: 22,
          fontSize: 19,
          color: "#5e685c",
        }}
      >
        <span>{predictions.length} selected forecasts · Our judgment</span>
        <span>Review: {AS_OF_LABEL}</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
