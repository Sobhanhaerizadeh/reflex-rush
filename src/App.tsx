import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

type Phase = "idle" | "waiting" | "go" | "result" | "tooSoon";

const TITLE: Record<Phase, string> = {
  idle: "Reflex Rush",
  waiting: "Warte …",
  go: "JETZT",
  result: "", // im Ergebnis wird stattdessen die Zahl gezeigt
  tooSoon: "Zu früh",
};

const HINT: Record<Phase, string> = {
  idle: "Tippe, um zu starten",
  waiting: "Warte auf Grün – noch nicht klicken",
  go: "Klick!",
  result: "Tippe für noch einen Versuch",
  tooSoon: "Zu schnell – tippe, um es erneut zu versuchen",
};

const MIN_DELAY = 1500; // ms
const MAX_DELAY = 4500; // ms

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Timer aufräumen, falls die Komponente verschwindet, während er läuft.
  useEffect(() => clearPending, [clearPending]);

  const start = useCallback(() => {
    setTime(null);
    setPhase("waiting");
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timeoutRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, delay);
  }, []);

  const handleAction = useCallback(() => {
    switch (phase) {
      case "idle":
      case "result":
      case "tooSoon":
        start();
        break;
      case "waiting":
        // Vor Grün geklickt → Fehlstart.
        clearPending();
        setPhase("tooSoon");
        break;
      case "go": {
        const ms = Math.round(performance.now() - startRef.current);
        setTime(ms);
        setBest((b) => (b === null ? ms : Math.min(b, ms)));
        setPhase("result");
        break;
      }
    }
  }, [phase, start, clearPending]);

  return (
    <main
      className="stage"
      data-phase={phase}
      role="button"
      tabIndex={0}
      aria-label={HINT[phase]}
      onClick={handleAction}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleAction();
        }
      }}
    >
      {/* Visier-Ecken – das Wiedererkennungselement */}
      <span className="bracket bracket--tl" aria-hidden="true" />
      <span className="bracket bracket--tr" aria-hidden="true" />
      <span className="bracket bracket--bl" aria-hidden="true" />
      <span className="bracket bracket--br" aria-hidden="true" />

      <header className="hud">
        <span className="hud__brand">REFLEX&nbsp;RUSH</span>
        <span className="hud__best">{best !== null ? `BEST ${best} MS` : "BEST —"}</span>
      </header>

      <div className="core">
        {phase === "result" && time !== null ? (
          <p className="readout" aria-live="polite">
            <span className="readout__num">{time}</span>
            <span className="readout__unit">ms</span>
          </p>
        ) : (
          <h1 className="title">{TITLE[phase]}</h1>
        )}
        <p className="hint">{HINT[phase]}</p>
      </div>
    </main>
  );
}