import Link from 'next/link';

interface HeroBlockProps {
  config: {
    title?: string;
    subtitle?: string;
    bgImage?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    alignment?: string;
  };
}

function WaveSVG() {
  const wavePath1 = "M0,64L48,74.7C96,85,192,107,288,96C384,85,480,43,576,42.7C672,43,768,85,864,90.7C960,96,1056,64,1152,53.3C1248,43,1344,53,1392,58.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z";
  const wavePath2 = "M0,96L48,85.3C96,75,192,53,288,64C384,75,480,117,576,112C672,107,768,53,864,48C960,43,1056,85,1152,90.7C1248,96,1344,72,1392,80L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z";

  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
      <div className="relative h-[60px] sm:h-[100px] w-[200%] animate-wave">
        {/* First copy */}
        <svg className="absolute left-0 top-0 bottom-0 w-1/2 h-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d={wavePath1} fill="white" opacity="0.15" />
          <path d={wavePath2} fill="white" opacity="0.1" />
        </svg>
        {/* Second copy (seamless loop) */}
        <svg className="absolute left-1/2 top-0 bottom-0 w-1/2 h-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d={wavePath1} fill="white" opacity="0.15" />
          <path d={wavePath2} fill="white" opacity="0.1" />
        </svg>
      </div>
    </div>
  );
}

function DecorativeBlobs() {
  return (
    <>
      <div className="blob w-72 h-72 bg-blue-400 top-[-80px] right-[-60px] animate-float" />
      <div className="blob w-48 h-48 bg-indigo-400 bottom-[20%] left-[-40px] animate-float-slow" style={{ animationDelay: '-2s' }} />
      <div className="blob w-36 h-36 bg-purple-400 top-[30%] right-[15%] animate-pulse-soft" style={{ animationDelay: '-1s' }} />
    </>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 animate-float"
          style={{
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDuration: `${4 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function HeroBlock({ config }: HeroBlockProps) {
  const alignClass = config.alignment === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <section className="relative overflow-hidden gradient-primary animate-gradient py-24 sm:py-36">
      {config.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${config.bgImage})` }}
        />
      )}
      <DecorativeBlobs />
      <FloatingParticles />
      <WaveSVG />

      <div className={`relative z-10 mx-auto flex max-w-4xl flex-col px-6 ${alignClass}`}>
        {config.title && (
          <h1 className="animate-fade-in-up text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl [text-shadow:0_2px_16px_rgba(0,0,0,0.2)]">
            {config.title}
          </h1>
        )}
        {config.subtitle && (
          <p className="animate-fade-in-up stagger-1 mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
            {config.subtitle}
          </p>
        )}
        {(config.ctaText || config.secondaryCtaText) && (
          <div className={`animate-fade-in-up stagger-2 mt-10 flex flex-wrap gap-4 ${config.alignment !== 'left' ? 'justify-center' : ''}`}>
            {config.ctaText && (
              <Link
                href={config.ctaLink || '#'}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
              >
                {config.ctaText}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            )}
            {config.secondaryCtaText && (
              <Link
                href={config.secondaryCtaLink || '#'}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 font-bold text-white transition-all hover:bg-white/10 hover:border-white/50 hover:scale-105 active:scale-95"
              >
                {config.secondaryCtaText}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
