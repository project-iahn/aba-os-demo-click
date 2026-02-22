import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export function RoleRedirect() {
  const { role } = useApp();
  
  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'parent') {
    return <Navigate to="/reports" replace />;
  }
  return <Navigate to="/cases" replace />;
}
