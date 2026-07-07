import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { currentUser, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
        Loading...
      </div>
    );
  }

  if (!currentUser || !isStaff) {
    return <StaffDeniedRedirect />;
  }

  return children;
}

function StaffDeniedRedirect() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      toast.warning("🚫 You don't have permission to access that page.");
    }
  }, [currentUser]);

  return <Navigate to="/" replace />;
}
