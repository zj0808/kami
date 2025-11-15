import { NextRequest, NextResponse } from 'next/server';
import { syncAllCardAccounts } from '@/lib/db';
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

// 批量同步所有账号信息
export async function POST(request: NextRequest) {
  try {
    const result = await syncAllCardAccounts();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: `成功同步 ${result.syncedCount} 个账号`,
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('批量同步账号错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

