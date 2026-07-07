const bcrypt = require("bcryptjs");
const {
  ORDER_STATUS,
  canTransitionTo,
  normalizeOrderStatus,
  normalizePhone,
  parseOrderReference,
} = require("../lib/orderStatus");

const categories = [
  {
    id: "cat-books",
    slug: "books",
    name: "Books",
    description: "Reading and reference titles for thoughtful workspaces.",
  },
  {
    id: "cat-stationery",
    slug: "stationery",
    name: "Stationery",
    description: "Pens, notebooks, and writing tools.",
  },
  {
    id: "cat-art-supplies",
    slug: "art-supplies",
    name: "Art Supplies",
    description: "Paper, markers, and creative tools.",
  },
  {
    id: "cat-tech",
    slug: "tech",
    name: "Tech",
    description: "Compact accessories that make the desk work harder.",
  },
  {
    id: "cat-gifts",
    slug: "gifts",
    name: "Gifts",
    description: "Objects that feel intentional and useful.",
  },
];

const brands = [
  { id: "brand-pilot", slug: "pilot", name: "Pilot" },
  { id: "brand-stabilo", slug: "stabilo", name: "Stabilo" },
  { id: "brand-lamy", slug: "lamy", name: "Lamy" },
  { id: "brand-moleskine", slug: "moleskine", name: "Moleskine" },
  { id: "brand-muji", slug: "muji", name: "Muji" },
  { id: "brand-baseus", slug: "baseus", name: "Baseus" },
];

