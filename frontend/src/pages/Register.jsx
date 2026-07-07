import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

export default function Register() {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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
      await register({ name, email, password, phone, address });
      toast.success(t("accountCreated"));
      navigate("/shop");
    } catch (error) {
      console.error('Registration error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error.response?.data;
        console.error('API error data:', apiError);
        if (apiError?.errors && Array.isArray(apiError.errors)) {
          const errorMessages = apiError.errors.map((e) => e.msg || e.message).join('. ');
          setError(errorMessages);
        } else if (apiError?.message) {
          setError(apiError.message);
        } else {
          setError(error instanceof Error ? error.message : t("registrationFailed"));
        }
      } else {
        setError(error instanceof Error ? error.message : t("registrationFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 pb-16">
      <div className="py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">{t("registerTitle")}</h1>
        <p className="mt-2 text-[16px] text-on-surface-variant">{t("registerSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-outline-variant bg-surface p-6">
        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {t("name")}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
            type="text"
            required
          />
        </label>

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
          <p className="mt-1 text-[11px] text-on-surface-variant">
            {t("passwordRequirements")}
          </p>
        </label>

        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {t("phoneNumber")}
          </span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
            type="tel"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {t("deliveryAddress")}
          </span>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="min-h-24 w-full rounded-md border border-outline-variant bg-muted-gray p-3 text-[14px] outline-none focus:border-academic-blue"
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
          {loading ? t("creatingAccount") : t("createAccount")}
        </button>

        <p className="text-center text-[14px] text-on-surface-variant">
          {t("alreadyHaveAccount")}{" "}
          <Link className="font-semibold text-academic-blue" to="/login">
            {t("signIn")}
          </Link>
        </p>
      </form>
    </main>
  );
}
