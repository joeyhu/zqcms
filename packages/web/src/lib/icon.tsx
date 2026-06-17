import * as LucideIcons from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolve a lucide icon name to its React component.
 * Returns the default FolderOpen icon if the name is not found.
 */
export function getIconComponent(name: string | null | undefined): LucideIcon {
  if (!name) return FolderOpen;

  // Try exact match
  const exact = (LucideIcons as Record<string, unknown>)[name];
  if (exact && typeof exact === 'function') return exact as LucideIcon;

  // Try with "Icon" suffix
  const withSuffix = (LucideIcons as Record<string, unknown>)[name + 'Icon'];
  if (withSuffix && typeof withSuffix === 'function') return withSuffix as LucideIcon;

  return FolderOpen;
}
