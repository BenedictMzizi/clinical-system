
import { useEffect } from 'react';
import splashImage from '../assets/hwms-splash.png';

export function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      role="status"
      aria-label="Loading Hospital Workflow Management System"
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <img
          src={splashImage}
          alt="HWMS Hospital Workflow Management System"
          className="max-h-[65vh] max-w-[85vw] object-contain"
        />

        <p className="text-sm tracking-[0.25em] text-amber-400">
          HOSPITAL WORKFLOW MANAGEMENT SYSTEM
        </p>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-amber-400" />
        </div>
      </div>
    </div>
  );
}
