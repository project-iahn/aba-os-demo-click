export type Role = 'admin' | 'therapist' | 'parent';

export interface Child {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  concern: string;
  diagnosis: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  status: 'active' | 'pending' | 'inactive';
  startDate: string;
  therapistId: string;
  lastSessionDate: string;
  trend: 'up' | 'down' | 'stable';
  notes: string;
  estimatedDevAge?: number; // 발달 추정 연령 (개월)
}

export interface Goal {
  id: string;
  childId: string;
  title: string;
  description: string;
  category: string;
  targetCriteria: string;
  createdAt: string;
  status: 'active' | 'mastered' | 'paused';
}

export interface SessionTrial {
  goalId: string;
  trials: number;
  successes: number;
  promptLevel: number; // 0-3 (0: 독립, 1: 언어촉진, 2: 부분신체, 3: 전체신체)
  problemBehaviorCount: number;
}

export interface Session {
  id: string;
  childId: string;
  therapistId: string;
  date: string;
  duration: number; // minutes
  notes: string;
  trials: SessionTrial[];
  createdAt: string;
}

export interface Report {
  id: string;
  childId: string;
  title: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  content: string;
  createdAt: string;
  createdBy: string;
  includedGoals: string[];
}

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  caseCount: number;
}

export interface CenterProfile {
  name: string;
  location: string;
  phone: string;
  email: string;
  establishedDate: string;
}

// Initial mock data
export const initialTherapists: Therapist[] = [
  { id: 'th1', name: '김민지', email: 'minji@abaos.kr', phone: '010-1234-5678', specialization: '언어/의사소통', caseCount: 5 },
  { id: 'th2', name: '이준혁', email: 'junhyuk@abaos.kr', phone: '010-2345-6789', specialization: '사회성/놀이', caseCount: 4 },
  { id: 'th3', name: '박서연', email: 'seoyeon@abaos.kr', phone: '010-3456-7890', specialization: '자조기술/일상생활', caseCount: 3 },
];

export const initialChildren: Child[] = [
  {
    id: 'c1',
    name: '김하늘',
    age: 5,
    birthDate: '2020-03-15',
    concern: '언어 발달 지연, 사회적 상호작용 어려움',
    diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '김영희',
    guardianPhone: '010-1111-2222',
    guardianRelation: '어머니',
    status: 'active',
    startDate: '2024-09-01',
    therapistId: 'th1',
    lastSessionDate: '2025-01-03',
    trend: 'up',
    notes: '최근 눈맞춤 빈도 증가, 단어 사용량 향상',
    estimatedDevAge: 42, // 3세 6개월 수준
  },
  {
    id: 'c2',
    name: '이서준',
    age: 4,
    birthDate: '2021-07-22',
    concern: '반복적 행동, 감각 민감성',
    diagnosis: '자폐 스펙트럼 장애 (ASD Level 2)',
    guardianName: '이민수',
    guardianPhone: '010-3333-4444',
    guardianRelation: '아버지',
    status: 'active',
    startDate: '2024-10-15',
    therapistId: 'th2',
    lastSessionDate: '2025-01-02',
    trend: 'stable',
    notes: '감각 조절 활동에 긍정적 반응',
    estimatedDevAge: 28, // 2세 4개월 수준
  },
  {
    id: 'c3',
    name: '박지우',
    age: 6,
    birthDate: '2019-11-08',
    concern: '또래 상호작용 어려움, 일상생활 자립',
    diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '박수현',
    guardianPhone: '010-5555-6666',
    guardianRelation: '어머니',
    status: 'active',
    startDate: '2024-06-01',
    therapistId: 'th3',
    lastSessionDate: '2024-12-28',
    trend: 'down',
    notes: '최근 세션 참여도 저하, 전환 활동에서 어려움',
    estimatedDevAge: 54, // 4세 6개월 수준
  },
];

