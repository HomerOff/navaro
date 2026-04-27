export function PathlyLogo({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" fill="#3b9df8" rx="7"/>
      <circle cx="24.5" cy="7.5" r="2.5" fill="#fff"/>
      <path fill="#fff" d="M10 24.292a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
      <path stroke="#fff" strokeWidth="3" d="M7.5 22.331V16c0-6.331 17 6.331 17 0V9.669"/>
    </svg>
  );
}
