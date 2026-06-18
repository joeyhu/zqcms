'use client';

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入您的姓名');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError('请至少填写联系电话或邮箱');
      return;
    }
    if (!content.trim()) {
      setError('请输入反馈内容');
      return;
    }

    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:11003/api';
      const res = await fetch(`${apiBase}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          content: content.trim(),
          pageUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '提交失败');
      }

      setSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setSubmitted(false);
          setError('');
        }}
        className="fixed right-6 bottom-24 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all px-5 py-3 text-sm font-medium"
      >
        <MessageSquare className="h-4 w-4" />
        反馈建议
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">反馈建议</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">感谢您的反馈！</h4>
                  <p className="mt-2 text-sm text-gray-500">我们会认真对待每一条建议</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200"
                  >
                    关闭
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="您的姓名"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="选填"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="选填"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">联系电话或邮箱至少填写一项</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      反馈内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      placeholder="请描述您的建议或遇到的问题..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? '提交中...' : '提交反馈'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