export const initialGoals: Goal[] = [
  // 김하늘 goals - showing improvement
  { id: 'g1', childId: 'c1', title: '요청하기', description: '원하는 물건/활동을 언어로 요청하기', category: '의사소통', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-09-01', status: 'active' },
  { id: 'g2', childId: 'c1', title: '눈맞춤 유지', description: '대화 시 3초 이상 눈맞춤 유지하기', category: '사회성', targetCriteria: '10회 시도 중 8회 성공', createdAt: '2024-09-01', status: 'active' },
  { id: 'g3', childId: 'c1', title: '지시 따르기', description: '1단계 언어 지시 따르기', category: '수용언어', targetCriteria: '5회 연속 90% 이상 성공', createdAt: '2024-09-15', status: 'active' },
  
  // 이서준 goals - stable
  { id: 'g4', childId: 'c2', title: '차례 기다리기', description: '놀이 상황에서 차례 기다리기', category: '사회성', targetCriteria: '3분 이상 적절히 기다리기', createdAt: '2024-10-15', status: 'active' },
  { id: 'g5', childId: 'c2', title: '감각 조절', description: '다양한 촉감에 적응하기', category: '감각통합', targetCriteria: '새로운 촉감 5개 이상 수용', createdAt: '2024-10-15', status: 'active' },
  { id: 'g6', childId: 'c2', title: '모방하기', description: '간단한 동작 모방하기', category: '놀이', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-11-01', status: 'active' },
  
  // 박지우 goals - showing regression
  { id: 'g7', childId: 'c3', title: '또래 인사하기', description: '또래에게 먼저 인사하기', category: '사회성', targetCriteria: '하루 3회 이상 자발적 인사', createdAt: '2024-06-01', status: 'active' },
  { id: 'g8', childId: 'c3', title: '혼자 양치하기', description: '감독 하에 혼자 양치하기', category: '자조기술', targetCriteria: '모든 단계 독립적 수행', createdAt: '2024-06-01', status: 'active' },
  { id: 'g9', childId: 'c3', title: '전환 적응', description: '활동 전환 시 적절히 대처하기', category: '행동', targetCriteria: '문제행동 없이 전환 5회 연속', createdAt: '2024-07-01', status: 'active' },
];

export const initialSessions: Session[] = [
  // 김하늘 sessions - showing clear improvement trend (70% -> 90%)
  { id: 's1', childId: 'c1', therapistId: 'th1', date: '2024-12-20', duration: 50, notes: '오늘 세션에서 하늘이가 "과자 줘"라고 자발적으로 요청했습니다.', trials: [
    { goalId: 'g1', trials: 10, successes: 7, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 5, promptLevel: 2, problemBehaviorCount: 1 },
    { goalId: 'g3', trials: 10, successes: 7, promptLevel: 2, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-20T10:00:00' },
  { id: 's2', childId: 'c1', therapistId: 'th1', date: '2024-12-23', duration: 50, notes: '눈맞춤 유지 시간이 조금 늘어났습니다. 칭찬 스티커에 좋은 반응.', trials: [
    { goalId: 'g1', trials: 10, successes: 7, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 6, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g3', trials: 10, successes: 8, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-23T10:00:00' },
  { id: 's3', childId: 'c1', therapistId: 'th1', date: '2024-12-26', duration: 50, notes: '요청하기 목표에서 발전을 보임.', trials: [
    { goalId: 'g1', trials: 10, successes: 8, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g3', trials: 10, successes: 8, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-26T10:00:00' },
  { id: 's4', childId: 'c1', therapistId: 'th1', date: '2024-12-28', duration: 50, notes: '요청하기 목표에서 큰 발전을 보임. 새로운 단어 2개 추가.', trials: [
    { goalId: 'g1', trials: 12, successes: 10, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g3', trials: 10, successes: 9, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-28T10:00:00' },
  { id: 's5', childId: 'c1', therapistId: 'th1', date: '2024-12-30', duration: 50, notes: '전반적으로 안정적인 세션. 집중력 향상됨.', trials: [
    { goalId: 'g1', trials: 10, successes: 9, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 8, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g3', trials: 10, successes: 10, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-30T10:00:00' },
  { id: 's6', childId: 'c1', therapistId: 'th1', date: '2025-01-03', duration: 50, notes: '새해 첫 세션. 하늘이가 기분 좋게 참여함. 독립 수행 수준 도달.', trials: [
    { goalId: 'g1', trials: 10, successes: 9, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g2', trials: 10, successes: 9, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g3', trials: 10, successes: 10, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-03T10:00:00' },
  
  // 이서준 sessions - stable trend
  { id: 's7', childId: 'c2', therapistId: 'th2', date: '2024-12-19', duration: 45, notes: '서준이가 차례 기다리기에서 진전을 보임.', trials: [
    { goalId: 'g4', trials: 8, successes: 5, promptLevel: 2, problemBehaviorCount: 2 },
    { goalId: 'g5', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g6', trials: 10, successes: 6, promptLevel: 2, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-19T14:00:00' },
  { id: 's8', childId: 'c2', therapistId: 'th2', date: '2024-12-23', duration: 45, notes: '감각 활동에 적극적으로 참여.', trials: [
    { goalId: 'g4', trials: 8, successes: 5, promptLevel: 2, problemBehaviorCount: 1 },
    { goalId: 'g5', trials: 8, successes: 5, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g6', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-23T14:00:00' },
  { id: 's9', childId: 'c2', therapistId: 'th2', date: '2024-12-26', duration: 45, notes: '새로운 촉감 재료 도입. 초기 거부 후 수용.', trials: [
    { goalId: 'g4', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g5', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g6', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-26T14:00:00' },
  { id: 's10', childId: 'c2', therapistId: 'th2', date: '2024-12-28', duration: 45, notes: '모방 능력 향상. 연속 동작 가능해짐.', trials: [
    { goalId: 'g4', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g5', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g6', trials: 10, successes: 8, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-28T14:00:00' },
  { id: 's11', childId: 'c2', therapistId: 'th2', date: '2024-12-30', duration: 45, notes: '전반적으로 안정적인 세션.', trials: [
    { goalId: 'g4', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g5', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g6', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-30T14:00:00' },
  { id: 's12', childId: 'c2', therapistId: 'th2', date: '2025-01-02', duration: 45, notes: '새해 첫 세션. 안정적인 수행.', trials: [
    { goalId: 'g4', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g5', trials: 10, successes: 7, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g6', trials: 10, successes: 8, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-02T14:00:00' },
  
  // 박지우 sessions - showing regression trend (75% -> 50%)
  { id: 's13', childId: 'c3', therapistId: 'th3', date: '2024-12-14', duration: 50, notes: '지우가 또래 상호작용에서 진전을 보임.', trials: [
    { goalId: 'g7', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g8', trials: 5, successes: 4, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g9', trials: 6, successes: 5, promptLevel: 1, problemBehaviorCount: 1 },
  ], createdAt: '2024-12-14T11:00:00' },
  { id: 's14', childId: 'c3', therapistId: 'th3', date: '2024-12-18', duration: 50, notes: '양치하기 독립성 증가. 전환 적응 양호.', trials: [
    { goalId: 'g7', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g8', trials: 5, successes: 4, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g9', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 1 },
  ], createdAt: '2024-12-18T11:00:00' },
  { id: 's15', childId: 'c3', therapistId: 'th3', date: '2024-12-21', duration: 50, notes: '전환 활동에서 다소 어려움 발생.', trials: [
    { goalId: 'g7', trials: 6, successes: 4, promptLevel: 2, problemBehaviorCount: 1 },
    { goalId: 'g8', trials: 5, successes: 4, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g9', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 3 },
  ], createdAt: '2024-12-21T11:00:00' },
  { id: 's16', childId: 'c3', therapistId: 'th3', date: '2024-12-24', duration: 50, notes: '전환 활동에서 어려움이 지속됨.', trials: [
    { goalId: 'g7', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 2 },
    { goalId: 'g8', trials: 5, successes: 4, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g9', trials: 8, successes: 3, promptLevel: 3, problemBehaviorCount: 4 },
  ], createdAt: '2024-12-24T11:00:00' },
  { id: 's17', childId: 'c3', therapistId: 'th3', date: '2024-12-26', duration: 50, notes: '성공률 저하. 문제행동 증가 관찰됨.', trials: [
    { goalId: 'g7', trials: 6, successes: 3, promptLevel: 3, problemBehaviorCount: 2 },
    { goalId: 'g8', trials: 5, successes: 3, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g9', trials: 8, successes: 2, promptLevel: 3, problemBehaviorCount: 5 },
  ], createdAt: '2024-12-26T11:00:00' },
  { id: 's18', childId: 'c3', therapistId: 'th3', date: '2024-12-28', duration: 50, notes: '전환 전략 조정 필요. 문제행동 관리 필요.', trials: [
    { goalId: 'g7', trials: 6, successes: 3, promptLevel: 3, problemBehaviorCount: 2 },
    { goalId: 'g8', trials: 5, successes: 3, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g9', trials: 8, successes: 2, promptLevel: 3, problemBehaviorCount: 4 },
  ], createdAt: '2024-12-28T11:00:00' },
];

export const initialReports: Report[] = [
  {
    id: 'r1',
    childId: 'c1',
    title: '2024년 12월 월간 진행 리포트',
    period: '2024-12',
    periodStart: '2024-12-01',
    periodEnd: '2024-12-31',
    summary: '요청하기 목표 성공률 70%→90% 향상, 눈맞춤 유지 62%→90% 향상. 전반적으로 긍정적 발전.',
    content: `[김하늘 아동 - 2024년 12월 관찰 보고서]

※ 본 리포트는 진단/처방이 아니라, 입력된 기록을 기반으로 한 관찰 요약입니다.

안녕하세요, 김영희 보호자님.

12월 한 달간 하늘이의 치료 활동에 대한 관찰 내용을 전달드립니다.

【기간 요약】
이번 기간 동안 총 6회의 치료 세션이 진행되었습니다. 하늘이는 전반적으로 긍정적인 발전을 보였으며, 특히 의사소통 영역에서 눈에 띄는 향상이 관찰되었습니다. 자발적 요청 빈도가 증가하였고, 촉진 수준이 전체적으로 낮아져 독립성이 향상되고 있습니다.

【목표별 변화】

1. 요청하기 (의사소통)
   - 성공률: 70% → 90%로 향상 (+20%p)
   - 촉진 수준: 부분신체(2) → 독립(0)으로 발전
   - "과자 줘", "놀이 하고 싶어" 등 자발적 요청 증가

2. 눈맞춤 유지 (사회성)
   - 성공률: 50% → 90%로 향상 (+40%p)
   - 촉진 수준: 부분신체(2) → 독립(0)으로 발전
   - 눈맞춤 유지 시간 평균 2초에서 4초로 증가
   
3. 지시 따르기 (수용언어)
   - 성공률: 70% → 100%로 향상 (+30%p)
   - 촉진 수준: 부분신체(2) → 독립(0)으로 발전
   - 거의 모든 1단계 지시를 독립적으로 수행

【관찰된 패턴】
- 세션 초반 10분간 집중력이 가장 높음
- 칭찬 스티커에 매우 긍정적인 반응
- 새로운 단어 습득 속도가 빨라지고 있음
- 문제행동 발생 빈도가 크게 감소 (세션당 평균 1회 → 0회)

【다음 세션 관찰 포인트】
- 2단어 조합 요청 시도 관찰
- 또래와의 상호작용에서 눈맞춤 유지 관찰
- 새로운 상황에서의 지시 따르기 일반화 관찰

감사합니다.
담당 치료사: 김민지`,
    createdAt: '2024-12-31T09:00:00',
    createdBy: '김민지',
    includedGoals: ['g1', 'g2', 'g3'],
  },
];

export const initialCenterProfile: CenterProfile = {
  name: '해오름 발달센터',
  location: '서울특별시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  email: 'hello@haeoreum.kr',
  establishedDate: '2020-03-01',
};

// Prompt level labels
export const promptLevelLabels = ['독립', '언어촉진', '부분신체', '전체신체'];

// Sample import data for data migration demo
export const sampleImportData = [
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '단어 모방하기', session_date: '2024-12-15', trials: 10, success: 6, prompt_level: 2, problem_count: 1, session_note: '새로운 단어에 긍정적 반응' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '단어 모방하기', session_date: '2024-12-18', trials: 10, success: 7, prompt_level: 1, problem_count: 0, session_note: '모방 정확도 향상' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '간단한 지시 따르기', session_date: '2024-12-15', trials: 8, success: 5, prompt_level: 2, problem_count: 0, session_note: '1단계 지시 이해력 향상' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '간단한 지시 따르기', session_date: '2024-12-18', trials: 8, success: 6, prompt_level: 1, problem_count: 0, session_note: '지시 따르기 일관성 증가' },
  { child_name: '정민호', birth_year: '2019', concern: '사회성 발달 지연', goal_title: '차례 지키기', session_date: '2024-12-16', trials: 6, success: 4, prompt_level: 2, problem_count: 2, session_note: '차례 기다리기에서 약간의 어려움' },
  { child_name: '정민호', birth_year: '2019', concern: '사회성 발달 지연', goal_title: '차례 지키기', session_date: '2024-12-20', trials: 8, success: 6, prompt_level: 1, problem_count: 1, session_note: '개선 조짐 보임' },
];