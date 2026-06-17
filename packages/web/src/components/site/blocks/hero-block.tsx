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

export function HeroBlock({ config }: HeroBlockProps) {
  const alignClass = config.alignment === 'left' ? 'text-left' : 'text-center';

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 py-20 sm:py-28 ${alignClass}`}
    >
      {config.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${config.bgImage})` }}
        />
      )}
      <div className="relative mx-auto max-w-4xl px-4">
        {config.title && (
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {config.title}
          </h1>
        )}
        {config.subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
            {config.subtitle}
          </p>
        )}
        {(config.ctaText || config.secondaryCtaText) && (
          <div className={`mt-8 flex flex-wrap gap-4 ${alignClass === 'text-center' ? 'justify-center' : ''}`}>
            {config.ctaText && (
              <Link
                href={config.ctaLink || '#'}
                className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
              >
                {config.ctaText}
              </Link>
            )}
            {config.secondaryCtaText && (
              <Link
                href={config.secondaryCtaLink || '#'}
                className="rounded-lg border-2 border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
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
