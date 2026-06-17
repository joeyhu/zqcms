import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderTree, Image, Tag } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';

interface Stats {
  posts: number;
  categories: number;
  media: number;
  tags: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ posts: 0, categories: 0, media: 0, tags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [postsRes, catsRes, mediaRes, tagsRes] = await Promise.all([
          fetchAPI<{ total: number }>('/posts'),
          fetchAPI<unknown[]>('/categories?all=true'),
          fetchAPI<{ data: unknown[] }>('/media?pageSize=1'),
          fetchAPI<unknown[]>('/tags'),
        ]);
        setStats({
          posts: postsRes.total || 0,
          categories: Array.isArray(catsRes) ? catsRes.length : 0,
          media: (mediaRes as { total?: number })?.total || 0,
          tags: Array.isArray(tagsRes) ? tagsRes.length : 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: '文章', count: stats.posts, icon: FileText, to: '/posts', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '目录', count: stats.categories, icon: FolderTree, to: '/categories', color: 'text-green-600', bg: 'bg-green-50' },
    { label: '媒体', count: stats.media, icon: Image, to: '/media', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '首页区块', count: stats.blocks, icon: Blocks, to: '/pages/home', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
