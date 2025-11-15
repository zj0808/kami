'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [cardType, setCardType] = useState<'augment' | 'windsurf'>('augment'); // 卡密类型
  const [filterType, setFilterType] = useState<'all' | 'augment' | 'windsurf'>('all'); // 类型筛选
  const [currentPage, setCurrentPage] = useState<'cards' | 'statistics' | 'settings'>('cards'); // 当前页面
  const [showBatchImport, setShowBatchImport] = useState(false); // 显示批量导入
  const [batchImportText, setBatchImportText] = useState(''); // 批量导入文本
  const [batchImportType, setBatchImportType] = useState<'augment' | 'windsurf'>('augment'); // 批量导入类型

  // 分页相关状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 配置相关状态
  const [purchaseUrl, setPurchaseUrl] = useState(''); // 购买链接
  const [configLoading, setConfigLoading] = useState(false); // 配置加载状态
  const [configMessage, setConfigMessage] = useState(''); // 配置消息

  // 筛选和搜索卡密 - 使用 useMemo 优化性能
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 状态筛选
      if (filterStatus === 'used' && card.usedCount === 0) return false;
      if (filterStatus === 'unused' && card.usedCount > 0) return false;

      // 类型筛选
      if (filterType !== 'all' && card.type !== filterType) return false;

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
  }, [cards, filterStatus, filterType, searchQuery]);

  // 分页数据 - 使用 useMemo 优化性能
  const paginatedCards = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCards.slice(startIndex, endIndex);
  }, [filteredCards, page, pageSize]);

  // 总页数
  const totalPages = Math.ceil(filteredCards.length / pageSize);

  // 计算统计数据 - 使用 useMemo 优化性能
  const stats = useMemo(() => {
    return {
      total: cards.length,
      used: cards.filter(c => c.usedCount > 0).length,
      unused: cards.filter(c => c.usedCount === 0).length,
      totalUses: cards.reduce((sum, c) => sum + c.usedCount, 0),
      totalMaxUses: cards.reduce((sum, c) => sum + c.maxUses, 0),
      augment: cards.filter(c => c.type === 'augment').length,
      windsurf: cards.filter(c => c.type === 'windsurf').length,
    };
  }, [cards]);

  const copyToClipboard = useCallback(async (text: string) => {
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
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadCards();
      loadConfig();
    }
  }, [authenticated]);

  // 加载配置
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setPurchaseUrl(data.purchaseUrl || '');
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 保存配置
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    // 提示用户输入密码
    const inputPassword = prompt('请输入管理员密码以保存配置：');
    if (!inputPassword) {
      return; // 用户取消
    }

    setConfigLoading(true);
    setConfigMessage('');

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: inputPassword,
          purchaseUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfigMessage('配置保存成功！');
        setTimeout(() => setConfigMessage(''), 3000);
      } else {
        setConfigMessage(data.error || '保存失败');
      }
    } catch (error) {
      setConfigMessage('网络错误，请稍后重试');
    } finally {
      setConfigLoading(false);
    }
  };

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
          type: cardType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (batchCount > 1) {
          setMessage(`成功创建 ${batchCount} 个卡密！`);
          setShareUrl('');
          // 乐观更新：直接添加新卡密到列表
          if (Array.isArray(data.data)) {
            setCards(prevCards => [...data.data, ...prevCards]);
          }
        } else {
          setMessage('卡密创建成功！');
          // 生成分享链接
          const url = `${window.location.origin}?code=${data.data.code}`;
          setShareUrl(url);
          // 乐观更新：直接添加新卡密到列表
          setCards(prevCards => [data.data, ...prevCards]);
        }
        setContent('');
        setCustomCode('');
        setBatchCount(1);
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

    // 乐观更新：立即从列表中移除
    setCards(prevCards => prevCards.filter(c => c.id !== id));

    try {
      const response = await fetch(`/api/admin/cards?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        // 如果删除失败，恢复数据
        alert(data.message || '删除失败');
        loadCards();
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
      // 网络错误时恢复数据
      loadCards();
    }
  };

  // 更新售卖状态
  const handleUpdateSoldStatus = async (id: string, soldStatus: 'sold' | 'unsold') => {
    // 乐观更新：立即更新UI
    setCards(prevCards => prevCards.map(c =>
      c.id === id ? { ...c, soldStatus } : c
    ));

    try {
      const response = await fetch('/api/admin/cards/sold-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, soldStatus }),
      });

      const data = await response.json();

      if (!data.success) {
        // 如果更新失败，恢复数据
        alert(data.message || '更新失败');
        loadCards();
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
      // 网络错误时恢复数据
      loadCards();
    }
  };

  // 同步账号信息
  const handleSyncAccount = async (id: string) => {
    try {
      const response = await fetch('/api/admin/cards/sync-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新UI
        setCards(prevCards => prevCards.map(c =>
          c.id === id ? { ...c, account: data.data.account } : c
        ));
        alert('同步成功！');
      } else {
        alert(data.message || '同步失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    }
  };

  // 批量同步所有账号
  const handleSyncAllAccounts = async () => {
    if (!confirm('确定要同步所有卡密的账号信息吗？')) {
      return;
    }

    setLoading(true);
    setMessage('正在同步账号信息...');

    try {
      const response = await fetch('/api/admin/cards/sync-all-accounts', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // 更新所有卡密数据
        setCards(data.data.cards);
        setMessage(`同步完成！共同步 ${data.data.syncedCount} 个账号`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || '同步失败');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 批量删除选中的卡密
  const handleBatchDelete = async () => {
    if (selectedCards.size === 0) {
      alert('请先选择要删除的卡密');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedCards.size} 个卡密吗？此操作不可恢复！`)) {
      return;
    }

    const idsToDelete = Array.from(selectedCards);

    // 乐观更新：立即从列表中移除
    setCards(prevCards => prevCards.filter(c => !selectedCards.has(c.id)));
    setSelectedCards(new Set());

    try {
      const deletePromises = idsToDelete.map(id =>
        fetch(`/api/admin/cards?id=${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      alert('批量删除成功！');
    } catch (error) {
      alert('批量删除失败，请稍后重试');
      // 失败时重新加载数据
      loadCards();
    }
  };

  // 批量导入卡密
  const handleBatchImport = async () => {
    if (!batchImportText.trim()) {
      alert('请输入要导入的内容');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 尝试解析JSON格式
      let accountsData;
      try {
        accountsData = JSON.parse(batchImportText.trim());
      } catch (e) {
        alert('JSON格式错误，请检查输入的内容');
        setLoading(false);
        return;
      }

      // 确保是数组
      if (!Array.isArray(accountsData)) {
        alert('请输入JSON数组格式的数据');
        setLoading(false);
        return;
      }

      if (accountsData.length === 0) {
        alert('没有有效的导入数据');
        setLoading(false);
        return;
      }

      // 批量创建
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const item of accountsData) {
        // 直接使用导入的内容，不做任何格式化
        // 如果是字符串，直接使用；如果是对象，转换为JSON字符串
        const content = typeof item === 'string' ? item : JSON.stringify(item, null, 2);

        try {
          const response = await fetch('/api/admin/cards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content,
              maxUses,
              batchCount: 1,
              type: batchImportType,
            }),
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            errors.push(`导入失败: ${result.message}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`导入失败: 网络错误`);
        }
      }

      setMessage(`导入完成！成功: ${successCount}, 失败: ${failCount}`);
      if (errors.length > 0 && errors.length <= 5) {
        setMessage(prev => prev + '\n失败原因:\n' + errors.join('\n'));
      }

      if (successCount > 0) {
        loadCards();
        setBatchImportText('');
        setShowBatchImport(false);
      }
    } catch (error) {
      setMessage('批量导入失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const generateShareUrl = (code: string) => {
    return `${window.location.origin}?code=${code}`;
  };

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
      content += `   类型: ${card.type === 'augment' ? 'Augment' : 'Windsurf'}\n`;
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
    csv += '类型,卡密,分享链接,内容,状态,使用次数,最大次数,创建时间,使用时间,使用IP\n';

    cardsToExport.forEach((card) => {
      const cardType = card.type === 'augment' ? 'Augment' : 'Windsurf';
      const status = card.used ? '已使用' : '未使用';
      const usedAt = card.usedAt ? new Date(card.usedAt).toLocaleString('zh-CN') : '';
      const usedByIp = card.usedByIp || '';
      csv += `"${cardType}","${card.code}","${generateShareUrl(card.code)}","${card.content}","${status}",${card.usedCount},${card.maxUses},"${new Date(card.createdAt).toLocaleString('zh-CN')}","${usedAt}","${usedByIp}"\n`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* 左侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        {/* 侧边栏头部 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">卡密管理系统</h1>
              <p className="text-xs text-gray-500">后台管理</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="p-4 border-b border-gray-100">
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentPage('cards')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentPage === 'cards'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              卡密管理
            </button>
            <button
              onClick={() => setCurrentPage('statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentPage === 'statistics'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              兑换统计
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentPage === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              系统设置
            </button>
          </nav>
        </div>

        {/* 创建卡密表单 - 仅在卡密管理页面显示 */}
        {currentPage === 'cards' && (
          <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            创建新卡密
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡密类型 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCardType('augment')}
                    className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                      cardType === 'augment'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Augment
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType('windsurf')}
                    className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                      cardType === 'windsurf'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                      Windsurf
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  兑换内容 *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="输入卡密兑换后显示的内容..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800 min-h-[120px] resize-none"
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
                  <p className="text-xs text-gray-500 mt-1.5">批量生成时不支持自定义卡密</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-2">
                    使用次数
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
                    生成数量
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

              {message && (
                <div className={`px-4 py-3 rounded-lg ${
                  message.includes('成功')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {shareUrl && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">分享链接：</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareUrl)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
                    >
                      复制
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? '创建中...' : '创建卡密'}
              </button>
            </form>

            {/* 批量导入区域 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowBatchImport(!showBatchImport)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  批量导入卡密
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showBatchImport ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showBatchImport && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      卡密类型 *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBatchImportType('augment')}
                        className={`px-3 py-2 rounded-lg border-2 transition text-xs font-medium ${
                          batchImportType === 'augment'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Augment
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchImportType('windsurf')}
                        className={`px-3 py-2 rounded-lg border-2 transition text-xs font-medium ${
                          batchImportType === 'windsurf'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Windsurf
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      导入格式说明
                    </label>
                    <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
                      <p className="font-semibold text-blue-700 mb-1">支持两种格式：</p>
                      <p className="mt-1 text-gray-700">1. 字符串数组：</p>
                      <p className="font-mono text-[10px] bg-white p-2 rounded border border-blue-300 overflow-x-auto">
                        ["内容1", "内容2", "内容3"]
                      </p>
                      <p className="mt-2 text-gray-700">2. 对象数组（会转为JSON格式）：</p>
                      <p className="font-mono text-[10px] bg-white p-2 rounded border border-blue-300 overflow-x-auto">
                        [{`{`}"email":"xxx","password":"xxx"{`}`}, {`{`}"email":"yyy","password":"yyy"{`}`}]
                      </p>
                      <p className="mt-2 text-gray-600">每个元素会生成一个卡密，内容原样保存</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      导入内容（JSON格式）*
                    </label>
                    <textarea
                      value={batchImportText}
                      onChange={(e) => setBatchImportText(e.target.value)}
                      placeholder='["内容1", "内容2"] 或 [{"email":"test@example.com","password":"pass123"}]'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-xs min-h-[150px] resize-none font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleBatchImport}
                      disabled={loading || !batchImportText.trim()}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '导入中...' : '开始导入'}
                    </button>
                    <button
                      onClick={() => {
                        setBatchImportText('');
                        setShowBatchImport(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 侧边栏底部 */}
        <div className="p-6 border-t border-gray-100 space-y-2">
          <button
            onClick={async () => {
              if (!confirm('⚠️ 警告：此操作将清空所有卡密数据，且不可恢复！\n\n确定要继续吗？')) {
                return;
              }

              if (!confirm('⚠️ 最后确认：真的要清空所有数据吗？')) {
                return;
              }

              try {
                const response = await fetch('/api/admin/clear', {
                  method: 'POST',
                });

                const data = await response.json();

                if (data.success) {
                  alert('✅ 所有数据已清空！');
                  loadCards();
                } else {
                  alert('❌ 清空失败：' + data.message);
                }
              } catch (error) {
                alert('❌ 网络错误，请稍后重试');
              }
            }}
            className="w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空所有数据
          </button>
          <a
            href="/"
            className="w-full px-4 py-2.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回前台
          </a>
          <button
            onClick={() => setAuthenticated(false)}
            className="w-full px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总卡密数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Augment: {stats.augment}</span>
                    <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">Windsurf: {stats.windsurf}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已兑换 / 未兑换</p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <p className="text-3xl font-bold text-red-600">{stats.used}</p>
                    <span className="text-gray-400">/</span>
                    <p className="text-3xl font-bold text-green-600">{stats.unused}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    已用 {stats.total > 0 ? ((stats.used / stats.total) * 100).toFixed(1) : 0}% ·
                    可用 {stats.total > 0 ? ((stats.unused / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">兑换次数</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUses}</p>
                  <p className="text-xs text-gray-500 mt-1">总计 {stats.totalMaxUses} 次</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 根据当前页面显示不同内容 */}
          {currentPage === 'cards' ? (
            /* 卡密列表 - 表格形式 */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    卡密列表
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    共 {filteredCards.length} 条
                    {selectedCards.size > 0 && (
                      <span className="ml-2 text-indigo-600 font-medium">
                        · 已选 {selectedCards.size} 个
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedCards.size > 0 && (
                    <>
                      <button
                        onClick={copySelectedCodes}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
                      >
                        复制卡密
                      </button>
                      <button
                        onClick={copySelectedLinks}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
                      >
                        复制链接
                      </button>
                      <button
                        onClick={handleBatchDelete}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                      >
                        删除选中
                      </button>
                    </>
                  )}
                  <button
                    onClick={exportToTxt}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                    disabled={cards.length === 0}
                    title={selectedCards.size > 0 ? '导出选中的卡密' : '导出所有卡密'}
                  >
                    导出TXT
                  </button>
                  <button
                    onClick={exportToCsv}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                    disabled={cards.length === 0}
                    title={selectedCards.size > 0 ? '导出选中的卡密' : '导出所有卡密'}
                  >
                    导出CSV
                  </button>
                  <button
                    onClick={handleSyncAllAccounts}
                    className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-sm flex items-center gap-1.5"
                    disabled={cards.length === 0 || loading}
                    title="从内容中提取并同步所有账号信息"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    批量同步账号
                  </button>
                </div>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="p-6 border-b border-gray-100 space-y-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索卡密或内容..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-800"
                />
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  disabled={filteredCards.length === 0}
                >
                  {selectedCards.size === filteredCards.length && filteredCards.length > 0 ? '取消全选' : '全选'}
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-xs text-gray-500 font-medium">类型:</span>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterType === 'all'
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterType('augment')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterType === 'augment'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Augment
                </button>
                <button
                  onClick={() => setFilterType('windsurf')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterType === 'windsurf'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Windsurf
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-xs text-gray-500 font-medium">状态:</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterStatus === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterStatus('unused')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterStatus === 'unused'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未使用
                </button>
                <button
                  onClick={() => setFilterStatus('used')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filterStatus === 'used'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已使用
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              {filteredCards.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500">
                    {cards.length === 0 ? '暂无卡密，请先创建' : '没有符合条件的卡密'}
                  </p>
                </div>
              ) : (
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedCards.size === filteredCards.length && filteredCards.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-20">类型</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-36">卡密</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">账号</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-64">内容</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-20">兑换状态</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-20">售卖状态</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">使用次数</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-36">创建时间</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCards.map((card) => (
                      <tr key={card.id} className={`hover:bg-gray-50 transition ${selectedCards.has(card.id) ? 'bg-indigo-50' : ''}`}>
                        <td className="px-3 py-3 whitespace-nowrap w-12">
                          <input
                            type="checkbox"
                            checked={selectedCards.has(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap w-20">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            card.type === 'augment'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {card.type === 'augment' ? 'Augment' : 'Windsurf'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap w-36">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {card.code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(card.code)}
                              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="复制卡密"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap w-40">
                          <div className="text-sm text-gray-700 truncate" title={card.account || '未知'}>
                            {card.account || '未知'}
                          </div>
                        </td>
                        <td className="px-3 py-3 w-64">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={card.content}>
                            {card.content}
                          </div>
                          {card.usedByIp && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              IP: {card.usedByIp}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap w-20">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            card.used
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {card.used ? '已用完' : '可使用'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap w-20">
                          <button
                            onClick={() => handleUpdateSoldStatus(card.id, card.soldStatus === 'sold' ? 'unsold' : 'sold')}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition cursor-pointer ${
                              card.soldStatus === 'sold'
                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                            title="点击切换售卖状态"
                          >
                            {card.soldStatus === 'sold' ? '已售' : '未售'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 w-24 text-center">
                          {card.usedCount}/{card.maxUses}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 w-36">
                          {new Date(card.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm w-24">
                          <div className="flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => copyToClipboard(card.code)}
                              className="text-indigo-600 hover:text-indigo-900 transition"
                              title="复制卡密"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyToClipboard(generateShareUrl(card.code))}
                              className="text-blue-600 hover:text-blue-900 transition"
                              title="复制链接"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSyncAccount(card.id)}
                              className="text-green-600 hover:text-green-900 transition"
                              title="同步账号"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="text-red-600 hover:text-red-900 transition"
                              title="删除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 分页控件 */}
              {filteredCards.length > 0 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 px-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                      共 <span className="font-medium">{filteredCards.length}</span> 条记录，
                      第 <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span> 页
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1); // 重置到第一页
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value={10}>10条/页</option>
                      <option value={20}>20条/页</option>
                      <option value={50}>50条/页</option>
                      <option value={100}>100条/页</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      首页
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      下一页
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      末页
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          ) : currentPage === 'statistics' ? (
            /* 兑换统计页面 */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  兑换统计信息
                </h2>
                <p className="text-sm text-gray-500 mt-1">查看所有卡密的兑换记录和统计数据</p>
              </div>

              <div className="p-6">
                {/* 统计概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">总兑换次数</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalUses}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">已兑换卡密</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stats.used}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">未兑换卡密</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{stats.unused}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">兑换率</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {stats.total > 0 ? ((stats.used / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                {/* 兑换记录列表 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">最近兑换记录</h3>
                  {cards
                    .filter(card => card.usedCount > 0)
                    .sort((a, b) => {
                      const aLastUsed = a.usedAt && a.usedAt.length > 0 ? new Date(a.usedAt[a.usedAt.length - 1]).getTime() : 0;
                      const bLastUsed = b.usedAt && b.usedAt.length > 0 ? new Date(b.usedAt[b.usedAt.length - 1]).getTime() : 0;
                      return bLastUsed - aLastUsed;
                    })
                    .slice(0, 20)
                    .map((card) => (
                      <div key={card.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                card.type === 'augment'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {card.type === 'augment' ? 'Augment' : 'Windsurf'}
                              </span>
                              <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-300">
                                {card.code}
                              </code>
                              <span className="text-xs text-gray-500">
                                已使用 {card.usedCount} / {card.maxUses} 次
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">兑换内容：</span>
                              <span className="ml-1">{card.content.substring(0, 100)}{card.content.length > 100 ? '...' : ''}</span>
                            </div>
                            {card.usedAt && Array.isArray(card.usedAt) && card.usedAt.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-700">兑换时间记录：</p>
                                <div className="flex flex-wrap gap-2">
                                  {card.usedAt.map((time: string, index: number) => (
                                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-300 text-gray-600">
                                      第{index + 1}次：{new Date(time).toLocaleString('zh-CN')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {cards.filter(card => card.usedCount > 0).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>暂无兑换记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentPage === 'settings' ? (
            /* 系统设置页面 */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  系统设置
                </h2>
                <p className="text-sm text-gray-500 mt-1">配置系统参数和前台显示内容</p>
              </div>

              <div className="p-6">
                <form onSubmit={handleSaveConfig} className="max-w-2xl">
                  <div className="space-y-6">
                    {/* 购买链接设置 */}
                    <div>
                      <label htmlFor="purchaseUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        购买链接
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        设置前台页面的购买链接（咸鱼、淘宝等），留空则不显示购买按钮
                      </p>
                      <input
                        type="url"
                        id="purchaseUrl"
                        value={purchaseUrl}
                        onChange={(e) => setPurchaseUrl(e.target.value)}
                        placeholder="https://your-purchase-link.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        示例：https://m.tb.cn/h.xxxxx 或 https://your-shop-link.com
                      </p>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex items-center gap-4">
                      <button
                        type="submit"
                        disabled={configLoading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {configLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            保存中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            保存设置
                          </>
                        )}
                      </button>
                      {configMessage && (
                        <span className={`text-sm ${configMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                          {configMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

