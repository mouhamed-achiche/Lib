import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "ar" | "en";
type Direction = "ltr" | "rtl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: Direction;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    home: "Accueil",
    catalog: "Catalogue",
    categories: "Catégories",
    profile: "Profil",
    myOrders: "Mes Commandes",
    trackOrder: "Suivre Commande",
    login: "Connexion",
    register: "S'inscrire",
    logout: "Déconnexion",
    dashboard: "Tableau de bord",
    searchPlaceholder: "Rechercher des livres, de la papeterie, et plus...",
    noProductsFound: "Aucun produit trouvé.",
    cart: "Panier",

    // Home Page
    bestSellers: "Meilleures Ventes",
    featuredNow: "En Vedette",
    viewAll: "Voir Tout",
    browseCatalog: "Parcourir le catalogue",

    // Product Card & Detail
    addToCart: "Ajouter au panier",
    addedToCart: "Ajouté au panier",
    bestseller: "Best-seller",
    sale: "Promo",
    new: "Nouveau",
    premium: "Premium",
    inStock: "En Stock",
    outOfStock: "Rupture de stock",
    price: "Prix",
    description: "Description",
    brand: "Marque",

    // Cart Page
    shoppingCart: "Votre Panier",
    cartEmpty: "Votre panier est vide",
    subtotal: "Sous-total",
    shipping: "Livraison",
    total: "Total",
    checkout: "Passer la commande",
    remove: "Supprimer",
    quantity: "Quantité",

    // Order History / Track Order
    orderHistory: "Historique des commandes",
    orderReference: "Référence de la commande",
    status: "Statut",
    date: "Date",
    trackButton: "Suivre la commande",
    trackingDetails: "Détails du suivi",
    enterDetails: "Saisissez les détails pour suivre votre commande",

    // Footer
    footerDesc: "Votre librairie et papeterie de confiance pour tous vos besoins académiques et professionnels.",
    rightsReserved: "Tous droits réservés.",
    quickLinks: "Liens rapides",
    contactUs: "Contactez-nous",
    newsletterCta: "Inscrivez-vous à notre newsletter pour recevoir nos dernières offres et nouveautés.",
    newsletterEmailPlaceholder: "Votre adresse e-mail...",
    books: "Livres",
    stationery: "Papeterie",
    artSupplies: "Fournitures d'art",
    thanksSubscribe: "Merci pour votre inscription",
    language: "Langue",
    selectLanguage: "Sélectionner la langue",
    
    // Catalog Page
    allProducts: "Tous les produits",
    browseSelection: "Parcourir la sélection actuelle et la réduire avec les filtres légers ci-dessous.",
    searchProducts: "Rechercher des produits",
    reset: "Réinitialiser",
    product: "produit",
    products: "produits",
    showLess: "Afficher moins",
    showAll: "Afficher tout",
    highestPrice: "Le prix le plus élevé est de",
    from: "De",
    to: "À",
    currency: "د.ت",
    availability: "Disponibilité",
    loadingProducts: "Chargement des produits...",
    showingProducts: "Affichage de",
    noProductsMatch: "Aucun produit ne correspond aux filtres sélectionnés.",
    
    // Sort Options
    sortFeatured: "En vedette",
    sortRelevant: "Le plus pertinent",
    sortBestseller: "Meilleures ventes",
    sortAlphaAsc: "Alphabétique, de A à Z",
    sortAlphaDesc: "Alphabétique, de Z à A",
    sortPriceLow: "Prix: faible à élevé",
    sortPriceHigh: "Prix: élevé à faible",
    sortDateAsc: "Date, de la plus ancienne à la plus récente",
    sortDateDesc: "Date, de la plus récente à la plus ancienne",
    
    // Cart Page
    yourCart: "Votre panier",
    reviewItems: "Examinez les articles que vous avez déjà choisis.",
    spendForFreeShipping: "Dépensez",
    forFreeShipping: "pour la livraison gratuite",
    more: "de plus",
    maxAvailable: "Max disponible",
    calculatedAtCheckout: "Calculé à la commande",
    tax: "Taxe",
    proceedToCheckout: "Passer à la commande",
    
    // Login/Register Page
    loginTitle: "Connexion",
    loginSubtitle: "Connectez-vous pour continuer vers la commande et votre compte.",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    registerTitle: "Créer un compte",
    createAccount: "Créer un compte",
    creatingAccount: "Création du compte...",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    welcomeBack: "Bienvenue",
    accountCreated: "Compte créé",
    couldNotFindAccount: "Hmm, nous n'avons pas pu trouver ce compte. Vérifiez votre e-mail et votre mot de passe !",
    
    // Form Fields
    name: "Nom",
    email: "E-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordMinLength: "Minimum 8 caractères",
    phoneNumber: "Numéro de téléphone",
    deliveryAddress: "Adresse de livraison",
    passwordRequirements: "Minimum 10 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial (!@#$%^&*)",
    registrationFailed: "Échec de l'inscription",
    registerSubtitle: "Créez un compte pour enregistrer vos commandes et payer plus rapidement.",
    
    // Checkout Page
    checkoutTitle: "Commande",
    checkoutSubtitle: "Confirmez vos détails de livraison et envoyez la commande à l'équipe Ibn Sina.",
    alreadyHaveAccountCheckout: "Vous avez déjà un compte ?",
    preFillDetails: "pour pré-remplir vos détails de livraison.",
    checkoutFullName: "Nom complet",
    deliveryAddressPlaceholder: "Rue, ville, code postal",
    checkoutNotes: "Notes",
    checkoutNotesPlaceholder: "Instructions de livraison, contact préféré, etc.",
    checkoutItems: "Articles",
    checkoutPlaceOrder: "Passer la commande",
    checkoutPlacingOrder: "Passer la commande...",
    checkoutCartEmpty: "Votre panier est vide.",
    checkoutPleaseAddDetails: "Veuillez ajouter votre nom, numéro de téléphone et adresse de livraison.",
    checkoutOrderPlacedSuccessfully: "Commande passée avec succès",
    checkoutCouldNotPlaceOrder: "Impossible de passer la commande",
    billingDetails: "Détails de facturation",
    fullName: "Nom complet",
    phone: "Téléphone",
    address: "Adresse",
    city: "Ville",
    notes: "Notes de commande (facultatif)",
    placeOrder: "Passer la commande",
    guestCheckout: "Commander en tant qu'invité",
    orderSummary: "Résumé de la commande",
  },
  en: {
    // Navigation
    home: "Home",
    catalog: "Catalog",
    categories: "Categories",
    profile: "Profile",
    myOrders: "My Orders",
    trackOrder: "Track Order",
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "Dashboard",
    searchPlaceholder: "Search books, stationery, and more...",
    noProductsFound: "No products found.",
    cart: "Cart",

    // Home Page
    bestSellers: "Best Sellers",
    featuredNow: "Featured Now",
    viewAll: "View All",
    browseCatalog: "Browse Catalog",

    // Product Card & Detail
    addToCart: "Add to Cart",
    addedToCart: "Added to Cart",
    bestseller: "Bestseller",
    sale: "Sale",
    new: "New",
    premium: "Premium",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    price: "Price",
    description: "Description",
    brand: "Brand",

    // Cart Page
    shoppingCart: "Shopping Cart",
    cartEmpty: "Your cart is empty",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    checkout: "Checkout",
    remove: "Remove",
    quantity: "Quantity",

    // Order History / Track Order
    orderHistory: "Order History",
    orderReference: "Order Reference",
    status: "Status",
    date: "Date",
    trackButton: "Track Order",
    trackingDetails: "Tracking Details",
    enterDetails: "Enter details to track your order",

    // Footer
    footerDesc: "Your trusted bookstore and stationery shop for all your academic and professional needs.",
    rightsReserved: "All rights reserved.",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    newsletterCta: "Subscribe to our newsletter to receive our latest offers and new arrivals.",
    newsletterEmailPlaceholder: "Your email address...",
    books: "Books",
    stationery: "Stationery",
    artSupplies: "Art Supplies",
    thanksSubscribe: "Thank you for subscribing",
    language: "Language",
    selectLanguage: "Select Language",
    
    // Catalog Page
    allProducts: "All Products",
    browseSelection: "Browse the current selection and narrow it down with the lightweight filters below.",
    searchProducts: "Search products",
    reset: "Reset",
    product: "product",
    products: "products",
    showLess: "Show less",
    showAll: "Show all",
    highestPrice: "The highest price is",
    from: "From",
    to: "To",
    currency: "د.ت",
    availability: "Availability",
    loadingProducts: "Loading products...",
    showingProducts: "Showing",
    noProductsMatch: "No products match the selected filters.",
    
    // Sort Options
    sortFeatured: "Featured",
    sortRelevant: "Most relevant",
    sortBestseller: "Best sellers",
    sortAlphaAsc: "Alphabetical, A to Z",
    sortAlphaDesc: "Alphabetical, Z to A",
    sortPriceLow: "Price: low to high",
    sortPriceHigh: "Price: high to low",
    sortDateAsc: "Date, oldest to newest",
    sortDateDesc: "Date, newest to oldest",
    
    // Cart Page
    yourCart: "Your cart",
    reviewItems: "Review the items you have already picked out.",
    spendForFreeShipping: "Spend",
    forFreeShipping: "for free shipping",
    more: "more",
    maxAvailable: "Max available",
    calculatedAtCheckout: "Calculated at checkout",
    tax: "Tax",
    proceedToCheckout: "Proceed to checkout",
    
    // Login/Register Page
    loginTitle: "Login",
    loginSubtitle: "Sign in to continue to checkout and your account.",
    signIn: "Sign in",
    signingIn: "Signing in...",
    registerTitle: "Create account",
    createAccount: "Create account",
    creatingAccount: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    welcomeBack: "Welcome back",
    accountCreated: "Account created",
    couldNotFindAccount: "Hmm, we couldn't find that account. Check your email and password!",
    
    // Form Fields
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordMinLength: "Minimum 8 characters",
    phoneNumber: "Phone number",
    deliveryAddress: "Delivery address",
    passwordRequirements: "Minimum 10 characters, 1 uppercase, 1 number, 1 special character (!@#$%^&*)",
    registrationFailed: "Registration failed",
    registerSubtitle: "Create an account to save orders and checkout faster.",
    
    // Checkout Page
    checkoutTitle: "Checkout",
    checkoutSubtitle: "Confirm your delivery details and send the order to the Ibn Sina team.",
    alreadyHaveAccountCheckout: "Already have an account?",
    preFillDetails: "to pre-fill your delivery details.",
    checkoutFullName: "Full name",
    deliveryAddressPlaceholder: "Street, city, postal code",
    checkoutNotes: "Notes",
    checkoutNotesPlaceholder: "Delivery instructions, preferred contact, etc.",
    checkoutItems: "Items",
    checkoutPlaceOrder: "Place order",
    checkoutPlacingOrder: "Placing order...",
    checkoutCartEmpty: "Your cart is empty.",
    checkoutPleaseAddDetails: "Please add your name, phone number, and delivery address.",
    checkoutOrderPlacedSuccessfully: "Order placed successfully",
    checkoutCouldNotPlaceOrder: "Could not place order",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    catalog: "الكتالوج",
    categories: "الفئات",
    profile: "الملف الشخصي",
    myOrders: "طلباتي",
    trackOrder: "تتبع الطلب",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    searchPlaceholder: "ابحث عن الكتب، الأدوات المكتبية، والمزيد...",
    noProductsFound: "لم يتم العثور على منتجات.",
    cart: "السلة",

    // Home Page
    bestSellers: "الأكثر مبيعاً",
    featuredNow: "المعروض حالياً",
    viewAll: "عرض الكل",
    browseCatalog: "تصفح الكتالوج",

    // Product Card & Detail
    addToCart: "أضف إلى السلة",
    addedToCart: "تمت الإضافة",
    bestseller: "الأكثر مبيعاً",
    sale: "تخفيض",
    new: "جديد",
    premium: "مميز",
    inStock: "متوفر",
    outOfStock: "نفذت الكمية",
    price: "السعر",
    description: "الوصف",
    brand: "العلامة التجارية",

    // Cart Page
    shoppingCart: "سلة التسوق",
    cartEmpty: "سلة التسوق فارغة",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    total: "الإجمالي",
    checkout: "إتمام الطلب",
    remove: "حذف",
    quantity: "الكمية",

    // Order History / Track Order
    orderHistory: "سجل الطلبات",
    orderReference: "رقم مرجع الطلب",
    status: "الحالة",
    date: "التاريخ",
    trackButton: "تتبع الطلب",
    trackingDetails: "تفاصيل التتبع",
    enterDetails: "أدخل التفاصيل لتتبع طلبك",

    // Footer
    footerDesc: "مكتبتكم الموثوقة لجميع احتياجاتكم الأكاديمية والمهنية.",
    rightsReserved: "جميع الحقوق محفوظة.",
    quickLinks: "روابط سريعة",
    contactUs: "اتصل بنا",
    newsletterCta: "اشترك في نشرتنا البريدية لتلقي أحدث عروضنا والمنتجات الجديدة.",
    newsletterEmailPlaceholder: "بريدك الإلكتروني...",
    books: "الكتب",
    stationery: "الأدوات المكتبية",
    artSupplies: "لوازم الفن",
    thanksSubscribe: "شكراً لاشتراكك",
    language: "اللغة",
    selectLanguage: "اختر اللغة",
    
    // Catalog Page
    allProducts: "جميع المنتجات",
    browseSelection: "تصفح التحديد الحالي وتقليله باستخدام الفلاتر الخفيفة أدناه.",
    searchProducts: "البحث عن المنتجات",
    reset: "إعادة تعيين",
    product: "منتج",
    products: "منتجات",
    showLess: "عرض أقل",
    showAll: "عرض الكل",
    highestPrice: "أعلى سعر هو",
    from: "من",
    to: "إلى",
    currency: "د.ت",
    availability: "التوفر",
    loadingProducts: "جاري تحميل المنتجات...",
    showingProducts: "عرض",
    noProductsMatch: "لا توجد منتجات تطابق الفلاتر المحددة.",
    
    // Sort Options
    sortFeatured: "مميز",
    sortRelevant: "الأكثر صلة",
    sortBestseller: "الأكثر مبيعاً",
    sortAlphaAsc: "أبجدي، من أ إلى ي",
    sortAlphaDesc: "أبجدي، من ي إلى أ",
    sortPriceLow: "السعر: من الأقل إلى الأعلى",
    sortPriceHigh: "السعر: من الأعلى إلى الأقل",
    sortDateAsc: "التاريخ، من الأقدم إلى الأحدث",
    sortDateDesc: "التاريخ، من الأحدث إلى الأقدم",
    
    // Cart Page
    yourCart: "سلة التسوق",
    reviewItems: "راجع العناصر التي اخترتها بالفعل.",
    spendForFreeShipping: "أنفق",
    forFreeShipping: "للشحن المجاني",
    more: "أكثر",
    maxAvailable: "الحد الأقصى المتاح",
    calculatedAtCheckout: "يتم حسابه عند الدفع",
    tax: "ضريبة",
    proceedToCheckout: "المتابعة إلى الدفع",
    
    // Login/Register Page
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "سجل الدخول للمتابعة إلى الدفع وحسابك.",
    signIn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    registerTitle: "إنشاء حساب",
    createAccount: "إنشاء حساب",
    creatingAccount: "جاري إنشاء الحساب...",
    alreadyHaveAccount: "لديك بالفعل حساب؟",
    welcomeBack: "مرحباً بعودتك",
    accountCreated: "تم إنشاء الحساب",
    couldNotFindAccount: "همم، لم نتمكن من العثور على هذا الحساب. تحقق من بريدك الإلكتروني وكلمة المرور!",
    
    // Form Fields
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordMinLength: "الحد الأدنى 8 أحرف",
    phoneNumber: "رقم الهاتف",
    deliveryAddress: "عنوان التوصيل",
    passwordRequirements: "الحد الأدنى 10 أحرف، 1 حرف كبير، 1 رقم، 1 حرف خاص (!@#$%^&*)",
    registrationFailed: "فشل التسجيل",
    registerSubtitle: "أنشئ حساباً لحفظ الطلبات والدفع بشكل أسرع.",
    
    // Checkout Page
    checkoutTitle: "الدفع",
    checkoutSubtitle: "أكد تفاصيل التوصيل وأرسل الطلب إلى فريق ابن سينا.",
    alreadyHaveAccountCheckout: "لديك بالفعل حساب؟",
    preFillDetails: "لملء تفاصيل التوصيل مسبقاً.",
    checkoutFullName: "الاسم الكامل",
    deliveryAddressPlaceholder: "الشارع، المدينة، الرمز البريدي",
    checkoutNotes: "ملاحظات",
    checkoutNotesPlaceholder: "تعليمات التوصيل، جهة الاتصال المفضلة، إلخ.",
    checkoutItems: "العناصر",
    checkoutPlaceOrder: "إرسال الطلب",
    checkoutPlacingOrder: "جاري إرسال الطلب...",
    checkoutCartEmpty: "سلة التسوق فارغة.",
    checkoutPleaseAddDetails: "الرجاء إضافة اسمك ورقم هاتفك وعنوان التوصيل.",
    checkoutOrderPlacedSuccessfully: "تم إرسال الطلب بنجاح",
    checkoutCouldNotPlaceOrder: "تعذر إرسال الطلب",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("ibn_sina_lang");
    return (saved === "fr" || saved === "ar" || saved === "en") ? saved : "fr";
  });

  const dir: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("ibn_sina_lang", language);
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] ?? translations["fr"]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
