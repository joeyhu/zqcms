import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAPI } from "@/lib/api-client";
import type { Category } from "@zqcms/shared/types";
import { TreeSelect } from "@/components/ui/TreeSelect";
import toast from "react-hot-toast";

export function CategoryFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAPI<Category[]>("/categories?all=true").then((cats) => {
      setParentCategories(cats);
    });

    if (isEdit) {
      fetchAPI<Category>(`/categories/by-id/${id}`).then((cat) => {
        setName(cat.name);
        setSlug(cat.slug);
        setDescription(cat.description || "");
        setUrl(cat.url || "");
        setParentId(cat.parentId || null);
        setIsVisible(cat.isVisible);
        setSortOrder(cat.sortOrder);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      slug,
      description: description || null,
      url: url || null,
      parentId,
      isVisible,
      sortOrder,
    };

    try {
      if (isEdit) {
        await fetchAPI(`/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("目录已更新");
      } else {
        await fetchAPI("/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("目录已创建");
      }
      navigate("/categories");
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
          {isEdit ? "编辑目录" : "新建目录"}
        </h1>
        <button
          onClick={() => navigate("/categories")}
          className="text-sm text-gray-500"
        >
          返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            父目录
          </label>
          <TreeSelect
            items={parentCategories}
            value={parentId}
            onChange={setParentId}
            placeholder="无（顶级目录）"
            excludeId={isEdit ? Number(id) : undefined}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名称
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            外部链接
          </label>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="设置后导航点击在新标签页打开，留空则展示目录内容页"
            className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            例如 https://docs.example.com
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            排序
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            className="rounded"
          />
          在导航中显示
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : isEdit ? "更新目录" : "创建目录"}
        </button>
      </form>
    </div>
  );
}
