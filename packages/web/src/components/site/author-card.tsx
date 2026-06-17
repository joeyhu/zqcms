import type { User } from '@zqcms/shared/types';
import { User as UserIcon } from 'lucide-react';

interface AuthorCardProps {
  author: User;
  postCount?: number;
}

export function AuthorCard({ author, postCount }: AuthorCardProps) {
  const displayName = author.name || author.email;

  return (
    <div className="mt-12 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
      <div className="flex items-start gap-4 sm:gap-5">
        {/* Avatar */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          {author.name ? (
            <span className="text-xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-gray-900">{displayName}</h4>
          <p className="mt-1 text-sm text-gray-500">
            {author.email}
            {postCount !== undefined && (
              <span className="ml-2 text-gray-300">· {postCount} 篇文章</span>
            )}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            内容创作者 · ZQCMS 平台作者
          </p>
        </div>
      </div>
    </div>
  );
}
