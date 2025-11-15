# 卡密类型功能说明

## 概述

系统现在支持两种卡密类型：
- **Augment** - Augment AI 助手的卡密
- **Windsurf** - Windsurf 编辑器的卡密

## 功能特性

### 1. 创建卡密时选择类型
在后台管理页面创建卡密时，可以选择卡密类型：
- 点击 "Augment" 或 "Windsurf" 按钮选择类型
- 默认类型为 Augment

### 2. 统计数据
在后台首页的统计卡片中可以看到：
- 总卡密数（包含 Augment 和 Windsurf 的数量）
- 已兑换/未兑换数量
- 兑换次数统计

### 3. 筛选功能
在卡密列表中可以按类型筛选：
- **全部** - 显示所有类型的卡密
- **Augment** - 只显示 Augment 类型的卡密
- **Windsurf** - 只显示 Windsurf 类型的卡密

同时支持按状态筛选：
- **全部** - 显示所有状态
- **未使用** - 只显示未使用的卡密
- **已使用** - 只显示已使用的卡密

### 4. 表格显示
卡密列表表格中新增"类型"列，清晰显示每个卡密的类型：
- Augment 类型显示为蓝色标签
- Windsurf 类型显示为青色标签

### 5. 导出功能
导出的 TXT 和 CSV 文件中都包含卡密类型信息：
- TXT 格式：每个卡密都会显示类型
- CSV 格式：第一列为类型列

## 数据迁移

如果您已有旧的卡密数据，需要运行迁移脚本为它们添加类型字段：

```bash
npx tsx scripts/migrate-card-types.ts
```

迁移脚本会：
1. 读取所有现有卡密
2. 为没有类型字段的卡密添加默认类型（augment）
3. 保存更新后的数据

## API 变更

### 创建卡密 API
POST `/api/admin/cards`

新增参数：
```json
{
  "content": "卡密内容",
  "type": "augment" | "windsurf",  // 新增：卡密类型
  "maxUses": 3,
  "batchCount": 1,
  "customCode": "可选"
}
```

### 卡密数据结构
```typescript
interface CardCode {
  id: string;
  code: string;
  content: string;
  used: boolean;
  usedAt?: string;
  usedByIp?: string;
  createdAt: string;
  maxUses: number;
  usedCount: number;
  type: 'augment' | 'windsurf';  // 新增字段
  useHistory?: Array<{
    ip: string;
    usedAt: string;
  }>;
}
```

## 使用建议

1. **创建卡密前先选择类型** - 确保为正确的产品创建卡密
2. **使用筛选功能** - 快速找到特定类型的卡密
3. **定期导出备份** - 导出的文件包含完整的类型信息
4. **批量操作** - 可以按类型筛选后进行批量复制或删除

## 注意事项

- 卡密类型一旦创建后无法修改
- 建议为不同类型的卡密使用不同的内容格式
- 导出时会包含类型信息，便于后续管理

