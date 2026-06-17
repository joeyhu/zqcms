import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Copy, Image as ImageIcon } from 'lucide-react';
import { fetchAPI, uploadFile } from '@/lib/api-client';
import type { Media, PaginatedResponse } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function MediaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<PaginatedResponse<Media>>('/media?pageSize=50');
      setMedia(res.data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMedia(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await uploadFile('/media/upload', formData);
      toast.success('上传成功');
      loadMedia();
    } catch (err) {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该文件？')) return;
    try {
      await fetchAPI(`/media/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadMedia();
    } catch {
      toast.error('删除失败');
    }
  };

  const copyUrl = (url: string) => {
    const fullUrl = `http://localhost:11003${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('链接已复制');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">媒体库</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? '上传中...' : '上传文件'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-gray-400">暂无媒体文件</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative rounded-xl border bg-white p-2 shadow-sm">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.mimeType.startsWith('image/') ? (
                  <img
                    src={`http://localhost:11003${item.url}`}
                    alt={item.altText || item.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100">
                  <button onClick={() => copyUrl(item.url)} className="rounded-lg bg-white/90 p-2 text-gray-700 hover:bg-white">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-red-500/90 p-2 text-white hover:bg-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 truncate px-1 text-xs text-gray-500">{item.filename}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