const products = [
  {
    id: "prod-rand-1",
    slug: "luxury-fountain-pen-982",
    title: "Luxury Fountain Pen 982",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "stationery",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 45.99,
    originalPrice: 54.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.8,
    stock: 75,
  },
  {
    id: "prod-rand-2",
    slug: "mechanical-pencil-0-7mm-231",
    title: "Mechanical Pencil 0.7mm 231",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "stationery",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 12.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 120,
  },
  {
    id: "prod-rand-3",
    slug: "sketching-charcoal-set-489",
    title: "Sketching Charcoal Set 489",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "art-supplies",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 29.99,
    originalPrice: 35.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.7,
    stock: 40,
  },
  {
    id: "prod-rand-4",
    slug: "watercolor-brush-set-602",
    title: "Watercolor Brush Set 602",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "art-supplies",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 34.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1565026051657-130190dcca21?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.6,
    stock: 65,
  },
  {
    id: "prod-rand-5",
    slug: "acrylic-painting-canvas-a3-112",
    title: "Acrylic Painting Canvas A3 112",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "art-supplies",
    brand: "Muji",
    brandSlug: "muji",
    price: 19.99,
    originalPrice: 24.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.9,
    stock: 90,
  },
  {
    id: "prod-rand-6",
    slug: "eraser-pack-of-4-321",
    title: "Eraser Pack of 4 321",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "stationery",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 4.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1455390213941-b7cae2642b47?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.3,
    stock: 150,
  },
  {
    id: "prod-rand-7",
    slug: "drafting-ruler-set-782",
    title: "Drafting Ruler Set 782",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 15.99,
    originalPrice: 19.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.4,
    stock: 55,
  },
  {
    id: "prod-rand-8",
    slug: "hardcover-journal-black-991",
    title: "Hardcover Journal Black 991",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "books",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 27.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.8,
    stock: 35,
  },
  {
    id: "prod-rand-9",
    slug: "spiral-notebook-a4-443",
    title: "Spiral Notebook A4 443",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "stationery",
    brand: "Muji",
    brandSlug: "muji",
    price: 9.99,
    originalPrice: 12.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.2,
    stock: 110,
  },
  {
    id: "prod-rand-10",
    slug: "weekly-desk-planner-234",
    title: "Weekly Desk Planner 234",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "stationery",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 22.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.6,
    stock: 80,
  },
  {
    id: "prod-rand-11",
    slug: "sticky-notes-pack-542",
    title: "Sticky Notes Pack 542",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 5.99,
    originalPrice: 7.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 140,
  },
  {
    id: "prod-rand-12",
    slug: "metal-paperclips-rainbow-882",
    title: "Metal Paperclips Rainbow 882",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "stationery",
    brand: "Muji",
    brandSlug: "muji",
    price: 6.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1565026051657-130190dcca21?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.4,
    stock: 125,
  },
  {
    id: "prod-rand-13",
    slug: "premium-scissors-8-inch-322",
    title: "Premium Scissors 8 Inch 322",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "stationery",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 18.99,
    originalPrice: 22.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.7,
    stock: 45,
  },
  {
    id: "prod-rand-14",
    slug: "double-sided-tape-roller-671",
    title: "Double-Sided Tape Roller 671",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 8.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1455390213941-b7cae2642b47?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.3,
    stock: 95,
  },
  {
    id: "prod-rand-15",
    slug: "desktop-pen-holder-902",
    title: "Desktop Pen Holder 902",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 14.99,
    originalPrice: 18.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.6,
    stock: 60,
  },
  {
    id: "prod-rand-16",
    slug: "felt-tip-markers-24-pack-441",
    title: "Felt-Tip Markers 24 Pack 441",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "art-supplies",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 25.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.8,
    stock: 70,
  },
  {
    id: "prod-rand-17",
    slug: "gel-ink-pens-multi-color-129",
    title: "Gel Ink Pens Multi-color 129",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "stationery",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 16.5,
    originalPrice: 19.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 105,
  },
  {
    id: "prod-rand-18",
    slug: "graph-paper-pad-a4-561",
    title: "Graph Paper Pad A4 561",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 7.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.4,
    stock: 85,
  },
  {
    id: "prod-rand-19",
    slug: "calligraphy-ink-black-903",
    title: "Calligraphy Ink Black 903",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "art-supplies",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 13.5,
    originalPrice: 16.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.7,
    stock: 50,
  },
  {
    id: "prod-rand-20",
    slug: "leather-pencil-case-882",
    title: "Leather Pencil Case 882",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "gifts",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 39.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1565026051657-130190dcca21?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.9,
    stock: 30,
  },
  {
    id: "prod-rand-21",
    slug: "dual-brush-markers-702",
    title: "Dual Brush Markers 702",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "art-supplies",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 32.5,
    originalPrice: 38.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.6,
    stock: 40,
  },
  {
    id: "prod-rand-22",
    slug: "origami-paper-pack-441",
    title: "Origami Paper Pack 441",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "art-supplies",
    brand: "Muji",
    brandSlug: "muji",
    price: 8.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1455390213941-b7cae2642b47?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 130,
  },
  {
    id: "prod-rand-23",
    slug: "clear-ruler-30cm-892",
    title: "Clear Ruler 30cm 892",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 3.5,
    originalPrice: 4.5,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.2,
    stock: 145,
  },
  {
    id: "prod-rand-24",
    slug: "heavy-duty-stapler-671",
    title: "Heavy Duty Stapler 671",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 24.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.6,
    stock: 55,
  },
  {
    id: "prod-rand-25",
    slug: "desktop-document-tray-901",
    title: "Desktop Document Tray 901",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "gifts",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 29.99,
    originalPrice: 35.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 48,
  },
  {
    id: "prod-rand-26",
    slug: "sticky-index-tabs-881",
    title: "Sticky Index Tabs 881",
    description: "High quality and reliable for everyday use. Durable materials.",
    categorySlug: "stationery",
    brand: "Muji",
    brandSlug: "muji",
    price: 4.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.4,
    stock: 160,
  },
  {
    id: "prod-rand-27",
    slug: "mini-whiteboard-set-331",
    title: "Mini Whiteboard Set 331",
    description: "Perfect for students, teachers, and professionals alike. Highly recommended.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 39.99,
    originalPrice: 49.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    featured: true,
    rating: 4.7,
    stock: 25,
  },
  {
    id: "prod-rand-28",
    slug: "whiteboard-markers-set-554",
    title: "Whiteboard Markers Set 554",
    description: "A classic item designed for comfort, style, and efficiency.",
    categorySlug: "stationery",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 11.99,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1565026051657-130190dcca21?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.5,
    stock: 90,
  },
  {
    id: "prod-rand-29",
    slug: "pastel-acrylic-paint-991",
    title: "Pastel Acrylic Paint 991",
    description: "Featuring modern materials and sleek construction. Elevate your desk space.",
    categorySlug: "art-supplies",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 21.5,
    originalPrice: 26.99,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.6,
    stock: 60,
  },
  {
    id: "prod-rand-30",
    slug: "glue-sticks-pack-672",
    title: "Glue Sticks Pack 672",
    description: "Great value pack. Long-lasting, reliable, and premium quality.",
    categorySlug: "stationery",
    brand: null,
    brandSlug: null,
    price: 5.5,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1455390213941-b7cae2642b47?auto=format&fit=crop&w=800&q=80",
    featured: false,
    rating: 4.3,
    stock: 140,
  },
  {
    id: "prod-journal-navy",
    slug: "classic-hardcover-journal-navy",
    title: "Classic Hardcover Journal - Navy Blue Edition",
    description: "A durable journal with smooth paper and a refined cloth cover.",
    categorySlug: "stationery",
    brand: null,
    price: 24,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLuid_yohZZz3e_1vGozTwad7qCBPi3d2DPhrW3hfrfYpDLOjps7lytC4Ucly0xYGAWxHQe1L-tPfY_Is4BpsrTUh8Y2Lj7RDiLNe2g9yOTsm0Cd4lVMpSeu9rV92loraTjhu0i-m1OY13M5N1HpFHlQRbIIrNI17ZTCbvMh4JQjOyUgWBWObUZ62Ip8fH6Oy0uUZUNloniWvj-ygse8D7kpvZO_aFA8aMPm34aSjiaLdA7rYdglLpTjE3Dh",
    featured: true,
    rating: 4.8,
    stock: 32,
  },
  {
    id: "prod-fine-liner-set",
    slug: "premium-fine-liner-pen-set",
    title: "Premium Fine-Liner Pen Set - Assorted Colors",
    description: "A clean, precise set for sketches, notes, and color coding.",
    categorySlug: "stationery",
    brand: null,
    price: 18.5,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM",
    featured: true,
    rating: 4.7,
    stock: 18,
  },
  {
    id: "prod-sketchbook-pro",
    slug: "professional-sketchbook",
    title: "Professional Sketchbook - Heavyweight Acid-Free Paper",
    description: "A sturdy sketchbook built for studies, drafts, and finished work.",
    categorySlug: "art-supplies",
    brand: null,
    price: 32,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLtWPEWZmlVrNUUjGdGyCRd8vhCVzND0rZLVw0GUmBpOQrJv2LKxYszZbp7OTRvcqnD_whehL_Q2SqCDzFLSMLqgIM6LrcnrsNzEA7BHg2SNMtzHoJJOJLMe6z1ozMWPRHT0kwY41Xy_-ebRvYVcoq6RPAjFPXuW7bDVCaX7Q4OY0RVR1UtiqTGjLt5ZOWZayA-jfgkMbFZYAj4gsADSkpGobArIW6qYdt36CbnEGq2fqBkz90JfMiOoMRo9",
    featured: true,
    rating: 4.9,
    stock: 24,
  },
  {
    id: "prod-birch-organizer",
    slug: "birch-wood-desk-organizer",
    title: "Birch Wood Desk Organizer - Modular Design",
    description: "A flexible desk organizer that keeps small tools in one place.",
    categorySlug: "gifts",
    brand: null,
    price: 45,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbQ4kFafv11pzds52xzwMDXM9To2vkwOTnnW0xuTx9J7ctLaSQ-K0bxzm-Poel9dC5-5NEJoTq1qvGcE8rC-MuAsWCLAeuJUgdzNvjHlBmI0GRvBpO88QQew_xvU016gzNyy7ebX6CNyGnUUJ7xvr7zpE0EUrLYZ-ft3B2zW6Qg-oWWcgK_OslZz2srNSJiK-OmwhD3rUFgknsWI7A2cpKGf4O4Jfb3u4kebC7lct0C7Z01kejDdz41ASCSy66v5RkKX8QTL3E0UcY",
    featured: true,
    rating: 4.6,
    stock: 12,
  },
  {
    id: "prod-exec-fountain-pen",
    slug: "executive-fountain-pen-set",
    title: "Executive Fountain Pen Set",
    description: "A premium writing set with balanced weight and smooth ink flow.",
    categorySlug: "stationery",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 120,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM",
    badge: { label: "Premium", tone: "neutral" },
    rating: 4.9,
    stock: 8,
  },
  {
    id: "prod-pastel-highlighter",
    slug: "pastel-highlighter-set",
    title: "Pastel Highlighter Set (6 Pack)",
    description: "Soft tones, clean lines, and a compact set for daily study.",
    categorySlug: "stationery",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 14,
    originalPrice: 18.5,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLsv-uhFk17KGk_jgPWP20N0eBNjMnQlQunwqaGwTOtr-LeOum-VbyDTF_JGvDqAD4PTNWzMsEs921_JaBUzaH4_0HPHJTU3AIzw0RRa5g4ee8_NgdyTsHBiRRtyXzcLitVrhjQUeQI1tQbZxoFcwwk9tzTt8xI-4ZxUXL8G7xq8q-4G4bNZbdCNd364KlkogXgEVl7YPrSYfLSsT6sazmRj5xawCjCQdFW7SPMX6Vj0jvq5VO0UIMEOews",
    badge: { label: "Sale", tone: "red" },
    rating: 4.5,
    stock: 22,
  },
  {
    id: "prod-rollerball-fine",
    slug: "rollerball-pen-fine-point",
    title: "Rollerball Pen Fine Point",
    description: "A precise everyday pen with a smooth and balanced feel.",
    categorySlug: "stationery",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 22,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM",
    rating: 4.4,
    stock: 15,
  },
  {
    id: "prod-moleskine-classic",
    slug: "classic-soft-cover-notebook",
    title: "Classic Soft Cover Notebook",
    description: "A daily notebook that fits naturally into work and study routines.",
    categorySlug: "stationery",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 28,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLuid_yohZZz3e_1vGozTwad7qCBPi3d2DPhrW3hfrfYpDLOjps7lytC4Ucly0xYGAWxHQe1L-tPfY_Is4BpsrTUh8Y2Lj7RDiLNe2g9yOTsm0Cd4lVMpSeu9rV92loraTjhu0i-m1OY13M5N1HpFHlQRbIIrNI17ZTCbvMh4JQjOyUgWBWObUZ62Ip8fH6Oy0uUZUNloniWvj-ygse8D7kpvZO_aFA8aMPm34aSjiaLdA7rYdglLpTjE3Dh",
    rating: 4.6,
    stock: 20,
  },
  {
    id: "prod-desk-organizer-modular",
    slug: "modular-birch-desk-organizer",
    title: "Modular Birch Desk Organizer",
    description: "A clean modular organizer for pens, cards, and small tools.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 45,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbQ4kFafv11pzds52xzwMDXM9To2vkwOTnnW0xuTx9J7ctLaSQ-K0bxzm-Poel9dC5-5NEJoTq1qvGcE8rC-MuAsWCLAeuJUgdzNvjHlBmI0GRvBpO88QQew_xvU016gzNyy7ebX6CNyGnUUJ7xvr7zpE0EUrLYZ-ft3B2zW6Qg-oWWcgK_OslZz2srNSJiK-OmwhD3rUFgknsWI7A2cpKGf4O4Jfb3u4kebC7lct0C7Z01kejDdz41ASCSy66v5RkKX8QTL3E0UcY",
    rating: 4.3,
    stock: 10,
  },
  {
    id: "prod-gel-pen-set",
    slug: "gel-pen-set-12-colors",
    title: "Gel Pen Set - 12 Colors",
    description: "A versatile color pack for notes, sketching, and labeling.",
    categorySlug: "art-supplies",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 16,
    originalPrice: null,
    currency: "DT",
    image:
      "https://lh3.googleusercontent.com/aida/AP1WRLsv-uhFk17KGk_jgPWP20N0eBNjMnQlQunwqaGwTOtr-LeOum-VbyDTF_JGvDqAD4PTNWzMsEs921_JaBUzaH4_0HPHJTU3AIzw0RRa5g4ee8_NgdyTsHBiRRtyXzcLitVrhjQUeQI1tQbZxoFcwwk9tzTt8xI-4ZxUXL8G7xq8q-4G4bNZbdCNd364KlkogXgEVl7YPrSYfLSsT6sazmRj5xawCjCQdFW7SPMX6Vj0jvq5VO0UIMEOews",
    rating: 4.4,
    stock: 19,
  },
  {
    id: "prod-usb-c-hub",
    slug: "usb-c-hub-7-in-1",
    title: "USB-C Hub 7-in-1",
    description: "A compact hub for displays, storage, and fast charging.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 55,
    originalPrice: null,
    currency: "DT",
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=80",
    badge: { label: "New", tone: "muted" },
    rating: 4.7,
    stock: 9,
    featured: true,
  },
  {
    id: "prod-creative-act",
    slug: "the-creative-act-way-of-being",
    title: "The Creative Act: A Way of Being",
    description: "A beautiful and gentle guide to the creative process by Rick Rubin.",
    categorySlug: "books",
    brand: null,
    price: 42,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    stock: 15,
    featured: true,
  },
  {
    id: "prod-show-work",
    slug: "show-your-work",
    title: "Show Your Work!",
    description: "10 ways to share your creativity and get discovered by Austin Kleon.",
    categorySlug: "books",
    brand: null,
    price: 29,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 22,
  },
  {
    id: "prod-atomic-habits",
    slug: "atomic-habits",
    title: "Atomic Habits",
    description: "An easy & proven way to build good habits & break bad ones.",
    categorySlug: "books",
    brand: null,
    price: 38,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    stock: 40,
    featured: true,
  },
  {
    id: "prod-designing-design",
    slug: "designing-design",
    title: "Designing Design",
    description: "Kenya Hara's profound exploration of design principles and minimalism.",
    categorySlug: "books",
    brand: "Muji",
    brandSlug: "muji",
    price: 65,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 8,
  },
  {
    id: "prod-grid-systems",
    slug: "grid-systems-in-graphic-design",
    title: "Grid Systems in Graphic Design",
    description: "The visual communication handbook for professional designers.",
    categorySlug: "books",
    brand: null,
    price: 85,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 12,
  },
  {
    id: "prod-keep-going",
    slug: "keep-going-10-ways",
    title: "Keep Going",
    description: "10 ways to stay creative in good times and bad by Austin Kleon.",
    categorySlug: "books",
    brand: null,
    price: 26,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    stock: 18,
  },
  {
    id: "prod-minimal-fountain-pen",
    slug: "minimalist-fountain-pen",
    title: "Minimalist Fountain Pen",
    description: "Refined matte finish writing instrument with smooth ink delivery.",
    categorySlug: "stationery",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 45,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 25,
    featured: true,
  },
  {
    id: "prod-recycled-notebook",
    slug: "recycled-paper-notebook",
    title: "Recycled Paper Notebook",
    description: "Plain eco-friendly pages bound in a sturdy recycled cover.",
    categorySlug: "stationery",
    brand: "Muji",
    brandSlug: "muji",
    price: 12,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    stock: 50,
  },
  {
    id: "prod-leather-pen-case",
    slug: "leather-pen-pencil-case",
    title: "Leather Pen Pencil Case",
    description: "Premium full-grain leather zipper case for your essential pens.",
    categorySlug: "stationery",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 34,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 15,
  },
  {
    id: "prod-a5-grid-refill",
    slug: "a5-grid-refill-notebook",
    title: "A5 Grid Refill Notebook",
    description: "Premium acid-free grid paper ideal for layouts and handwriting.",
    categorySlug: "stationery",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 8,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80",
    rating: 4.4,
    stock: 80,
  },
  {
    id: "prod-brass-ruler",
    slug: "solid-brass-ruler",
    title: "Solid Brass Ruler",
    description: "A heavy, timeless 15cm ruler that patinates beautifully with age.",
    categorySlug: "stationery",
    brand: "Lamy",
    brandSlug: "lamy",
    price: 29,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    stock: 20,
  },
  {
    id: "prod-dual-brush-pens",
    slug: "dual-brush-pen-set",
    title: "Dual-Brush Pen Set",
    description: "Double-sided markers featuring flexible brush and fine-tips.",
    categorySlug: "stationery",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 48,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 30,
  },
  {
    id: "prod-watercolor-set",
    slug: "premium-watercolor-set",
    title: "Premium Watercolor Set",
    description: "Artist-grade watercolor pan set with excellent lightfastness.",
    categorySlug: "art-supplies",
    brand: "Canson",
    brandSlug: "canson",
    price: 75,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    stock: 12,
  },
  {
    id: "prod-acrylic-tubes",
    slug: "acrylic-color-tubes-12-pack",
    title: "Acrylic Color Tubes (12 Pack)",
    description: "Vibrant high-viscosity acrylic paints with rich pigments.",
    categorySlug: "art-supplies",
    brand: "Canson",
    brandSlug: "canson",
    price: 54,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 16,
  },
  {
    id: "prod-mixed-media-pad",
    slug: "mixed-media-sketchpad",
    title: "Mixed Media Sketchpad",
    description: "Heavyweight paper suited for ink, watercolor, and sketches.",
    categorySlug: "art-supplies",
    brand: "Canson",
    brandSlug: "canson",
    price: 22,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    stock: 35,
  },
  {
    id: "prod-pastel-chalks",
    slug: "soft-pastel-chalk-set",
    title: "Soft Pastel Chalk Set",
    description: "Velvety smooth pastels with intense color laydown and easy blending.",
    categorySlug: "art-supplies",
    brand: "Stabilo",
    brandSlug: "stabilo",
    price: 39,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    stock: 25,
  },
  {
    id: "prod-brush-kit",
    slug: "artist-paint-brush-kit",
    title: "Artist Paint Brush Kit",
    description: "Multi-shape professional synthetic brush set for fine details.",
    categorySlug: "art-supplies",
    brand: "Canson",
    brandSlug: "canson",
    price: 29,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 40,
  },
  {
    id: "prod-drafting-pencil",
    slug: "drafting-pencil-0-5mm",
    title: "Drafting Pencil 0.5mm",
    description: "All-metal knurled grip mechanical pencil for engineering level precision.",
    categorySlug: "art-supplies",
    brand: "Pilot",
    brandSlug: "pilot",
    price: 18,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 60,
  },
  {
    id: "prod-mech-keyboard",
    slug: "mechanical-keyboard-tkl",
    title: "Mechanical Keyboard TKL",
    description: "Tactile brown switches with backlighting in a space-saving layout.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 189,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    stock: 14,
    featured: true,
  },
  {
    id: "prod-wireless-mouse",
    slug: "ergonomic-wireless-mouse",
    title: "Ergonomic Wireless Mouse",
    description: "Precision tracking mouse designed to reduce wrist strain.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 89,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 20,
  },
  {
    id: "prod-laptop-stand",
    slug: "aluminum-laptop-stand",
    title: "Aluminum Laptop Stand",
    description: "Elevates your screen to eye level to improve posture and cooling.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 65,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 25,
  },
  {
    id: "prod-felt-deskpad",
    slug: "desk-pad-felt-medium",
    title: "Desk Pad Felt Medium",
    description: "Warm, textured premium merino wool felt mat for keyboard and mouse.",
    categorySlug: "tech",
    brand: "Muji",
    brandSlug: "muji",
    price: 39,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    stock: 18,
  },
  {
    id: "prod-usbc-charger",
    slug: "dual-port-usb-c-charger",
    title: "Dual Port USB-C Charger",
    description: "65W fast charger compatible with laptops, tablets, and phones.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 49,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 30,
  },
  {
    id: "prod-noise-earbuds",
    slug: "noise-cancelling-earbuds",
    title: "Noise-Cancelling Earbuds",
    description: "Active noise-cancelling wireless earbuds with deep soundstage.",
    categorySlug: "tech",
    brand: "Baseus",
    brandSlug: "baseus",
    price: 129,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 15,
  },
  {
    id: "prod-soy-candle",
    slug: "aromatic-soy-candle-set",
    title: "Aromatic Soy Candle Set",
    description: "Hand-poured candle set infused with pure essential oils.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 34,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    stock: 40,
  },
  {
    id: "prod-matcha-kit",
    slug: "matcha-starter-ceremony-kit",
    title: "Matcha Starter Ceremony Kit",
    description: "Traditional bamboo whisk, ceramic bowl, and scoop set.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 79,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    stock: 10,
    featured: true,
  },
  {
    id: "prod-leather-cardholder",
    slug: "minimalist-leather-cardholder",
    title: "Minimalist Leather Cardholder",
    description: "Sleek pocket card holder crafted from full-grain leather.",
    categorySlug: "gifts",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 45,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1627124118123-e4d3eaa97f3f?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 25,
  },
  {
    id: "prod-tea-box",
    slug: "curated-tea-gift-box",
    title: "Curated Tea Gift Box",
    description: "Selection of 6 premium organic loose-leaf tea canisters.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 59,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    stock: 15,
  },
  {
    id: "prod-ceramic-mug",
    slug: "handcrafted-ceramic-mug",
    title: "Handcrafted Ceramic Mug",
    description: "Wabi-sabi inspired handmade stoneware mug with unique glaze.",
    categorySlug: "gifts",
    brand: "Muji",
    brandSlug: "muji",
    price: 28,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    stock: 30,
  },
  {
    id: "prod-hourglass",
    slug: "hourglass-brass-timer",
    title: "Hourglass Brass Timer",
    description: "30-minute visual focus tool with solid brass pillars.",
    categorySlug: "gifts",
    brand: "Moleskine",
    brandSlug: "moleskine",
    price: 42,
    originalPrice: null,
    currency: "DT",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    stock: 20,
  },
];

