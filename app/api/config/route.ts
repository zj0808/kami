import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.json');

// 默认配置
const DEFAULT_CONFIG = {
  purchaseUrl: '',
};

// 确保配置文件存在
async function ensureConfigFile() {
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    const dataDir = path.dirname(CONFIG_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

// 读取配置
async function readConfig() {
  await ensureConfigFile();
  const data = await fs.readFile(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

// 写入配置
async function writeConfig(config: any) {
  await ensureConfigFile();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
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
    const config = await readConfig();
    config.purchaseUrl = purchaseUrl || '';
    await writeConfig(config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}

