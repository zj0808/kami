import { kv } from '@vercel/kv';
import { CardCode, CardType } from './types';

const CARDS_KEY = 'cards:all'; // Redis key for storing all cards

// 生成随机卡密码
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 读取所有卡密
export async function getAllCards(): Promise<CardCode[]> {
  const cards = await kv.get<CardCode[]>(CARDS_KEY);
  return cards || [];
}

// 保存所有卡密
export async function saveCards(cards: CardCode[]): Promise<void> {
  await kv.set(CARDS_KEY, cards);
}

// 根据卡密码查找
export async function findCardByCode(code: string): Promise<CardCode | undefined> {
  const cards = await getAllCards();
  return cards.find(card => card.code === code);
}

// 从内容中提取账号信息
function extractAccount(content: string, type: CardType): string {
  try {
    const data = JSON.parse(content);
    if (type === 'augment') {
      return data.email_note || '';
    } else if (type === 'windsurf') {
      return data.email || '';
    }
  } catch (e) {
    // 如果不是JSON格式，返回空字符串
  }
  return '';
}

// 创建新卡密
export async function createCard(code: string, content: string, maxUses: number = 1, type: CardType = 'augment'): Promise<CardCode> {
  const cards = await getAllCards();
  const account = extractAccount(content, type);
  const newCard: CardCode = {
    id: Date.now().toString(),
    code,
    content,
    used: false,
    createdAt: new Date().toISOString(),
    maxUses,
    usedCount: 0,
    type,
    account,
    soldStatus: 'unsold', // 默认未售
    useHistory: [],
  };
  cards.push(newCard);
  await saveCards(cards);
  return newCard;
}

// 标记卡密为已使用（支持多次使用）
export async function markCardAsUsed(code: string, ip?: string): Promise<boolean> {
  const cards = await getAllCards();
  const card = cards.find(c => c.code === code);

  if (!card) return false;

  // 检查是否还有剩余使用次数
  if (card.usedCount >= card.maxUses) {
    return false;
  }

  // 增加使用次数
  card.usedCount += 1;

  // 记录使用历史
  if (!card.useHistory) {
    card.useHistory = [];
  }
  card.useHistory.push({
    ip: ip || 'unknown',
    usedAt: new Date().toISOString(),
  });

  // 如果达到最大使用次数，标记为已使用
  if (card.usedCount >= card.maxUses) {
    card.used = true;
    card.usedAt = new Date().toISOString();
  }

  // 记录第一次使用的IP
  if (card.usedCount === 1 && ip) {
    card.usedByIp = ip;
  }

  await saveCards(cards);
  return true;
}

// 删除卡密
export async function deleteCard(id: string): Promise<boolean> {
  const cards = await getAllCards();
  const filteredCards = cards.filter(c => c.id !== id);
  if (filteredCards.length < cards.length) {
    await saveCards(filteredCards);
    return true;
  }
  return false;
}

// 批量创建卡密
export async function createBatchCards(content: string, count: number, maxUses: number = 1, type: CardType = 'augment'): Promise<CardCode[]> {
  const cards = await getAllCards();
  const newCards: CardCode[] = [];
  const account = extractAccount(content, type);

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const newCard: CardCode = {
      id: `${Date.now()}-${i}`,
      code,
      content,
      used: false,
      createdAt: new Date().toISOString(),
      maxUses,
      usedCount: 0,
      type,
      account,
      soldStatus: 'unsold', // 默认未售
      useHistory: [],
    };
    newCards.push(newCard);
    cards.push(newCard);
  }

  await saveCards(cards);
  return newCards;
}

// 更新售卖状态
export async function updateCardSoldStatus(id: string, soldStatus: 'sold' | 'unsold'): Promise<boolean> {
  const cards = await getAllCards();
  const card = cards.find(c => c.id === id);

  if (!card) return false;

  card.soldStatus = soldStatus;
  await saveCards(cards);
  return true;
}

// 同步账号信息（从内容中提取）
export async function syncCardAccount(id: string): Promise<{ account: string } | null> {
  const cards = await getAllCards();
  const card = cards.find(c => c.id === id);

  if (!card) return null;

  // 从内容中提取账号
  const account = extractAccount(card.content, card.type);
  card.account = account;

  await saveCards(cards);
  return { account };
}

// 批量同步所有账号信息
export async function syncAllCardAccounts(): Promise<{ syncedCount: number; cards: CardCode[] }> {
  const cards = await getAllCards();
  let syncedCount = 0;

  for (const card of cards) {
    const account = extractAccount(card.content, card.type);
    card.account = account;
    syncedCount++;
  }

  await saveCards(cards);
  return { syncedCount, cards };
}

// 生成随机卡密
export function generateRandomCode(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // 格式化为 XXXX-XXXX-XXXX
  return result.match(/.{1,4}/g)?.join('-') || result;
}

// 清空所有卡密数据
export async function clearAllCards(): Promise<void> {
  await kv.set(CARDS_KEY, []);
}
