import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CONFIG_KEY = 'config:system'; // Redis key for system config

// 默认配置
const DEFAULT_CONFIG = {
  purchaseUrl: '',
};

// 读取配置
async function readConfig() {
  const config = await kv.get<typeof DEFAULT_CONFIG>(CONFIG_KEY);
  return config || DEFAULT_CONFIG;
}

// 写入配置
async function writeConfig(config: typeof DEFAULT_CONFIG) {
  await kv.set(CONFIG_KEY, config);
}

// GET - 获取配置
export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('读取配置失败:', error);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

// POST - 更新配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, purchaseUrl } = body;

    // 验证管理员密码
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 更新配置
    const config = {
      purchaseUrl: purchaseUrl || '',
    };
    await writeConfig(config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}