const users = [
  {
    id: "staff-001",
    name: "Ibn Sina Staff",
    email: "adelmoula9hwa1234@gmail.com",
    passwordHash: bcrypt.hashSync("M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq", 10),
    role: "staff",
  },
];

const carts = new Map();
const wishlists = new Map();
const orders = [];
const newsletterSubscribers = [];
const promotions = [
  {
    id: "promo-tuf-gaming",
    code: "TUFDEAL",
    title: "ASUS TUF GAMING F16",
    description: JSON.stringify({
      notes: "Promo spéciale ordinateur portable de gaming",
      banner_subtitle: "SPÉCIAL PROMO",
      banner_badge_left: "JEU OFFERT",
      banner_badge_left_sub: "Resident Evil",
      banner_badge_left_img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=200&q=80",
      banner_reduction: "+ RÉDUCTION JUSQU'À",
      banner_discount: "-1220DT",
      banner_image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
      banner_bg_img: "/promo_tech_bg.png",
      banner_link: "/catalog/tech",
    }),
    discount_type: "fixed",
    discount_value: 1220,
    max_uses: null,
    used_count: 0,
    start_date: new Date("2026-06-01T00:00:00.000Z"),
    end_date: new Date("2026-08-31T23:59:59.000Z"),
    is_active: 1,
    created_by: "staff-001",
    created_at: new Date(),
  },
  {
    id: "promo-creative-thought",
    code: "SINA15",
    title: "OUTILS DE PENSÉE CRÉATIVE",
    description: JSON.stringify({
      notes: "Promo de bienvenue 15% de reduction collection luxe",
      banner_subtitle: "COLLECTION LUXE",
      banner_badge_left: "CADEAU OFFERT",
      banner_badge_left_sub: "Carnet de notes",
      banner_badge_left_img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=200&q=80",
      banner_reduction: "OFFRE EXCLUSIVE",
      banner_discount: "-15% SINA15",
      banner_image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
      banner_bg_img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      banner_link: "/catalog/stationery",
    }),
    discount_type: "percentage",
    discount_value: 15,
    max_uses: 500,
    used_count: 0,
    start_date: new Date("2026-05-01T00:00:00.000Z"),
    end_date: new Date("2026-08-31T23:59:59.000Z"),
    is_active: 1,
    created_by: "staff-001",
    created_at: new Date(),
  },
  {
    id: "promo-tech-essentials",
    code: "LAUNCH55",
    title: "USB-C HUB & SYSTEM",
    description: JSON.stringify({
      notes: "Prix de lancement hub Baseus",
      banner_subtitle: "WORKFLOW MINIMALISTE",
      banner_badge_left: "LIVRAISON",
      banner_badge_left_sub: "Gratuite dès 100DT",
      banner_badge_left_img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80",
      banner_reduction: "PRIX DE LANCEMENT",
      banner_discount: "55DT",
      banner_image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=600&q=80",
      banner_bg_img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      banner_link: "/catalog/tech",
    }),
    discount_type: "fixed",
    discount_value: 55,
    max_uses: null,
    used_count: 0,
    start_date: new Date("2026-06-01T00:00:00.000Z"),
    end_date: new Date("2026-08-31T23:59:59.000Z"),
    is_active: 1,
    created_by: "staff-001",
    created_at: new Date(),
  }
];

