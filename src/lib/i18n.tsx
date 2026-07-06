import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type Dict = Record<string, string>;

// Compact UI dictionary — expand as needed.
const STRINGS: Record<LangCode, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.trends": "Trends",
    "nav.inventory": "Inventory",
    "nav.ai": "AI",
    "nav.profile": "Profile",
    "profile.title": "Profile",
    "profile.subscription": "Subscription",
    "profile.aiUsage": "AI usage",
    "profile.preferences": "Preferences",
    "profile.appearance": "Appearance",
    "profile.notifications": "Notifications",
    "profile.help": "Help",
    "profile.language": "Language",
    "profile.signOut": "Sign out",
    "profile.aiCredits": "AI credits",
    "profile.remaining": "remaining",
    "assistant.askAnything": "Ask anything",
    "assistant.tagline":
      "Get help running your shop — trends, stock, listings, and reports.",
    "credits.insufficient": "Not enough AI credits. Upgrade your plan.",
  },
  hi: {
    "nav.home": "होम",
    "nav.trends": "ट्रेंड्स",
    "nav.inventory": "इन्वेंटरी",
    "nav.ai": "एआई",
    "nav.profile": "प्रोफ़ाइल",
    "profile.title": "प्रोफ़ाइल",
    "profile.subscription": "सदस्यता",
    "profile.aiUsage": "एआई उपयोग",
    "profile.preferences": "प्राथमिकताएँ",
    "profile.appearance": "थीम",
    "profile.notifications": "सूचनाएँ",
    "profile.help": "सहायता",
    "profile.language": "भाषा",
    "profile.signOut": "साइन आउट",
    "profile.aiCredits": "एआई क्रेडिट",
    "profile.remaining": "शेष",
    "assistant.askAnything": "कुछ भी पूछें",
    "assistant.tagline":
      "अपनी दुकान चलाने में मदद पाएं — ट्रेंड, स्टॉक, लिस्टिंग और रिपोर्ट।",
    "credits.insufficient": "पर्याप्त एआई क्रेडिट नहीं। प्लान अपग्रेड करें।",
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.trends": "போக்குகள்",
    "nav.inventory": "சரக்கு",
    "nav.ai": "ஏஐ",
    "nav.profile": "சுயவிவரம்",
    "profile.title": "சுயவிவரம்",
    "profile.subscription": "சந்தா",
    "profile.aiUsage": "ஏஐ பயன்பாடு",
    "profile.preferences": "விருப்பங்கள்",
    "profile.appearance": "தோற்றம்",
    "profile.notifications": "அறிவிப்புகள்",
    "profile.help": "உதவி",
    "profile.language": "மொழி",
    "profile.signOut": "வெளியேறு",
    "profile.aiCredits": "ஏஐ கிரெடிட்கள்",
    "profile.remaining": "மீதம்",
    "assistant.askAnything": "எதையும் கேளுங்கள்",
    "assistant.tagline":
      "உங்கள் கடையை நடத்த உதவி — போக்குகள், சரக்கு, பட்டியல்கள், அறிக்கைகள்.",
    "credits.insufficient": "போதுமான ஏஐ கிரெடிட்கள் இல்லை. திட்டத்தை மேம்படுத்துங்கள்.",
  },
  te: {
    "nav.home": "హోమ్",
    "nav.trends": "ట్రెండ్స్",
    "nav.inventory": "ఇన్వెంటరీ",
    "nav.ai": "ఏఐ",
    "nav.profile": "ప్రొఫైల్",
    "profile.title": "ప్రొఫైల్",
    "profile.subscription": "సబ్‌స్క్రిప్షన్",
    "profile.aiUsage": "ఏఐ వినియోగం",
    "profile.preferences": "ప్రాధాన్యతలు",
    "profile.appearance": "రూపం",
    "profile.notifications": "నోటిఫికేషన్‌లు",
    "profile.help": "సహాయం",
    "profile.language": "భాష",
    "profile.signOut": "సైన్ అవుట్",
    "profile.aiCredits": "ఏఐ క్రెడిట్‌లు",
    "profile.remaining": "మిగిలినవి",
    "assistant.askAnything": "ఏదైనా అడగండి",
    "assistant.tagline":
      "మీ దుకాణం నడపడంలో సహాయం — ట్రెండ్స్, స్టాక్, లిస్టింగ్‌లు, నివేదికలు.",
    "credits.insufficient": "సరిపడా ఏఐ క్రెడిట్‌లు లేవు. ప్లాన్ అప్‌గ్రేడ్ చేయండి.",
  },
  bn: {
    "nav.home": "হোম",
    "nav.trends": "ট্রেন্ড",
    "nav.inventory": "ইনভেন্টরি",
    "nav.ai": "এআই",
    "nav.profile": "প্রোফাইল",
    "profile.title": "প্রোফাইল",
    "profile.subscription": "সাবস্ক্রিপশন",
    "profile.aiUsage": "এআই ব্যবহার",
    "profile.preferences": "পছন্দসমূহ",
    "profile.appearance": "চেহারা",
    "profile.notifications": "নোটিফিকেশন",
    "profile.help": "সহায়তা",
    "profile.language": "ভাষা",
    "profile.signOut": "সাইন আউট",
    "profile.aiCredits": "এআই ক্রেডিট",
    "profile.remaining": "অবশিষ্ট",
    "assistant.askAnything": "যেকোনো কিছু জিজ্ঞাসা করুন",
    "assistant.tagline":
      "আপনার দোকান চালাতে সাহায্য — ট্রেন্ড, স্টক, তালিকা ও রিপোর্ট।",
    "credits.insufficient": "যথেষ্ট এআই ক্রেডিট নেই। প্ল্যান আপগ্রেড করুন।",
  },
  mr: {
    "nav.home": "होम",
    "nav.trends": "ट्रेंड्स",
    "nav.inventory": "इन्व्हेंटरी",
    "nav.ai": "एआय",
    "nav.profile": "प्रोफाइल",
    "profile.title": "प्रोफाइल",
    "profile.subscription": "सदस्यता",
    "profile.aiUsage": "एआय वापर",
    "profile.preferences": "पसंती",
    "profile.appearance": "स्वरूप",
    "profile.notifications": "सूचना",
    "profile.help": "मदत",
    "profile.language": "भाषा",
    "profile.signOut": "साइन आउट",
    "profile.aiCredits": "एआय क्रेडिट्स",
    "profile.remaining": "उर्वरित",
    "assistant.askAnything": "काहीही विचारा",
    "assistant.tagline":
      "तुमचे दुकान चालवण्यास मदत — ट्रेंड्स, स्टॉक, यादी आणि अहवाल.",
    "credits.insufficient": "पुरेसे एआय क्रेडिट्स नाहीत. प्लॅन अपग्रेड करा.",
  },
  gu: {
    "nav.home": "હોમ",
    "nav.trends": "ટ્રેન્ડ્સ",
    "nav.inventory": "ઇન્વેન્ટરી",
    "nav.ai": "એઆઈ",
    "nav.profile": "પ્રોફાઇલ",
    "profile.title": "પ્રોફાઇલ",
    "profile.subscription": "સબ્સ્ક્રિપ્શન",
    "profile.aiUsage": "એઆઈ વપરાશ",
    "profile.preferences": "પસંદગીઓ",
    "profile.appearance": "દેખાવ",
    "profile.notifications": "સૂચનાઓ",
    "profile.help": "મદદ",
    "profile.language": "ભાષા",
    "profile.signOut": "સાઇન આઉટ",
    "profile.aiCredits": "એઆઈ ક્રેડિટ્સ",
    "profile.remaining": "બાકી",
    "assistant.askAnything": "કંઈપણ પૂછો",
    "assistant.tagline":
      "તમારી દુકાન ચલાવવામાં મદદ — ટ્રેન્ડ્સ, સ્ટોક, યાદી અને અહેવાલો.",
    "credits.insufficient": "પૂરતા એઆઈ ક્રેડિટ્સ નથી. પ્લાન અપગ્રેડ કરો.",
  },
};

interface LangCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

function readInitial(): LangCode {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("dk_lang") as LangCode | null;
  if (stored && STRINGS[stored]) return stored;
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(readInitial);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem("dk_lang", l);
    } catch {
      /* noop */
    }
  }, []);

  const t = useCallback(
    (key: string) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

export function useT() {
  return useLang().t;
}
