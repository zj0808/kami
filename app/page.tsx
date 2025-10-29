'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface RedemptionRecord {
  code: string;
  content: string;
  redeemedAt: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const showAdmin = searchParams.get('admin_zj') === 'true'; // 只有 ?admin_zj=true 才显示管理员入口

  const [code, setCode] = useState(codeFromUrl);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<RedemptionRecord[]>([]);
  const [remainingUses, setRemainingUses] = useState(0);
  const [maxUses, setMaxUses] = useState(0);

  // 加载兑换记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('redemption_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('加载兑换记录失败', e);
      }
    }
  }, []);

  // 保存兑换记录
  const saveToHistory = (code: string, content: string) => {
    const newRecord: RedemptionRecord = {
      code,
      content,
      redeemedAt: new Date().toISOString(),
    };
    const updatedHistory = [newRecord, ...history].slice(0, 20); // 只保留最近20条
    setHistory(updatedHistory);
    localStorage.setItem('redemption_history', JSON.stringify(updatedHistory));
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        setContent(data.data.content);
        setVerified(true);
        setRemainingUses(data.data.remainingUses || 0);
        setMaxUses(data.data.maxUses || 1);
        // 保存到兑换记录
        saveToHistory(code, data.data.content);
      } else {
        setError(data.message || '验证失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {!verified ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">卡密兑换</h1>
              <p className="text-gray-600">请输入您的卡密以查看内容</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  卡密
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="请输入卡密，例如：XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '验证中...' : '验证卡密'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
              {showAdmin && (
                <a
                  href="/admin"
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  管理员入口
                </a>
              )}
              {history.length > 0 && (
                <>
                  {showAdmin && <span className="text-gray-300">|</span>}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 transition"
                  >
                    {showHistory ? '隐藏兑换记录' : '查看兑换记录'}
                  </button>
                </>
              )}
            </div>

            {/* 兑换记录列表 */}
            {showHistory && history.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">兑换记录</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((record, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-sm font-mono text-gray-800">
                          {record.code}
                        </code>
                        <span className="text-xs text-gray-500">
                          {new Date(record.redeemedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                        {record.content}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (confirm('确定要清空所有兑换记录吗？')) {
                      setHistory([]);
                      localStorage.removeItem('redemption_history');
                    }
                  }}
                  className="mt-3 text-xs text-red-600 hover:text-red-700"
                >
                  清空记录
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">兑换成功！</h2>
              <p className="text-gray-600">以下是您的内容</p>
              {remainingUses > 0 && (
                <div className="mt-3 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    此卡密还可使用 <span className="font-bold text-lg">{remainingUses}</span> 次
                  </p>
                </div>
              )}
              {remainingUses === 0 && (
                <div className="mt-3 inline-block px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    此卡密已达到最大使用次数 ({maxUses} 次)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
                {content}
              </div>
            </div>

            <button
              onClick={() => {
                setVerified(false);
                setCode('');
                setContent('');
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
