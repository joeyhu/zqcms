import Link from 'next/link';

interface CTABlockProps {
  config: {
    title?: string;
    desc?: string;
    btnText?: string;
    btnLink?: string;
    bgColor?: string;
  };
}

export function CTABlock({ config }: CTABlockProps) {
  return (
    <section
      className="py-16"
      style={{ backgroundColor: config.bgColor || '#3B82F6' }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center">
        {config.title && (
          <h2 className="text-3xl font-bold text-white">{config.title}</h2>
        )}
        {config.desc && (
          <p className="mt-3 text-lg text-white/80">{config.desc}</p>
        )}
        {config.btnText && (
          <Link
            href={config.btnLink || '#'}
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
          >
            {config.btnText}
          </Link>
        )}
      </div>
    </section>
  );
}
