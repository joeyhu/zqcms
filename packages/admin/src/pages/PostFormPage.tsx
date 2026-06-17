import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAPI } from "@/lib/api-client";
import type { Post, Category, Tag } from "@zqcms/shared/types";
import { POST_STATUS_LABELS } from "@zqcms/shared/constants";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import toast from "react-hot-toast";

export function PostFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      fetchAPI<{ data: Category[] }>("/categories?all=true"),
      fetchAPI<Tag[]>("/tags"),
    ]).then(([catsRes, tagsRes]) => {
      setCategories(catsRes.data || []);
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
        setCoverImage(post.coverImage || "");
        setSelectedTagIds((post.tags || []).map((t: Tag) => t.id));
        setSelectedTagIds((post.tags || []).map((t: Tag) => t.id));
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      status,
      categoryId,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      isFeatured,
      coverImage: coverImage || null,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };

    try {
      if (isEdit) {
        await fetchAPI(`/posts/by-id/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("文章已更新");
      } else {
        await fetchAPI("/posts", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("文章已创建");
      }
      navigate("/posts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="grid gap-6 lg:grid-cols-3">
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
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">无（未分类）</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图片 URL
                </label>
                <input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* 标签选择 */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tags.map((tag) => {
                      const checked = selectedTagIds.includes(tag.id);
                      return (
                        <label key={tag.id} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                          checked ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setSelectedTagIds((prev) =>
                              prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                            )}
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
                设为特色文章
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : isEdit ? "更新文章" : "发布文章"}
              </button>
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
    </div>
  );
}
