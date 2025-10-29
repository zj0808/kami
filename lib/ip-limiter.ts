import { kv } from '@vercel/kv';
import { IpAttempt } from './types';

const IP_ATTEMPTS_KEY = 'ip:attempts:all'; // Redis key for storing IP attempts
const MAX_ATTEMPTS_PER_HOUR = 10; // 每小时最多尝试10次
const BLOCK_DURATION = 60 * 60 * 1000; // 1小时

// 读取IP尝试记录
async function getIpAttempts(): Promise<IpAttempt[]> {
  try {
    const attempts = await kv.get<IpAttempt[]>(IP_ATTEMPTS_KEY);
    return attempts || [];
  } catch (error) {
    console.error('读取IP尝试记录失败:', error);
    return [];
  }
}

// 保存IP尝试记录
async function saveIpAttempts(attempts: IpAttempt[]): Promise<void> {
  try {
    await kv.set(IP_ATTEMPTS_KEY, attempts);
  } catch (error) {
    console.error('保存IP尝试记录失败:', error);
  }
}

// 清理过期记录
function cleanExpiredAttempts(attempts: IpAttempt[]): IpAttempt[] {
  const now = Date.now();
  return attempts.filter((attempt) => {
    const lastAttemptTime = new Date(attempt.lastAttempt).getTime();
    return now - lastAttemptTime < BLOCK_DURATION;
  });
}

// 检查IP是否被限制
export async function checkIpLimit(ip: string): Promise<{ allowed: boolean; message?: string }> {
  let attempts = await getIpAttempts();
  attempts = cleanExpiredAttempts(attempts);

  const ipAttempt = attempts.find((a) => a.ip === ip);

  if (!ipAttempt) {
    return { allowed: true };
  }

  if (ipAttempt.attempts >= MAX_ATTEMPTS_PER_HOUR) {
    const lastAttemptTime = new Date(ipAttempt.lastAttempt).getTime();
    const timeLeft = Math.ceil((BLOCK_DURATION - (Date.now() - lastAttemptTime)) / 1000 / 60);
    return {
      allowed: false,
      message: `尝试次数过多，请在 ${timeLeft} 分钟后再试`,
    };
  }

  return { allowed: true };
}

// 记录IP尝试
export async function recordIpAttempt(ip: string): Promise<void> {
  let attempts = await getIpAttempts();
  attempts = cleanExpiredAttempts(attempts);

  const existingIndex = attempts.findIndex((a) => a.ip === ip);

  if (existingIndex >= 0) {
    attempts[existingIndex].attempts += 1;
    attempts[existingIndex].lastAttempt = new Date().toISOString();
  } else {
    attempts.push({
      ip,
      attempts: 1,
      lastAttempt: new Date().toISOString(),
    });
  }

  await saveIpAttempts(attempts);
}

// 获取客户端IP
export function getClientIp(request: Request): string {
  // 尝试从各种header中获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 如果都没有，返回一个默认值
  return 'unknown';
}

