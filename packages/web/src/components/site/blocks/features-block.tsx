import { Zap, Shield, Star, Database, FileText, Search, Blocks, Rocket, Code2, GripVertical } from 'lucide-react';

interface FeaturesBlockProps {
  config: {
    columns?: number;
    items?: Array<{ icon: string; title: string; desc: string }>;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Shield, Star, Database, FileText, Search, GripVertical,
  Blocks, Rocket, Code2,
};

const gradientBgs = [
  'from-blue-500 to-cyan-500',
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-indigo-500',
];

export function FeaturesBlock({ config }: FeaturesBlockProps) {
  const items = config.items || [];
  const columns = config.columns || 3;

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className={`grid gap-8 ${gridCols[columns] || gridCols[3]}`}>
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || Zap;
            const gradient = gradientBgs[index % gradientBgs.length];

            return (
              <div
                key={index}
                className="group animate-fade-in-up cursor-default rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon with gradient bg */}
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-3.5 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
