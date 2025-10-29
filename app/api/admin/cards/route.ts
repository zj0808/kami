import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, createCard, deleteCard, generateRandomCode, createBatchCards } from '@/lib/db';
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

// 获取所有卡密
export async function GET() {
  try {
    const cards = await getAllCards();
    return NextResponse.json<ApiResponse>({
      success: true,
      data: cards,
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('获取卡密列表错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

// 创建新卡密（支持批量创建）
export async function POST(request: NextRequest) {
  try {
    const { content, customCode, maxUses = 1, batchCount = 1 } = await request.json();

    if (!content) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '请输入内容',
      }, { status: 400, headers: corsHeaders() });
    }

    // 批量创建
    if (batchCount > 1) {
      if (batchCount > 100) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: '单次最多创建100个卡密',
        }, { status: 400, headers: corsHeaders() });
      }

      const newCards = await createBatchCards(content, batchCount, maxUses);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: newCards,
        message: `成功创建 ${batchCount} 个卡密`,
      }, { headers: corsHeaders() });
    }

    // 单个创建
    const code = customCode || generateRandomCode();
    const newCard = await createCard(code, content, maxUses);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: newCard,
      message: '卡密创建成功',
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('创建卡密错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

// 删除卡密
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '缺少卡密ID',
      }, { status: 400, headers: corsHeaders() });
    }

    const deleted = await deleteCard(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '卡密不存在',
      }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '删除成功',
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('删除卡密错误:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误',
    }, { status: 500, headers: corsHeaders() });
  }
}

