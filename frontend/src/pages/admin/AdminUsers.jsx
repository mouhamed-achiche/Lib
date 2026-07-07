import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
];

function roleBadgeClass(role) {
  if (role === "staff") return "bg-oxford-red text-white";
  return "bg-muted-gray text-on-surface-variant";
}

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data?.items ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (user, nextRole) => {
    if (user.role === nextRole) return;
    if (user.id === currentUser?.id && nextRole !== "staff") {
      toast.error("You cannot remove your own staff access.");
      return;
    }

    setUpdatingId(user.id);
    try {
      const response = await adminApi.updateUserRole(user.id, nextRole);
      const updated = response.data?.user;
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, role: updated?.role ?? nextRole } : item,
        ),
      );
      toast.success(`Role updated to ${nextRole}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Manage Users
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Manage customer accounts and staff access.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue"
          onClick={load}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="mt-8">
        {loading ? (
          <p className="text-on-surface-variant">Loading users...</p>
        ) : users.length ? (
          <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
            <table className="min-w-full text-left text-[14px]">
              <thead className="border-b border-outline-variant bg-muted-gray/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Name</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Email</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Phone</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Role</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Change role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant last:border-0">
                    <td className="px-4 py-3 font-medium text-academic-blue">
                      {user.name}
                      {user.id === currentUser?.id ? (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.06em] text-on-surface-variant">
                          (you)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{user.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${roleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="h-9 rounded-md border border-outline-variant px-2 text-[13px] outline-none focus:border-academic-blue disabled:opacity-60"
                        disabled={updatingId === user.id}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                        value={user.role}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-on-surface-variant">No users found.</p>
        )}
      </section>
    </div>
  );
}