const dealOfTheDay = [
  {
    id: "deal-1",
    productId: "prod-rand-3",
    title: "Sketching Charcoal Set 489",
    ref: "489",
    description: "A classic item designed for comfort, style, and efficiency. Perfect for artists and creative professionals.",
    originalPrice: 35.99,
    discount: "-17%",
    salePrice: 29.99,
    expiryTimestamp: new Date("2026-07-01T00:00:00.000Z"),
    is_active: true,
  },
  {
    id: "deal-2",
    productId: "prod-matcha-kit",
    title: "Matcha Starter Ceremony Kit",
    ref: "KIT-001",
    description: "Traditional bamboo whisk, ceramic bowl, and scoop set for authentic matcha preparation.",
    originalPrice: 95,
    discount: "-17%",
    salePrice: 79,
    expiryTimestamp: new Date("2026-07-15T00:00:00.000Z"),
    is_active: true,
  }
];

const homepageSections = [
  {
    id: "section-1",
    title: "All Products",
    slug: "all-products",
    description: "Browse our complete collection",
    productIds: [
      "prod-rand-1", "prod-rand-2", "prod-rand-3", "prod-rand-4", "prod-rand-5",
      "prod-rand-6", "prod-rand-7", "prod-rand-8", "prod-rand-9", "prod-rand-10",
      "prod-rand-11", "prod-rand-12", "prod-rand-13", "prod-rand-14", "prod-rand-15",
      "prod-rand-16", "prod-rand-17", "prod-rand-18", "prod-rand-19", "prod-rand-20",
      "prod-rand-21", "prod-rand-22", "prod-rand-23", "prod-rand-24", "prod-rand-25",
      "prod-rand-26", "prod-rand-27", "prod-rand-28", "prod-rand-29", "prod-rand-30"
    ],
    order: 1,
    is_active: true,
  }
];

