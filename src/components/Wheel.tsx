import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { WheelItem } from "../types";
import { computeSegments, type SpinPlan } from "../lib/wheel";
import { readableInk, withAlpha } from "../lib/colors";

const CX = 200;
const CY = 200;
const R = 176;

export interface WheelHandle {
  spin(plan: SpinPlan): Promise<void>;
  reset(animate?: boolean): void;
  rotation(): number;
}

interface WheelProps {
  items: WheelItem[];
  spinning: boolean;
  disabled: boolean;
  spinLabel: string;
  hubLabel: string;
  countLabel: string;
  onSpin: () => void;
  onAddOption: () => void;
}

function polar(radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(radians), CY + radius * Math.sin(radians)];
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function segmentPath(startAngle: number, endAngle: number): string {
  const sweep = endAngle - startAngle;
  const [x1, y1] = polar(R, startAngle);
  const [x2, y2] = polar(R, endAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  if (sweep >= 359.999) {
    return `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`;
  }
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel(
  { items, spinning, disabled, spinLabel, hubLabel, countLabel, onSpin, onAddOption },
  ref,
) {
  const rotorRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animationRef = useRef<Animation | null>(null);
  const segments = useMemo(() => computeSegments(items), [items]);
  const radialLabels = items.length > 6 || segments.some((segment) => segment.sweep < 34);

  useEffect(() => {
    return () => {
      animationRef.current?.cancel();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    spin(plan: SpinPlan) {
      const element = rotorRef.current;
      if (!element) return Promise.resolve();
      animationRef.current?.cancel();
      const start = rotationRef.current;
      element.style.transform = `rotate(${start}deg)`;
      const animation = element.animate(
        [
          { transform: `rotate(${start}deg)` },
          { transform: `rotate(${plan.targetRotation}deg)` },
        ],
        {
          duration: plan.duration * 1000,
          easing: "cubic-bezier(0.42, 0, 0.08, 1)",
          fill: "forwards",
        },
      );
      animationRef.current = animation;
      return new Promise<void>((resolve) => {
        animation.onfinish = () => {
          element.style.transform = `rotate(${plan.targetRotation}deg)`;
          rotationRef.current = plan.targetRotation;
          animation.cancel();
          animationRef.current = null;
          pointerRef.current?.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(7deg)" },
              { transform: "rotate(-4deg)" },
              { transform: "rotate(0deg)" },
            ],
            { duration: 420, easing: "cubic-bezier(0.22, 0.9, 0.3, 1)" },
          );
          resolve();
        };
        animation.oncancel = () => resolve();
      });
    },
    reset(animate = true) {
      const element = rotorRef.current;
      animationRef.current?.cancel();
      animationRef.current = null;
      if (!element) {
        rotationRef.current = 0;
        return;
      }
      const current = rotationRef.current;
      if (!animate || Math.abs(current % 360) < 0.01) {
        element.style.transform = "rotate(0deg)";
        rotationRef.current = 0;
        return;
      }
      element.style.transform = `rotate(${current}deg)`;
      const animation = element.animate(
        [{ transform: `rotate(${current}deg)` }, { transform: "rotate(0deg)" }],
        { duration: 520, easing: "cubic-bezier(0.3, 0.8, 0.2, 1)", fill: "forwards" },
      );
      animation.onfinish = () => {
        element.style.transform = "rotate(0deg)";
        rotationRef.current = 0;
        animation.cancel();
      };
    },
    rotation() {
      return rotationRef.current;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="wheel-stage">
        <div className="absolute inset-[3%] rounded-full border border-dashed border-[rgba(18,18,24,0.14)] bg-white/35" />
        <button
          type="button"
          onClick={onAddOption}
          aria-label={spinLabel}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-full text-muted transition active:scale-[0.99]"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/85 shadow-[0_16px_34px_-20px_rgba(20,20,40,0.35)]">
            <Plus size={24} strokeWidth={2.2} />
          </span>
          <span className="max-w-[180px] text-center text-[12px] font-semibold leading-5">
            {countLabel}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="wheel-stage">
      <div className="wheel-glow" aria-hidden="true" />
      <div className="wheel-static-shadow" aria-hidden="true" />
      <div className="absolute inset-0 z-[1] flex items-center justify-center">
        <svg
          viewBox="0 0 400 400"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={countLabel}
        >
          <circle cx={CX} cy={CY} r={189} fill="rgba(255,255,255,0.72)" />
          <circle cx={CX} cy={CY} r={187} fill="none" stroke="rgba(18,18,24,0.055)" strokeWidth="1.5" />
          <g ref={rotorRef} className="wheel-rotor">
            {items.length === 1 ? (
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill={items[0].color}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="3"
              />
            ) : (
              segments.map((segment) => (
                <path
                  key={segment.item.id}
                  d={segmentPath(segment.startAngle, segment.endAngle)}
                  fill={segment.item.color}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              ))
            )}

            {segments.map((segment) => {
              const ink = readableInk(segment.item.color);
              if (radialLabels) {
                const radius = R * 0.7;
                const maxChars = Math.max(5, Math.floor(segment.sweep * 0.55));
                const label = truncate(segment.item.name, Math.min(18, maxChars));
                const localRotation =
                  segment.midAngle >= 90 && segment.midAngle < 270 ? 270 : 90;
                return (
                  <g
                    key={`label-${segment.item.id}`}
                    transform={`rotate(${segment.midAngle} ${CX} ${CY})`}
                  >
                    <text
                      x={CX}
                      y={CY - radius}
                      transform={`rotate(${localRotation} ${CX} ${CY - radius})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={ink}
                      fontSize="9.6"
                      fontWeight="700"
                      letterSpacing="-0.01em"
                      style={{ paintOrder: "stroke", stroke: withAlpha("#FFFFFF", 0.28), strokeWidth: 2 }}
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              const fontSize = segments.length <= 4 ? 14 : 12.4;
              const maxChars =
                segment.sweep > 120 ? 22 : segment.sweep > 70 ? 16 : segment.sweep > 45 ? 11 : 8;
              const [x, y] = polar(R * 0.64, segment.midAngle);
              return (
                <text
                  key={`label-${segment.item.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={ink}
                  fontSize={fontSize}
                  fontWeight="700"
                  letterSpacing="-0.02em"
                  style={{
                    paintOrder: "stroke",
                    stroke: withAlpha("#FFFFFF", 0.24),
                    strokeWidth: 2.5,
                  }}
                >
                  {truncate(segment.item.name, maxChars)}
                </text>
              );
            })}
          </g>

          <circle cx={CX} cy={CY} r={R + 9} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="18" />
          <circle cx={CX} cy={CY} r={R + 18} fill="none" stroke="rgba(18,18,24,0.065)" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[-1.5%] z-20 -translate-x-1/2">
        <div ref={pointerRef} className="origin-top">
          <svg
            width="34"
            height="43"
            viewBox="0 0 34 43"
            fill="none"
            className="drop-shadow-[0_10px_14px_rgba(17,17,20,0.28)]"
            aria-hidden="true"
          >
            <path
              d="M17 41.5 4.1 19.2a14.9 14.9 0 1 1 25.8 0L17 41.5Z"
              fill="#111114"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="2.4"
            />
            <circle cx="17" cy="16.2" r="4.1" fill="rgba(255,255,255,0.92)" />
          </svg>
        </div>
      </div>

      <button
        type="button"
        onClick={onSpin}
        disabled={disabled || spinning}
        aria-label={spinLabel}
        aria-busy={spinning}
        className="absolute left-1/2 top-1/2 z-10 flex aspect-square w-[25%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.99),rgba(248,248,250,0.92))] text-ink shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_34px_-14px_rgba(20,18,40,0.45),0_0_0_1px_rgba(18,18,24,0.05)] transition duration-200 active:scale-[0.955] disabled:opacity-80"
      >
        <span className="absolute inset-[7%] rounded-full border border-[rgba(18,18,24,0.055)]" />
        <Sparkles
          size={18}
          strokeWidth={2.1}
          className={spinning ? "animate-pulse" : ""}
        />
        <span className="text-[10px] font-bold tracking-[-0.01em]">{hubLabel}</span>
      </button>
    </div>
  );
});
