import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Settings,
  Image,
  LogOut,
  Globe,
  ChevronDown,
  Plus,
  Wrench,
  Grid3X3,
  Tags,
  Bot,
  Send,
  MessageSquare,
  CheckCircle2,
  Users,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";
import { fetchAPI, setCurrentSiteId, getCurrentSiteId } from "@/lib/api-client";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "仪表盘" },
  { to: "/categories", icon: FolderTree, label: "目录管理" },
  { to: "/posts", icon: FileText, label: "文章管理" },
  { to: "/tags", icon: Tags, label: "标签管理" },
  { to: "/icons", icon: Grid3X3, label: "图标管理" },
  { to: "/media", icon: Image, label: "媒体库" },
  { to: "/settings", icon: Settings, label: "站点配置" },
  { to: "/settings/llm", icon: Bot, label: "LLM 设置" },
  { to: "/publish", icon: Send, label: "内容平台" },
  { to: "/feedback", icon: MessageSquare, label: "用户反馈" },
  { to: "/sites", icon: Globe, label: "站点管理" },
  ...(isAdmin() ? [{ to: "/users", icon: Users, label: "用户管理" }] : []),
];

interface SiteItem {
  id: number;
  name: string;
  slug: string;
  domain: string;
}

export function AdminLayout() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [currentSite, setCurrentSite] = useState<SiteItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<SiteItem[]>("/sites").then((list) => {
      setSites(list);
      const currentId = getCurrentSiteId();
      if (currentId) {
        const found = list.find((s) => s.id === currentId);
        if (found) setCurrentSite(found);
      }
      if (!currentId && list.length > 0) {
        setCurrentSiteId(list[0].id);
        setCurrentSite(list[0]);
      }
    });
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchSite = (site: SiteItem) => {
    setCurrentSiteId(site.id);
    setCurrentSite(site);
    setMenuOpen(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "退出登录",
      message: "确定要退出当前账号吗？",
    });
    if (!ok) return;
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <LayoutDashboard className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">ZQCMS</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard" || item.to === "/settings"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main area with top bar */}
      <div className="flex flex-1 flex-col">
        {/* Top bar with site switcher */}
        <header className="flex h-14 items-center justify-between border-b bg-white px-6">
          <span className="text-sm text-gray-500">
            {currentSite ? (
              <>
                当前站点:
                <span className="text-blue-600 px-1">
                  {currentSite.name} ({currentSite.domain})
                </span>
              </>
            ) : (
              "未选择站点"
            )}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Globe className="h-4 w-4 text-gray-400" />
              <span>{currentSite?.name || "选择站点"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border bg-white shadow-xl">
                <div className="border-b px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">切换站点</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {sites.map((site) => {
                    const isActive = currentSite?.id === site.id;
                    return (
                      <button
                        key={site.id}
                        onClick={() => switchSite(site)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {/* Active indicator dot */}
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                            isActive
                              ? 'bg-blue-500 ring-2 ring-blue-200'
                              : 'bg-gray-300'
                          }`}
                        />

                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>
                              {site.name}
                            </span>
                            {isActive && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {site.domain}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t px-4 py-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/sites/new");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> 新建站点
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
