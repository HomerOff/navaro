import { useEffect, useRef } from 'react';
import L from 'leaflet';

function makeMarker(n, color, size, label = null, selected = false) {
  const s = Math.round(size);
  const fs = Math.round(s * 0.42);
  const border = selected ? 3 : Math.max(2, Math.round(s * 0.1));
  const shadow = selected
    ? `0 0 0 4px ${color}44, 0 6px 16px rgba(0,0,0,.30)`
    : '0 4px 10px rgba(0,0,0,.20),0 0 0 1px rgba(0,0,0,.04)';
  const scale = selected ? 1.18 : 1;
  return L.divIcon({
    className: 'pathly-marker',
    html: `<div style="
      width:${s}px;height:${s}px;border-radius:50%;
      background:${color};border:${border}px solid #fff;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${fs}px;
      font-family:'Plus Jakarta Sans',system-ui,sans-serif;
      transform:scale(${scale});
      transition:transform .2s ease, box-shadow .2s ease;
    ">${label !== null ? label : n}</div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

function makeDayPill(day, km, color) {
  return L.divIcon({
    className: 'pathly-daypill',
    html: `<div style="
      background:${color};color:#fff;border:3px solid #fff;
      padding:6px 13px;border-radius:9999px;
      font-family:'Plus Jakarta Sans',system-ui,sans-serif;
      font-weight:700;font-size:13px;white-space:nowrap;
      box-shadow:0 6px 14px rgba(0,0,0,.16);
    ">Day ${day} · ${km} km</div>`,
    iconSize: [120, 30],
    iconAnchor: [60, 15],
  });
}

/**
 * @param {object} props
 * @param {[number,number]} props.center
 * @param {number}  props.zoom
 * @param {object[]} props.spots   – [{ n, coord, color, size?, label? }]
 * @param {object[]} props.route   – [{ coords, color, weight?, dashed? }]
 * @param {object[]} props.dayPills– [{ at, day, km, color }]
 * @param {boolean}  props.interactive
 * @param {function} props.onMarkerClick – (spotIndex) => void
 * @param {number|null} props.selectedIdx
 * @param {object}  props.style
 */
export function PathlyMap({
  center = [48.8566, 2.3522],
  zoom = 13,
  spots = [],
  route = [],
  dayPills = [],
  interactive = false,
  onMarkerClick,
  selectedIdx = null,
  style,
}) {
  const elRef      = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const pillsRef   = useRef([]);

  // ── Init map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const map = L.map(elRef.current, {
      center, zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: false,
      tap: false,
    });

    if (interactive) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
      maxZoom: 20, subdomains: 'abcd',
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update center/zoom when they change ───────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [center[0], center[1], zoom]);

  // ── Redraw routes ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    route.forEach(r => {
      if (!r.coords?.length) return;
      const pl = L.polyline(r.coords, {
        color: r.color,
        weight: r.weight ?? 6,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: r.dashed ? '4 10' : null,
      }).addTo(mapRef.current);
      polylinesRef.current.push(pl);
    });
  }, [JSON.stringify(route)]);

  // ── Redraw markers ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    spots.forEach((sp, i) => {
      const isSelected = selectedIdx === i;
      const s = (sp.size ?? 30) * (isSelected ? 1.25 : 1);
      const marker = L.marker(sp.coord, {
        icon: makeMarker(sp.n, sp.color, s, sp.label ?? null, isSelected),
        zIndexOffset: isSelected ? 1000 : (sp.z ?? 0),
      }).addTo(mapRef.current);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(i));
      markersRef.current.push(marker);
    });
  }, [JSON.stringify(spots), selectedIdx, onMarkerClick]);

  // ── Redraw day pills ──────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    pillsRef.current.forEach(p => p.remove());
    pillsRef.current = [];

    dayPills.forEach(p => {
      const pill = L.marker(p.at, {
        icon: makeDayPill(p.day, p.km, p.color),
        zIndexOffset: 800,
      }).addTo(mapRef.current);
      pillsRef.current.push(pill);
    });
  }, [JSON.stringify(dayPills)]);

  // ── Pan to selected spot ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || selectedIdx === null) return;
    const sp = spots[selectedIdx];
    if (sp?.coord) {
      mapRef.current.panTo(sp.coord, { animate: true, duration: 0.4 });
    }
  }, [selectedIdx]);

  return (
    <div
      ref={elRef}
      style={{ width: '100%', height: '100%', background: '#E8ECEA', ...style }}
    />
  );
}
