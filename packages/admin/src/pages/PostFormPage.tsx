import { useEffect, useState, FormEvent, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Wand2, X } from "lucide-react";
import { fetchAPI } from "@/lib/api-client";
import type {
  Post,
  Category,
  Tag,
  LlmAssistResponse,
} from "@zqcms/shared/types";
import { POST_STATUS_LABELS } from "@zqcms/shared/constants";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { TreeSelect } from "@/components/ui/TreeSelect";
import { Tooltip } from "@/components/ui/Tooltip";
import toast from "react-hot-toast";

export function PostFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [hasAuthor, setHasAuthor] = useState(true);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiSavePending, setAiSavePending] = useState(false);
  const [tagPicker, setTagPicker] = useState<{ tags: string[] } | null>(null);
  const [tagPickerSelected, setTagPickerSelected] = useState<Set<string>>(new Set());
  const [tagPickerSaving, setTagPickerSaving] = useState(false);
  const [mediaList, setMediaList] = useState<
    Array<{ id: number; url: string; filename: string; mimeType: string }>
  >([]);

  useEffect(() => {
    Promise.all([
      fetchAPI<Category[]>("/categories?all=true"),
      fetchAPI<Tag[]>("/tags"),
    ]).then(([catsRes, tagsRes]) => {
      setCategories(catsRes || []);
      setTags(tagsRes);
    });

    if (isEdit) {
      fetchAPI<Post>(`/posts/by-id/${id}`).then((post) => {
        setTitle(post.title);
        setSlug(post.slug);
        setContent(post.content);
        setExcerpt(post.excerpt || "");
        setStatus(post.status);
        setCategoryId(post.categoryId);
        setSeoTitle(post.seoTitle || "");
        setSeoDesc(post.seoDesc || "");
        setIsFeatured(post.isFeatured);
        setIsPinned(post.isPinned);
        setCoverImage(post.coverImage || "");
        setSelectedTagIds((post.tags || []).map((t: Tag) => t.id));
      });
    }
  }, [id, isEdit]);

  const buildBody = useCallback(() => {
    // 自动从标题生成 slug：去掉特殊字符，空格转连字符，转小写
    const autoSlug =
      slug ||
      title
        .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 80) ||
      `post-${Date.now()}`;

    return {
      title,
      slug: autoSlug,
      content,
      excerpt: excerpt || null,
      status,
      categoryId,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      isFeatured,
      isPinned,
      coverImage: coverImage || null,
      authorId: hasAuthor ? undefined : null, // undefined = 保持默认作者，null = 无作者
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };
  }, [
    title,
    slug,
    content,
    excerpt,
    status,
    categoryId,
    seoTitle,
    seoDesc,
    isFeatured,
    isPinned,
    coverImage,
    selectedTagIds,
  ]);

  const doSave = async (overrideStatus?: string, isAuto = false) => {
    if (isAuto) setAutoSaving(true);
    else setSaving(true);

    const body = { ...buildBody(), status: overrideStatus || status };

    try {
      if (isEdit) {
        await fetchAPI(`/posts/by-id/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await fetchAPI("/posts", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      if (!isAuto) toast.success(isEdit ? "文章已更新" : "文章已创建");
      isDirty.current = false;
      return true;
    } catch (err) {
      if (!isAuto) toast.error(err instanceof Error ? err.message : "保存失败");
      return false;
    } finally {
      if (isAuto) setAutoSaving(false);
      else setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await doSave();
    if (ok) navigate("/posts");
  };

  const handleSaveDraft = async () => {
    await doSave("DRAFT");
  };

  const handlePublish = async () => {
    await doSave("PUBLISHED");
    navigate("/posts");
  };

  // ── AI 辅助 ──
  const handleAiAssist = async (action: string) => {
    if (!content.trim()) {
      toast.error("请先输入文章内容");
      return;
    }
    setAiAction(action);
    try {
      const body: Record<string, unknown> = {
        action,
        content,
        title: title || undefined,
      };
      if (action === "classify") {
        body.categories = categories.map((c) => c.name);
      }
      if (action === "extractTags") {
        body.existingTags = tags.map((t) => t.name);
      }

      const res = await fetchAPI<LlmAssistResponse>("/llm/assist", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.success || res.error) {
        toast.error(res.error || "AI 服务返回错误");
        return;
      }

      switch (action) {
        case "generate":
          if (res.result) setContent(res.result);
          toast.success("AI 续写完成，正在自动保存...");
          break;
        case "summarize":
          if (res.result) setExcerpt(res.result);
          toast.success("摘要生成完成，正在自动保存...");
          break;
        case "extractTags":
          if (res.tags && res.tags.length > 0) {
            // 弹出标签选择窗口
            setTagPicker({ tags: res.tags });
            setTagPickerSelected(new Set(res.tags));
            toast.success(`AI 建议了 ${res.tags.length} 个标签，请在弹窗中选择`);
          }
          break;
        case "classify":
          if (res.category) {
            const found = categories.find(
              (c) =>
                c.name === res.category ||
                c.name.includes(res.category!) ||
                res.category!.includes(c.name),
            );
            if (found) {
              setCategoryId(found.id);
              toast.success(`AI 推荐分类：${found.name}，正在自动保存...`);
            } else {
              toast(`AI 建议分类：${res.category}（未匹配到现有分类）`, {
                icon: "💡",
                duration: 5000,
              });
            }
          }
          break;
        case 'generateTitle':
          if (res.result) setTitle(res.result);
          toast.success('AI 标题生成完成，正在自动保存...');
          break;
        case 'format':
          if (res.result) setContent(res.result);
          toast.success('AI 排版优化完成，正在自动保存...');
          break;
        case 'generateSeo':
          if (res.seoTitle) setSeoTitle(res.seoTitle);
          if (res.seoDesc) setSeoDesc(res.seoDesc);
          toast.success('AI SEO 数据生成完成，正在自动保存...');
          break;
      }

      // AI 操作成功后触发自动保存（effect 在状态更新后执行）
      // 标签提取除外：需要用户在弹窗中选择后才保存
      if (action !== 'extractTags') {
        setAiSavePending(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI 服务调用失败");
    } finally {
      setAiAction(null);
    }
  };

  // ── 标签选择窗：保存所选标签（批量创建 + 设置文章标签并自动保存）──
  const handleTagPickerSave = async () => {
    if (tagPickerSelected.size === 0) {
      setTagPicker(null);
      return;
    }
    setTagPickerSaving(true);
    try {
      const createdTags: Tag[] = await fetchAPI<Tag[]>('/tags/batch-create', {
        method: 'POST',
        body: JSON.stringify({ names: Array.from(tagPickerSelected) }),
      });
      const tagIds = (createdTags || []).map((t) => t.id);
      setSelectedTagIds(tagIds);
      setTagPicker(null);
      const updatedTags = await fetchAPI<Tag[]>('/tags');
      setTags(updatedTags || []);
      toast.success(`已保存 ${createdTags.length} 个标签，正在自动保存文章...`);
      setAiSavePending(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存标签失败');
    } finally {
      setTagPickerSaving(false);
    }
  };

  // ── Auto-save (debounced, only when editing) ──
  useEffect(() => {
    if (!isEdit || aiAction) return;
    isDirty.current = true;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!isDirty.current) return;
      await doSave("DRAFT", true);
    }, 5000); // 5 秒防抖

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [
    title,
    slug,
    content,
    excerpt,
    categoryId,
    coverImage,
    isFeatured,
    isPinned,
    selectedTagIds,
  ]); // eslint-disable-line

  // AI 操作后立即保存（等状态更新完成后触发）
  useEffect(() => {
    if (!aiSavePending) return;
    setAiSavePending(false);
    doSave("DRAFT", true);
  }, [aiSavePending]); // eslint-disable-line

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "编辑文章" : "新建文章"}
        </h1>
        <button
          onClick={() => navigate("/posts")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI 处理中提示 */}
        {aiAction && (
          <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm text-purple-700">
            <Wand2 className="h-4 w-4 animate-pulse" />
            AI 正在处理中，表单已锁定，请稍候...
          </div>
        )}

        <div className={`grid gap-6 lg:grid-cols-3 ${aiAction ? 'pointer-events-none opacity-60' : ''}`}>
          {/* Main */}
          <div className="space-y-4 lg:col-span-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold font"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容 (Markdown)
              </label>
              <MarkdownEditor value={content} onChange={setContent} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {Object.entries(POST_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <TreeSelect
                  items={categories.filter((c) => !c.url)}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="无（未分类）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图片 URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="block w-full rounded-lg border px-3 py-2 text-sm flex-1"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setShowMediaPicker(true);
                      try {
                        const res = await fetchAPI<{
                          data: Array<{
                            id: number;
                            url: string;
                            filename: string;
                            mimeType: string;
                          }>;
                        }>("/media?pageSize=100");
                        setMediaList(res.data || []);
                      } catch {
                        setMediaList([]);
                      }
                    }}
                    className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0"
                  >
                    媒体库
                  </button>
                </div>
              </div>

              {/* Media Picker Modal */}
              {showMediaPicker && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  onClick={() => setShowMediaPicker(false)}
                >
                  <div
                    className="w-full max-w-2xl max-h-[80vh] rounded-xl bg-white shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b">
                      <h3 className="font-semibold text-lg">选择封面图片</h3>
                      <Tooltip content="关闭">
                        <button
                          onClick={() => setShowMediaPicker(false)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {mediaList.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-400">
                          媒体库暂无图片
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {mediaList
                            .filter((m) => m.mimeType?.startsWith("image/"))
                            .map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setCoverImage(m.url);
                                  setShowMediaPicker(false);
                                }}
                                className={`rounded-lg border p-2 text-left hover:border-blue-400 transition-colors ${
                                  coverImage === m.url
                                    ? "border-blue-500 ring-1 ring-blue-200"
                                    : "border-gray-200"
                                }`}
                              >
                                <div className="aspect-square rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={`http://localhost:11003${m.url}`}
                                    alt={m.filename}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="mt-1 text-[10px] text-gray-500 truncate">
                                  {m.filename}
                                </p>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 标签选择 */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tags.map((tag) => {
                      const checked = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                            checked
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedTagIds((prev) =>
                                prev.includes(tag.id)
                                  ? prev.filter((t) => t !== tag.id)
                                  : [...prev, tag.id],
                              )
                            }
                            className="sr-only"
                          />
                          {tag.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded"
                />
                设为精选文章
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded"
                />
                设为置顶文章
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasAuthor}
                  onChange={(e) => setHasAuthor(e.target.checked)}
                  className="rounded"
                />
                显示作者信息
              </label>

              {/* Auto-save indicator */}
              {isEdit && (
                <div className="text-center text-xs text-gray-300">
                  {autoSaving ? "⏳ 自动保存中..." : "✓ 已自动保存"}
                </div>
              )}

              {/* Save buttons */}
              {isEdit ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving || !!aiAction}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存草稿"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving || !!aiAction}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "发布中..." : "发布文章"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving || !!aiAction}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存草稿"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !!aiAction}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "发布中..." : "发布文章"}
                  </button>
                </div>
              )}
            </div>

            {/* AI 助手 */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-sm text-gray-900">AI 助手</h3>
                {aiAction && (
                  <span className="text-xs text-purple-500 animate-pulse">
                    处理中...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAiAssist('generateTitle')}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === 'generateTitle' ? '⏳ 标题中...' : '💡 生成标题'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist("generate")}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === "generate" ? "⏳ 续写中..." : "✏️ AI 续写"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist("summarize")}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === "summarize" ? "⏳ 摘要中..." : "📝 生成摘要"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist("extractTags")}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === "extractTags" ? "⏳ 提取中..." : "🏷️ 提取标签"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist("classify")}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === "classify" ? "⏳ 分类中..." : "📂 自动分类"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist('format')}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === 'format' ? '⏳ 排版中...' : '📐 优化排版'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist('generateSeo')}
                  disabled={!!aiAction}
                  className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {aiAction === 'generateSeo' ? '⏳ SEO中...' : '🔍 生成SEO'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                基于已配置的 LLM 模型，AI 可辅助生成标题、SEO、优化排版、续写文章、生成摘要、提取标签和自动推荐分类。
              </p>
            </div>

            {/* SEO */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">SEO 设置</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  SEO 标题
                </label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  SEO 描述
                </label>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  摘要
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="文章摘要..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* AI 标签选择弹窗 */}
      {tagPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTagPicker(null)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">AI 建议标签</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  已选 {tagPickerSelected.size}/{tagPicker.tags.length} 个
                </p>
              </div>
              <Tooltip content="关闭">
                <button onClick={() => setTagPicker(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {tagPicker.tags.map((tag) => (
                <label
                  key={tag}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors ${
                    tagPickerSelected.has(tag)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tagPickerSelected.has(tag)}
                    onChange={() => {
                      setTagPickerSelected((prev) => {
                        const next = new Set(prev);
                        next.has(tag) ? next.delete(tag) : next.add(tag);
                        return next;
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">{tag}</span>
                  {tags.find((t) => t.name === tag) && (
                    <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5">已有</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={handleTagPickerSave}
                disabled={tagPickerSaving || tagPickerSelected.size === 0}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {tagPickerSaving ? '保存中...' : `保存所选标签 (${tagPickerSelected.size})`}
              </button>
              <button
                onClick={() => setTagPicker(null)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
