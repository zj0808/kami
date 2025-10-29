import { NextRequest, NextResponse } from 'next/server';
import { findCardByCode, markCardAsUsed } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { checkIpLimit, recordIpAttempt, getClientIp } from '@/lib/ip-limiter';

// 添加 CORS 头
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// 处理 OPTIONS 请求（预检请求）
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP
    const clientIp = getClientIp(request);

    // 检查IP限制
    const ipCheck = checkIpLimit(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: ipCheck.message || 'IP被限制',
      }, { status: 429, headers: corsHeaders() });
    }

    // 记录IP尝试
    recordIpAttempt(clientIp);

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '请输入卡密',
      }, { status: 400, headers: corsHeaders() });
    }

    const card = await findCardByCode(code);

    if (!card) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '卡密不存在',
      }, { status: 404, headers: corsHeaders() });
    }

    // 检查是否还有剩余使用次数
    if (card.usedCount >= card.maxUses) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该卡密已达到最大使用次数',
      }, { status: 400, headers: corsHeaders() });
    }

    // 标记为已使用，记录IP
    const success = await markCardAsUsed(code, clientIp);

    if (!success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '卡密使用失败',
      }, { status: 500, headers: corsHeaders() });
    }

    // 重新获取卡密信息，获取最新的使用次数
    const updatedCard = await findCardByCode(code);
    const remainingUses = updatedCard ? updatedCard.maxUses - updatedCard.usedCount : 0;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        content: card.content,
        remainingUses,
        maxUses: card.maxUses,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('验证卡密错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

