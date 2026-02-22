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
  { id: 'th2', name: '이준혁', email: 'junhyuk@abaos.kr', phone: '010-2345-6789', specialization: '사회성/놀이', caseCount: 3 },
  { id: 'th3', name: '박서연', email: 'seoyeon@abaos.kr', phone: '010-3456-7890', specialization: '자조기술/일상생활', caseCount: 2 },
];

export const initialChildren: Child[] = [
  // 김민지(th1) 담당 - 5명
  {
    id: 'c1', name: '김하늘', age: 5, birthDate: '2020-03-15',
    concern: '언어 발달 지연, 사회적 상호작용 어려움', diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '김영희', guardianPhone: '010-1111-2222', guardianRelation: '어머니',
    status: 'active', startDate: '2024-09-01', therapistId: 'th1',
    lastSessionDate: '2025-01-03', trend: 'up',
    notes: '최근 눈맞춤 빈도 증가, 단어 사용량 향상', estimatedDevAge: 42,
  },
  {
    id: 'c4', name: '최유진', age: 5, birthDate: '2020-06-10',
    concern: '언어 발달 지연, 단어 모방 어려움', diagnosis: '발달 지연 (언어)',
    guardianName: '최지혜', guardianPhone: '010-4444-1111', guardianRelation: '어머니',
    status: 'active', startDate: '2024-11-01', therapistId: 'th1',
    lastSessionDate: '2025-01-04', trend: 'up',
    notes: '단어 모방 정확도 향상 중', estimatedDevAge: 40,
  },
  {
    id: 'c5', name: '정민호', age: 6, birthDate: '2019-09-25',
    concern: '사회성 발달 지연, 또래 관계 어려움', diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '정현우', guardianPhone: '010-5555-1111', guardianRelation: '아버지',
    status: 'active', startDate: '2024-08-01', therapistId: 'th1',
    lastSessionDate: '2025-01-02', trend: 'stable',
    notes: '또래 상호작용 빈도 유지 중', estimatedDevAge: 52,
  },
  {
    id: 'c6', name: '한소율', age: 4, birthDate: '2021-02-14',
    concern: '의사소통 의도 부족, 제한된 어휘', diagnosis: '표현 언어 장애',
    guardianName: '한미영', guardianPhone: '010-6666-1111', guardianRelation: '어머니',
    status: 'active', startDate: '2024-12-01', therapistId: 'th1',
    lastSessionDate: '2025-01-03', trend: 'up',
    notes: '의사소통 의도 표현 증가', estimatedDevAge: 30,
  },
  {
    id: 'c7', name: '오태양', age: 3, birthDate: '2022-05-20',
    concern: '전반적 발달 지연', diagnosis: '전반적 발달 지연 (GDD)',
    guardianName: '오지훈', guardianPhone: '010-7777-1111', guardianRelation: '아버지',
    status: 'pending', startDate: '2025-01-10', therapistId: 'th1',
    lastSessionDate: '', trend: 'stable',
    notes: '초기 평가 예정', estimatedDevAge: 24,
  },
  // 이준혁(th2) 담당 - 3명
  {
    id: 'c2', name: '이서준', age: 4, birthDate: '2021-07-22',
    concern: '반복적 행동, 감각 민감성', diagnosis: '자폐 스펙트럼 장애 (ASD Level 2)',
    guardianName: '이민수', guardianPhone: '010-3333-4444', guardianRelation: '아버지',
    status: 'active', startDate: '2024-10-15', therapistId: 'th2',
    lastSessionDate: '2025-01-02', trend: 'stable',
    notes: '감각 조절 활동에 긍정적 반응', estimatedDevAge: 28,
  },
  {
    id: 'c8', name: '윤서아', age: 5, birthDate: '2020-11-03',
    concern: '놀이 기술 부족, 상상 놀이 어려움', diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '윤재호', guardianPhone: '010-8888-1111', guardianRelation: '아버지',
    status: 'active', startDate: '2024-07-15', therapistId: 'th2',
    lastSessionDate: '2025-01-04', trend: 'up',
    notes: '상징 놀이 빈도 증가', estimatedDevAge: 38,
  },
  {
    id: 'c9', name: '강도윤', age: 7, birthDate: '2018-08-12',
    concern: '감정 조절 어려움, 공격 행동', diagnosis: '자폐 스펙트럼 장애 (ASD Level 2)',
    guardianName: '강수진', guardianPhone: '010-9999-1111', guardianRelation: '어머니',
    status: 'inactive', startDate: '2024-03-01', therapistId: 'th2',
    lastSessionDate: '2024-11-30', trend: 'down',
    notes: '치료 일시 중단 (가정 사정)', estimatedDevAge: 58,
  },
  // 박서연(th3) 담당 - 2명
  {
    id: 'c3', name: '박지우', age: 6, birthDate: '2019-11-08',
    concern: '또래 상호작용 어려움, 일상생활 자립', diagnosis: '자폐 스펙트럼 장애 (ASD Level 1)',
    guardianName: '박수현', guardianPhone: '010-5555-6666', guardianRelation: '어머니',
    status: 'active', startDate: '2024-06-01', therapistId: 'th3',
    lastSessionDate: '2024-12-28', trend: 'down',
    notes: '최근 세션 참여도 저하, 전환 활동에서 어려움', estimatedDevAge: 54,
  },
  {
    id: 'c10', name: '신예린', age: 5, birthDate: '2020-12-30',
    concern: '자조기술 부족, 식사/착탈의 어려움', diagnosis: '발달 지연 (적응행동)',
    guardianName: '신동혁', guardianPhone: '010-1010-1111', guardianRelation: '아버지',
    status: 'active', startDate: '2024-09-15', therapistId: 'th3',
    lastSessionDate: '2025-01-03', trend: 'stable',
    notes: '자조기술 단계적 향상 중', estimatedDevAge: 44,
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

  // 최유진(c4) goals
  { id: 'g10', childId: 'c4', title: '단어 모방하기', description: '치료사가 말한 단어 따라 말하기', category: '표현언어', targetCriteria: '10회 시도 중 8회 정확 모방', createdAt: '2024-11-01', status: 'active' },
  { id: 'g11', childId: 'c4', title: '간단한 지시 따르기', description: '1단계 언어 지시 수행하기', category: '수용언어', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-11-01', status: 'active' },

  // 정민호(c5) goals
  { id: 'g12', childId: 'c5', title: '차례 지키기', description: '게임에서 차례 기다리고 지키기', category: '사회성', targetCriteria: '3회 연속 독립 수행', createdAt: '2024-08-01', status: 'active' },
  { id: 'g13', childId: 'c5', title: '감정 표현하기', description: '기본 감정 단어로 표현하기', category: '의사소통', targetCriteria: '하루 5회 이상 자발적 표현', createdAt: '2024-08-15', status: 'active' },

  // 한소율(c6) goals
  { id: 'g14', childId: 'c6', title: '그림 카드 명명', description: '그림 카드를 보고 이름 말하기', category: '표현언어', targetCriteria: '20개 카드 중 16개 정확', createdAt: '2024-12-01', status: 'active' },
  { id: 'g15', childId: 'c6', title: '요구 표현하기', description: '원하는 것을 몸짓/말로 표현', category: '의사소통', targetCriteria: '5회 연속 자발적 표현', createdAt: '2024-12-01', status: 'active' },

  // 윤서아(c8) goals
  { id: 'g16', childId: 'c8', title: '상징 놀이', description: '인형/소꿉놀이에서 역할 수행', category: '놀이', targetCriteria: '5분 이상 독립적 상징 놀이', createdAt: '2024-07-15', status: 'active' },
  { id: 'g17', childId: 'c8', title: '또래 놀이 참여', description: '또래와 함께 놀이 활동 참여', category: '사회성', targetCriteria: '10분 이상 또래와 협동 놀이', createdAt: '2024-08-01', status: 'active' },

  // 강도윤(c9) goals
  { id: 'g18', childId: 'c9', title: '감정 조절', description: '화가 날 때 적절한 대처 전략 사용', category: '행동', targetCriteria: '대처 전략 독립 사용 5회 연속', createdAt: '2024-03-01', status: 'paused' },
  { id: 'g19', childId: 'c9', title: '자기 표현', description: '불편한 상황을 말로 표현하기', category: '의사소통', targetCriteria: '5회 연속 적절한 언어 사용', createdAt: '2024-03-15', status: 'paused' },

  // 신예린(c10) goals
  { id: 'g20', childId: 'c10', title: '혼자 숟가락 사용', description: '식사 시 숟가락으로 독립 식사', category: '자조기술', targetCriteria: '한 끼 독립적 수행', createdAt: '2024-09-15', status: 'active' },
  { id: 'g21', childId: 'c10', title: '상의 착탈의', description: '상의 혼자 벗고 입기', category: '자조기술', targetCriteria: '3회 연속 독립 수행', createdAt: '2024-10-01', status: 'active' },
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

  // 최유진(c4) sessions - improving
  { id: 's19', childId: 'c4', therapistId: 'th1', date: '2024-12-15', duration: 45, notes: '새로운 단어에 긍정적 반응.', trials: [
    { goalId: 'g10', trials: 10, successes: 6, promptLevel: 2, problemBehaviorCount: 1 },
    { goalId: 'g11', trials: 8, successes: 5, promptLevel: 2, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-15T09:00:00' },
  { id: 's20', childId: 'c4', therapistId: 'th1', date: '2024-12-18', duration: 45, notes: '모방 정확도 향상.', trials: [
    { goalId: 'g10', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g11', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-18T09:00:00' },
  { id: 's21', childId: 'c4', therapistId: 'th1', date: '2024-12-22', duration: 45, notes: '자발적 모방 시도 증가.', trials: [
    { goalId: 'g10', trials: 10, successes: 8, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g11', trials: 8, successes: 7, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-22T09:00:00' },
  { id: 's22', childId: 'c4', therapistId: 'th1', date: '2025-01-04', duration: 45, notes: '새해 세션. 꾸준한 향상.', trials: [
    { goalId: 'g10', trials: 10, successes: 8, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g11', trials: 8, successes: 7, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-04T09:00:00' },

  // 정민호(c5) sessions - stable
  { id: 's23', childId: 'c5', therapistId: 'th1', date: '2024-12-16', duration: 50, notes: '차례 기다리기에서 약간의 어려움.', trials: [
    { goalId: 'g12', trials: 6, successes: 4, promptLevel: 2, problemBehaviorCount: 2 },
    { goalId: 'g13', trials: 8, successes: 5, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-16T11:00:00' },
  { id: 's24', childId: 'c5', therapistId: 'th1', date: '2024-12-20', duration: 50, notes: '개선 조짐 보임.', trials: [
    { goalId: 'g12', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 1 },
    { goalId: 'g13', trials: 8, successes: 5, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-20T11:00:00' },
  { id: 's25', childId: 'c5', therapistId: 'th1', date: '2024-12-27', duration: 50, notes: '안정적 수행.', trials: [
    { goalId: 'g12', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g13', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-27T11:00:00' },
  { id: 's26', childId: 'c5', therapistId: 'th1', date: '2025-01-02', duration: 50, notes: '새해 세션. 일관된 수행.', trials: [
    { goalId: 'g12', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g13', trials: 8, successes: 6, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-02T11:00:00' },

  // 한소율(c6) sessions - improving
  { id: 's27', childId: 'c6', therapistId: 'th1', date: '2024-12-10', duration: 40, notes: '첫 세션. 기초 평가.', trials: [
    { goalId: 'g14', trials: 10, successes: 4, promptLevel: 3, problemBehaviorCount: 1 },
    { goalId: 'g15', trials: 6, successes: 2, promptLevel: 3, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-10T14:00:00' },
  { id: 's28', childId: 'c6', therapistId: 'th1', date: '2024-12-17', duration: 40, notes: '적응 중. 약간의 향상.', trials: [
    { goalId: 'g14', trials: 10, successes: 5, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g15', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-17T14:00:00' },
  { id: 's29', childId: 'c6', therapistId: 'th1', date: '2024-12-24', duration: 40, notes: '그림 카드 명명 향상.', trials: [
    { goalId: 'g14', trials: 10, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g15', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-24T14:00:00' },
  { id: 's30', childId: 'c6', therapistId: 'th1', date: '2025-01-03', duration: 40, notes: '꾸준한 향상 지속.', trials: [
    { goalId: 'g14', trials: 10, successes: 7, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g15', trials: 6, successes: 5, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-03T14:00:00' },

  // 윤서아(c8) sessions - improving
  { id: 's31', childId: 'c8', therapistId: 'th2', date: '2024-12-19', duration: 45, notes: '상징 놀이 활동에 참여.', trials: [
    { goalId: 'g16', trials: 8, successes: 5, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g17', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 1 },
  ], createdAt: '2024-12-19T10:00:00' },
  { id: 's32', childId: 'c8', therapistId: 'th2', date: '2024-12-26', duration: 45, notes: '또래 놀이 시간 증가.', trials: [
    { goalId: 'g16', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g17', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-26T10:00:00' },
  { id: 's33', childId: 'c8', therapistId: 'th2', date: '2025-01-04', duration: 45, notes: '상징 놀이 독립성 향상.', trials: [
    { goalId: 'g16', trials: 8, successes: 7, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g17', trials: 6, successes: 5, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-04T10:00:00' },

  // 강도윤(c9) sessions - last sessions before pause
  { id: 's34', childId: 'c9', therapistId: 'th2', date: '2024-11-20', duration: 50, notes: '감정 조절 어려움 지속.', trials: [
    { goalId: 'g18', trials: 8, successes: 3, promptLevel: 3, problemBehaviorCount: 4 },
    { goalId: 'g19', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 2 },
  ], createdAt: '2024-11-20T15:00:00' },
  { id: 's35', childId: 'c9', therapistId: 'th2', date: '2024-11-27', duration: 50, notes: '마지막 세션. 중단 전 평가.', trials: [
    { goalId: 'g18', trials: 8, successes: 3, promptLevel: 3, problemBehaviorCount: 3 },
    { goalId: 'g19', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 2 },
  ], createdAt: '2024-11-27T15:00:00' },

  // 신예린(c10) sessions - stable
  { id: 's36', childId: 'c10', therapistId: 'th3', date: '2024-12-12', duration: 45, notes: '숟가락 사용 연습.', trials: [
    { goalId: 'g20', trials: 8, successes: 5, promptLevel: 2, problemBehaviorCount: 0 },
    { goalId: 'g21', trials: 6, successes: 3, promptLevel: 2, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-12T10:00:00' },
  { id: 's37', childId: 'c10', therapistId: 'th3', date: '2024-12-19', duration: 45, notes: '자조기술 단계적 향상.', trials: [
    { goalId: 'g20', trials: 8, successes: 5, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g21', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-19T10:00:00' },
  { id: 's38', childId: 'c10', therapistId: 'th3', date: '2024-12-26', duration: 45, notes: '꾸준한 진전.', trials: [
    { goalId: 'g20', trials: 8, successes: 6, promptLevel: 1, problemBehaviorCount: 0 },
    { goalId: 'g21', trials: 6, successes: 4, promptLevel: 1, problemBehaviorCount: 0 },
  ], createdAt: '2024-12-26T10:00:00' },
  { id: 's39', childId: 'c10', therapistId: 'th3', date: '2025-01-03', duration: 45, notes: '새해 세션. 안정적 수행.', trials: [
    { goalId: 'g20', trials: 8, successes: 6, promptLevel: 0, problemBehaviorCount: 0 },
    { goalId: 'g21', trials: 6, successes: 5, promptLevel: 0, problemBehaviorCount: 0 },
  ], createdAt: '2025-01-03T10:00:00' },
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