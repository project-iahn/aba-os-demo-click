import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Role,
  Child,
  Goal,
  Session,
  Report,
  Therapist,
  CenterProfile,
  initialChildren,
  initialGoals,
  initialSessions,
  initialReports,
  initialTherapists,
  initialCenterProfile,
} from '@/data/mockData';

interface AppState {
  role: Role;
  children: Child[];
  goals: Goal[];
  sessions: Session[];
  reports: Report[];
  therapists: Therapist[];
  centerProfile: CenterProfile;
}

interface AppContextType extends AppState {
  setRole: (role: Role) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  addSession: (session: Session) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  resetData: () => void;
  getChildById: (id: string) => Child | undefined;
  getGoalsByChildId: (childId: string) => Goal[];
  getSessionsByChildId: (childId: string) => Session[];
  getReportsByChildId: (childId: string) => Report[];
  getTherapistById: (id: string) => Therapist | undefined;
  bulkImport: (data: { children: Child[]; goals: Goal[]; sessions: Session[] }) => void;
  updateChildTrend: (childId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialState = (): AppState => ({
  role: 'admin',
  children: [...initialChildren],
  goals: [...initialGoals],
  sessions: [...initialSessions],
  reports: [...initialReports],
  therapists: [...initialTherapists],
  centerProfile: { ...initialCenterProfile },
});

// Helper to calculate trend based on recent sessions
const calculateTrend = (sessions: Session[]): 'up' | 'down' | 'stable' => {
  if (sessions.length < 4) return 'stable';
  
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const recentSessions = sortedSessions.slice(0, 4);
  const olderSessions = sortedSessions.slice(4, 8);
  
  if (olderSessions.length === 0) return 'stable';
  
  const getAvgSuccessRate = (sessions: Session[]) => {
    const allTrials = sessions.flatMap(s => s.trials);
    if (allTrials.length === 0) return 0;
    const totalTrials = allTrials.reduce((acc, t) => acc + t.trials, 0);
    const totalSuccesses = allTrials.reduce((acc, t) => acc + t.successes, 0);
    return totalSuccesses / totalTrials;
  };
  
  const recentRate = getAvgSuccessRate(recentSessions);
  const olderRate = getAvgSuccessRate(olderSessions);
  
  if (recentRate > olderRate + 0.1) return 'up';
  if (recentRate < olderRate - 0.1) return 'down';
  return 'stable';
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);

  const setRole = useCallback((role: Role) => {
    setState((prev) => ({ ...prev, role }));
  }, []);

  const addChild = useCallback((child: Child) => {
    setState((prev) => ({ ...prev, children: [...prev.children, child] }));
  }, []);

  const updateChild = useCallback((id: string, updates: Partial<Child>) => {
    setState((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const addGoal = useCallback((goal: Goal) => {
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const updateChildTrend = useCallback((childId: string) => {
    setState((prev) => {
      const childSessions = prev.sessions.filter(s => s.childId === childId);
      const trend = calculateTrend(childSessions);
      return {
        ...prev,
        children: prev.children.map(c => 
          c.id === childId ? { ...c, trend } : c
        ),
      };
    });
  }, []);

  const addSession = useCallback((session: Session) => {
    setState((prev) => {
      const updatedSessions = [...prev.sessions, session];
      const childSessions = updatedSessions.filter(s => s.childId === session.childId);
      const trend = calculateTrend(childSessions);
      
      // Update child's lastSessionDate and trend
      const updatedChildren = prev.children.map((c) => {
        if (c.id === session.childId) {
          return { ...c, lastSessionDate: session.date, trend };
        }
        return c;
      });
      
      return {
        ...prev,
        sessions: updatedSessions,
        children: updatedChildren,
      };
    });
  }, []);

  const addReport = useCallback((report: Report) => {
    setState((prev) => ({ ...prev, reports: [...prev.reports, report] }));
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<Report>) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }, []);

  const resetData = useCallback(() => {
    setState(getInitialState());
  }, []);

  const bulkImport = useCallback((data: { children: Child[]; goals: Goal[]; sessions: Session[] }) => {
    setState((prev) => ({
      ...prev,
      children: [...prev.children, ...data.children],
      goals: [...prev.goals, ...data.goals],
      sessions: [...prev.sessions, ...data.sessions],
    }));
  }, []);

  const getChildById = useCallback(
    (id: string) => state.children.find((c) => c.id === id),
    [state.children]
  );

  const getGoalsByChildId = useCallback(
    (childId: string) => state.goals.filter((g) => g.childId === childId),
    [state.goals]
  );

  const getSessionsByChildId = useCallback(
    (childId: string) => state.sessions.filter((s) => s.childId === childId),
    [state.sessions]
  );

  const getReportsByChildId = useCallback(
    (childId: string) => state.reports.filter((r) => r.childId === childId),
    [state.reports]
  );

  const getTherapistById = useCallback(
    (id: string) => state.therapists.find((t) => t.id === id),
    [state.therapists]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        setRole,
        addChild,
        updateChild,
        addGoal,
        updateGoal,
        addSession,
        addReport,
        updateReport,
        resetData,
        getChildById,
        getGoalsByChildId,
        getSessionsByChildId,
        getReportsByChildId,
        getTherapistById,
        bulkImport,
        updateChildTrend,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}