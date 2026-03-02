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
  estimatedDevAge?: number;
}

// Program = Goal (ABA terminology)
export interface Program {
  id: string;
  childId: string;
  title: string;
  description: string;
  category: string; // skill domain
  targetCriteria: string;
  createdAt: string;
  status: 'active' | 'mastered' | 'paused';
}

// Keep Goal as alias for backward compat
export type Goal = Program;

// Individual trial record (behavioral unit)
export interface Trial {
  id: string;
  sessionId: string;
  programId: string;
  trialOrder: number;
  stimulus: string;   // what was presented
  response: string;   // what child did
  result: 'correct' | 'incorrect' | 'no_response';
  promptLevel: number; // 0=independent, 1=gestural, 2=verbal, 3=partial_physical, 4=full_physical
  latencySeconds?: number;
  problemBehavior: boolean;
  notes?: string;
}

// Legacy aggregated trial (for backward compat during transition)
export interface SessionTrial {
  goalId: string;
  trials: number;
  successes: number;
  promptLevel: number;
  problemBehaviorCount: number;
}

export interface Session {
  id: string;
  childId: string;
  therapistId: string;
  date: string;
  duration: number;
  notes: string;
  // Trial-centric: individual trials
  trialRecords: Trial[];
  // Legacy aggregated (computed from trialRecords)
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

// Prompt level labels (5-level)
export const promptLevelLabels = ['독립', '제스처', '언어촉진', '부분신체', '전체신체'];

// Helper: aggregate trials into SessionTrial format for backward compat
export function aggregateTrials(trials: Trial[], programId: string): SessionTrial {
  const programTrials = trials.filter(t => t.programId === programId);
  const total = programTrials.length;
  const successes = programTrials.filter(t => t.result === 'correct').length;
  const avgPrompt = total > 0 ? Math.round(programTrials.reduce((a, t) => a + t.promptLevel, 0) / total) : 0;
  const problemCount = programTrials.filter(t => t.problemBehavior).length;
  return { goalId: programId, trials: total, successes, promptLevel: avgPrompt, problemBehaviorCount: problemCount };
}

// Helper: build aggregated trials array from trialRecords
export function buildAggregatedTrials(trialRecords: Trial[]): SessionTrial[] {
  const programIds = [...new Set(trialRecords.map(t => t.programId))];
  return programIds.map(pid => aggregateTrials(trialRecords, pid));
}

// Helper: get unique stimuli that were mastered (>= 80% correct across all sessions)
export function getMasteredStimuli(allTrials: Trial[], programId: string): string[] {
  const programTrials = allTrials.filter(t => t.programId === programId && t.stimulus);
  const stimuliMap = new Map<string, { correct: number; total: number }>();
  programTrials.forEach(t => {
    const existing = stimuliMap.get(t.stimulus) || { correct: 0, total: 0 };
    existing.total++;
    if (t.result === 'correct') existing.correct++;
    stimuliMap.set(t.stimulus, existing);
  });
  return Array.from(stimuliMap.entries())
    .filter(([, v]) => v.total >= 2 && (v.correct / v.total) >= 0.8)
    .map(([k]) => k);
}

// Helper: get stimulus-level mastery breakdown
export function getStimulusMastery(allTrials: Trial[], programId: string): { stimulus: string; rate: number; total: number }[] {
  const programTrials = allTrials.filter(t => t.programId === programId && t.stimulus);
  const stimuliMap = new Map<string, { correct: number; total: number }>();
  programTrials.forEach(t => {
    const existing = stimuliMap.get(t.stimulus) || { correct: 0, total: 0 };
    existing.total++;
    if (t.result === 'correct') existing.correct++;
    stimuliMap.set(t.stimulus, existing);
  });
  return Array.from(stimuliMap.entries())
    .map(([stimulus, v]) => ({ stimulus, rate: Math.round((v.correct / v.total) * 100), total: v.total }))
    .sort((a, b) => b.rate - a.rate);
}

// ===== MOCK DATA =====

export const initialTherapists: Therapist[] = [
  { id: 'th1', name: '김민지', email: 'minji@abaos.kr', phone: '010-1234-5678', specialization: '언어/의사소통', caseCount: 5 },
  { id: 'th2', name: '이준혁', email: 'junhyuk@abaos.kr', phone: '010-2345-6789', specialization: '사회성/놀이', caseCount: 3 },
  { id: 'th3', name: '박서연', email: 'seoyeon@abaos.kr', phone: '010-3456-7890', specialization: '자조기술/일상생활', caseCount: 2 },
];

export const initialChildren: Child[] = [
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

export const initialGoals: Program[] = [
  { id: 'g1', childId: 'c1', title: '요청하기', description: '원하는 물건/활동을 언어로 요청하기', category: '의사소통', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-09-01', status: 'active' },
  { id: 'g2', childId: 'c1', title: '눈맞춤 유지', description: '대화 시 3초 이상 눈맞춤 유지하기', category: '사회성', targetCriteria: '10회 시도 중 8회 성공', createdAt: '2024-09-01', status: 'active' },
  { id: 'g3', childId: 'c1', title: '지시 따르기', description: '1단계 언어 지시 따르기', category: '수용언어', targetCriteria: '5회 연속 90% 이상 성공', createdAt: '2024-09-15', status: 'active' },
  { id: 'g4', childId: 'c2', title: '차례 기다리기', description: '놀이 상황에서 차례 기다리기', category: '사회성', targetCriteria: '3분 이상 적절히 기다리기', createdAt: '2024-10-15', status: 'active' },
  { id: 'g5', childId: 'c2', title: '감각 조절', description: '다양한 촉감에 적응하기', category: '감각통합', targetCriteria: '새로운 촉감 5개 이상 수용', createdAt: '2024-10-15', status: 'active' },
  { id: 'g6', childId: 'c2', title: '모방하기', description: '간단한 동작 모방하기', category: '놀이', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-11-01', status: 'active' },
  { id: 'g7', childId: 'c3', title: '또래 인사하기', description: '또래에게 먼저 인사하기', category: '사회성', targetCriteria: '하루 3회 이상 자발적 인사', createdAt: '2024-06-01', status: 'active' },
  { id: 'g8', childId: 'c3', title: '혼자 양치하기', description: '감독 하에 혼자 양치하기', category: '자조기술', targetCriteria: '모든 단계 독립적 수행', createdAt: '2024-06-01', status: 'active' },
  { id: 'g9', childId: 'c3', title: '전환 적응', description: '활동 전환 시 적절히 대처하기', category: '행동', targetCriteria: '문제행동 없이 전환 5회 연속', createdAt: '2024-07-01', status: 'active' },
  { id: 'g10', childId: 'c4', title: '단어 모방하기', description: '치료사가 말한 단어 따라 말하기', category: '표현언어', targetCriteria: '10회 시도 중 8회 정확 모방', createdAt: '2024-11-01', status: 'active' },
  { id: 'g11', childId: 'c4', title: '간단한 지시 따르기', description: '1단계 언어 지시 수행하기', category: '수용언어', targetCriteria: '5회 연속 80% 이상 성공', createdAt: '2024-11-01', status: 'active' },
  { id: 'g12', childId: 'c5', title: '차례 지키기', description: '게임에서 차례 기다리고 지키기', category: '사회성', targetCriteria: '3회 연속 독립 수행', createdAt: '2024-08-01', status: 'active' },
  { id: 'g13', childId: 'c5', title: '감정 표현하기', description: '기본 감정 단어로 표현하기', category: '의사소통', targetCriteria: '하루 5회 이상 자발적 표현', createdAt: '2024-08-15', status: 'active' },
  { id: 'g14', childId: 'c6', title: '그림 카드 명명', description: '그림 카드를 보고 이름 말하기', category: '표현언어', targetCriteria: '20개 카드 중 16개 정확', createdAt: '2024-12-01', status: 'active' },
  { id: 'g15', childId: 'c6', title: '요구 표현하기', description: '원하는 것을 몸짓/말로 표현', category: '의사소통', targetCriteria: '5회 연속 자발적 표현', createdAt: '2024-12-01', status: 'active' },
  { id: 'g16', childId: 'c8', title: '상징 놀이', description: '인형/소꿉놀이에서 역할 수행', category: '놀이', targetCriteria: '5분 이상 독립적 상징 놀이', createdAt: '2024-07-15', status: 'active' },
  { id: 'g17', childId: 'c8', title: '또래 놀이 참여', description: '또래와 함께 놀이 활동 참여', category: '사회성', targetCriteria: '10분 이상 또래와 협동 놀이', createdAt: '2024-08-01', status: 'active' },
  { id: 'g18', childId: 'c9', title: '감정 조절', description: '화가 날 때 적절한 대처 전략 사용', category: '행동', targetCriteria: '대처 전략 독립 사용 5회 연속', createdAt: '2024-03-01', status: 'paused' },
  { id: 'g19', childId: 'c9', title: '자기 표현', description: '불편한 상황을 말로 표현하기', category: '의사소통', targetCriteria: '5회 연속 적절한 언어 사용', createdAt: '2024-03-15', status: 'paused' },
  { id: 'g20', childId: 'c10', title: '혼자 숟가락 사용', description: '식사 시 숟가락으로 독립 식사', category: '자조기술', targetCriteria: '한 끼 독립적 수행', createdAt: '2024-09-15', status: 'active' },
  { id: 'g21', childId: 'c10', title: '상의 착탈의', description: '상의 혼자 벗고 입기', category: '자조기술', targetCriteria: '3회 연속 독립 수행', createdAt: '2024-10-01', status: 'active' },
];

// Helper to generate trial records from legacy aggregated data
function generateTrials(
  sessionId: string,
  programId: string,
  total: number,
  successes: number,
  promptLevel: number,
  problemCount: number,
  stimuli: string[],
): Trial[] {
  const trials: Trial[] = [];
  for (let i = 0; i < total; i++) {
    const isCorrect = i < successes;
    trials.push({
      id: `${sessionId}-${programId}-t${i + 1}`,
      sessionId,
      programId,
      trialOrder: i + 1,
      stimulus: stimuli[i % stimuli.length],
      response: isCorrect ? stimuli[i % stimuli.length] : '',
      result: isCorrect ? 'correct' : 'incorrect',
      promptLevel,
      problemBehavior: i < problemCount,
    });
  }
  return trials;
}

// Stimuli per program for realistic data
const PROGRAM_STIMULI: Record<string, string[]> = {
  'g1': ['과자 줘', '물 주세요', '놀이 하고 싶어', '그네 타고 싶어', '안아 주세요', '더 줘', '이거 줘', '열어 줘', '도와 줘', '같이 놀자'],
  'g2': ['인사할 때', '이름 부를 때', '질문할 때', '놀이 중', '간식 시간', '책 읽을 때', '노래할 때', '대화 중', '지시할 때', '칭찬할 때'],
  'g3': ['앉아', '일어나', '이리 와', '공 줘', '손 올려', '박수 쳐', '문 닫아', '의자에 앉아', '신발 벗어', '손 씻어'],
  'g4': ['블록 쌓기', '공 굴리기', '퍼즐 맞추기', '그림 그리기', '색칠하기', '카드 게임', '보드게임', '인형 놀이'],
  'g5': ['모래', '점토', '물감', '스티커', '솜', '나무 블록', '고무공', '천'],
  'g6': ['박수', '만세', '점프', '돌기', '손흔들기', '고개 끄덕', '발 구르기', '팔 벌리기', '손뼉', '인사'],
  'g7': ['안녕', '안녕하세요', '잘 가', '고마워', '미안해', '같이 놀자'],
  'g8': ['치약 짜기', '칫솔 잡기', '위 닦기', '아래 닦기', '헹구기'],
  'g9': ['블록→그림', '그림→간식', '간식→정리', '정리→놀이', '놀이→인사', '실내→실외'],
  'g10': ['사과', '바나나', '물', '자동차', '강아지', '고양이', '공', '나무', '꽃', '집'],
  'g11': ['앉아', '일어나', '손 씻어', '신발 신어', '문 열어', '가방 가져와', '의자 밀어', '컵 줘'],
  'g12': ['주사위 던지기', '카드 뽑기', '블록 쌓기', '퍼즐 조각', '공 던지기', '그림 맞추기', '순서 기다리기', '말 옮기기'],
  'g13': ['기뻐요', '슬퍼요', '화나요', '무서워요', '좋아요', '싫어요', '놀라워요', '지루해요'],
  'g14': ['사과', '자동차', '강아지', '고양이', '공', '물', '나무', '꽃', '집', '배'],
  'g15': ['줘', '더', '싫어', '좋아', '안아', '열어'],
  'g16': ['인형 밥주기', '인형 재우기', '소꿉 요리', '병원 놀이', '가게 놀이', '전화 놀이', '운전 놀이', '학교 놀이'],
  'g17': ['블록 함께', '공 주고받기', '그림 함께', '노래 함께', '춤 함께', '퍼즐 함께'],
  'g18': ['심호흡', '숫자 세기', '자리 이동', '말로 표현', '도움 요청', '기다리기', '대안 찾기', '타이머 사용'],
  'g19': ['아파요', '힘들어요', '도와주세요', '쉬고 싶어요', '무서워요', '싫어요'],
  'g20': ['밥 뜨기', '입으로', '국 뜨기', '반찬 집기', '흘리지 않기', '그릇 잡기', '숟가락 잡기', '입 닦기'],
  'g21': ['팔 빼기', '머리 빼기', '팔 넣기', '머리 넣기', '앞뒤 확인', '지퍼/단추'],
};

// Build sessions with individual trial records
function buildSession(
  id: string, childId: string, therapistId: string, date: string, duration: number, notes: string,
  trialSpecs: { programId: string; total: number; successes: number; promptLevel: number; problemCount: number }[],
): Session {
  const trialRecords: Trial[] = [];
  trialSpecs.forEach(spec => {
    const stimuli = PROGRAM_STIMULI[spec.programId] || ['자극1', '자극2', '자극3'];
    trialRecords.push(...generateTrials(id, spec.programId, spec.total, spec.successes, spec.promptLevel, spec.problemCount, stimuli));
  });
  return {
    id, childId, therapistId, date, duration, notes,
    trialRecords,
    trials: buildAggregatedTrials(trialRecords),
    createdAt: `${date}T10:00:00`,
  };
}

export const initialSessions: Session[] = [
  // 김하늘 sessions - showing clear improvement trend (70% -> 90%)
  buildSession('s1', 'c1', 'th1', '2024-12-20', 50, '오늘 세션에서 하늘이가 "과자 줘"라고 자발적으로 요청했습니다.', [
    { programId: 'g1', total: 10, successes: 7, promptLevel: 2, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 5, promptLevel: 2, problemCount: 1 },
    { programId: 'g3', total: 10, successes: 7, promptLevel: 2, problemCount: 0 },
  ]),
  buildSession('s2', 'c1', 'th1', '2024-12-23', 50, '눈맞춤 유지 시간이 조금 늘어났습니다. 칭찬 스티커에 좋은 반응.', [
    { programId: 'g1', total: 10, successes: 7, promptLevel: 2, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 6, promptLevel: 2, problemCount: 0 },
    { programId: 'g3', total: 10, successes: 8, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s3', 'c1', 'th1', '2024-12-26', 50, '요청하기 목표에서 발전을 보임.', [
    { programId: 'g1', total: 10, successes: 8, promptLevel: 1, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g3', total: 10, successes: 8, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s4', 'c1', 'th1', '2024-12-28', 50, '요청하기 목표에서 큰 발전을 보임. 새로운 단어 2개 추가.', [
    { programId: 'g1', total: 12, successes: 10, promptLevel: 1, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g3', total: 10, successes: 9, promptLevel: 0, problemCount: 0 },
  ]),
  buildSession('s5', 'c1', 'th1', '2024-12-30', 50, '전반적으로 안정적인 세션. 집중력 향상됨.', [
    { programId: 'g1', total: 10, successes: 9, promptLevel: 0, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 8, promptLevel: 0, problemCount: 0 },
    { programId: 'g3', total: 10, successes: 10, promptLevel: 0, problemCount: 0 },
  ]),
  buildSession('s6', 'c1', 'th1', '2025-01-03', 50, '새해 첫 세션. 하늘이가 기분 좋게 참여함. 독립 수행 수준 도달.', [
    { programId: 'g1', total: 10, successes: 9, promptLevel: 0, problemCount: 0 },
    { programId: 'g2', total: 10, successes: 9, promptLevel: 0, problemCount: 0 },
    { programId: 'g3', total: 10, successes: 10, promptLevel: 0, problemCount: 0 },
  ]),

  // 이서준 sessions - stable
  buildSession('s7', 'c2', 'th2', '2024-12-19', 45, '서준이가 차례 기다리기에서 진전을 보임.', [
    { programId: 'g4', total: 8, successes: 5, promptLevel: 2, problemCount: 2 },
    { programId: 'g5', total: 6, successes: 4, promptLevel: 1, problemCount: 1 },
    { programId: 'g6', total: 10, successes: 6, promptLevel: 2, problemCount: 0 },
  ]),
  buildSession('s8', 'c2', 'th2', '2024-12-23', 45, '감각 활동에 적극적으로 참여.', [
    { programId: 'g4', total: 8, successes: 5, promptLevel: 2, problemCount: 1 },
    { programId: 'g5', total: 8, successes: 5, promptLevel: 1, problemCount: 0 },
    { programId: 'g6', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s9', 'c2', 'th2', '2024-12-26', 45, '새로운 촉감 재료 도입. 초기 거부 후 수용.', [
    { programId: 'g4', total: 8, successes: 6, promptLevel: 1, problemCount: 1 },
    { programId: 'g5', total: 8, successes: 6, promptLevel: 1, problemCount: 1 },
    { programId: 'g6', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s10', 'c2', 'th2', '2024-12-28', 45, '모방 능력 향상. 연속 동작 가능해짐.', [
    { programId: 'g4', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g5', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g6', total: 10, successes: 8, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s11', 'c2', 'th2', '2024-12-30', 45, '전반적으로 안정적인 세션.', [
    { programId: 'g4', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g5', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g6', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s12', 'c2', 'th2', '2025-01-02', 45, '새해 첫 세션. 안정적인 수행.', [
    { programId: 'g4', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g5', total: 10, successes: 7, promptLevel: 0, problemCount: 0 },
    { programId: 'g6', total: 10, successes: 8, promptLevel: 0, problemCount: 0 },
  ]),

  // 박지우 sessions - regression
  buildSession('s13', 'c3', 'th3', '2024-12-14', 50, '지우가 또래 상호작용에서 진전을 보임.', [
    { programId: 'g7', total: 8, successes: 6, promptLevel: 1, problemCount: 1 },
    { programId: 'g8', total: 5, successes: 4, promptLevel: 1, problemCount: 0 },
    { programId: 'g9', total: 6, successes: 5, promptLevel: 1, problemCount: 1 },
  ]),
  buildSession('s14', 'c3', 'th3', '2024-12-18', 50, '양치하기 독립성 증가. 전환 적응 양호.', [
    { programId: 'g7', total: 8, successes: 6, promptLevel: 1, problemCount: 1 },
    { programId: 'g8', total: 5, successes: 4, promptLevel: 0, problemCount: 0 },
    { programId: 'g9', total: 6, successes: 4, promptLevel: 1, problemCount: 1 },
  ]),
  buildSession('s15', 'c3', 'th3', '2024-12-21', 50, '전환 활동에서 다소 어려움 발생.', [
    { programId: 'g7', total: 6, successes: 4, promptLevel: 2, problemCount: 1 },
    { programId: 'g8', total: 5, successes: 4, promptLevel: 0, problemCount: 0 },
    { programId: 'g9', total: 6, successes: 3, promptLevel: 2, problemCount: 3 },
  ]),
  buildSession('s16', 'c3', 'th3', '2024-12-24', 50, '전환 활동에서 어려움이 지속됨.', [
    { programId: 'g7', total: 6, successes: 3, promptLevel: 2, problemCount: 2 },
    { programId: 'g8', total: 5, successes: 4, promptLevel: 0, problemCount: 0 },
    { programId: 'g9', total: 8, successes: 3, promptLevel: 3, problemCount: 4 },
  ]),
  buildSession('s17', 'c3', 'th3', '2024-12-26', 50, '성공률 저하. 문제행동 증가 관찰됨.', [
    { programId: 'g7', total: 6, successes: 3, promptLevel: 3, problemCount: 2 },
    { programId: 'g8', total: 5, successes: 3, promptLevel: 1, problemCount: 1 },
    { programId: 'g9', total: 8, successes: 2, promptLevel: 3, problemCount: 5 },
  ]),
  buildSession('s18', 'c3', 'th3', '2024-12-28', 50, '전환 전략 조정 필요. 문제행동 관리 필요.', [
    { programId: 'g7', total: 6, successes: 3, promptLevel: 3, problemCount: 2 },
    { programId: 'g8', total: 5, successes: 3, promptLevel: 1, problemCount: 1 },
    { programId: 'g9', total: 8, successes: 2, promptLevel: 3, problemCount: 4 },
  ]),

  // 최유진 - improving
  buildSession('s19', 'c4', 'th1', '2024-12-15', 45, '새로운 단어에 긍정적 반응.', [
    { programId: 'g10', total: 10, successes: 6, promptLevel: 2, problemCount: 1 },
    { programId: 'g11', total: 8, successes: 5, promptLevel: 2, problemCount: 0 },
  ]),
  buildSession('s20', 'c4', 'th1', '2024-12-18', 45, '모방 정확도 향상.', [
    { programId: 'g10', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g11', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s21', 'c4', 'th1', '2024-12-22', 45, '자발적 모방 시도 증가.', [
    { programId: 'g10', total: 10, successes: 8, promptLevel: 1, problemCount: 0 },
    { programId: 'g11', total: 8, successes: 7, promptLevel: 0, problemCount: 0 },
  ]),
  buildSession('s22', 'c4', 'th1', '2025-01-04', 45, '새해 세션. 꾸준한 향상.', [
    { programId: 'g10', total: 10, successes: 8, promptLevel: 0, problemCount: 0 },
    { programId: 'g11', total: 8, successes: 7, promptLevel: 0, problemCount: 0 },
  ]),

  // 정민호 - stable
  buildSession('s23', 'c5', 'th1', '2024-12-16', 50, '차례 기다리기에서 약간의 어려움.', [
    { programId: 'g12', total: 6, successes: 4, promptLevel: 2, problemCount: 2 },
    { programId: 'g13', total: 8, successes: 5, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s24', 'c5', 'th1', '2024-12-20', 50, '개선 조짐 보임.', [
    { programId: 'g12', total: 8, successes: 6, promptLevel: 1, problemCount: 1 },
    { programId: 'g13', total: 8, successes: 5, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s25', 'c5', 'th1', '2024-12-27', 50, '안정적 수행.', [
    { programId: 'g12', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g13', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s26', 'c5', 'th1', '2025-01-02', 50, '새해 세션. 일관된 수행.', [
    { programId: 'g12', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g13', total: 8, successes: 6, promptLevel: 0, problemCount: 0 },
  ]),

  // 한소율 - improving
  buildSession('s27', 'c6', 'th1', '2024-12-10', 40, '첫 세션. 기초 평가.', [
    { programId: 'g14', total: 10, successes: 4, promptLevel: 3, problemCount: 1 },
    { programId: 'g15', total: 6, successes: 2, promptLevel: 3, problemCount: 0 },
  ]),
  buildSession('s28', 'c6', 'th1', '2024-12-17', 40, '적응 중. 약간의 향상.', [
    { programId: 'g14', total: 10, successes: 5, promptLevel: 2, problemCount: 0 },
    { programId: 'g15', total: 6, successes: 3, promptLevel: 2, problemCount: 0 },
  ]),
  buildSession('s29', 'c6', 'th1', '2024-12-24', 40, '그림 카드 명명 향상.', [
    { programId: 'g14', total: 10, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g15', total: 6, successes: 4, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s30', 'c6', 'th1', '2025-01-03', 40, '꾸준한 향상 지속.', [
    { programId: 'g14', total: 10, successes: 7, promptLevel: 1, problemCount: 0 },
    { programId: 'g15', total: 6, successes: 5, promptLevel: 0, problemCount: 0 },
  ]),

  // 윤서아 - improving
  buildSession('s31', 'c8', 'th2', '2024-12-19', 45, '상징 놀이 활동에 참여.', [
    { programId: 'g16', total: 8, successes: 5, promptLevel: 2, problemCount: 0 },
    { programId: 'g17', total: 6, successes: 3, promptLevel: 2, problemCount: 1 },
  ]),
  buildSession('s32', 'c8', 'th2', '2024-12-26', 45, '또래 놀이 시간 증가.', [
    { programId: 'g16', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g17', total: 6, successes: 4, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s33', 'c8', 'th2', '2025-01-04', 45, '상징 놀이 독립성 향상.', [
    { programId: 'g16', total: 8, successes: 7, promptLevel: 0, problemCount: 0 },
    { programId: 'g17', total: 6, successes: 5, promptLevel: 1, problemCount: 0 },
  ]),

  // 강도윤 - last sessions before pause
  buildSession('s34', 'c9', 'th2', '2024-11-20', 50, '감정 조절 어려움 지속.', [
    { programId: 'g18', total: 8, successes: 3, promptLevel: 3, problemCount: 4 },
    { programId: 'g19', total: 6, successes: 3, promptLevel: 2, problemCount: 2 },
  ]),
  buildSession('s35', 'c9', 'th2', '2024-11-27', 50, '마지막 세션. 중단 전 평가.', [
    { programId: 'g18', total: 8, successes: 3, promptLevel: 3, problemCount: 3 },
    { programId: 'g19', total: 6, successes: 3, promptLevel: 2, problemCount: 2 },
  ]),

  // 신예린 - stable
  buildSession('s36', 'c10', 'th3', '2024-12-12', 45, '숟가락 사용 연습.', [
    { programId: 'g20', total: 8, successes: 5, promptLevel: 2, problemCount: 0 },
    { programId: 'g21', total: 6, successes: 3, promptLevel: 2, problemCount: 0 },
  ]),
  buildSession('s37', 'c10', 'th3', '2024-12-19', 45, '자조기술 단계적 향상.', [
    { programId: 'g20', total: 8, successes: 5, promptLevel: 1, problemCount: 0 },
    { programId: 'g21', total: 6, successes: 4, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s38', 'c10', 'th3', '2024-12-26', 45, '꾸준한 진전.', [
    { programId: 'g20', total: 8, successes: 6, promptLevel: 1, problemCount: 0 },
    { programId: 'g21', total: 6, successes: 4, promptLevel: 1, problemCount: 0 },
  ]),
  buildSession('s39', 'c10', 'th3', '2025-01-03', 45, '새해 세션. 안정적 수행.', [
    { programId: 'g20', total: 8, successes: 6, promptLevel: 0, problemCount: 0 },
    { programId: 'g21', total: 6, successes: 5, promptLevel: 0, problemCount: 0 },
  ]),
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
    content: `[김하늘 아동 - 2024년 12월 관찰 보고서]\n\n※ 본 리포트는 진단/처방이 아니라, 입력된 기록을 기반으로 한 관찰 요약입니다.\n\n안녕하세요, 김영희 보호자님.\n\n12월 한 달간 하늘이의 치료 활동에 대한 관찰 내용을 전달드립니다.\n\n【기간 요약】\n이번 기간 동안 총 6회의 치료 세션이 진행되었습니다.\n\n【목표별 변화】\n\n1. 요청하기 (의사소통)\n   - 성공률: 70% → 90%로 향상 (+20%p)\n   - 촉진 수준: 부분신체(3) → 독립(0)으로 발전\n   - 마스터한 자극: 과자 줘, 물 주세요, 놀이 하고 싶어\n\n2. 눈맞춤 유지 (사회성)\n   - 성공률: 50% → 90%로 향상 (+40%p)\n   - 독립 수행 수준 도달\n\n3. 지시 따르기 (수용언어)\n   - 성공률: 70% → 100%로 향상 (+30%p)\n   - 마스터한 자극: 앉아, 일어나, 이리 와, 공 줘, 손 올려\n\n감사합니다.\n담당 치료사: 김민지`,
    createdAt: '2024-12-31T09:00:00',
    createdBy: '김민지',
    includedGoals: ['g1', 'g2', 'g3'],
  },
];

export const initialCenterProfile: CenterProfile = {
  name: '아이랑 ABA 행동발달연구소',
  location: '서울특별시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  email: 'hello@airang-aba.kr',
  establishedDate: '2020-03-01',
};

export const sampleImportData = [
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '단어 모방하기', session_date: '2024-12-15', trials: 10, success: 6, prompt_level: 2, problem_count: 1, session_note: '새로운 단어에 긍정적 반응' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '단어 모방하기', session_date: '2024-12-18', trials: 10, success: 7, prompt_level: 1, problem_count: 0, session_note: '모방 정확도 향상' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '간단한 지시 따르기', session_date: '2024-12-15', trials: 8, success: 5, prompt_level: 2, problem_count: 0, session_note: '1단계 지시 이해력 향상' },
  { child_name: '최유진', birth_year: '2020', concern: '언어 발달 지연', goal_title: '간단한 지시 따르기', session_date: '2024-12-18', trials: 8, success: 6, prompt_level: 1, problem_count: 0, session_note: '지시 따르기 일관성 증가' },
  { child_name: '정민호', birth_year: '2019', concern: '사회성 발달 지연', goal_title: '차례 지키기', session_date: '2024-12-16', trials: 6, success: 4, prompt_level: 2, problem_count: 2, session_note: '차례 기다리기에서 약간의 어려움' },
  { child_name: '정민호', birth_year: '2019', concern: '사회성 발달 지연', goal_title: '차례 지키기', session_date: '2024-12-20', trials: 8, success: 6, prompt_level: 1, problem_count: 1, session_note: '개선 조짐 보임' },
];
