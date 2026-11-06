import { FACILITIES, type Facility } from "./facilities";

export type Lang = "id" | "en";
export type Category = "I" | "II" | "III";
export type Data = {
  animal: string;
  contact: "touch" | "lick" | "nibble" | "scratch" | "bite" | "bat" | "unknown";
  skin: "intact" | "broken_no_blood" | "bleeding" | "unknown";
  mucous: "yes" | "no" | "unknown";
  symptoms: boolean;
  language: Lang;
};
export type Result = {
  category: Category;
  advice: string;
  explanation: string;
  firstAid: string;
  warning: string | null;
  disclaimer: string;
  facilities: Facility[];
};

const CONTACTS = ["touch", "lick", "nibble", "scratch", "bite", "bat", "unknown"];
const SKINS = ["intact", "broken_no_blood", "bleeding", "unknown"];
const TRI = ["yes", "no", "unknown"];

export function validate(d: any): Data | null {
  if (!d || typeof d !== "object") return null;
  if (!CONTACTS.includes(d.contact) || !SKINS.includes(d.skin) || !TRI.includes(d.mucous)) return null;
  return {
    animal: String(d.animal ?? "").slice(0, 60) || "?",
    contact: d.contact,
    skin: d.skin,
    mucous: d.mucous,
    symptoms: d.symptoms === true,
    language: d.language === "en" ? "en" : "id",
  };
}

/** Apakah masih ada informasi penting yang kurang? */
export function needsMore(d: Data): boolean {
  if (d.contact === "unknown") return true;
  if (d.contact === "bat" || d.contact === "touch") return false;
  return d.skin === "unknown" || d.mucous === "unknown";
}

/** Aturan WHO ditulis eksplisit (bukan AI). Jika ambigu -> kategori lebih berisiko. */
export function classify(d: Data): Category {
  if (d.contact === "bat" || d.mucous === "yes") return "III";
  switch (d.contact) {
    case "touch":
      return "I";
    case "lick":
      return d.skin === "intact" && d.mucous === "no" ? "I" : "III";
    case "nibble":
      return d.skin === "intact" ? "II" : "III";
    case "scratch":
    case "bite":
      return d.skin === "intact" || d.skin === "broken_no_blood" ? "II" : "III";
    default:
      return "III";
  }
}

const TXT = {
  id: {
    firstAid:
      "Cuci luka dengan sabun dan air mengalir minimal 15 menit, lalu beri antiseptik (povidone iodine/alkohol 70%). Jangan dijahit atau ditutup rapat.",
    I: "Kategori I: kontak tanpa luka. Umumnya tidak perlu profilaksis, tetapi tetap konsultasikan ke tenaga medis untuk memastikan.",
    II: "Kategori II: luka ringan. Perlu vaksin anti rabies (VAR) segera. Pergi ke fasilitas kesehatan hari ini.",
    III: "Kategori III: pajanan berat. Perlu vaksin (VAR) dan imunoglobulin rabies (SAR/RIG) segera. Pergi ke fasilitas kesehatan sekarang.",
    warning:
      "Anda menyebut gejala (demam, kejang, atau takut air). Segera cari pertolongan medis atau hubungi 112.",
    disclaimer:
      "RabiGuard adalah alat bantu keputusan awal, bukan diagnosis. Selalu temui tenaga medis. Darurat: 112.",
  },
  en: {
    firstAid:
      "Wash the wound with soap and running water for at least 15 minutes, then apply an antiseptic (povidone iodine/70% alcohol). Do not suture or tightly cover it.",
    I: "Category I: contact without a wound. Usually no prophylaxis is needed, but confirm with a health professional.",
    II: "Category II: minor wound. Rabies vaccine (PEP) is needed promptly. Go to a health facility today.",
    III: "Category III: severe exposure. Vaccine and rabies immunoglobulin (RIG) are needed immediately. Go to a health facility now.",
    warning: "You mentioned symptoms (fever, convulsions or fear of water). Seek medical help immediately or call 112.",
    disclaimer:
      "RabiGuard is an initial decision aid, not a diagnosis. Always see a medical professional. Emergency: 112.",
  },
};

/** Susun hasil akhir. `explanation` dari LLM boleh kosong (fallback = teks baku). */
export function buildResult(d: Data, explanation = ""): Result {
  const t = TXT[d.language];
  const category = classify(d);
  return {
    category,
    advice: t[category],
    explanation: explanation.trim(),
    firstAid: t.firstAid,
    warning: d.symptoms ? t.warning : null,
    disclaimer: t.disclaimer,
    facilities: FACILITIES,
  };
}
