// 数据完整性状态
export type DataStatus = 'COMPLETE' | 'PARTIAL' | 'PENDING_MANUAL';

// 通知类型
export type NoticeType = '夏令营' | '预推免' | '综合' | '未找到';

export interface University {
  id: number;
  name: string;
  tier: string;
  location?: string;
  is985?: boolean;
  is211?: boolean;
  disciplineGrade?: string;
  specialty: string;
  degreeType: string;
  duration?: string;
  examForm: string;
  englishRequirement: string;
  applicationPeriod: string;
  deadline: string;
  url: string;
  dataStatus: DataStatus;
  // Phase 2 新增字段
  dataVerified: boolean;       // 数据是否已核实
  noticeType?: NoticeType;     // 通知类型（夏令营/预推免）
  sourceChannel?: string;      // 来源渠道
}
