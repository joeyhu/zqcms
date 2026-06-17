import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { fetchAPI } from "@/lib/api-client";
import type { PageBlock } from "@zqcms/shared/types";
import { BlockType } from "@zqcms/shared/types";
import { BLOCK_TYPE_LABELS, CARD_STYLE_PRESETS, SHADOW_OPTIONS, BORDER_RADIUS_OPTIONS, ALIGN_OPTIONS, RESPONSIVE_COLUMNS_DEFAULTS } from "@zqcms/shared/constants";
import { BlockPreview } from "@/components/builder/BlockPreview";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Tooltip } from "@/components/ui/Tooltip";
import toast from "react-hot-toast";

// ============================================================
// Block Config Editor (Modal)
// ============================================================
function BlockConfigPanel({
  block,
  onSave,
  onClose,
}: {
  block: PageBlock;
  onSave: (
    id: number,
    data: { config: Record<string, unknown>; title?: string },
  ) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<Record<string, unknown>>(
    block.config || {},
  );
  const [title, setTitle] = useState(block.title || "");

  const updateField = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
        <h3 className="font-semibold text-lg mb-4">
          编辑区块 - {BLOCK_TYPE_LABELS[block.blockType] || block.blockType}
        </h3>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              区块标题
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {/* Dynamic fields based on block type */}
          {block.blockType === BlockType.HERO && (
            <>
              <Field
                label="标题"
                value={config.title as string}
                onChange={(v) => updateField("title", v)}
              />
              <Field
                label="副标题"
                value={config.subtitle as string}
                onChange={(v) => updateField("subtitle", v)}
              />
              <Field
                label="主按钮文字"
                value={config.ctaText as string}
                onChange={(v) => updateField("ctaText", v)}
              />
              <Field
                label="主按钮链接"
                value={config.ctaLink as string}
                onChange={(v) => updateField("ctaLink", v)}
              />
              <Field
                label="次按钮文字"
                value={config.secondaryCtaText as string}
                onChange={(v) => updateField("secondaryCtaText", v)}
              />
              <Field
                label="次按钮链接"
                value={config.secondaryCtaLink as string}
                onChange={(v) => updateField("secondaryCtaLink", v)}
              />
              <Field
                label="背景图片 URL"
                value={config.bgImage as string}
                onChange={(v) => updateField("bgImage", v)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  对齐方式
                </label>
                <select
                  value={(config.alignment as string) || "center"}
                  onChange={(e) => updateField("alignment", e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="center">居中</option>
                  <option value="left">左对齐</option>
                </select>
              </div>
            </>
          )}

          {block.blockType === BlockType.FEATURES && (
            <Field
              label="列数"
              value={String(config.columns || 3)}
              onChange={(v) => updateField("columns", Number(v))}
            />
          )}

          {block.blockType === BlockType.POST_LIST && (
            <>
              <Field
                label="显示数量"
                value={String(config.limit || 6)}
                onChange={(v) => updateField("limit", Number(v))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">布局</label>
                <select
                  value={(config.layout as string) || "grid"}
                  onChange={(e) => updateField("layout", e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="grid">网格</option>
                  <option value="list">列表</option>
                </select>
              </div>
            </>
          )}

          {/* ★ 卡片样式（POST_LIST / CATEGORY_LIST） */}
          {(block.blockType === BlockType.POST_LIST || block.blockType === BlockType.CATEGORY_LIST) && (
            <>
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">🎨 卡片样式</h4>
              </div>

              {/* 预设 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预设风格</label>
                <select
                  value={(config.cardStyle as Record<string, unknown>)?.preset as string || 'simple-white'}
                  onChange={(e) => {
                    const existing = (config.cardStyle as Record<string, unknown>) || {};
                    updateField('cardStyle', { ...existing, preset: e.target.value });
                  }}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {CARD_STYLE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* 阴影 + 圆角 + 对齐 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">阴影</label>
                  <select
                    value={(config.cardStyle as Record<string, unknown>)?.shadow as string || 'sm'}
                    onChange={(e) => {
                      const existing = (config.cardStyle as Record<string, unknown>) || {};
                      updateField('cardStyle', { ...existing, shadow: e.target.value });
                    }}
                    className="block w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {SHADOW_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">圆角</label>
                  <select
                    value={(config.cardStyle as Record<string, unknown>)?.borderRadius as string || 'xl'}
                    onChange={(e) => {
                      const existing = (config.cardStyle as Record<string, unknown>) || {};
                      updateField('cardStyle', { ...existing, borderRadius: e.target.value });
                    }}
                    className="block w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {BORDER_RADIUS_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容对齐</label>
                <select
                  value={(config.cardStyle as Record<string, unknown>)?.alignment as string || 'left'}
                  onChange={(e) => {
                    const existing = (config.cardStyle as Record<string, unknown>) || {};
                    updateField('cardStyle', { ...existing, alignment: e.target.value });
                  }}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {ALIGN_OPTIONS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* 自定义 CSS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自定义 CSS 微调</label>
                <input
                  value={(config.cardStyle as Record<string, unknown>)?.customCss as string || ''}
                  onChange={(e) => {
                    const existing = (config.cardStyle as Record<string, unknown>) || {};
                    updateField('cardStyle', { ...existing, customCss: e.target.value });
                  }}
                  placeholder="例如: hover:scale-105 transition-transform"
                  className="block w-full rounded-lg border px-3 py-2 text-sm font-mono"
                />
              </div>

              {/* 响应式列数 */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📐 响应式列数</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🖥 桌面</label>
                  <select
                    value={String((config.responsiveColumns as Record<string, number>)?.desktop || RESPONSIVE_COLUMNS_DEFAULTS.desktop)}
                    onChange={(e) => {
                      const existing = (config.responsiveColumns as Record<string, number>) || { ...RESPONSIVE_COLUMNS_DEFAULTS };
                      updateField('responsiveColumns', { ...existing, desktop: Number(e.target.value) });
                    }}
                    className="block w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (<option key={n} value={n}>{n} 列</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📱 平板</label>
                  <select
                    value={String((config.responsiveColumns as Record<string, number>)?.tablet || RESPONSIVE_COLUMNS_DEFAULTS.tablet)}
                    onChange={(e) => {
                      const existing = (config.responsiveColumns as Record<string, number>) || { ...RESPONSIVE_COLUMNS_DEFAULTS };
                      updateField('responsiveColumns', { ...existing, tablet: Number(e.target.value) });
                    }}
                    className="block w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4].map((n) => (<option key={n} value={n}>{n} 列</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📱 手机</label>
                  <select
                    value={String((config.responsiveColumns as Record<string, number>)?.mobile || RESPONSIVE_COLUMNS_DEFAULTS.mobile)}
                    onChange={(e) => {
                      const existing = (config.responsiveColumns as Record<string, number>) || { ...RESPONSIVE_COLUMNS_DEFAULTS };
                      updateField('responsiveColumns', { ...existing, mobile: Number(e.target.value) });
                    }}
                    className="block w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {[1, 2].map((n) => (<option key={n} value={n}>{n} 列</option>))}
                  </select>
                </div>
              </div>

              {/* 旧版 columns 同步 */}
              {block.blockType === BlockType.CATEGORY_LIST && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.showCount !== false}
                    onChange={(e) => updateField("showCount", e.target.checked)}
                    className="rounded"
                  />
                  显示文章数量
                </label>
              )}
            </>
          )}

          {block.blockType === BlockType.FAQ && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FAQ 数据 (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.items || [], null, 2)}
                onChange={(e) => {
                  try {
                    updateField("items", JSON.parse(e.target.value));
                  } catch {}
                }}
                rows={6}
                className="block w-full rounded-lg border px-3 py-2 text-sm font-mono"
              />
            </div>
          )}

          {block.blockType === BlockType.MARKDOWN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容 (Markdown)
              </label>
              <textarea
                value={(config.content as string) || ""}
                onChange={(e) => updateField("content", e.target.value)}
                rows={8}
                className="block w-full rounded-lg border px-3 py-2 text-sm font-mono"
              />
            </div>
          )}

          {block.blockType === BlockType.CTA && (
            <>
              <Field
                label="标题"
                value={config.title as string}
                onChange={(v) => updateField("title", v)}
              />
              <Field
                label="描述"
                value={config.desc as string}
                onChange={(v) => updateField("desc", v)}
              />
              <Field
                label="按钮文字"
                value={config.btnText as string}
                onChange={(v) => updateField("btnText", v)}
              />
              <Field
                label="按钮链接"
                value={config.btnLink as string}
                onChange={(v) => updateField("btnLink", v)}
              />
            </>
          )}

          {/* Raw JSON editor for all types */}
          <details>
            <summary className="text-sm text-gray-500 cursor-pointer">
              高级：JSON 编辑
            </summary>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value));
                } catch {}
              }}
              rows={8}
              className="mt-2 block w-full rounded-lg border px-3 py-2 text-xs font-mono"
            />
          </details>
        </div>

        <div className="mt-6 flex gap-3 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() =>
              onSave(block.id, { config, title: title || undefined })
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border px-3 py-2 text-sm"
      />
    </div>
  );
}

