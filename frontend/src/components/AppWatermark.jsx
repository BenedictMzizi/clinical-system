
import watermark from '../assets/AppWatermark.png';

export function AppWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <img
        src={watermark}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: 0.055,
          objectPosition: 'center',
        }}
      />
    </div>
  );
}
