"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Sparkles, Sliders, X, Play, Pause, Flame, CloudRain, Waves, Bell } from "lucide-react";

interface SoundTrack {
  id: string;
  name: string;
  desc: string;
  icon: typeof CloudRain;
  color: string;
  defaultVolume: number;
}

const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "rain",
    name: "Bamboo Rainfall",
    desc: "Gentle tropical raindrops on warm roof",
    icon: CloudRain,
    color: "#60a5fa",
    defaultVolume: 0.5,
  },
  {
    id: "bowls",
    name: "Tibetan Bowls (432Hz)",
    desc: "Harmonic meditative frequency",
    icon: Bell,
    color: "#fbbf24",
    defaultVolume: 0.6,
  },
  {
    id: "water",
    name: "Thermal Spring",
    desc: "Flowing mineral water stream",
    icon: Waves,
    color: "#34d399",
    defaultVolume: 0.4,
  },
  {
    id: "fire",
    name: "Warm Fireplace",
    desc: "Gentle crackling heated basalt hearth",
    icon: Flame,
    color: "#f87171",
    defaultVolume: 0.3,
  },
];

interface SanctuaryAudioStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SanctuaryAudioStudio({ isOpen, onClose }: SanctuaryAudioStudioProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({
    rain: 0.5,
    bowls: 0.6,
    water: 0.4,
    fire: 0.3,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ [key: string]: { gain: GainNode; stop: () => void } }>({});

  const initWebAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    return ctx;
  }, []);

  const createRainNode = (ctx: AudioContext, gainVal: number) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;

    const gain = ctx.createGain();
    gain.gain.value = gainVal * 0.4;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    return {
      gain,
      stop: () => {
        try {
          noise.stop();
          noise.disconnect();
        } catch {}
      },
    };
  };

  const createBowlsNode = (ctx: AudioContext, gainVal: number) => {
    const baseFreq = 432;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = "sine";
    osc1.frequency.value = baseFreq; // 432Hz Fundamental

    osc2.type = "sine";
    osc2.frequency.value = baseFreq * 1.5; // 648Hz 5th Harmonic

    osc3.type = "sine";
    osc3.frequency.value = baseFreq * 2.76; // Overtones

    // Gentle LFO tremolo
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15; // Slow breathing wave
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.connect(lfoGain.gain);

    const masterGain = ctx.createGain();
    masterGain.gain.value = gainVal * 0.25;

    osc1.connect(masterGain);
    osc2.connect(masterGain);
    osc3.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    return {
      gain: masterGain,
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          osc3.stop();
          lfo.stop();
          masterGain.disconnect();
        } catch {}
      },
    };
  };

  const createWaterNode = (ctx: AudioContext, gainVal: number) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.value = 480;
    filter1.Q.value = 3.0;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "lowpass";
    filter2.frequency.value = 850;

    const gain = ctx.createGain();
    gain.gain.value = gainVal * 0.35;

    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    return {
      gain,
      stop: () => {
        try {
          noise.stop();
          gain.disconnect();
        } catch {}
      },
    };
  };

  const createFireNode = (ctx: AudioContext, gainVal: number) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const r = Math.random();
      data[i] = r > 0.985 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.05;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = gainVal * 0.3;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    return {
      gain,
      stop: () => {
        try {
          noise.stop();
          gain.disconnect();
        } catch {}
      },
    };
  };

  const startSoundscape = () => {
    const ctx = initWebAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Stop existing nodes
    Object.values(nodesRef.current).forEach((node) => node.stop());
    nodesRef.current = {};

    // Start each node
    nodesRef.current.rain = createRainNode(ctx, volumes.rain);
    nodesRef.current.bowls = createBowlsNode(ctx, volumes.bowls);
    nodesRef.current.water = createWaterNode(ctx, volumes.water);
    nodesRef.current.fire = createFireNode(ctx, volumes.fire);

    setIsPlaying(true);
  };

  const stopSoundscape = () => {
    Object.values(nodesRef.current).forEach((node) => node.stop());
    nodesRef.current = {};
    setIsPlaying(false);
  };

  const toggleMaster = () => {
    if (isPlaying) stopSoundscape();
    else startSoundscape();
  };

  const handleVolumeChange = (trackId: string, val: number) => {
    const next = { ...volumes, [trackId]: val };
    setVolumes(next);

    if (nodesRef.current[trackId]) {
      const maxMultiplier = trackId === "bowls" ? 0.25 : trackId === "rain" ? 0.4 : 0.35;
      nodesRef.current[trackId].gain.gain.setTargetAtTime(
        val * maxMultiplier,
        audioCtxRef.current?.currentTime || 0,
        0.05
      );
    }
  };

  const applyPreset = (presetVolumes: { [key: string]: number }) => {
    setVolumes(presetVolumes);
    if (isPlaying && audioCtxRef.current) {
      Object.entries(presetVolumes).forEach(([trackId, val]) => {
        if (nodesRef.current[trackId]) {
          const maxMultiplier = trackId === "bowls" ? 0.25 : trackId === "rain" ? 0.4 : 0.35;
          nodesRef.current[trackId].gain.gain.setTargetAtTime(
            val * maxMultiplier,
            audioCtxRef.current?.currentTime || 0,
            0.05
          );
        }
      });
    } else {
      startSoundscape();
    }
  };

  useEffect(() => {
    return () => {
      Object.values(nodesRef.current).forEach((n) => n.stop());
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0f12] border border-[#c5a880]/35 shadow-2xl p-6 sm:p-7 text-[#f7f4ee] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold tracking-wider text-[#f7f4ee] flex items-center gap-2">
                SANCTUARY SOUNDSCAPE STUDIO
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] font-mono text-[#e8ded2]/60">
                Spatial Organic ASMR Audio Synthesis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Play Toggle */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141b22] to-[#0d1217] border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-sans font-medium text-white block">
              {isPlaying ? "Soundscape is Active" : "Soundscape is Paused"}
            </span>
            <span className="text-[10px] font-mono text-[#c5a880] block">
              {isPlaying ? "Playing 4 Harmonized Layers" : "Tap play to begin relaxation audio"}
            </span>
          </div>

          <button
            onClick={toggleMaster}
            className={`px-5 py-2.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isPlaying
                ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                : "bg-[#c5a880] text-[#07090b] shadow-[#c5a880]/20 hover:brightness-110"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Stop Soundscape
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play Soundscape
              </>
            )}
          </button>
        </div>

        {/* Quick Relaxation Presets */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">
            Curated Presets:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyPreset({ rain: 0.1, bowls: 0.85, water: 0.4, fire: 0.1 })}
              className="p-2 rounded-xl bg-[#10151a] border border-white/10 hover:border-[#c5a880]/50 text-left transition-all cursor-pointer group"
            >
              <span className="block text-[11px] font-sans font-medium text-white group-hover:text-[#c5a880]">
                Deep Zen
              </span>
              <span className="block text-[9px] font-mono text-white/40">432Hz Harmonic</span>
            </button>

            <button
              onClick={() => applyPreset({ rain: 0.8, bowls: 0.25, water: 0.6, fire: 0.2 })}
              className="p-2 rounded-xl bg-[#10151a] border border-white/10 hover:border-[#c5a880]/50 text-left transition-all cursor-pointer group"
            >
              <span className="block text-[11px] font-sans font-medium text-white group-hover:text-[#c5a880]">
                Monsoon Rain
              </span>
              <span className="block text-[9px] font-mono text-white/40">Rain & Stream</span>
            </button>

            <button
              onClick={() => applyPreset({ rain: 0.2, bowls: 0.5, water: 0.1, fire: 0.85 })}
              className="p-2 rounded-xl bg-[#10151a] border border-white/10 hover:border-[#c5a880]/50 text-left transition-all cursor-pointer group"
            >
              <span className="block text-[11px] font-sans font-medium text-white group-hover:text-[#c5a880]">
                Basalt Hearth
              </span>
              <span className="block text-[9px] font-mono text-white/40">Warm Fireplace</span>
            </button>
          </div>
        </div>

        {/* 4 Multi-Track Volume Faders */}
        <div className="space-y-3 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">
            Channel Sliders:
          </span>

          <div className="space-y-2.5">
            {SOUND_TRACKS.map((track) => {
              const Icon = track.icon;
              const val = volumes[track.id] || 0;
              return (
                <div
                  key={track.id}
                  className="p-3 rounded-2xl bg-[#0e1318] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: track.color }} />
                      <span className="text-xs font-sans text-[#f7f4ee] font-medium">
                        {track.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#c5a880]">
                      {Math.round(val * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={val}
                    onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-[#c5a880] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-[10px] font-sans text-white/40">
            Synthesized live in browser with Web Audio API • 100% Zero-lag & Offline Ready
          </p>
        </div>
      </div>
    </div>
  );
}
