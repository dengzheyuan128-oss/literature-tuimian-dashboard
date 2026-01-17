# 数据结构定义（冻结）

> 状态：**已冻结** - 不得随意修改

## universities.json 结构

```typescript
{
  "universities": [
    {
      "id": number,
      "name": string,
      "tier": "第一梯队" | "第二梯队" | "第三梯队" | "第四梯队" | "第五梯队",
      "disciplineGrade": "A+" | "A" | "A-" | "B+" | "B" | "B-" | null,
      "programs": [
        {
          "id": string,  // 格式: "{schoolId}-{programIndex}"
          "name": string,
          "notices": [
            {
              "id": string,  // 格式: "{programId}-{noticeIndex}"
              "year": number,
              "title": string,
              "url": string,
              "linkGrade": "A" | "B" | "C" | "D",
              "sourceType": "official" | "list_page" | "third_party" | "homepage"
            }
          ]
        }
      ]
    }
  ]
}
```

## 字段说明

### University 层级

- **id**: 院校唯一标识（数字）
- **name**: 院校全称
- **tier**: 五梯队分级（见分级规则文档）
- **disciplineGrade**: 教育部学科评估等级（可为null）

### Program 层级

- **id**: 项目ID（格式固定）
- **name**: 项目名称（如"中国语言文学"）

### Notice 层级

- **id**: 通知ID（格式固定）
- **year**: 招生年份（如2026）
- **title**: 通知标题
- **url**: 通知链接
- **linkGrade**: 链接质量等级（见等级规则文档）
- **sourceType**: 来源类型

## 修改规则

1. **禁止修改字段名**
2. **禁止修改ID格式**
3. **禁止删除必填字段**
4. 如需新增字段，必须先更新本文档并获得确认

## 数据完整性约束

- 每个university必须有至少1个program
- 每个program必须有至少1个notice
- 所有ID必须唯一
- tier和linkGrade必须使用枚举值
