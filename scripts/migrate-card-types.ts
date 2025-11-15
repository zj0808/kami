/**
 * 数据迁移脚本：为现有卡密添加类型字段
 * 运行方式: npx tsx scripts/migrate-card-types.ts
 */

import { kv } from '@vercel/kv';
import { CardCode } from '../lib/types';

const CARDS_KEY = 'cards:all';

async function migrateCardTypes() {
  console.log('开始迁移卡密类型...');

  try {
    // 获取所有卡密
    const cards = await kv.get<CardCode[]>(CARDS_KEY);

    if (!cards || cards.length === 0) {
      console.log('没有找到需要迁移的卡密');
      return;
    }

    console.log(`找到 ${cards.length} 个卡密`);

    // 为每个卡密添加类型字段（如果没有的话）
    let updatedCount = 0;
    const updatedCards = cards.map((card) => {
      if (!card.type) {
        updatedCount++;
        return {
          ...card,
          type: 'augment' as const, // 默认设置为 augment
        };
      }
      return card;
    });

    if (updatedCount > 0) {
      // 保存更新后的卡密
      await kv.set(CARDS_KEY, updatedCards);
      console.log(`✅ 成功迁移 ${updatedCount} 个卡密，添加了类型字段`);
    } else {
      console.log('所有卡密都已有类型字段，无需迁移');
    }

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
migrateCardTypes();

