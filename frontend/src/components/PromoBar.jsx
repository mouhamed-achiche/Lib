import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { bannersApi } from "@/lib/api";

function PromoImage({ slide }) {
  const image = (
    <img
      alt={slide.alt}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
      src={slide.image}
    />
  );

  if (!slide.link) return image;

  if (/^https?:\/\//.test(slide.link)) {
    return (
      <a aria-label={slide.alt} className="block h-full w-full" href={slide.link} rel="noreferrer" target="_blank">
        {image}
      </a>
    );
  }

  return (
    <Link aria-label={slide.alt} className="block h-full w-full" to={slide.link}>
      {image}
    </Link>
  );
}

export default function PromoBar() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    let ignored = false;

    const loadBanners = async () => {
      try {
        const response = await bannersApi.getActive();
        const items = response.data?.items ?? [];
        const mappedSlides = items.map(banner => ({
          id: `banner-${banner.id}`,
          alt: banner.title || banner.subtitle || "IBN SINA Banner",
          image: banner.image_url,
          link: banner.link || "/catalog",
        })).filter(s => s.image);

        if (!ignored && mappedSlides.length > 0) {
          setSlides(mappedSlides);
          setCurrentIndex(0);
        }
      } catch (error) {
        // Hide carousel when backend is unavailable
      } finally {
        if (!ignored) {
          setIsLoading(false);
        }
      }
    };

    loadBanners();

    return () => {
      ignored = true;
    };
  }, []);

  useEffect(() => {
    if (isHovered || !isPlaying || slides.length < 2) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, isPlaying, slides.length]);

  if (isLoading || slides.length === 0) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") handlePrev();
    if (event.key === "ArrowRight") handleNext();
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section
      aria-label="Homepage promotions"
      aria-roledescription="carousel"
      className="group relative aspect-[16/9] min-h-[280px] w-full select-none overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-lg focus:outline-none focus:ring-2 focus:ring-academic-blue/30 sm:aspect-[16/7] lg:aspect-[16/6] lg:min-h-[350px]"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      role="region"
      tabIndex={0}
    >
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            aria-hidden={!isActive}
            aria-label={`Promotion ${index + 1} of ${slides.length}`}
            aria-roledescription="slide"
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
            key={slide.id}
            role="group"
          >
            <PromoImage slide={slide} />
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous promotion"
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={handlePrev}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            aria-label="Next promotion"
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={handleNext}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            aria-label={isPlaying ? "Pause promotions" : "Play promotions"}
            className="absolute bottom-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white/85 backdrop-blur-md transition-all duration-300 hover:bg-black/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={() => setIsPlaying((playing) => !playing)}
            type="button"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-2 backdrop-blur-md">
            {slides.map((slide, index) => (
              <button
                aria-current={index === currentIndex ? "true" : "false"}
                aria-label={`Show promotion ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/75"
                }`}
                key={slide.id}
                onClick={() => setCurrentIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
