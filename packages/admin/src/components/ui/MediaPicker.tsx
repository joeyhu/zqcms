import { useState, useEffect, useRef } from 'react';
import { fetchAPI, uploadFile } from '@/lib/api-client';
import { Image, Upload, X, Download, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
}

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

const API_ORIGIN = 'http://localhost:11003';

function isImage(mime: string) {
  return mime?.startsWith('image/');
}

export function MediaPicker({ value, onChange, label = '选择文件', accept = 'image/*' }: MediaPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const loadMedia = async () => {
    try {
      const res = await fetchAPI<{ data: MediaItem[] }>('/media?pageSize=100');
      setMedia(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (showPicker) loadMedia();
  }, [showPicker]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadFile('/media/upload', formData) as MediaItem;
      toast.success('上传成功');
      onChange(res.url);
      setMedia((prev) => [res, ...prev]);
      setShowPicker(false);
    } catch {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (item: MediaItem) => {
    onChange(item.url);
    setShowPicker(false);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = `${API_ORIGIN}${url}`;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      <div className="flex items-start gap-3">
        {/* Preview thumbnail */}
        {value && isImage(value) && (
          <div className="relative group shrink-0">
            <img
              src={value.startsWith('http') ? value : `${API_ORIGIN}${value}`}
              alt="预览"
              className="h-16 w-16 rounded-lg border object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleDownload(value, value.split('/').pop() || 'file')}
                className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                title="下载"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                title="清除"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1">
          {/* URL input + Media button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="输入 URL 或从媒体库选择..."
            />
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shrink-0"
            >
              <Image className="h-4 w-4" />
              媒体库
            </button>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowPicker(false)} />
          <div ref={pickerRef} className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="font-semibold text-gray-900">媒体库</h3>
              <button onClick={() => setShowPicker(false)} className="rounded p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Upload */}
            <div className="border-b px-5 py-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Upload className="h-4 w-4" />
                {uploading ? '上传中...' : '上传文件'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleUpload}
              />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {media.length === 0 ? (
                <div className="py-12 text-center text-gray-400">暂无媒体文件</div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {media.map((item) => {
                    const selected = value === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`relative group rounded-lg border-2 overflow-hidden transition-all ${
                          selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {isImage(item.mimeType) ? (
                          <img
                            src={`${API_ORIGIN}${item.url}`}
                            alt={item.filename}
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-gray-50">
                            <Image className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-xs text-white truncate">{item.filename}</p>
                        </div>
                        {selected && (
                          <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
