import { useEffect, useState, FormEvent, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { fetchAPI } from "@/lib/api-client";
import type {
  CardTemplate,
  CardTemplateConfig,
  CardElementType,
} from "@zqcms/shared/types";
import { CardPreview, ICON_OPTIONS } from "@/components/builder/CardPreview";
import { Tooltip } from "@/components/ui/Tooltip";
import toast from "react-hot-toast";

const DEFAULT_CFG: CardTemplateConfig = {
  icon: {
    bg: "#EFF6FF",
    fg: "#3B82F6",
    name: "Zap",
    size: 40,
    round: true,
    shadow: "none",
  },
  primary: {
    bg: "transparent",
    fg: "#111827",
    size: "base",
    weight: "semibold",
    maxLines: 2,
  },
  secondary: { bg: "transparent", fg: "#6B7280", size: "sm", maxLines: 2 },
  tags: {
    bg: "transparent",
    fg: "#1D4ED8",
    tagBg: "#DBEAFE",
    tagFg: "#1D4ED8",
    rounded: true,
    visible: true,
    items: ["示例标签"],
  },
  order: ["icon", "primary", "secondary", "tags"],
  direction: "vertical",
  align: "start",
  gap: 12,
  containerBg: "#ffffff",
  containerBorderWidth: 1,
  containerBorderColor: "#e5e7eb",
  containerShadow: "sm",
  containerRadius: "xl",
  linkType: "none",
  customCss: "",
};

type Cfg = CardTemplateConfig;

function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded border px-2 py-1.5 text-xs focus:border-blue-400 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
function C({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-medium text-gray-500 w-12 flex-shrink-0">
        {label}
      </label>
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-7 rounded border cursor-pointer"
      />
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border px-2 py-1 text-xs font-mono focus:border-blue-400 outline-none"
      />
    </div>
  );
}

// Sortable order item
function SortableOrderItem({
  type,
  label,
  enabled,
  onToggle,
}: {
  type: CardElementType;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: type });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded border bg-white px-2 py-1.5 text-xs transition-opacity ${!enabled ? 'opacity-40' : ''}`}
    >
      <Tooltip content="拖拽排序">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500"
          disabled={!enabled}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
      <span className="text-gray-700 flex-1">{label}</span>
      {/* Toggle switch */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-500' : 'bg-gray-300'
        }`}
        title={enabled ? '显示中，点击隐藏' : '已隐藏，点击显示'}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`} />
      </button>
    </div>
  );
}

const ELEMENT_LABELS: Record<CardElementType, string> = {
  icon: "🎯 图标",
  primary: "📝 主文字",
  secondary: "📄 次文字",
  tags: "🏷️ 标签",
};

export function CardTemplateFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cfg, setCfg] = useState<Cfg>(DEFAULT_CFG);
  const [saving, setSaving] = useState(false);
  const [sample, setSample] = useState({
    primaryText: "示例卡片标题",
    secondaryText: "示例描述文字",
    tagItems: ["标签1", "标签2"],
  });
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (isEdit) {
      fetchAPI<CardTemplate>(`/card-templates/${id}`).then((t) => {
        setName(t.name);
        setDescription(t.description || "");
        const merged = { ...DEFAULT_CFG };
        const tc = t.config || {};
        if (tc.icon)
          merged.icon = {
            ...merged.icon,
            ...(tc.icon as unknown as Record<string, unknown> as any),
          };
        if (tc.primary)
          merged.primary = {
            ...merged.primary,
            ...(tc.primary as unknown as Record<string, unknown> as any),
          };
        if (tc.secondary)
          merged.secondary = {
            ...merged.secondary,
            ...(tc.secondary as unknown as Record<string, unknown> as any),
          };
        if (tc.tags)
          merged.tags = {
            ...merged.tags,
            ...(tc.tags as unknown as Record<string, unknown> as any),
          };
        if (tc.order) merged.order = tc.order as CardElementType[];
        if (tc.direction) merged.direction = tc.direction as any;
        if (tc.align) merged.align = tc.align as any;
        if (tc.gap !== undefined) merged.gap = tc.gap as number;
        if (tc.containerBg) merged.containerBg = tc.containerBg as string;
        if (tc.containerBorderWidth !== undefined)
          merged.containerBorderWidth = tc.containerBorderWidth as number;
        if (tc.containerBorderColor)
          merged.containerBorderColor = tc.containerBorderColor as string;
        if (tc.containerShadow)
          merged.containerShadow = tc.containerShadow as string;
        if (tc.containerRadius)
          merged.containerRadius = tc.containerRadius as string;
        if (tc.linkType) merged.linkType = tc.linkType as string;
        if (tc.linkPattern) merged.linkPattern = tc.linkPattern as string;
        if (tc.linkHref) merged.linkHref = tc.linkHref as string;
        if (tc.customCss) merged.customCss = tc.customCss as string;
        setCfg(merged);
      });
    }
  }, [id, isEdit]);

  const up = useCallback((path: string, val: unknown) => {
    setCfg((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++)
        obj = (obj[keys[i]] || {}) as Record<string, unknown>;
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const old = cfg.order.indexOf(active.id as CardElementType);
    const nw = cfg.order.indexOf(over.id as CardElementType);
    const re = [...cfg.order];
    re.splice(old, 1);
    re.splice(nw, 0, active.id as CardElementType);
    setCfg((p) => ({ ...p, order: re }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name, description: description || null, config: cfg };
      if (isEdit)
        await fetchAPI(`/card-templates/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      else
        await fetchAPI("/card-templates", {
          method: "POST",
          body: JSON.stringify(body),
        });
      toast.success(isEdit ? "已更新" : "已创建");
      navigate("/cards");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // Tag items management
  const addTagItem = () =>
    setCfg((p) => ({
      ...p,
      tags: { ...p.tags, items: [...p.tags.items, ""] },
    }));
  const updateTagItem = (i: number, v: string) => {
    const items = [...cfg.tags.items];
    items[i] = v;
    setCfg((p) => ({ ...p, tags: { ...p.tags, items } }));
  };
  const removeTagItem = (i: number) => {
    setCfg((p) => ({
      ...p,
      tags: { ...p.tags, items: p.tags.items.filter((_, j) => j !== i) },
    }));
  };

  return (
    <div className="-m-6 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">
          {isEdit ? "编辑卡片" : "新建卡片"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/cards")}
            className="rounded-lg border px-4 py-1.5 text-sm"
          >
            返回
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Config */}
        <div className="w-[380px] min-w-[340px] border-r bg-gray-50 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div className="rounded-xl border bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">基本信息</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="卡片名称"
              className="block w-full rounded border px-2 py-1.5 text-xs focus:border-blue-400 outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述"
              rows={2}
              className="block w-full rounded border px-2 py-1.5 text-xs focus:border-blue-400 outline-none"
            />
          </div>

          {/* Element Order — drag & drop */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              📐 元素排序
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cfg.order}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {cfg.order.map((t) => (
                    <SortableOrderItem
                      key={t}
                      type={t}
                      label={ELEMENT_LABELS[t]}
                      enabled
                      onToggle={() => {
                        setCfg((p) => ({
                          ...p,
                          order: p.order.filter((x) => x !== t),
                        }));
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {/* Hidden items */}
            {(['icon', 'primary', 'secondary', 'tags'] as CardElementType[])
              .filter((t) => !cfg.order.includes(t))
              .map((t) => (
                <SortableOrderItem
                  key={t}
                  type={t}
                  label={ELEMENT_LABELS[t]}
                  enabled={false}
                  onToggle={() => {
                    setCfg((p) => ({ ...p, order: [...p.order, t] }));
                  }}
                />
              ))}
          </div>

          {/* Layout */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">📐 布局</h3>
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="方向"
                value={cfg.direction}
                onChange={(v) => up("direction", v)}
                options={[
                  { value: "vertical", label: "纵向" },
                  { value: "horizontal", label: "横向" },
                ]}
              />
              <Sel
                label="对齐"
                value={cfg.align}
                onChange={(v) => up("align", v)}
                options={[
                  { value: "start", label: "左对齐" },
                  { value: "center", label: "居中" },
                ]}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                间距 (px)
              </label>
              <input
                type="number"
                value={cfg.gap}
                onChange={(e) => up("gap", Number(e.target.value))}
                className="block w-full rounded border px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Container Style */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">🖼️ 容器样式</h3>
            <C
              label="背景"
              value={cfg.containerBg}
              onChange={(v) => up("containerBg", v)}
            />
            <p className="text-[9px] text-gray-400 -mt-2">
              支持纯色或渐变，如: linear-gradient(135deg, #3B82F6, #8B5CF6)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="圆角"
                value={cfg.containerRadius}
                onChange={(v) => up("containerRadius", v)}
                options={[
                  { value: "none", label: "直角" },
                  { value: "md", label: "小圆角" },
                  { value: "lg", label: "中圆角" },
                  { value: "xl", label: "大圆角" },
                  { value: "2xl", label: "全圆角" },
                ]}
              />
              <Sel
                label="阴影"
                value={cfg.containerShadow}
                onChange={(v) => up("containerShadow", v)}
                options={[
                  { value: "none", label: "无" },
                  { value: "sm", label: "小" },
                  { value: "md", label: "中" },
                  { value: "lg", label: "大" },
                  { value: "xl", label: "超大" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="边框粗细"
                value={String(cfg.containerBorderWidth)}
                onChange={(v) => up("containerBorderWidth", Number(v))}
                options={[
                  { value: "0", label: "无" },
                  { value: "1", label: "1px" },
                  { value: "2", label: "2px" },
                  { value: "4", label: "4px" },
                ]}
              />
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">边框色</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={cfg.containerBorderColor || '#e5e7eb'}
                    onChange={(e) => up('containerBorderColor', e.target.value)}
                    className="h-7 w-7 rounded border cursor-pointer flex-shrink-0" />
                  <input value={cfg.containerBorderColor || ''}
                    onChange={(e) => up('containerBorderColor', e.target.value)}
                    className="flex-1 min-w-0 rounded border px-2 py-1.5 text-xs font-mono focus:border-blue-400 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Icon config */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">🎯 图标</h3>
            <Sel
              label="图标"
              value={cfg.icon.name}
              onChange={(v) => up("icon.name", v)}
              options={ICON_OPTIONS.map((n) => ({ value: n, label: n }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="大小"
                value={String(cfg.icon.size)}
                onChange={(v) => up("icon.size", Number(v))}
                options={[
                  { value: "32", label: "32px" },
                  { value: "40", label: "40px" },
                  { value: "48", label: "48px" },
                  { value: "56", label: "56px" },
                ]}
              />
              <Sel
                label="阴影"
                value={cfg.icon.shadow}
                onChange={(v) => up("icon.shadow", v)}
                options={[
                  { value: "none", label: "无" },
                  { value: "sm", label: "小" },
                  { value: "md", label: "中" },
                  { value: "lg", label: "大" },
                ]}
              />
            </div>
            <C
              label="背景"
              value={cfg.icon.bg}
              onChange={(v) => up("icon.bg", v)}
            />
            <C
              label="前景"
              value={cfg.icon.fg}
              onChange={(v) => up("icon.fg", v)}
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={cfg.icon.round}
                onChange={(e) => up("icon.round", e.target.checked)}
              />
              圆角
            </label>
          </div>

          {/* Primary text */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">📝 主文字</h3>
            <div className="grid grid-cols-2 gap-3">
              <Sel
                label="字号"
                value={cfg.primary.size}
                onChange={(v) => up("primary.size", v)}
                options={[
                  { value: "xs", label: "超小" },
                  { value: "sm", label: "小" },
                  { value: "base", label: "正常" },
                  { value: "lg", label: "大" },
                  { value: "xl", label: "超大" },
                ]}
              />
              <Sel
                label="字重"
                value={cfg.primary.weight}
                onChange={(v) => up("primary.weight", v)}
                options={[
                  { value: "normal", label: "常规" },
                  { value: "medium", label: "中等" },
                  { value: "semibold", label: "半粗" },
                  { value: "bold", label: "加粗" },
                ]}
              />
            </div>
            <C
              label="背景"
              value={cfg.primary.bg}
              onChange={(v) => up("primary.bg", v)}
            />
            <C
              label="前景"
              value={cfg.primary.fg}
              onChange={(v) => up("primary.fg", v)}
            />
          </div>

          {/* Secondary text */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">📄 次文字</h3>
            <Sel
              label="字号"
              value={cfg.secondary.size}
              onChange={(v) => up("secondary.size", v)}
              options={[
                { value: "xs", label: "超小" },
                { value: "sm", label: "小" },
                { value: "base", label: "正常" },
              ]}
            />
            <C
              label="背景"
              value={cfg.secondary.bg}
              onChange={(v) => up("secondary.bg", v)}
            />
            <C
              label="前景"
              value={cfg.secondary.fg}
              onChange={(v) => up("secondary.fg", v)}
            />
          </div>

          {/* Tags */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">🏷️ 标签</h3>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={cfg.tags.visible}
                onChange={(e) => up("tags.visible", e.target.checked)}
              />
              显示标签
            </label>
            {cfg.tags.visible && (
              <>
                <C
                  label="区域背景"
                  value={cfg.tags.bg}
                  onChange={(v) => up("tags.bg", v)}
                />
                <C
                  label="标签背景"
                  value={cfg.tags.tagBg}
                  onChange={(v) => up("tags.tagBg", v)}
                />
                <C
                  label="标签文字"
                  value={cfg.tags.tagFg}
                  onChange={(v) => up("tags.tagFg", v)}
                />
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={cfg.tags.rounded}
                    onChange={(e) => up("tags.rounded", e.target.checked)}
                  />
                  圆角标签
                </label>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">标签内容</span>
                    <Tooltip content="添加">
                      <button
                        type="button"
                        onClick={addTagItem}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3 inline" />
                      </button>
                    </Tooltip>
                  </div>
                  {cfg.tags.items.map((item, i) => (
                    <div key={i} className="flex gap-1">
                      <input
                        value={item}
                        onChange={(e) => updateTagItem(i, e.target.value)}
                        placeholder={`标签 ${i + 1}`}
                        className="flex-1 rounded border px-2 py-1 text-xs"
                      />
                      <Tooltip content="删除">
                        <button
                          onClick={() => removeTagItem(i)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Link */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">🔗 链接</h3>
            <Sel
              label="链接类型"
              value={cfg.linkType}
              onChange={(v) => up("linkType", v)}
              options={[
                { value: "none", label: "无链接" },
                { value: "internal", label: "内部（/目录/文章）" },
                { value: "external", label: "外部 URL" },
              ]}
            />
            {cfg.linkType === "internal" && (
              <input
                value={cfg.linkPattern || ""}
                onChange={(e) => up("linkPattern", e.target.value)}
                placeholder="/${slug}"
                className="block w-full rounded border px-2 py-1.5 text-xs font-mono"
              />
            )}
            {cfg.linkType === "external" && (
              <input
                value={cfg.linkHref || ""}
                onChange={(e) => up("linkHref", e.target.value)}
                placeholder="https://..."
                className="block w-full rounded border px-2 py-1.5 text-xs font-mono"
              />
            )}
          </div>

          {/* Custom CSS */}
          <div className="rounded-xl border bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              ✨ 自定义 CSS
            </h3>
            <textarea
              value={cfg.customCss || ""}
              onChange={(e) => up("customCss", e.target.value)}
              rows={2}
              placeholder="hover:shadow-xl hover:scale-105"
              className="block w-full rounded border px-2 py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="max-w-md mx-auto space-y-6">
            <CardPreview config={cfg} sampleData={sample} />
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                🔍 预览数据
              </h3>
              <input
                value={sample.primaryText}
                onChange={(e) =>
                  setSample((s) => ({ ...s, primaryText: e.target.value }))
                }
                placeholder="主文字"
                className="block w-full rounded border px-2 py-1.5 text-xs"
              />
              <textarea
                value={sample.secondaryText}
                onChange={(e) =>
                  setSample((s) => ({ ...s, secondaryText: e.target.value }))
                }
                placeholder="次文字"
                rows={2}
                className="block w-full rounded border px-2 py-1.5 text-xs"
              />
              <div className="space-y-1">
                {sample.tagItems.map((t, i) => (
                  <div key={i} className="flex gap-1">
                    <input
                      value={t}
                      onChange={(e) => {
                        const items = [...sample.tagItems];
                        items[i] = e.target.value;
                        setSample((s) => ({ ...s, tagItems: items }));
                      }}
                      className="flex-1 rounded border px-2 py-1 text-xs"
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setSample((s) => ({ ...s, tagItems: [...s.tagItems, ""] }))
                  }
                  className="text-xs text-blue-600"
                >
                  <Plus className="h-3 w-3 inline" /> 添加标签
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
