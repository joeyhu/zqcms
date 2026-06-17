interface FAQBlockProps {
  config: {
    items?: Array<{ question: string; answer: string }>;
  };
}

export function FAQBlock({ config }: FAQBlockProps) {
  const items = config.items || [];

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-3xl px-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <details key={index} className="group rounded-xl bg-white border shadow-sm">
              <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 list-none flex items-center justify-between">
                {item.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600 leading-relaxed">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
