import { useState } from "react";
import { Sparkles, Check, Sun, Moon, Compass, Leaf, Shield, Zap, Heart } from "lucide-react";

export type ThemePreset = "ivory" | "dark" | "amber" | "emerald" | "ninja" | "purple";

interface ThemeSectionProps {
  currentTheme: ThemePreset;
  onSelectTheme: (theme: ThemePreset) => void;
}

export default function ThemeSection({ currentTheme, onSelectTheme }: ThemeSectionProps) {
  const presets = [
    {
      id: "ivory" as const,
      name: "Classic Ivory",
      desc: "Warm off-white sand aesthetic. High contrast, easy legibility.",
      bg: "bg-white border-neutral-200 text-neutral-800",
      indicator: "bg-awaji-gold",
      icon: Sun,
    },
    {
      id: "dark" as const,
      name: "Cosmic Slate",
      desc: "Deep atmospheric space workspace. Safe on eyes during midnight studies.",
      bg: "bg-neutral-950 border-neutral-800 text-white",
      indicator: "bg-indigo-500",
      icon: Moon,
    },
    {
      id: "ninja" as const,
      name: "Ninja Blue",
      desc: "Deep shadows and neon cobalt accents. Optimized for silent night coding.",
      bg: "bg-[#0B132B] border-blue-900/50 text-blue-200",
      indicator: "bg-blue-500",
      icon: Shield,
    },
    {
      id: "purple" as const,
      name: "Ethereal Purple",
      desc: "Mystical starry lavender sanctuary. Keeps the brain active and imaginative.",
      bg: "bg-[#130E20] border-purple-900/50 text-purple-200",
      indicator: "bg-purple-500",
      icon: Zap,
    },

    {
      id: "amber" as const,
      name: "Sunlight Amber",
      desc: "Cozy golden study sanctuary. Enhances relaxation and mental flow.",
      bg: "bg-amber-50/50 border-amber-200 text-amber-900",
      indicator: "bg-amber-500",
      icon: Compass,
    },
    {
      id: "emerald" as const,
      name: "Emerald Garden",
      desc: "Peaceful forest clearing. Designed for extended technical workshops.",
      bg: "bg-emerald-50/50 border-emerald-200 text-emerald-900",
      indicator: "bg-emerald-600",
      icon: Leaf,
    }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in" id="theme-section">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/40 shadow-sm">
        <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
          Module 06
        </span>
        <h2 className="text-2xl font-display font-black text-neutral-800 tracking-tight mt-1">
          Study Space Customizer
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Select a localized preset or ambient colorway for your active student layout.
        </p>
      </div>

      {/* Preset Cards Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {presets.map((p) => {
          const IconComp = p.icon;
          const isActive = currentTheme === p.id;
          return (
            <button
              key={p.id}
              id={`theme-preset-${p.id}`}
              onClick={() => onSelectTheme(p.id)}
              className={`p-6 rounded-3xl border text-left flex flex-col justify-between h-[160px] transition-all duration-300 hover:shadow-md cursor-pointer ${p.bg} ${
                isActive ? "ring-2 ring-offset-2 ring-awaji-gold border-transparent scale-[1.01]" : ""
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="p-2 bg-black/5 rounded-xl block">
                  <IconComp size={16} />
                </span>
                {isActive && (
                  <span className="p-1 bg-emerald-500 text-white rounded-full">
                    <Check size={12} />
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display font-black text-sm mb-1">{p.name}</h3>
                <p className="text-xs opacity-70 font-light leading-relaxed">{p.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
