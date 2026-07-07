import { useState } from "react";
import { toast } from "sonner";
import logoImg from "@/img/Logo.png";
import { newsletterApi } from "@/lib/api";
import { useLanguage } from "@/lib/language";

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email.trim());
      toast.success(t("thanksSubscribe") || "Merci pour votre inscription");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-surface border-t border-outline-variant py-12 mt-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img alt="IBN SINA Logo" className="h-14 w-14 object-contain" src={logoImg} />
            <h2 className="font-headline text-[20px] font-bold text-academic-blue">IBN SINA</h2>
          </div>
          <p className="text-[14px] text-on-surface-variant">
            {t("footerDesc")}
          </p>
        </div>
        {[
          { title: t("catalog"), items: [t("books"), t("stationery"), t("art-supplies")] },
          { title: t("quickLinks"), items: [t("home"), t("trackOrder"), t("contactUs")] },
        ].map((col) => (
          <div key={col.title}>
            <h3 className="font-bold text-academic-blue mb-4 uppercase tracking-wider text-[12px]">
              {col.title}
            </h3>
            <ul className="space-y-2 text-[14px] text-on-surface-variant">
              {col.items.map((i) => (
                <li key={i}>
                  <a className="hover:text-oxford-red" href="#">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="font-bold text-academic-blue mb-4 uppercase tracking-wider text-[12px]">
            Newsletter
          </h3>
          <p className="text-[13px] text-on-surface-variant mb-3 leading-relaxed">
            {t("newsletterCta")}
          </p>
          <div className="flex">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-muted-gray border border-outline-variant px-3 py-2 rounded-l w-full text-[14px] focus:border-academic-blue focus:outline-none"
              placeholder={t("newsletterEmailPlaceholder")}
              type="email"
            />
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-academic-blue text-white px-4 py-2 rounded-r font-semibold text-[12px] uppercase hover:bg-oxford-red transition-colors disabled:opacity-60"
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-outline-variant text-center text-[14px] text-on-surface-variant">
        © 2026 IBN SINA. {t("rightsReserved")}
      </div>
    </footer>
  );
}
