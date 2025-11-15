import { NextRequest, NextResponse } from 'next/server';
import { clearAllCards } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 清空所有卡密数据
    await clearAllCards();

    return NextResponse.json({
      success: true,
      message: '所有数据已清空',
    });
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '清空数据失败',
      },
      { status: 500 }
    );
  }
}

