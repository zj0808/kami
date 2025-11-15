import { NextRequest, NextResponse } from 'next/server';
import { updateCardSoldStatus } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

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

// 更新售卖状态
export async function PUT(request: NextRequest) {
  try {
    const { id, soldStatus } = await request.json();

    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '缺少卡密ID',
      }, { status: 400, headers: corsHeaders() });
    }

    if (soldStatus !== 'sold' && soldStatus !== 'unsold') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '无效的售卖状态',
      }, { status: 400, headers: corsHeaders() });
    }

    const updated = await updateCardSoldStatus(id, soldStatus);

    if (!updated) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '卡密不存在',
      }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '更新成功',
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('更新售卖状态错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

