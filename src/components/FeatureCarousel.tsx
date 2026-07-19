import { useState, useEffect } from "react";
import { CAROUSEL_FEATURES } from "../data";
import { CarouselFeature } from "../types";
import { ChevronLeft, ChevronRight, BookOpen, Calendar, Hourglass, Sparkles, Heart, Flame, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Helper map to match string names to Lucide icons
const iconMap: { [key: string]: any } = {
  BookOpen: BookOpen,
  CalendarClock: Calendar,
  Hourglass: Hourglass,
  Sparkles: Sparkles,
  Heart: Heart,
  Flame: Flame,
};

interface FeatureCarouselProps {
  onSelectFeature: (featureId: string) => void;
}

export default function FeatureCarousel({ onSelectFeature }: FeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1); // 1 = right, -1 = left
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Auto-play interval
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_FEATURES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_FEATURES.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_FEATURES.length) % CAROUSEL_FEATURES.length);
  };

  const currentFeature: CarouselFeature = CAROUSEL_FEATURES[currentIndex];
  const IconComponent = iconMap[currentFeature.iconName] || BookOpen;

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -150 : 150,
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="awaji-carousel"
    >
      {/* Dynamic Background aura mapping to feature mood */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-awaji-gold/5 blur-3xl pointer-events-none -translate-y-20 translate-x-20 transition-all duration-1000" />

      {/* Header of carousel */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-awaji-gold uppercase font-bold">
            Awaji Ecosystem
          </span>
          <h2 className="text-xl md:text-2xl font-display font-bold text-neutral-800 tracking-tight">
            Explore All Features
          </h2>
        </div>

        {/* Next/Prev Navigation controls */}
        <div className="flex gap-2">
          <button
            id="carousel-prev"
            onClick={handlePrev}
            className="p-2 bg-white/90 hover:bg-neutral-100 border border-neutral-200/60 rounded-full text-neutral-700 hover:text-awaji-gold shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            id="carousel-next"
            onClick={handleNext}
            className="p-2 bg-white/90 hover:bg-neutral-100 border border-neutral-200/60 rounded-full text-neutral-700 hover:text-awaji-gold shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
            aria-label="Next Slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="relative min-h-[340px] md:min-h-[280px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            {/* Left Info Panel */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-awaji-gold/10 text-awaji-gold rounded-xl">
                  <IconComponent size={20} className="animate-pulse" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-semibold block">
                    {currentFeature.tagline}
                  </span>
                  <h3 className="text-2xl font-display font-extrabold text-neutral-800 leading-tight">
                    {currentFeature.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-light">
                {currentFeature.description}
              </p>

              {/* Benefits checklist */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                  Core Capabilities
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentFeature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-neutral-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-awaji-gold" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Go to feature CTA */}
              <button
                id={`go-to-${currentFeature.id}`}
                onClick={() => onSelectFeature(currentFeature.id)}
                className="inline-flex items-center gap-1.5 pt-4 text-xs font-bold text-awaji-gold hover:text-awaji-gold-dark cursor-pointer transition-colors group"
              >
                <span>Launch this feature</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Graphic/Mockup Panel */}
            <button
              onClick={() => onSelectFeature(currentFeature.id)}
              className="md:col-span-5 relative w-full h-56 md:h-64 rounded-2xl overflow-hidden shadow-lg border border-neutral-200/40 cursor-pointer text-left focus:outline-none transition-transform duration-300 hover:scale-[1.02]"
              id={`carousel-graphic-${currentFeature.id}`}
            >
              <img
                src={currentFeature.imageUrl}
                alt={currentFeature.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-mono bg-awaji-gold/95 px-2 py-0.5 rounded-full font-bold">
                  LAUNCH MODULE
                </span>
              </div>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators / Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {CAROUSEL_FEATURES.map((_, idx) => (
          <button
            key={idx}
            id={`indicator-${idx}`}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
              idx === currentIndex ? "bg-awaji-gold w-6" : "bg-neutral-300 hover:bg-neutral-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
