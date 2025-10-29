import { kv } from '@vercel/kv';
import { CardCode } from './types';

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

// 创建新卡密
export async function createCard(code: string, content: string, maxUses: number = 1): Promise<CardCode> {
  const cards = await getAllCards();
  const newCard: CardCode = {
    id: Date.now().toString(),
    code,
    content,
    used: false,
    createdAt: new Date().toISOString(),
    maxUses,
    usedCount: 0,
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
export async function createBatchCards(content: string, count: number, maxUses: number = 1): Promise<CardCode[]> {
  const cards = await getAllCards();
  const newCards: CardCode[] = [];

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
      useHistory: [],
    };
    newCards.push(newCard);
    cards.push(newCard);
  }

  await saveCards(cards);
  return newCards;
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

