export type ProductBadge = {
  label: string;
  tone: "red" | "neutral" | "muted";
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  categorySlug?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  image: string;
  badge?: ProductBadge;
  variant?: string;
  rating?: number;
  stock?: number;
  featured?: boolean;
  promotionEndDate?: string;
};

export const LOGO_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDf3_PswXtUMiWfmarvMtx02ZlpRwwscKD0hTOpJiMTm2sIJml8m-svSJbRXnJAkCTzy3zXR0CZ9WGvurQXXfzLDDMvC1itrLH0OuiW5444EITeQMmwAL4A_RirHJsoCJHUWpDS2683GeYfwXUGzxJHnjVVT9bqymR8XorlJaHQM2THGFcnoI3JVso0jzoXNKSfCmcTClI7i37Go8dMSkaQQysZvfoYrrEjUzBGhX9dWQYDq3CpnUl-eQwJ9Ec0ZH37JR0_KbNsr_lE";

export const HERO_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB0Hm8ITf3LunbtXezy5dLVqfyRC3Tl0uceg-Bjiebm0YIi1nlvArz-xYuz8fu7SX4MFoVmVzf-8VZTgzPCeltB0UppOlx6IGhcjyqYgjXXUTRJE7wmKiAASk3fO30Omjp6_iO1bkdLp6COHfkwdy6lIQy6UsZltw2Hm3WIJcyVrP_EZQpMh7Rg3AqXwrhPmIjh9GyMQp3451CLnlleMJLC1NJ20fVTT8BrjC_7abTSD1z0QD6iLwQ7DnIz2AxeCpenoKJVVnEaU3ge";

export const categories = [
  { name: "Books", slug: "books", icon: "menu_book", to: "/catalog/books" },
  { name: "Stationery", slug: "stationery", icon: "edit", to: "/catalog/stationery" },
  { name: "Art Supplies", slug: "art-supplies", icon: "palette", to: "/catalog/art-supplies" },
  { name: "Tech", slug: "tech", icon: "devices", to: "/catalog/tech" },
  { name: "Gifts", slug: "gifts", icon: "redeem", to: "/catalog/gifts" },
];

export const products: Product[] = [];

export const trending = products.filter((product) => product.featured).slice(0, 4);
export const stationery = products.filter((product) => product.categorySlug === "stationery");

export const initialCart: (Product & { quantity: number })[] = [];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
