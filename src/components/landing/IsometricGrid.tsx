export function IsometricGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="iso-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 80 20 L 80 60 L 40 80 L 0 60 L 0 20 Z" fill="none" stroke="rgba(0, 191, 191, 0.5)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#iso-grid)" />
      </svg>
    </div>
  );
}
