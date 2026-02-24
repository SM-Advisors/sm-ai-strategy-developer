import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { hasAccess } = useAuthStore();

  if (!hasAccess) {
    return <Navigate to="/?redirect=true" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
