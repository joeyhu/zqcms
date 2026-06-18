import { useEffect, useState, FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { fetchAPI, getCurrentSiteId } from "@/lib/api-client";
import { Tooltip } from "@/components/ui/Tooltip";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { MediaPicker } from "@/components/ui/MediaPicker";
import { AutoExpandingTextarea } from "@/components/ui/AutoExpandingTextarea";
import type { SiteSettings } from "@zqcms/shared/types";
import toast from "react-hot-toast";

type SocialEntry = { key: string; value: string };

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [socialEntries, setSocialEntries] = useState<SocialEntry[]>([]);
  const [qrEntries, setQrEntries] = useState<SocialEntry[]>([]);

  const currentSiteId = getCurrentSiteId();

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch branding settings
        const data = await fetchAPI<SiteSettings>("/site");

        // Fetch site identity (domain, slug) from sites API
        let siteIdentity: Record<string, string> = {
          name: "",
          slug: "",
          domain: "",
        };
        if (currentSiteId) {
          try {
            const siteInfo = await fetchAPI<Record<string, unknown>>(
              `/sites/${currentSiteId}`,
            );
            siteIdentity = {
              name: String(siteInfo.name || ""),
              slug: String(siteInfo.slug || ""),
              domain: String(siteInfo.domain || ""),
            };
          } catch {
            /* ignore */
          }
        }

        setForm({
          // Identity (from sites API)
          name: siteIdentity.name || data.siteName || "",
          slug: siteIdentity.slug || "",
          domain: siteIdentity.domain || "",
          // Branding (from site settings API)
          siteName: data.siteName || "",
          siteDescription: data.siteDescription || "",
          primaryColor: data.primaryColor || "#3B82F6",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          address: data.address || "",
          logo: data.logo || "",
          favicon: data.favicon || "",
          footerText: data.footerText || "",
          copyright: data.copyright || "",
          gaId: data.gaId || "",
          icp: data.icp || "",
        });

        // Social links
        let links: Record<string, string> = {};
        const raw = data.socialLinks as unknown;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          links = raw as Record<string, string>;
        } else if (typeof raw === "string" && raw.trim()) {
          try {
            links = JSON.parse(raw);
          } catch {
            /* */
          }
        }
        setSocialEntries(
          Object.entries(links).map(([key, value]) => ({ key, value })),
        );

        // QR codes
        let qrs: Record<string, string> = {};
        const rawQr = data.socialQRCodes as unknown;
        if (rawQr && typeof rawQr === "object" && !Array.isArray(rawQr)) {
          qrs = rawQr as Record<string, string>;
        } else if (typeof rawQr === "string" && rawQr.trim()) {
          try {
            qrs = JSON.parse(rawQr);
          } catch {
            /* */
          }
        }
        setQrEntries(
          Object.entries(qrs).map(([key, value]) => ({ key, value })),
        );
      } catch (err) {
        toast.error("加载配置失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentSiteId]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocialEntry = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setSocialEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: val } : e)),
    );
  };
  const addSocialEntry = () =>
    setSocialEntries((prev) => [...prev, { key: "", value: "" }]);
  const removeSocialEntry = (index: number) =>
    setSocialEntries((prev) => prev.filter((_, i) => i !== index));

  const updateQrEntry = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setQrEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: val } : e)),
    );
  };
  const addQrEntry = () =>
    setQrEntries((prev) => [...prev, { key: "", value: "" }]);
  const removeQrEntry = (index: number) =>
    setQrEntries((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Save site identity (name, slug, domain) via sites API
      if (currentSiteId) {
        await fetchAPI(`/sites/${currentSiteId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name || form.siteName,
            slug: form.slug || null,
            domain: form.domain || null,
          }),
        });
      }

      // 2. Save branding settings via site API
      const socialLinks: Record<string, string> = {};
      for (const entry of socialEntries) {
        if (entry.key.trim())
          socialLinks[entry.key.trim()] = entry.value.trim();
      }

      const qrCodes: Record<string, string> = {};
      for (const entry of qrEntries) {
        if (entry.key.trim()) qrCodes[entry.key.trim()] = entry.value.trim();
      }

      const body: Record<string, unknown> = {
        siteName: form.siteName || null,
        siteDescription: form.siteDescription || null,
        primaryColor: form.primaryColor || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        address: form.address || null,
        logo: form.logo || null,
        favicon: form.favicon || null,
        footerText: form.footerText || null,
        copyright: form.copyright || null,
        gaId: form.gaId || null,
        icp: form.icp || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        socialQRCodes: Object.keys(qrCodes).length > 0 ? qrCodes : null,
      };

      await fetchAPI("/site", { method: "PUT", body: JSON.stringify(body) });
      toast.success("配置已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-12 text-center text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">站点配置</h1>
      </div>

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {/* ── 站点身份 (域名/slug) ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">站点身份</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                站点名称
              </label>
              <input
                value={form["name"] || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标识 (slug)
              </label>
              <input
                value={form["slug"] || ""}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
                className="block w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                绑定域名
              </label>
              <input
                value={form["domain"] || ""}
                onChange={(e) => handleChange("domain", e.target.value)}
                required
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="example.com"
              />
            </div>
          </div>
        </div>

        {/* ── 基本信息 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">基本信息</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              站点描述
            </label>
            <AutoExpandingTextarea
              value={form["siteDescription"] || ""}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
              minRows={2}
              maxRows={8}
              placeholder="简要描述站点内容，用于 SEO 和首页展示"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                显示名称
              </label>
              <input
                value={form["siteName"] || ""}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主题色
              </label>
              <ColorPicker
                value={form["primaryColor"] || "#3B82F6"}
                onChange={(v) => handleChange("primaryColor", v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系邮箱
              </label>
              <input
                value={form["contactEmail"] || ""}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                value={form["contactPhone"] || ""}
                placeholder="请填写联系电话"
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地址
              </label>
              <AutoExpandingTextarea
                value={form["address"] || ""}
                placeholder="请填写地址"
                onChange={(e) => handleChange("address", e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── 品牌资源 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">品牌资源</h2>
          <div className="grid gap-4 sm:grid-cols-1">
            <MediaPicker
              value={form["logo"] || ""}
              onChange={(v) => handleChange("logo", v)}
              label="Logo"
            />
            <MediaPicker
              value={form["favicon"] || ""}
              onChange={(v) => handleChange("favicon", v)}
              label="Favicon"
            />
          </div>
        </div>

        {/* ── 社交链接 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">社交链接</h2>
            <button
              type="button"
              onClick={addSocialEntry}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              添加
            </button>
          </div>
          {socialEntries.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-300 border border-dashed rounded-lg">
              暂无社交链接
            </div>
          ) : (
            <div className="space-y-3">
              {socialEntries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={entry.key}
                    onChange={(e) =>
                      updateSocialEntry(i, "key", e.target.value)
                    }
                    placeholder="平台名称"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    value={entry.value}
                    onChange={(e) =>
                      updateSocialEntry(i, "value", e.target.value)
                    }
                    placeholder="链接"
                    className="flex-[2] rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <Tooltip content="删除">
                    <button
                      type="button"
                      onClick={() => removeSocialEntry(i)}
                      className="rounded p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 二维码 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">二维码</h2>
            <button
              type="button"
              onClick={addQrEntry}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              添加
            </button>
          </div>
          {qrEntries.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-300 border border-dashed rounded-lg">
              暂无二维码
            </div>
          ) : (
            <div className="space-y-3">
              {qrEntries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={entry.key}
                    onChange={(e) => updateQrEntry(i, "key", e.target.value)}
                    placeholder="平台名称"
                    className="flex-[1] rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <MediaPicker
                    value={entry.value}
                    onChange={(v) => updateQrEntry(i, "value", v)}
                    label=""
                  />
                  <Tooltip content="删除">
                    <button
                      type="button"
                      onClick={() => removeQrEntry(i)}
                      className="rounded p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 页脚 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">页脚设置</h2>
          {[
            ["footerText", "页脚文案"],
            ["copyright", "版权信息"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <AutoExpandingTextarea
                placeholder={`请填写${label}`}
                value={form[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>

        {/* ── 分析/备案 ── */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">分析与备案</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Analytics ID
            </label>
            <input
              value={form["gaId"] || ""}
              onChange={(e) => handleChange("gaId", e.target.value)}
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ICP 备案号
            </label>
            <input
              value={form["icp"] || ""}
              onChange={(e) => handleChange("icp", e.target.value)}
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="京ICP备2024000001号"
            />
            <p className="mt-1 text-xs text-gray-400">
              留空则不显示；有值则链接指向 https://beian.miit.gov.cn/
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存配置"}
          </button>
        </div>
      </form>
    </div>
  );
}
