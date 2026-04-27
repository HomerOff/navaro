const mk = (vb, paths) => {
  const Comp = ({ size = 20, color = 'currentColor', fill = 'none', sw = 1.7, style, className }) => (
    <svg
      width={size} height={size} viewBox={vb}
      fill={fill} stroke={color} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      className={className}
    >
      {paths}
    </svg>
  );
  return Comp;
};

export const Ic = {
  back:      mk('0 0 24 24', <><path d="M9 14l-4-4 4-4"/><path d="M5 10h10a4 4 0 010 8h-1"/></>),
  close:     mk('0 0 24 24', <path d="M6 6l12 12M18 6L6 18"/>),
  pencil:    mk('0 0 24 24', <path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z"/>),
  chevR:     mk('0 0 24 24', <path d="M9 6l6 6-6 6"/>),
  chevD:     mk('0 0 24 24', <path d="M6 9l6 6 6-6"/>),
  chevUD:    mk('0 0 24 24', <><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></>),
  plus:      mk('0 0 24 24', <><path d="M12 5v14M5 12h14"/></>),
  share:     mk('0 0 24 24', <><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><rect x="4" y="14" width="16" height="7" rx="2"/></>),
  menu3:     mk('0 0 24 24', <><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/></>),
  search:    mk('0 0 24 24', <><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.5-3.5"/></>),
  profile:   mk('0 0 24 24', <><path d="M5 20a7 7 0 0114 0"/><circle cx="12" cy="9" r="4"/></>),
  map:       mk('0 0 24 24', <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>),
  inbox:     mk('0 0 24 24', <><path d="M3 13l2.5-7A2 2 0 017.4 5h9.2a2 2 0 011.9 1L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z"/><path d="M3 13h5l1 2h6l1-2h5"/></>),
  bookmark:  mk('0 0 24 24', <path d="M6 4h12v17l-6-4-6 4V4z"/>),
  bag:       mk('0 0 24 24', <><path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></>),
  pin:       mk('0 0 24 24', <><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9.5" r="2.5"/></>),
  pinFill:   mk('0 0 24 24', <><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" fill="currentColor" stroke="currentColor"/><circle cx="12" cy="9.5" r="2.4" fill="#fff" stroke="#fff"/></>),
  pinBlue:   mk('0 0 24 24', <><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" fill="#3B9DF8" stroke="#3B9DF8"/><circle cx="12" cy="9.5" r="2.4" fill="#fff" stroke="#fff"/></>),
  route:     mk('0 0 24 24', <><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M6 15.5V11a4 4 0 014-4h4M18 8.5V13a4 4 0 01-4 4h-4"/></>),
  routeAlt:  mk('0 0 24 24', <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5V13a4 4 0 004 4h4M18 15.5V11a4 4 0 00-4-4h-4"/></>),
  car:       mk('0 0 24 24', <><path d="M5 11l1.6-4.2A2 2 0 018.5 5.5h7a2 2 0 011.9 1.3L19 11"/><path d="M3 16v-3a2 2 0 012-2h14a2 2 0 012 2v3a1 1 0 01-1 1h-1.5v1.5a1 1 0 01-1 1h-1a1 1 0 01-1-1V17H8v1.5a1 1 0 01-1 1H6a1 1 0 01-1-1V17H4a1 1 0 01-1-1z"/><circle cx="7" cy="14" r="0.8" fill="currentColor" stroke="none"/><circle cx="17" cy="14" r="0.8" fill="currentColor" stroke="none"/></>),
  walk:      mk('0 0 24 24', <><circle cx="13" cy="4.5" r="1.6" fill="currentColor" stroke="none"/><path d="M9 11l3-2 3 1 1 5-3 2v5"/><path d="M11 14l-3 7M14 17l3 4"/></>),
  headph:    mk('0 0 24 24', <path d="M4 13a8 8 0 0116 0v5a2 2 0 01-2 2h-1a1 1 0 01-1-1v-5a1 1 0 011-1h3M4 13v5a2 2 0 002 2h1a1 1 0 001-1v-5a1 1 0 00-1-1H4z"/>),
  sparkle:   mk('0 0 24 24', <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" fill="currentColor" stroke="none"/><path d="M19 15l.6 1.5L21 17l-1.4.5L19 19l-.6-1.5L17 17l1.4-.5L19 15z" fill="currentColor" stroke="none"/></>),
  star:      mk('0 0 24 24', <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" fill="currentColor" stroke="none"/>),
  cal:       mk('0 0 24 24', <><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>),
  check:     mk('0 0 24 24', <><circle cx="12" cy="12" r="10" fill="#16A34A" stroke="none"/><path d="M8 12.5l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none"/></>),
  checkCircle: mk('0 0 24 24', <><circle cx="12" cy="12" r="10"/><path d="M8 12.5l3 3 5-6"/></>),
  loading:   mk('0 0 24 24', <><circle cx="12" cy="12" r="10" stroke="#E2E8F0" fill="none"/><path d="M12 2a10 10 0 0110 10" stroke="#3B9DF8" strokeWidth="2.5" fill="none"/></>),
  globe:     mk('0 0 24 24', <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>),
  bell:      mk('0 0 24 24', <><path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16z"/><path d="M10 21h4"/></>),
  fire:      mk('0 0 24 24', <path d="M12 3s4 5 4 9a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 2 1 3 2 3-1-3 1-7 1-9z" fill="currentColor" stroke="none"/>),
  trash:     mk('0 0 24 24', <><path d="M5 7h14M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7l1 13a2 2 0 002 2h4a2 2 0 002-2l1-13"/></>),
  copy:      mk('0 0 24 24', <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></>),
  phone:     mk('0 0 24 24', <path d="M5 4h3l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>),
  clipboard: mk('0 0 24 24', <><rect x="6" y="5" width="12" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></>),
  diamond:   mk('0 0 24 24', <><path d="M12 3l5 5-5 13L7 8l5-5z" fill="#3B9DF8" stroke="none"/><path d="M12 3l5 5H7l5-5z" fill="#5BB1FA" stroke="none"/></>),
  crossR:    mk('0 0 24 24', <><circle cx="12" cy="12" r="9" fill="#FB7185" stroke="none"/><path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" fill="none"/></>),
  swap:      mk('0 0 24 24', <><path d="M7 7h11l-3-3M17 17H6l3 3"/></>),
  info:      mk('0 0 24 24', <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></>),
  externalLink: mk('0 0 24 24', <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>),
};
