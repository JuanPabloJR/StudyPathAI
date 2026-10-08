import { useEffect, useRef, useState } from 'react';

/**
 * Columnas agrupadas: tiempo real vs. estimado por módulo (minutos).
 * Specs de marca: columnas <= 24px, extremo redondeado 4px y base recta,
 * 2px de separación entre columnas vecinas, grid recesivo, tooltip por columna
 * y tabla accesible. Colores validados (accent #0369A1 / estimate #7C3AED).
 */

export interface TimeComparisonDatum {
  label: string;     // "M1", "M2"...
  title: string;     // título completo del módulo (tooltip)
  estimated: number; // minutos
  real: number;      // minutos
}

const SERIES = [
  { key: 'estimated', name: 'Estimado', color: '#7C3AED' },
  { key: 'real',      name: 'Real',     color: '#0369A1' },
] as const;

const HEIGHT = 260;
const PAD    = { top: 12, right: 8, bottom: 28, left: 40 };
const BAR_W  = 20;
const GAP    = 2;

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`);

function niceMax(v: number) {
  if (v <= 0) return 60;
  const step = v <= 120 ? 30 : v <= 300 ? 60 : 120;
  return Math.ceil(v / step) * step;
}

// Columna con extremo superior redondeado y base recta
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export function TimeComparisonChart({ data }: { data: TimeComparisonDatum[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  const [hover, setHover] = useState<{ i: number; s: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const max    = niceMax(Math.max(...data.flatMap((d) => [d.estimated, d.real])));
  const plotW  = width - PAD.left - PAD.right;
  const plotH  = HEIGHT - PAD.top - PAD.bottom;
  const band   = plotW / Math.max(data.length, 1);
  const groupW = BAR_W * 2 + GAP;
  const y      = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks  = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  const hovered = hover ? data[hover.i] : null;
  const hoveredSeries = hover ? SERIES[hover.s] : null;

  return (
    <div>
      {/* Leyenda (2 series) */}
      <div className="flex items-center gap-4 mb-3 text-xs text-body">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={HEIGHT} role="img" aria-label="Tiempo real vs. estimado por módulo">
          {/* Grid recesivo + eje Y */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#F1F5F9" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#94A3B8">
                {fmtMin(t)}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="#E2E8F0" />

          {data.map((d, i) => {
            const gx = PAD.left + band * i + (band - groupW) / 2;
            return (
              <g key={d.label}>
                {SERIES.map((s, si) => {
                  const v  = d[s.key];
                  const bx = gx + si * (BAR_W + GAP);
                  const dim = hover && !(hover.i === i && hover.s === si);
                  return (
                    <path
                      key={s.key}
                      d={barPath(bx, y(v), BAR_W, y(0) - y(v))}
                      fill={s.color}
                      opacity={dim ? 0.45 : 1}
                    />
                  );
                })}
                {/* Zonas de hover más grandes que la marca */}
                {SERIES.map((s, si) => (
                  <rect
                    key={`hit-${s.key}`}
                    x={gx + si * (BAR_W + GAP) - GAP}
                    y={PAD.top}
                    width={BAR_W + GAP * 2}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHover({ i, s: si })}
                  />
                ))}
                <text x={gx + groupW / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="#475569">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && hoveredSeries && hover && (
          <div
            className="pointer-events-none absolute z-10 bg-white border border-gray-100 shadow-md rounded-lg px-3 py-2 text-xs"
            style={{
              left: Math.min(width - 180, PAD.left + band * hover.i + band / 2),
              top:  Math.max(0, y(hovered[hoveredSeries.key]) - 56),
            }}
          >
            <p className="font-semibold text-ink truncate max-w-[160px]">{hovered.title}</p>
            <p className="text-body flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: hoveredSeries.color }} />
              {hoveredSeries.name}: <span className="font-semibold text-ink">{fmtMin(hovered[hoveredSeries.key])}</span>
            </p>
          </div>
        )}
      </div>

      {/* Vista de tabla para lectores de pantalla */}
      <div className="sr-only">
      <table>
        <caption>Tiempo real vs. estimado por módulo, en minutos</caption>
        <thead>
          <tr><th>Módulo</th><th>Estimado</th><th>Real</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><td>{d.title}</td><td>{d.estimated}</td><td>{d.real}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
