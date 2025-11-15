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
  const [purchaseUrl, setPurchaseUrl] = useState('');

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

  // 加载购买链接配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        setPurchaseUrl(data.purchaseUrl || '');
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    };
    loadConfig();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 - 科技风格 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {!verified ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-10 border border-slate-700/50">
            <div className="text-center mb-8">
              {/* Logo/Icon - 科技风格 */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/50 transform hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">卡密兑换</h1>
              <p className="text-gray-400 text-sm">请输入您的卡密以查看内容</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                  卡密
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="请输入卡密，例如：XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-gray-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl animate-shake">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    验证中...
                  </span>
                ) : '验证卡密'}
              </button>
            </form>

            {/* 购买链接 - 仅在配置了链接时显示 */}
            {purchaseUrl && (
              <div className="mt-6">
                <a
                  href={purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-slate-800/50 hover:bg-slate-800/70 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border border-slate-700/50 hover:border-blue-500/50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span>购买链接</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
              {showAdmin && (
                <a
                  href="/admin"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  管理员入口
                </a>
              )}
              {history.length > 0 && (
                <>
                  {showAdmin && <span className="text-white/30">|</span>}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showHistory ? '隐藏兑换记录' : '查看兑换记录'}
                  </button>
                </>
              )}
            </div>

            {/* 兑换记录列表 */}
            {showHistory && history.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-8 animate-fadeIn">
                <h3 className="text-base font-bold text-gray-200 mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  兑换记录
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {history.map((record, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-xl transition-all duration-300"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <code className="text-sm font-mono font-bold text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                            {record.code}
                          </code>
                          <span className="text-xs text-gray-500 bg-slate-700/50 px-2 py-1 rounded">
                            {new Date(record.redeemedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                          {record.content}
                        </p>
                      </div>
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
                  className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空记录
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-4 shadow-lg animate-bounce-slow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">兑换成功！</h2>
              <p className="text-gray-300">以下是您的内容</p>
              {remainingUses > 0 && (
                <div className="mt-4 inline-block px-5 py-2.5 bg-blue-500/20 border border-blue-400/50 rounded-xl backdrop-blur-sm">
                  <p className="text-sm text-blue-200">
                    此卡密还可使用 <span className="font-bold text-xl text-blue-300">{remainingUses}</span> 次
                  </p>
                </div>
              )}
              {remainingUses === 0 && (
                <div className="mt-4 inline-block px-5 py-2.5 bg-orange-500/20 border border-orange-400/50 rounded-xl backdrop-blur-sm">
                  <p className="text-sm text-orange-200">
                    此卡密已达到最大使用次数 ({maxUses} 次)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 relative border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(content).then(() => {
                      alert('内容已复制到剪贴板！');
                    }).catch(() => {
                      // 降级方案
                      const textArea = document.createElement('textarea');
                      textArea.value = content;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-999999px';
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        alert('内容已复制到剪贴板！');
                      } catch (err) {
                        alert('复制失败，请手动复制');
                      }
                      textArea.remove();
                    });
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                  title="复制内容"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </button>
              </div>
              <div className="prose max-w-none text-gray-200 whitespace-pre-wrap break-words pr-24 leading-relaxed">
                {content}
              </div>
            </div>

            <button
              onClick={() => {
                setVerified(false);
                setCode('');
                setContent('');
              }}
              className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 transform hover:scale-[1.02] active:scale-[0.98]"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-gray-300 text-lg">加载中...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
