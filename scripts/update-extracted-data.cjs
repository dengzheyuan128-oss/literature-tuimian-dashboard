/**
 * 更新提取成功的院校数据
 * 基于WebFetch批量提取的结果
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = require(dataPath);

// 提取成功的数据
const extractedData = {
  '北京大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学、中国民间文学',
    examForm: '科研论文考核(30分)+面试(70分)',
    englishRequirement: 'CET-4≥600分或CET-6≥426分或TOEFL≥90分或IELTS≥6.0',
    applicationPeriod: '2025年9月1日起',
    deadline: '2025年9月7日16:00',
    dataVerified: true
  },
  '武汉大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学、创意写作、国际中文教育',
    examForm: '材料审核+综合面试',
    englishRequirement: 'CET-6≥425分或IELTS≥6.5分或TOEFL≥90分',
    applicationPeriod: '2025年9月5日-9月10日',
    deadline: '2025年9月20日24:00',
    dataVerified: true
  },
  '四川大学': {
    specialty: '中国语言文学、新闻传播学、艺术学理论等全部招生专业',
    examForm: '线下综合面试',
    englishRequirement: '未明确要求',
    applicationPeriod: '通知发布后即可报名',
    deadline: '2025年9月8日14:00',
    dataVerified: true
  },
  '中山大学': {
    specialty: '国际中文教育',
    examForm: '面试为主',
    englishRequirement: 'CET-4/6成绩证明',
    applicationPeriod: '2025年9月27日前',
    deadline: '2025年9月27日08:00',
    dataVerified: true
  },
  '北京师范大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古代文学、中国现当代文学、比较文学与世界文学、中国民间文学、儿童文学、中国创意写作等16个方向',
    examForm: '现场面试(≥180/300分合格)',
    englishRequirement: 'CET-4/6或TOEFL或IELTS',
    applicationPeriod: '2025年9月5日起',
    deadline: '2025年9月11日23:59:59',
    dataVerified: true
  },
  '兰州大学': {
    specialty: '中国语言文学、艺术学(学术)、国际中文教育(专业)',
    examForm: '视频面试(3-5人专家组)',
    englishRequirement: 'CET-6≥425分或IELTS≥6.0分或TOEFL≥90分(直博生)',
    applicationPeriod: '推免系统开通前预报名',
    deadline: '以教育部推免系统为准',
    dataVerified: true
  },
  '湖南师范大学': {
    specialty: '中国语言文学一级学科12个学硕点+3个专硕点',
    examForm: '面试为主(笔试权重≤50%)',
    englishRequirement: '面试考查外语听说能力',
    applicationPeriod: '预报名9月6日-15日，正式9月22日',
    deadline: '2025年10月15日',
    dataVerified: true
  },
  '厦门大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学',
    examForm: '综合评估考核',
    englishRequirement: 'CET-6≥425分或CET-4≥500分或TOEFL/IELTS≥60%总分',
    applicationPeriod: '2025年7月1日-10日',
    deadline: '2025年7月10日',
    dataVerified: true
  },
  '山东大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学(含创意写作)、比较文学与世界文学',
    examForm: '现场面试(自我介绍+回答问题)',
    englishRequirement: '需提供外语水平证明',
    applicationPeriod: '2025年9月1日起',
    deadline: '以学校预报名通知为准',
    dataVerified: true
  },
  '上海交通大学': {
    specialty: '中文系、历史系、哲学系、汉语国际教育中心、艺术教育中心相关专业',
    examForm: '面试(复试)',
    englishRequirement: 'CET-6≥425分或TOEFL≥90分或IELTS≥6.0分',
    applicationPeriod: '2025年9月22日9:00起',
    deadline: '2025年9月22日',
    dataVerified: true
  },
  '重庆大学': {
    specialty: '中国语言文学(学术博士/硕士)',
    examForm: '材料审核+复试',
    englishRequirement: 'CET-4/6或TOEFL或IELTS成绩',
    applicationPeriod: '2025年8月9日起',
    deadline: '2025年9月5日24:00',
    dataVerified: true
  },
  '中国海洋大学': {
    specialty: '全部可招收应届生的学科专业',
    examForm: '待定(后续开展复试)',
    englishRequirement: '需提供外语水平证明',
    applicationPeriod: '2025年7月18日起',
    deadline: '2025年9月14日24:00',
    dataVerified: true
  },
  '华中师范大学': {
    specialty: '各专业硕士研究生',
    examForm: '待定',
    englishRequirement: '待定',
    applicationPeriod: '2025年9月5日起',
    deadline: '2025年9月14日',
    dataVerified: false
  },
  '吉林大学': {
    specialty: '中国语言文学、新闻学、传播学、广播电视艺术学、国际语言相关专业',
    examForm: '线下面试(专业+综合+外语听说)',
    englishRequirement: '外语听说能力测试',
    applicationPeriod: '2025年9月12日9:00起',
    deadline: '2025年9月14日9:00',
    dataVerified: true
  },
  '湖南大学': {
    specialty: '应用语言学、比较文学与世界文学、文艺学、汉语言文字学、中国古代文学、中国现当代文学、中国古典文献学、国际中文教育、学科教学(语文)',
    examForm: '现场复试(外语+专业+综合，≥20分钟/人)',
    englishRequirement: 'CET-4/6或TOEFL或IELTS成绩',
    applicationPeriod: '2025年7月25日起',
    deadline: '2025年9月12日14:00',
    dataVerified: true
  },
  '中央民族大学': {
    specialty: '文艺学、汉语言文字学、中国古代文学、中国现当代文学',
    examForm: '综合面试(50%)+专业笔试(50%)',
    englishRequirement: 'CET-6通过(英语考生)',
    applicationPeriod: '2025年9月17日0时起',
    deadline: '2025年9月21日17:00',
    dataVerified: true
  },
  '东南大学': {
    specialty: '哲学、中国语言文学、旅游学、公共管理、医学人文学、社会学、历史学等',
    examForm: '材料审核(+公开答辩)',
    englishRequirement: 'CET-4≥520分或CET-6≥430分或TOEFL≥100分或IELTS≥7.0分',
    applicationPeriod: '2025年8月29日起',
    deadline: '2025年9月1日(报名)，9月2日(材料)',
    dataVerified: true
  },
  '东北师范大学': {
    specialty: '全部接收推免的学科专业',
    examForm: '由各院部自行通知',
    englishRequirement: '需提供外语水平证明材料',
    applicationPeriod: '2025年9月8日起',
    deadline: '以系统公布为准',
    dataVerified: false
  },
  '陕西师范大学': {
    specialty: '全日制学术学位、专业学位、本研衔接师范生公费教育',
    examForm: '面试为主',
    englishRequirement: '待定',
    applicationPeriod: '预报名9月19日前，正式9月22日9:00',
    deadline: '2025年10月10日前',
    dataVerified: true
  },
  '苏州大学': {
    specialty: '全日制硕士全部专业',
    examForm: '面试(综合素质+外语+专业)',
    englishRequirement: '由各单位自定',
    applicationPeriod: '推免系统开通后',
    deadline: '以系统为准',
    dataVerified: false
  },
  '郑州大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学、国际中文教育',
    examForm: '线上面试(英语口语+专业知识)',
    englishRequirement: 'CET-4/6或TOEFL或IELTS或PETS成绩',
    applicationPeriod: '2024年9月6日起',
    deadline: '2024年9月19日9:00前',
    dataVerified: false // 2024年数据
  },
  '西北大学': {
    specialty: '除MBA/MPA外全部专业',
    examForm: '材料审核+复试',
    englishRequirement: 'CET-4/6或TOEFL或IELTS或PETS成绩',
    applicationPeriod: '2025年9月1日起',
    deadline: '2025年9月18日',
    dataVerified: true
  },
  '广西大学': {
    specialty: '全日制学硕/专硕全部专业',
    examForm: '待定',
    englishRequirement: '待定',
    applicationPeriod: '2025年7月18日起',
    deadline: '2025年9月20日',
    dataVerified: true
  },
  '新疆大学': {
    specialty: '除法律非全日制及管理类专业学位外全部硕士专业',
    examForm: '笔试+面试',
    englishRequirement: 'CET-4/6成绩单',
    applicationPeriod: '意向报名即日起，正式9月22日',
    deadline: '2025年10月19日',
    dataVerified: true
  },
  '天津大学': {
    specialty: '以推免系统公布为准',
    examForm: '遴选考核(具体待通知)',
    englishRequirement: '待定',
    applicationPeriod: '9月22日前校内系统报名',
    deadline: '2025年10月20日',
    dataVerified: false
  },
  '中央财经大学': {
    specialty: '中国语言文学、新闻传播学、艺术学理论、新闻与传播、美术与书法',
    examForm: '综合面试+外语听说测试',
    englishRequirement: 'CET-4/6或其他英语成绩证明',
    applicationPeriod: '系统开放日起',
    deadline: '2025年9月14日17:00',
    dataVerified: true
  },
  '江南大学': {
    specialty: '教育学、教育技术学、中国语言文学、艺术学、学科教学(语文/数学/音乐)、现代教育技术、小学教育、心理健康教育、音乐、戏剧与影视',
    examForm: '线下面试(专业+综合+外语听说)',
    englishRequirement: '待定',
    applicationPeriod: '即日起',
    deadline: '2025年9月22日',
    dataVerified: true
  },
  '北京语言大学': {
    specialty: '以2026年硕士招生专业目录为准',
    examForm: '待定(9月16-21日复试)',
    englishRequirement: '较高外语水平(需提供成绩证明)',
    applicationPeriod: '2025年9月4日10:00起',
    deadline: '2025年9月12日9:00',
    dataVerified: true
  },
  '河南大学': {
    specialty: '应用经济学、民族学、中国语言文学、考古学、中国史、地理学等',
    examForm: '线上线下结合',
    englishRequirement: 'CET-4≥425分',
    applicationPeriod: '2025年9月22日9:00起',
    deadline: '以推免系统为准',
    dataVerified: true
  },
  '河北师范大学': {
    specialty: '文艺学、语言学及应用语言学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学、国际中文教育、学科教学(语文)、课程与教学论',
    examForm: '由各学科确定',
    englishRequirement: '待定',
    applicationPeriod: '复试前系统报名',
    deadline: '第一批9月30日，其他10月15日',
    dataVerified: true
  },
  '黑龙江大学': {
    specialty: '28个培养单位131个专业',
    examForm: '面试',
    englishRequirement: 'CET-4≥425分或IELTS≥5.5分或TOEFL≥80分',
    applicationPeriod: '推免系统开通后',
    deadline: '2025年10月20日',
    dataVerified: true
  },
  '山西大学': {
    specialty: '文艺学、汉语言文字学、中国古典文献学、中国古代文学、中国现当代文学、比较文学与世界文学、中国民间文学、国际中文教育、艺术学理论',
    examForm: '线下面试(外语+学术+思政)',
    englishRequirement: 'CET-4/6或其他等级证书',
    applicationPeriod: '2025年9月16日8:00起',
    deadline: '2025年9月20日17:00',
    dataVerified: true
  },
  '西南交通大学': {
    specialty: '中国语言文学、新闻传播学、新闻与传播',
    examForm: '待定',
    englishRequirement: '待定',
    applicationPeriod: '2025年9月11日起',
    deadline: '2025年9月17日10:00',
    dataVerified: true
  },
  '中国矿业大学': {
    specialty: '全部招生专业(以系统为准)',
    examForm: '面试为主',
    englishRequirement: '待定',
    applicationPeriod: '预报名2025年9月18日前',
    deadline: '2025年9月18日',
    dataVerified: true
  }
};

// 更新函数
function updateSchool(school, updates) {
  if (!school.programs || school.programs.length === 0) return false;

  const program = school.programs[0];
  if (updates.specialty) {
    program.specialty = updates.specialty;
  }

  if (!program.notices || program.notices.length === 0) return false;

  const notice = program.notices[0];
  if (updates.examForm) notice.examForm = updates.examForm;
  if (updates.englishRequirement) notice.englishRequirement = updates.englishRequirement;
  if (updates.applicationPeriod) notice.applicationPeriod = updates.applicationPeriod;
  if (updates.deadline) notice.deadline = updates.deadline;
  if (updates.dataVerified !== undefined) notice.dataVerified = updates.dataVerified;

  return true;
}

// 执行更新
let updated = 0;
let failed = 0;

data.universities.forEach(school => {
  const updates = extractedData[school.name];
  if (updates) {
    if (updateSchool(school, updates)) {
      updated++;
      console.log(`✅ 更新: ${school.name}`);
    } else {
      failed++;
      console.log(`❌ 失败: ${school.name} (数据结构问题)`);
    }
  }
});

// 更新元数据
data.lastUpdated = new Date().toISOString().split('T')[0];

// 写入文件
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n=== 更新完成 ===');
console.log(`成功更新: ${updated} 所`);
console.log(`更新失败: ${failed} 所`);
console.log(`未匹配: ${data.universities.length - updated - failed} 所`);