let userCounter = 2;
let orderCounter = 1;
let newsletterCounter = 1;
let categoryCounter = categories.length + 1;
let productCounter = products.length + 1;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getProductByIdOrSlug(identifier) {
  return products.find(
    (product) => product.id === identifier || product.slug === identifier,
  );
}

function getCategoryBySlug(slug) {
  return categories.find((category) => category.slug === slug);
}

function getBrandBySlug(slug) {
  return brands.find((brand) => brand.slug === slug);
}

function getUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function getUserById(id) {
  return users.find((user) => user.id === id);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function getCartForUser(userId) {
  if (!carts.has(userId)) {
    carts.set(userId, []);
  }
  return carts.get(userId);
}

function serializeCart(userId) {
  const items = getCartForUser(userId).map((entry) => {
    const product = getProductByIdOrSlug(entry.productId);
    if (!product) return null;
    return {
      id: entry.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      price: product.price,
      currency: product.currency,
      image: product.image,
      quantity: entry.quantity,
      stock: product.stock ?? 0,
      variant: entry.variant ?? null,
      total: Number((product.price * entry.quantity).toFixed(2)),
    };
  }).filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return {
    items,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      shipping: subtotal >= Number(process.env.FREE_SHIPPING_THRESHOLD || 200) ? 0 : 12,
      total: Number((subtotal + (subtotal >= Number(process.env.FREE_SHIPPING_THRESHOLD || 200) ? 0 : 12)).toFixed(2)),
    },
  };
}

