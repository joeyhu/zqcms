import Link from 'next/link';
import type { SiteSettings } from '@zqcms/shared/types';

/** QR 码按钮 — hover 显示二维码弹窗 */
function QrCodeButton({ name, imgUrl }: { name: string; imgUrl: string }) {
  return (
    <div className="group relative">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
        {name}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4-11a1 1 0 011 1v.5a1 1 0 01-1 1h-1a1 1 0 01-1-1V6a1 1 0 011-1h1zm-6 5a1 1 0 011-1h8a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7z" /></svg>
      </span>
      {/* Popup */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-300/50 min-w-[200px]">
          <img
            src={imgUrl}
            alt={name}
            className="h-56 w-56 rounded-xl object-contain bg-gray-50"
          />
          <p className="mt-3 text-center text-sm font-medium text-gray-500">{name}</p>
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-3 h-3 rotate-45 border-b border-r border-gray-100 bg-white" />
      </div>
    </div>
  );
}

interface FooterProps {
  settings: SiteSettings;
}

function FooterWave() {
  const wavePath = "M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,74.7C672,75,768,53,864,42.7C960,32,1056,32,1152,37.3C1248,43,1344,53,1392,58.7L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z";

  return (
    <div className="relative -mt-1 overflow-hidden leading-none pointer-events-none">
      <div className="relative h-[50px] sm:h-[70px] w-[200%] animate-wave2">
        <svg className="absolute left-0 top-0 bottom-0 w-1/2 h-full text-gray-50" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d={wavePath} fill="currentColor" />
        </svg>
        <svg className="absolute left-1/2 top-0 bottom-0 w-1/2 h-full text-gray-50" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d={wavePath} fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function Footer({ settings }: FooterProps) {
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
    } catch { /* ignore */ }
  }

  // 解析 socialQRCodes
  let qrCodes: Record<string, string> | null = null;
  const rawQr = settings.socialQRCodes as unknown;
  if (rawQr && typeof rawQr === 'object' && !Array.isArray(rawQr)) {
    qrCodes = rawQr as Record<string, string>;
  } else if (typeof rawQr === 'string' && rawQr.trim()) {
    try {
      const parsed = JSON.parse(rawQr);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) qrCodes = parsed;
    } catch { /* ignore */ }
  }

  const hasSocial = socialLinks && Object.keys(socialLinks).length > 0;
  const hasQr = qrCodes && Object.keys(qrCodes).length > 0;

  return (
    <footer>
      <FooterWave />

      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{settings.siteName}</h3>
              {settings.footerText && (
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{settings.footerText}</p>
              )}
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">联系方式</h4>
              <div className="space-y-2.5 text-sm text-gray-500">
                {settings.contactEmail && (
                  <p className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {settings.contactEmail}
                  </p>
                )}
                {settings.contactPhone && (
                  <p className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {settings.contactPhone}
                  </p>
                )}
                {settings.address && (
                  <p className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {settings.address}
                  </p>
                )}
              </div>
            </div>

            {/* Social Links + QR Codes */}
            {(hasSocial || hasQr) && (
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">关注我们</h4>
                <div className="flex flex-wrap gap-3">
                  {/* Regular links */}
                  {hasSocial && Object.entries(socialLinks!).map(([name, url]) => (
                    <Link
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {name}
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                  ))}
                  {/* QR code buttons */}
                  {hasQr && Object.entries(qrCodes!).map(([name, imgUrl]) => (
                    <QrCodeButton key={name} name={name} imgUrl={imgUrl} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center gap-2 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-400">
              {settings.copyright || `© ${new Date().getFullYear()} ${settings.siteName}`}
            </p>
            {settings.icp && (
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {settings.icp}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
