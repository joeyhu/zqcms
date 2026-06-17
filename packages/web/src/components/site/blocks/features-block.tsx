import { Zap, Shield, Star } from 'lucide-react';

interface FeaturesBlockProps {
  config: {
    columns?: number;
    items?: Array<{ icon: string; title: string; desc: string }>;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Shield,
  Star,
  Database: Star,
  FileText: Star,
  Search: Star,
  GripVertical: Star,
  Blocks: Star,
  Rocket: Star,
  Code2: Star,
};

export function FeaturesBlock({ config }: FeaturesBlockProps) {
  const items = config.items || [];
  const columns = config.columns || 3;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`grid gap-8 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || Zap;
            return (
              <div key={index} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
