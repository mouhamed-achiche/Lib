import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(t("welcomeBack"));
      navigate(user.role === "staff" ? "/dashboard" : "/shop");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("couldNotFindAccount"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 pb-16">
      <div className="py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">{t("loginTitle")}</h1>
        <p className="mt-2 text-[16px] text-on-surface-variant">{t("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-outline-variant bg-surface p-6">
        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {t("email")}
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
            type="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {t("password")}
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
            type="password"
            required
          />
        </label>

        {error && (
          <p className="rounded-md border border-oxford-red/30 bg-oxford-red/10 px-3 py-2 text-[14px] text-oxford-red">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-oxford-red px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? t("signingIn") : t("signIn")}
        </button>

        <p className="text-center text-[14px] text-on-surface-variant">
          {t("alreadyHaveAccount")}{" "}
          <Link className="font-semibold text-academic-blue" to="/register">
            {t("createAccount")}
          </Link>
        </p>
      </form>
    </main>
  );
}
