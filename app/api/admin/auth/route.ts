import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '请输入密码',
      }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '验证成功',
      });
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '密码错误',
      }, { status: 401 });
    }
  } catch (error) {
    console.error('密码验证错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500 });
  }
}