function upsertCartItem(userId, productId, quantity = 1) {
  const cart = getCartForUser(userId);
  const existing = cart.find((item) => item.productId === productId);
  const product = getProductByIdOrSlug(productId);
  const stock = product ? (product.stock ?? Infinity) : Infinity;

  if (existing) {
    existing.quantity = Math.min(Math.max(1, existing.quantity + quantity), stock);
    return existing;
  }
  const item = {
    id: `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId,
    quantity: Math.min(Math.max(1, quantity), stock),
  };
  cart.push(item);
  return item;
}

function updateCartItem(userId, itemId, quantity) {
  const cart = getCartForUser(userId);
  const index = cart.findIndex((item) => item.id === itemId);
  if (index === -1) return null;
  if (quantity <= 0) {
    cart.splice(index, 1);
    return null;
  }
  const product = getProductByIdOrSlug(cart[index].productId);
  const stock = product ? (product.stock ?? Infinity) : Infinity;
  cart[index].quantity = Math.min(quantity, stock);
  return cart[index];
}

function removeCartItem(userId, itemId) {
  const cart = getCartForUser(userId);
  const index = cart.findIndex((item) => item.id === itemId);
  if (index === -1) return false;
  cart.splice(index, 1);
  return true;
}

function clearCart(userId) {
  carts.set(userId, []);
}

function getWishlist(userId) {
  if (!wishlists.has(userId)) {
    wishlists.set(userId, []);
  }
  return wishlists.get(userId);
}

function toggleWishlist(userId, productId) {
  const wishlist = getWishlist(userId);
  const index = wishlist.indexOf(productId);
  if (index === -1) {
    wishlist.push(productId);
  } else {
    wishlist.splice(index, 1);
  }
  return wishlist;
}

function createOrder(userId, payload = {}) {
  const cart = getCartForUser(userId);
  const cartItems = cart
    .map((entry) => {
      const product = getProductByIdOrSlug(entry.productId);
      if (!product) return null;
      return {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        quantity: entry.quantity,
        total: Number((product.price * entry.quantity).toFixed(2)),
      };
    })
    .filter(Boolean);

  const sourceItems = Array.isArray(payload.items) && payload.items.length > 0 ? payload.items : cartItems;
  const items = sourceItems.map((item) => {
    if (item.productId) {
      const product = getProductByIdOrSlug(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        quantity: Number(item.quantity ?? 1),
        total: Number((product.price * Number(item.quantity ?? 1)).toFixed(2)),
      };
    }
    return item;
  }).filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= Number(process.env.FREE_SHIPPING_THRESHOLD || 200) ? 0 : 12;
  const total = Number((subtotal + shipping).toFixed(2));

  const now = new Date().toISOString();
  const order = {
    id: `order-${orderCounter++}`,
    customerId: userId,
    userId,
    customerName: String(payload.customerName ?? payload.name ?? "").trim(),
    phone: String(payload.phone ?? "").trim(),
    address: String(payload.address ?? payload.shippingAddress ?? "").trim(),
    shippingAddress: String(payload.address ?? payload.shippingAddress ?? "").trim(),
    notes: payload.notes ?? "",
    status: ORDER_STATUS.PENDING_APPROVAL_CALL,
    statusUpdatedAt: now,
    items: clone(items).map((item) => ({
      ...item,
      id: item.productId ?? item.id,
      name: item.title ?? item.name,
    })),
    subtotal: Number(subtotal.toFixed(2)),
    shipping,
    total,
    createdAt: now,
  };

  orders.unshift(order);
  clearCart(userId);
  return order;
}

function buildOrderItems(payload = {}) {
  const sourceItems = Array.isArray(payload.items) ? payload.items : [];
  return sourceItems
    .map((item) => {
      if (item.productId) {
        const product = getProductByIdOrSlug(item.productId);
        if (!product) return null;
        const quantity = Number(item.quantity ?? 1);
        return {
          id: product.id,
          productId: product.id,
          slug: product.slug,
          name: product.title,
          title: product.title,
          price: product.price,
          quantity,
          image: product.image,
          total: Number((product.price * quantity).toFixed(2)),
        };
      }
      const quantity = Number(item.quantity ?? 1);
      const price = Number(item.price ?? 0);
      return {
        id: item.id ?? item.productId ?? `item-${Math.random().toString(36).slice(2, 8)}`,
        productId: item.productId ?? item.id ?? null,
        slug: item.slug ?? "",
        name: item.name ?? item.title ?? "Item",
        title: item.name ?? item.title ?? "Item",
        price,
        quantity,
        image: item.image ?? "",
        total: Number((price * quantity).toFixed(2)),
      };
    })
    .filter(Boolean);
}

function createGuestOrder(payload = {}) {
  const items = buildOrderItems(payload);
  if (!items.length) {
    const error = new Error("Order must include at least one item.");
    error.statusCode = 400;
    throw error;
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= Number(process.env.FREE_SHIPPING_THRESHOLD || 200) ? 0 : 12;
  const total = Number((subtotal + shipping).toFixed(2));
  const now = new Date().toISOString();

  const order = {
    id: `order-${Date.now()}`,
    customerId: null,
    userId: null,
    customerName: String(payload.customerName ?? payload.name ?? "").trim(),
    phone: String(payload.phone ?? "").trim(),
    address: String(payload.address ?? payload.shippingAddress ?? "").trim(),
    notes: String(payload.notes ?? "").trim(),
    status: ORDER_STATUS.PENDING_APPROVAL_CALL,
    statusUpdatedAt: now,
    items: clone(items),
    subtotal: Number(subtotal.toFixed(2)),
    shipping,
    total,
    createdAt: now,
  };

  orders.unshift(order);
  return order;
}

function getOrderById(orderId) {
  const id = parseOrderReference(orderId) || orderId;
  return orders.find((order) => order.id === id) ?? null;
}

function findOrderByReference(reference, phone) {
  const orderId = parseOrderReference(reference);
  const normalizedPhone = normalizePhone(phone);
  if (!orderId || !normalizedPhone) return null;

  const order = getOrderById(orderId);
  if (!order) return null;
  if (normalizePhone(order.phone) !== normalizedPhone) return null;
  return order;
}

function updateOrderStatus(orderId, nextStatus) {
  const order = getOrderById(orderId);
  if (!order) return null;

  const normalizedNext = normalizeOrderStatus(nextStatus);
  if (!canTransitionTo(order.status, normalizedNext)) {
    const error = new Error("Invalid status transition.");
    error.statusCode = 400;
    throw error;
  }

  // Decrement stock when order is approved and delivered
  if (normalizedNext === ORDER_STATUS.APPROVED_DELIVERED && order.status !== ORDER_STATUS.APPROVED_DELIVERED) {
    for (const item of order.items || []) {
      const product = getProductByIdOrSlug(item.productId || item.id);
      if (product && product.stock !== undefined) {
        product.stock = Math.max(0, product.stock - (item.quantity || 1));
      }
    }
  }

  // Restore stock when order is returned after delivery
  if (normalizedNext === ORDER_STATUS.RETURNED_AFTER_DELIVERY && order.status === ORDER_STATUS.APPROVED_DELIVERED) {
    for (const item of order.items || []) {
      const product = getProductByIdOrSlug(item.productId || item.id);
      if (product && product.stock !== undefined) {
        product.stock = product.stock + (item.quantity || 1);
      }
    }
  }

  order.status = normalizedNext;
  order.statusUpdatedAt = new Date().toISOString();
  return order;
}

function addNewsletterSubscriber(email) {
  const existing = newsletterSubscribers.find(
    (subscriber) => subscriber.email.toLowerCase() === String(email).toLowerCase(),
  );
  if (existing) return existing;
  const subscriber = {
    id: `news-${newsletterCounter++}`,
    email,
    createdAt: new Date().toISOString(),
  };
  newsletterSubscribers.push(subscriber);
  return subscriber;
}

function registerUser({ name, email, password, phone, address, city }) {
  if (getUserByEmail(email)) {
    const error = new Error("An account with that email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = {
    id: `user-${userCounter++}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "customer",
    phone: phone?.trim() ?? "",
    address: address?.trim() ?? "",
    city: city?.trim() ?? "",
  };
  users.push(user);
  return user;
}

