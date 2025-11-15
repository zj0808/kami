import { NextRequest, NextResponse } from 'next/server';
import { syncCardAccount } from '@/lib/db';
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

// 同步账号信息
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '缺少卡密ID',
      }, { status: 400, headers: corsHeaders() });
    }

    const result = await syncCardAccount(id);

    if (!result) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '卡密不存在或同步失败',
      }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: '同步成功',
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('同步账号错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

