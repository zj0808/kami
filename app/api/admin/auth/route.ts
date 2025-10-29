import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '请输入密码',
      }, { status: 400, headers: corsHeaders() });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '验证成功',
      }, { headers: corsHeaders() });
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '密码错误',
      }, { status: 401, headers: corsHeaders() });
    }
  } catch (error) {
    console.error('密码验证错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

