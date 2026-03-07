import { describe, expect, it } from 'vitest';

import type { University } from '@/types/university';

import {
  buildApprovedNoticeInsert,
  buildSubmissionExtractedPayload,
  buildSubmissionTitle,
  findBestProgramCardMatch,
} from '@/lib/submissionWorkflow';

const universities: University[] = [
  {
    id: 1,
    sourceCardId: 'card-1',
    name: '北京大学',
    tier: '985',
    specialty: '中国语言文学',
    degreeType: '学硕',
    examForm: '面试',
    englishRequirement: 'CET-6',
    applicationPeriod: '2026年6月',
    deadline: '2026年6月30日',
    url: 'https://example.com/pku',
    dataStatus: 'COMPLETE',
    dataVerified: true,
    noticeType: '夏令营',
  },
  {
    id: 2,
    sourceCardId: 'card-2',
    name: '复旦大学',
    tier: '985',
    specialty: '汉语言文字学',
    degreeType: '学硕',
    examForm: '面试',
    englishRequirement: 'CET-6',
    applicationPeriod: '2026年6月',
    deadline: '2026年6月25日',
    url: 'https://example.com/fudan',
    dataStatus: 'COMPLETE',
    dataVerified: true,
    noticeType: '夏令营',
  },
];

describe('submissionWorkflow', () => {
  it('normalizes extracted payload fields', () => {
    const payload = buildSubmissionExtractedPayload({
      name: '北京大学',
      specialty: '',
      degreeType: '学硕',
      applicationPeriod: '',
      deadline: '2026年6月30日',
      examForm: '面试',
      englishRequirement: '',
      noticeType: '夏令营',
    });

    expect(payload.programName).toBe('未注明');
    expect(payload.applicationPeriod).toBe('未注明');
    expect(payload.institutionName).toBe('北京大学');
  });

  it('finds the best matching program card', () => {
    const match = findBestProgramCardMatch(
      {
        institutionName: '北京大学',
        programName: '中国语言文学',
        degreeType: '学硕',
        applicationPeriod: '未注明',
        deadline: '未注明',
        examForm: '未注明',
        englishRequirement: '未注明',
        noticeType: '夏令营',
      },
      universities,
    );

    expect(match?.sourceCardId).toBe('card-1');
  });

  it('builds an approved notice payload', () => {
    const insert = buildApprovedNoticeInsert(
      {
        institutionName: '北京大学',
        programName: '中国语言文学',
        degreeType: '学硕',
        applicationPeriod: '2026年6月10日至6月30日',
        deadline: '2026年6月30日',
        examForm: '面试',
        englishRequirement: 'CET-6',
        noticeType: '夏令营',
      },
      'https://example.com/notice',
    );

    expect(insert.title).toBe(buildSubmissionTitle({
      institutionName: '北京大学',
      programName: '中国语言文学',
      degreeType: '学硕',
      applicationPeriod: '2026年6月10日至6月30日',
      deadline: '2026年6月30日',
      examForm: '面试',
      englishRequirement: 'CET-6',
      noticeType: '夏令营',
    }));
    expect(insert.stage).toBe('夏令营');
    expect(insert.review_status).toBe('approved');
    expect(insert.notice_url).toBe('https://example.com/notice');
  });
});
