import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText, PenLine, Palette, Monitor, Gift } from "lucide-react";
import { categories } from "@/lib/catalog";
import { dealsApi, homepageApi } from "@/lib/api";
import { TrendingCard } from "@/components/ProductCard";
import { TrendingCardSkeleton } from "@/components/ProductCardSkeleton";
import PromoBar from "@/components/PromoBar";
import DealOfTheDay from "@/components/DealOfTheDay";
import { useLanguage } from "@/lib/language";

export default function Home() {
  const { t } = useLanguage();

  const dealOfTheDayQuery = useQuery({
    queryKey: ["deal-of-the-day"],
    retry: false,
    queryFn: async () => {
      const { data } = await dealsApi.getActive();
      return data.deals || [];
    },
  });

  const sectionsQuery = useQuery({
    queryKey: ["homepage-sections"],
    retry: false,
    queryFn: async () => {
      const { data } = await homepageApi.getSections();
      return data.sections ?? [];
    },
  });

  const sections = sectionsQuery.data ?? [];
  const isLoading = sectionsQuery.isLoading;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="mt-6 md:mt-8 mb-10">
        <PromoBar />
      </div>

      <DealOfTheDay deals={dealOfTheDayQuery.data} loading={dealOfTheDayQuery.isLoading} />

      {isLoading ? (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-headline text-[26px] font-semibold text-academic-blue">Loading...</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <TrendingCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ) : sections.length > 0 ? (
        sections.map((section) => (
          <section key={section.id} className="mb-10">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-headline text-[26px] font-semibold text-academic-blue">{section.title}</h2>
              <Link to="/catalog" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-oxford-red">
                {t("viewAll")}
              </Link>
            </div>
            {section.description && (
              <p className="mb-4 text-[14px] text-on-surface-variant">{section.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-6">
              {section.products?.map((product) => (
                <TrendingCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        ))
      ) : null}

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-headline text-[26px] font-semibold text-academic-blue">{t("categories")}</h2>
          <Link to="/catalog" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-oxford-red">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.slug} to={category.to} className="group flex flex-col items-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant bg-surface text-academic-blue transition-colors group-hover:border-academic-blue">
                <CategoryIcon slug={category.slug} />
              </span>
              <span className="mt-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const iconMap = {
  books: BookOpenText,
  stationery: PenLine,
  "art-supplies": Palette,
  tech: Monitor,
  gifts: Gift,
};

function CategoryIcon({ slug }) {
  const Icon = iconMap[slug] || BookOpenText;
  return <Icon className="h-8 w-8" />;
}
