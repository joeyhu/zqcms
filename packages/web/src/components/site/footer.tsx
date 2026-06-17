import Link from 'next/link';
import type { SiteSettings } from '@zqcms/shared/types';

interface FooterProps {
  settings: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  // 安全解析 socialLinks（兼容旧数据中被 JSON.stringify 两次的字符串）
  let socialLinks: Record<string, string> | null = null;
  const raw = settings.socialLinks as unknown;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    socialLinks = raw as Record<string, string>;
  } else if (typeof raw === 'string' && (raw as string).trim()) {
    try {
      const parsed = JSON.parse(raw as string);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        socialLinks = parsed as Record<string, string>;
      }
    } catch { /* ignore invalid JSON */ }
  }

  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg text-gray-900">{settings.siteName}</h3>
            {settings.footerText && (
              <p className="mt-2 text-sm text-gray-500">{settings.footerText}</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">联系方式</h4>
            <div className="space-y-2 text-sm text-gray-500">
              {settings.contactEmail && <p>📧 {settings.contactEmail}</p>}
              {settings.contactPhone && <p>📞 {settings.contactPhone}</p>}
              {settings.address && <p>📍 {settings.address}</p>}
            </div>
          </div>

          {/* Social Links */}
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">关注我们</h4>
              <div className="flex gap-3">
                {Object.entries(socialLinks).map(([name, url]) => (
                  <Link
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 capitalize"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t pt-4 text-center text-sm text-gray-400">
          {settings.copyright || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
