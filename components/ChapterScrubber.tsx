"use client";

interface ChapterScrubberProps {
  currentProgress: number;
  onJumpToAct: (targetProgress: number) => void;
}

const CHAPTER_STOPS = [
  { act: "01", name: "ARRIVAL", progress: 0.0, time: "00:00" },
  { act: "02", name: "THERMAL", progress: 0.38, time: "00:26" },
  { act: "03", name: "BOTANICAL", progress: 0.65, time: "00:45" },
  { act: "04", name: "SANCTUARY", progress: 0.92, time: "01:04" },
];

export default function ChapterScrubber({
  currentProgress,
  onJumpToAct,
}: ChapterScrubberProps) {
  return (
    <div className="fixed left-6 sm:left-10 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-start gap-5 select-none">
      {/* Background Vertical Guide Line */}
      <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-white/10 -z-10" />

      {CHAPTER_STOPS.map((stop, idx) => {
        // Determine if this chapter is currently active
        const nextProgress = CHAPTER_STOPS[idx + 1]?.progress || 1.0;
        const isActive =
          currentProgress >= stop.progress - 0.05 && currentProgress < nextProgress;

        return (
          <button
            key={stop.act}
            onClick={() => onJumpToAct(stop.progress)}
            className="group flex items-center gap-3.5 text-left transition-all cursor-pointer"
            title={`Glide to Act ${stop.act}: ${stop.name}`}
          >
            {/* Dot Indicator */}
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border ${
                isActive
                  ? "bg-[#c5a880] border-[#e4d3ba] scale-125 shadow-md shadow-[#c5a880]/50"
                  : "bg-[#0b0f12] border-white/30 group-hover:border-[#c5a880] group-hover:scale-110"
              }`}
            />

            {/* Label and Time */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono tracking-widest transition-colors ${
                    isActive
                      ? "text-[#c5a880] font-bold"
                      : "text-white/40 group-hover:text-white/80"
                  }`}
                >
                  ACT {stop.act}
                </span>
                <span
                  className={`text-[9px] font-sans tracking-[0.2em] uppercase transition-colors ${
                    isActive
                      ? "text-[#f7f4ee] font-medium"
                      : "text-white/30 group-hover:text-white/60"
                  }`}
                >
                  {stop.name}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
