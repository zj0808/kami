'use client';

import { useState, useEffect } from 'react';
import { CardCode } from '@/lib/types';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [cards, setCards] = useState<CardCode[]>([]);
  const [content, setContent] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [maxUses, setMaxUses] = useState(3); // 默认3次
  const [batchCount, setBatchCount] = useState(1); // 批量生成数量
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all'); // 筛选状态
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set()); // 选中的卡密ID

  useEffect(() => {
    if (authenticated) {
      loadCards();
    }
  }, [authenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthenticated(true);
        setPassword('');
      } else {
        setAuthError(data.message || '密码错误');
      }
    } catch (error) {
      setAuthError('网络错误，请稍后重试');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      const response = await fetch('/api/admin/cards');
      const data = await response.json();
      if (data.success) {
        setCards(data.data);
      }
    } catch (error) {
      console.error('加载卡密列表失败:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    if (batchCount < 1 || batchCount > 100) {
      alert('批量数量必须在 1-100 之间');
      return;
    }

    setLoading(true);
    setMessage('');
    setShareUrl('');

    try {
      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          customCode: customCode || undefined,
          maxUses,
          batchCount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (batchCount > 1) {
          setMessage(`成功创建 ${batchCount} 个卡密！`);
          setShareUrl('');
        } else {
          setMessage('卡密创建成功！');
          // 生成分享链接
          const url = `${window.location.origin}?code=${data.data.code}`;
          setShareUrl(url);
        }
        setContent('');
        setCustomCode('');
        setBatchCount(1);
        loadCards();
      } else {
        setMessage(data.message || '创建失败');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个卡密吗？')) return;

    try {
      const response = await fetch(`/api/admin/cards?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadCards();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // 尝试使用现代 API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert('已复制到剪贴板！');
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          alert('已复制到剪贴板！');
        } catch (err) {
          alert('复制失败，请手动复制');
        }
        textArea.remove();
      }
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  const generateShareUrl = (code: string) => {
    return `${window.location.origin}?code=${code}`;
  };

  // 筛选和搜索卡密
  const filteredCards = cards.filter((card) => {
    // 状态筛选
    if (filterStatus === 'used' && !card.used) return false;
    if (filterStatus === 'unused' && card.used) return false;

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        card.code.toLowerCase().includes(query) ||
        card.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 切换选中状态
  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCards.size === filteredCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredCards.map(card => card.id)));
    }
  };

  // 复制选中的卡密
  const copySelectedCodes = () => {
    const selected = cards.filter(card => selectedCards.has(card.id));
    if (selected.length === 0) {
      alert('请先选择要复制的卡密');
      return;
    }
    const codes = selected.map(card => card.code).join('\n');
    copyToClipboard(codes);
  };

  // 复制选中的链接
  const copySelectedLinks = () => {
    const selected = cards.filter(card => selectedCards.has(card.id));
    if (selected.length === 0) {
      alert('请先选择要复制的卡密');
      return;
    }
    const links = selected.map(card => generateShareUrl(card.code)).join('\n');
    copyToClipboard(links);
  };

  // 导出卡密为TXT
  const exportToTxt = () => {
    const cardsToExport = selectedCards.size > 0
      ? cards.filter(card => selectedCards.has(card.id))
      : filteredCards.length > 0 ? filteredCards : cards;

    if (cardsToExport.length === 0) {
      alert('没有可导出的卡密');
      return;
    }

    let content = '卡密列表\n';
    content += '='.repeat(50) + '\n\n';

    cardsToExport.forEach((card, index) => {
      content += `${index + 1}. 卡密: ${card.code}\n`;
      content += `   链接: ${generateShareUrl(card.code)}\n`;
      content += `   内容: ${card.content}\n`;
      content += `   状态: ${card.used ? `已使用 (${card.usedCount}/${card.maxUses})` : `未使用 (0/${card.maxUses})`}\n`;
      content += `   创建时间: ${new Date(card.createdAt).toLocaleString('zh-CN')}\n`;
      if (card.used && card.usedAt) {
        content += `   使用时间: ${new Date(card.usedAt).toLocaleString('zh-CN')}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `卡密列表_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导出卡密为CSV
  const exportToCsv = () => {
    const cardsToExport = selectedCards.size > 0
      ? cards.filter(card => selectedCards.has(card.id))
      : filteredCards.length > 0 ? filteredCards : cards;

    if (cardsToExport.length === 0) {
      alert('没有可导出的卡密');
      return;
    }

    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '卡密,分享链接,内容,状态,使用次数,最大次数,创建时间,使用时间,使用IP\n';

    cardsToExport.forEach((card) => {
      const status = card.used ? '已使用' : '未使用';
      const usedAt = card.usedAt ? new Date(card.usedAt).toLocaleString('zh-CN') : '';
      const usedByIp = card.usedByIp || '';
      csv += `"${card.code}","${generateShareUrl(card.code)}","${card.content}","${status}",${card.usedCount},${card.maxUses},"${new Date(card.createdAt).toLocaleString('zh-CN')}","${usedAt}","${usedByIp}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `卡密列表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 如果未认证，显示登录界面
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">管理员登录</h1>
              <p className="text-gray-600">请输入管理员密码</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                  required
                  autoFocus
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? '验证中...' : '登录'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                ← 返回前台
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">卡密管理后台</h1>
            <a href="/" className="text-indigo-600 hover:text-indigo-700">
              ← 返回前台
            </a>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            退出登录
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 创建卡密表单 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">创建新卡密</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  内容 *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="输入卡密兑换后显示的内容..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800 min-h-[150px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
                  自定义卡密（可选）
                </label>
                <input
                  type="text"
                  id="customCode"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="留空则自动生成"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                  disabled={batchCount > 1}
                />
                {batchCount > 1 && (
                  <p className="text-xs text-gray-500 mt-1">批量生成时不支持自定义卡密</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-2">
                    使用次数限制
                  </label>
                  <input
                    type="number"
                    id="maxUses"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                  />
                </div>

                <div>
                  <label htmlFor="batchCount" className="block text-sm font-medium text-gray-700 mb-2">
                    批量生成数量
                  </label>
                  <input
                    type="number"
                    id="batchCount"
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建卡密'}
              </button>
            </form>

            {message && (
              <div className={`mt-4 px-4 py-3 rounded-lg ${
                message.includes('成功') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {shareUrl && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">分享链接：</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
                  >
                    复制
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 卡密列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                卡密列表 ({filteredCards.length}/{cards.length})
                {selectedCards.size > 0 && (
                  <span className="ml-2 text-sm text-indigo-600">
                    已选 {selectedCards.size} 个
                  </span>
                )}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {selectedCards.size > 0 && (
                  <>
                    <button
                      onClick={copySelectedCodes}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                    >
                      复制卡密
                    </button>
                    <button
                      onClick={copySelectedLinks}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                    >
                      复制链接
                    </button>
                  </>
                )}
                <button
                  onClick={exportToTxt}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                  disabled={cards.length === 0}
                  title={selectedCards.size > 0 ? '导出选中的卡密' : '导出所有卡密'}
                >
                  导出TXT
                </button>
                <button
                  onClick={exportToCsv}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  disabled={cards.length === 0}
                  title={selectedCards.size > 0 ? '导出选中的卡密' : '导出所有卡密'}
                >
                  导出CSV
                </button>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="mb-4 space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索卡密或内容..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
              />

              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  disabled={filteredCards.length === 0}
                >
                  {selectedCards.size === filteredCards.length && filteredCards.length > 0 ? '取消全选' : '全选'}
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filterStatus === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterStatus('unused')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filterStatus === 'unused'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未使用
                </button>
                <button
                  onClick={() => setFilterStatus('used')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filterStatus === 'used'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已使用
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredCards.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {cards.length === 0 ? '暂无卡密' : '没有符合条件的卡密'}
                </p>
              ) : (
                filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className={`border rounded-lg p-4 ${
                      card.used ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-200'
                    } ${selectedCards.has(card.id) ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => toggleCardSelection(card.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <code className="text-lg font-mono font-semibold text-gray-800">
                                {card.code}
                              </code>
                              <span className={`px-2 py-1 text-xs rounded ${
                                card.used
                                  ? 'bg-gray-200 text-gray-600'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {card.usedCount}/{card.maxUses} 次
                              </span>
                              {card.used && (
                                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                                  已用完
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {card.content}
                            </p>
                            {card.usedByIp && (
                              <p className="text-xs text-gray-500 mt-1">
                                首次使用IP: {card.usedByIp}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(card.id)}
                            className="ml-2 text-red-600 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 flex-wrap">
                          <button
                            onClick={() => copyToClipboard(card.code)}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            复制卡密
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => copyToClipboard(generateShareUrl(card.code))}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            复制链接
                          </button>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-500">
                            {new Date(card.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

