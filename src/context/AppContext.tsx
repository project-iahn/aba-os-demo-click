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
  resetData: () => void;
  getChildById: (id: string) => Child | undefined;
  getGoalsByChildId: (childId: string) => Goal[];
  getSessionsByChildId: (childId: string) => Session[];
  getReportsByChildId: (childId: string) => Report[];
  getTherapistById: (id: string) => Therapist | undefined;
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

  const addSession = useCallback((session: Session) => {
    setState((prev) => {
      // Update child's lastSessionDate and potentially trend
      const updatedChildren = prev.children.map((c) => {
        if (c.id === session.childId) {
          return { ...c, lastSessionDate: session.date };
        }
        return c;
      });
      return {
        ...prev,
        sessions: [...prev.sessions, session],
        children: updatedChildren,
      };
    });
  }, []);

  const addReport = useCallback((report: Report) => {
    setState((prev) => ({ ...prev, reports: [...prev.reports, report] }));
  }, []);

  const resetData = useCallback(() => {
    setState(getInitialState());
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
        resetData,
        getChildById,
        getGoalsByChildId,
        getSessionsByChildId,
        getReportsByChildId,
        getTherapistById,
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
