// 卡密数据类型定义
export interface CardCode {
  id: string;
  code: string;
  content: string;
  used: boolean;
  usedAt?: string;
  usedByIp?: string;
  createdAt: string;
  maxUses: number; // 最大使用次数
  usedCount: number; // 已使用次数
  useHistory?: Array<{ // 使用历史
    ip: string;
    usedAt: string;
  }>;
}

export interface IpAttempt {
  ip: string;
  attempts: number;
  lastAttempt: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