function updateUser(userId, data) {
  const user = getUserById(userId);
  if (!user) return null;
  if (typeof data.name === "string" && data.name.trim()) user.name = data.name.trim();
  if (typeof data.email === "string" && data.email.trim()) user.email = data.email.trim();
  if (typeof data.phone === "string") user.phone = data.phone.trim();
  if (typeof data.address === "string") user.address = data.address.trim();
  if (typeof data.city === "string") user.city = data.city.trim();
  return user;
}

function changePassword(userId, currentPassword, newPassword) {
  const user = getUserById(userId);
  if (!user) return null;
  const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  return user;
}

function createCategory({ name, slug, description }) {
  if (!name?.trim()) {
    const error = new Error("Category name is required.");
    error.statusCode = 400;
    throw error;
  }

  const finalSlug = slugify(slug || name);
  if (categories.some((category) => category.slug === finalSlug)) {
    const error = new Error("A category with that slug already exists.");
    error.statusCode = 409;
    throw error;
  }

  const category = {
    id: `cat-${categoryCounter++}`,
    slug: finalSlug,
    name: name.trim(),
    description: description?.trim() ?? "",
  };
  categories.push(category);
  return category;
}

function updateCategory(categoryId, data) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;

  if (typeof data.name === "string" && data.name.trim()) {
    category.name = data.name.trim();
  }
  if (typeof data.slug === "string" && data.slug.trim()) {
    const nextSlug = slugify(data.slug);
    if (categories.some((item) => item.id !== categoryId && item.slug === nextSlug)) {
      const error = new Error("A category with that slug already exists.");
      error.statusCode = 409;
      throw error;
    }
    category.slug = nextSlug;
  }
  if (typeof data.description === "string") {
    category.description = data.description.trim();
  }
  return category;
}