// ============================================================
// Sortable Block Item (Left Panel)
// ============================================================
function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggle,
}: {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const activeClass = isSelected
    ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
    : "border-gray-200 bg-white hover:border-gray-300";
  const dimmedClass = !block.isVisible ? "opacity-50" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${activeClass} ${dimmedClass}`}
    >
      <Tooltip content="拖拽排序">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </Tooltip>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100 flex-shrink-0">
            {BLOCK_TYPE_LABELS[block.blockType] || block.blockType}
          </span>
          {block.title && (
            <span className="text-xs text-gray-600 truncate">
              {block.title}
            </span>
          )}
        </div>
        {!block.title && !block.isVisible && (
          <span className="text-[10px] text-yellow-500">已隐藏</span>
        )}
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="rounded p-1 text-gray-300 hover:text-gray-500"
          title={block.isVisible ? "隐藏" : "显示"}
        >
          {block.isVisible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded p-1 text-gray-300 hover:text-blue-500"
          title="编辑配置"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-gray-300 hover:text-red-500"
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Builder (Split Layout)
// ============================================================
type PreviewWidth = "desktop" | "tablet" | "mobile";

export function PageBuilderPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Page type derivation ──
  const { pageType, pageLabel, basePageType, slug } = useMemo(() => {
    const path = location.pathname;
    let base = "home";
    if (path.startsWith("/pages/category")) base = "category";
    else if (path.startsWith("/pages/subcategory")) base = "subcategory";
    else if (path === "/pages/home" || path === "/pages") base = "home";

    const s = searchParams.get("slug") || "";
    const pt = s ? `${base}:${s}` : base;

    const labels: Record<string, string> = {
      home: "首页搭建",
      category: "目录页模板搭建",
      subcategory: "子目录页模板搭建",
    };
    let label = labels[base] || "页面搭建";
    if (s)
      label =
        base === "category" ? `目录「${s}」页面搭建` : `子目录「${s}」页面搭建`;

    return { pageType: pt, pageLabel: label, basePageType: base, slug: s };
  }, [location.pathname, searchParams]);

  // ── State ──
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<string>("HERO");
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");

  const sensors = useSensors(useSensor(PointerSensor));
  const confirm = useConfirm();

  // ── Load blocks ──
  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PageBlock[]>(
        `/page-blocks?pageType=${encodeURIComponent(pageType)}`,
      );
      setBlocks(data);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [pageType]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // ── Auto-select first block ──
  useEffect(() => {
    if (blocks.length > 0 && selectedBlockId === null) {
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks]);

  // ── Actions ──
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);
    setBlocks(newBlocks);

    const items = newBlocks.map((b, idx) => ({ id: b.id, sortOrder: idx }));
    await fetchAPI("/page-blocks/reorder", {
      method: "POST",
      body: JSON.stringify({ items }),
    }).catch(() => toast.error("排序保存失败"));
  };

  const handleAddBlock = async () => {
    try {
      const block = await fetchAPI<PageBlock>("/page-blocks", {
        method: "POST",
        body: JSON.stringify({
          pageType,
          blockType: newBlockType,
          sortOrder: blocks.length,
          isVisible: true,
        }),
      });
      const updated = [...blocks, block];
      setBlocks(updated);
      setAddingBlock(false);
      setSelectedBlockId(block.id);
      toast.success("区块已添加");
    } catch {
      toast.error("添加失败");
    }
  };

  const handleEditSave = async (
    id: number,
    data: { config: Record<string, unknown>; title?: string },
  ) => {
    try {
      await fetchAPI(`/page-blocks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setEditingBlock(null);
      loadBlocks();
      toast.success("区块已更新");
    } catch {
      toast.error("保存失败");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "删除区块",
      message: "确定删除该区块？",
      danger: true,
    });
    if (!ok) return;
    try {
      await fetchAPI(`/page-blocks/${id}`, { method: "DELETE" });
      setSelectedBlockId((prev) => (prev === id ? null : prev));
      loadBlocks();
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleToggle = async (id: number) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    try {
      await fetchAPI(`/page-blocks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isVisible: !block.isVisible }),
      });
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isVisible: !b.isVisible } : b)),
      );
    } catch {
      toast.error("操作失败");
    }
  };

  const handleSelectBlock = (id: number) => {
    setSelectedBlockId(id);
    // Scroll preview to this block
    setTimeout(() => {
      const el = previewRef.current?.querySelector(`[data-block-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handlePreviewClick = (block: PageBlock) => {
    setSelectedBlockId(block.id);
  };

  // ── Preview width ──
  const previewMaxWidth = {
    desktop: "max-w-5xl",
    tablet: "max-w-2xl",
    mobile: "max-w-sm",
  }[previewWidth];

  const blockTypes = Object.values(BlockType).filter(
    (t) => t !== BlockType.TESTIMONIALS && t !== BlockType.CONTACT,
  );

  // ── Loading ──
  if (loading)
    return <div className="py-12 text-center text-gray-400">加载中...</div>;

  // ── Render ──
  return (
    <div className="-m-6 h-[calc(100vh-56px)] flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">{pageLabel}</h1>
          <span className="text-xs text-gray-400">{blocks.length} 个区块</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview width toggle */}
          <div className="flex rounded-lg border bg-gray-50 p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as [PreviewWidth, typeof Monitor][]
            ).map(([w, Icon]) => (
              <button
                key={w}
                onClick={() => setPreviewWidth(w)}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  previewWidth === w
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title={`${w === "desktop" ? "桌面端" : w === "tablet" ? "平板端" : "移动端"}预览`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setAddingBlock(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            添加区块
          </button>
        </div>
      </div>

      {/* ── Template hints ── */}
      {((basePageType !== "home" && !slug) || slug) && (
        <div
          className={`px-4 py-2 text-xs flex-shrink-0 ${
            slug
              ? "bg-blue-50 text-blue-700 border-b border-blue-100"
              : "bg-amber-50 text-amber-700 border-b border-amber-100"
          }`}
        >
          {slug
            ? `正在编辑${basePageType === "category" ? "目录" : "子目录"}「${slug}」的专属布局。删除所有区块将回退至全局模板或默认布局。`
            : `正在编辑全局「${basePageType === "category" ? "目录页" : "子目录页"}模板」。所有未设专属布局的页面将使用此模板。`}
        </div>
      )}

      {/* ── Main Split Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ▸▸▸ Left Panel: Block List ▸▸▸ */}
        <div className="w-[340px] min-w-[280px] border-r bg-gray-50 flex flex-col flex-shrink-0">
          <div className="px-4 py-2 border-b bg-white flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              区块列表
            </span>
            <span className="text-[10px] text-gray-400">拖拽排序</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {blocks.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">暂无区块</p>
                <button
                  onClick={() => setAddingBlock(true)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                >
                  添加第一个区块
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {blocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => handleSelectBlock(block.id)}
                        onEdit={() => setEditingBlock(block)}
                        onDelete={() => handleDelete(block.id)}
                        onToggle={() => handleToggle(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* ▸▸▸ Right Panel: Live Preview ▸▸▸ */}
        <div className="flex-1 overflow-y-auto bg-gray-100" ref={previewRef}>
          {/* Preview container */}
          <div
            className={`mx-auto py-8 px-4 transition-all duration-200 ${previewMaxWidth}`}
          >
            {blocks.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white py-24 text-center">
                <p className="text-gray-400">
                  点击左上角「添加区块」开始搭建页面
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  添加后可在右侧实时预览效果
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.id} data-block-id={block.id}>
                    <BlockPreview
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onClick={() => handlePreviewClick(block)}
                      onDoubleClick={() => setEditingBlock(block)}
                    />
                    {/* Double-click hint on hover */}
                    {selectedBlockId === block.id && (
                      <div className="flex justify-center -mt-1 pb-2">
                        <button
                          onClick={() => setEditingBlock(block)}
                          className="rounded-full bg-blue-500 text-white px-3 py-0.5 text-[10px] font-medium shadow-sm hover:bg-blue-600 transition-colors"
                        >
                          双击编辑 &nbsp;·&nbsp; 选中区块 #{block.sortOrder + 1}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {/* Add block modal */}
      {addingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-lg mb-4">添加新区块</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择区块类型
              </label>
              <select
                value={newBlockType}
                onChange={(e) => setNewBlockType(e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm mb-4"
              >
                {blockTypes.map((type) => (
                  <option key={type} value={type}>
                    {BLOCK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAddingBlock(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddBlock}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block editor modal */}
      {editingBlock && (
        <BlockConfigPanel
          block={editingBlock}
          onSave={handleEditSave}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}