function deleteCategory(categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return false;

  if (products.some((product) => product.categorySlug === category.slug)) {
    const error = new Error("Cannot delete a category that has products.");
    error.statusCode = 400;
    throw error;
  }

  const index = categories.findIndex((item) => item.id === categoryId);
  categories.splice(index, 1);
  return true;
}

function createProduct(data = {}) {
  if (!data.title?.trim() && !data.name?.trim()) {
    const error = new Error("Product name is required.");
    error.statusCode = 400;
    throw error;
  }

  const title = (data.title || data.name).trim();
  const slug = slugify(data.slug || title);
  if (products.some((product) => product.slug === slug)) {
    const error = new Error("A product with that slug already exists.");
    error.statusCode = 409;
    throw error;
  }

  const category =
    (data.categorySlug && getCategoryBySlug(data.categorySlug)) ||
    categories.find((item) => item.id === data.category_id) ||
    categories[0];

  const product = {
    id: data.id || `prod-${productCounter++}`,
    slug,
    title,
    description: data.description?.trim() ?? "",
    categorySlug: category?.slug ?? "stationery",
    brand: data.brand ?? null,
    brandSlug: data.brandSlug ?? null,
    price: Number(data.price ?? 0),
    originalPrice: data.originalPrice ?? data.sale_price ?? null,
    currency: "DT",
    image: data.image || data.image_url || "",
    rating: Number(data.rating ?? 4.5),
    stock: Number(data.stock ?? data.stock_qty ?? 0),
  };

  if (data.badge) product.badge = data.badge;
  products.push(product);
  return product;
}

function updateProduct(productId, data = {}) {
  const product = products.find((item) => item.id === productId || item.slug === productId);
  if (!product) return null;

  if (typeof data.title === "string" && data.title.trim()) product.title = data.title.trim();
  if (typeof data.name === "string" && data.name.trim()) product.title = data.name.trim();
  if (typeof data.slug === "string" && data.slug.trim()) {
    const nextSlug = slugify(data.slug);
    if (products.some((item) => item.id !== product.id && item.slug === nextSlug)) {
      const error = new Error("A product with that slug already exists.");
      error.statusCode = 409;
      throw error;
    }
    product.slug = nextSlug;
  }
  if (typeof data.description === "string") product.description = data.description.trim();
  if (data.price !== undefined) product.price = Number(data.price);
  if (data.stock !== undefined || data.stock_qty !== undefined) {
    product.stock = Number(data.stock ?? data.stock_qty);
  }
  if (data.image !== undefined || data.image_url !== undefined) {
    product.image = data.image || data.image_url || "";
  }
  if (data.categorySlug) {
    const category = getCategoryBySlug(data.categorySlug);
    if (category) product.categorySlug = category.slug;
  }
  if (data.category_id) {
    const category = categories.find((item) => item.id === data.category_id);
    if (category) product.categorySlug = category.slug;
  }

  return product;
}

function deleteProduct(productId) {
  const index = products.findIndex(
    (product) => product.id === productId || product.slug === productId,
  );
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
}

function createBrand({ name, slug }) {
  if (!name?.trim()) {
    const error = new Error("Brand name is required.");
    error.statusCode = 400;
    throw error;
  }

  const finalSlug = slugify(slug || name);
  if (brands.some((b) => b.slug === finalSlug)) {
    const error = new Error("A brand with that slug already exists.");
    error.statusCode = 409;
    throw error;
  }

  const brand = {
    id: `brand-${Date.now()}`,
    slug: finalSlug,
    name: name.trim(),
  };
  brands.push(brand);
  return brand;
}

const banners = [
  {
    id: "banner-1",
    title: "Books Month",
    subtitle: "SPÉCIAL PROMO",
    image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=85",
    link: "/catalog/books",
    is_active: 1,
    sort_order: 0,
  },
  {
    id: "banner-2",
    title: "Stationery Tools",
    subtitle: "NEW ARRIVALS",
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=85",
    link: "/catalog/stationery",
    is_active: 1,
    sort_order: 1,
  },
  {
    id: "banner-3",
    title: "Tech Essentials",
    subtitle: "OFFICE SETUP",
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1600&q=85",
    link: "/catalog/tech",
    is_active: 1,
    sort_order: 2,
  },
];

module.exports = {
  categories,
  brands,
  products,
  users,
  orders,
  newsletterSubscribers,
  promotions,
  banners,
  dealOfTheDay,
  homepageSections,
  getProductByIdOrSlug,
  getCategoryBySlug,
  getBrandBySlug,
  getUserByEmail,
  getUserById,
  sanitizeUser,
  getCartForUser,
  serializeCart,
  upsertCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getWishlist,
  toggleWishlist,
  createOrder,
  createGuestOrder,
  getOrderById,
  findOrderByReference,
  updateOrderStatus,
  addNewsletterSubscriber,
  registerUser,
  updateUser,
  changePassword,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createBrand,
};
