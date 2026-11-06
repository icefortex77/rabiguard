"use client";
import { useEffect, useRef, useState } from "react";
import { buildResult, type Data, type Lang, type Result } from "@/lib/triage";

type Msg = { role: "user" | "assistant"; content: string };
type P = [string, string];
const pick = (l: Lang, p: P) => (l === "id" ? p[0] : p[1]);

const S: Record<string, P> = {
  sub: ["Digigit atau dicakar hewan? Mulai dari sini.", "Bitten or scratched by an animal? Start here."],
  washT: ["Cuci luka dulu", "Wash the wound first"],
  washGo: ["Mulai timer 15 menit", "Start 15-minute timer"],
  pause: ["Jeda", "Pause"],
  resume: ["Lanjutkan", "Resume"],
  reset: ["Ulangi", "Reset"],
  washDone: ["Selesai. Sekarang ke fasilitas kesehatan.", "Done. Now go to a health facility."],
  fact: [
    "Hampir semua kematian akibat rabies bisa dicegah bila vaksin diberikan cepat. Luka kecil dan tidak berdarah tetap perlu dinilai tenaga medis.",
    "Almost all rabies deaths are preventable when vaccine is given quickly. Even small, non-bleeding wounds need a medical assessment.",
  ],
  s1: ["Ceritakan", "Describe"],
  s2: ["Konfirmasi", "Confirm"],
  s3: ["Hasil", "Result"],
  h1: ["Ceritakan apa yang terjadi", "Tell me what happened"],
  intro: [
    "Tulis dengan kata-kata Anda sendiri. Saya akan bertanya bila ada yang kurang jelas.",
    "Write in your own words. I will ask if something is unclear.",
  ],
  tryT: ["Contoh cerita", "Example stories"],
  placeholder: ["Tulis kejadiannya…", "Describe what happened…"],
  send: ["Kirim", "Send"],
  thinking: ["Memproses…", "Working on it…"],
  confirmT: ["Apakah ini sudah benar?", "Is this correct?"],
  yes: ["Benar, tampilkan hasil", "Correct, show result"],
  edit: ["Ubah lewat formulir", "Edit with form"],
  fbT: [
    "Asisten AI sedang tidak tersedia. Isi formulir ini; hasilnya tetap dihitung dengan aturan WHO.",
    "The AI assistant is unavailable. Fill in this form; the result still uses WHO rules.",
  ],
  fbGo: ["Lihat hasil", "Show result"],
  symptom: ["Ada demam, kejang, atau takut air", "Fever, convulsions or fear of water"],
  fac: ["Pusat penanganan rabies di Bali", "Rabies treatment centres in Bali"],
  facNote: [
    "Daftar awal. Hubungi dulu untuk memastikan stok vaksin dan imunoglobulin.",
    "Starting list. Call ahead to confirm vaccine and immunoglobulin stock.",
  ],
  all: ["Semua", "All"],
  map: ["Buka peta", "Open map"],
  copy: ["Salin ringkasan untuk petugas", "Copy summary for staff"],
  copied: ["Tersalin", "Copied"],
  again: ["Mulai kasus baru", "Start a new case"],
  why: ["Data yang dipakai", "Data used"],
  cat: ["Kategori", "Category"],
  call: ["Telepon darurat 112", "Call emergency 112"],
  animal: ["Hewan", "Animal"],
  contact: ["Jenis kontak", "Contact"],
  skin: ["Kondisi kulit", "Skin"],
  mucous: ["Air liur kena mata/mulut/hidung", "Saliva on eyes/mouth/nose"],
  symptoms: ["Gejala", "Symptoms"],
  yesW: ["Ada", "Yes"],
  fuT: ["Ada pertanyaan lanjutan?", "Any follow-up questions?"],
  fuPh: ["Tanyakan seputar gigitan dan rabies…", "Ask about bites and rabies…"],
  fuErr: [
    "Asisten AI sedang tidak tersedia. Silakan langsung ke fasilitas kesehatan atau hubungi 112.",
    "The AI assistant is unavailable. Please go to a health facility or call 112.",
  ],
  fu1: ["Apa yang dilakukan di fasilitas kesehatan?", "What happens at the health facility?"],
  fu2: ["Apakah luka kecil tetap perlu diperiksa?", "Does a small wound still need checking?"],
  fu3: ["Apa yang perlu saya bawa ke sana?", "What should I bring with me?"],
  ask: ["Tanya", "Ask"],
  disc: [
    "Alat bantu keputusan awal, bukan diagnosis. Selalu temui tenaga medis.",
    "An initial decision aid, not a diagnosis. Always see a medical professional.",
  ],
};
const t = (l: Lang, k: string) => S[k]?.[l === "id" ? 0 : 1] ?? k;

const OPT: Record<string, Record<string, P>> = {
  contact: {
    touch: ["Menyentuh / memberi makan", "Touched / fed"],
    lick: ["Dijilat", "Licked"],
    nibble: ["Digigit ringan tanpa luka", "Nibbled, no wound"],
    scratch: ["Dicakar", "Scratched"],
    bite: ["Digigit", "Bitten"],
    bat: ["Kontak dengan kelelawar", "Bat contact"],
    unknown: ["Belum jelas", "Unclear"],
  },
  skin: {
    intact: ["Kulit utuh", "Skin intact"],
    broken_no_blood: ["Lecet, tidak berdarah", "Graze, no blood"],
    bleeding: ["Berdarah / robek / tusukan", "Bleeding / torn / puncture"],
    unknown: ["Belum jelas", "Unclear"],
  },
  mucous: { yes: ["Ya", "Yes"], no: ["Tidak", "No"], unknown: ["Belum jelas", "Unclear"] },
};

const EXAMPLES: P[] = [
  ["Digigit anjing liar di betis, lukanya robek dan berdarah", "A stray dog bit my calf and the wound is bleeding"],
  ["Dicakar monyet, lukanya kecil tapi sedikit berdarah", "A monkey scratched me, small wound but slightly bleeding"],
  ["Dijilat anjing di tangan, kulit saya utuh", "A dog licked my hand, my skin is not broken"],
];

const CAT = {
  I: "bg-emerald-700 text-white",
  II: "bg-amber-400 text-slate-900",
  III: "bg-red-700 text-white",
} as const;

const btn = "rounded-lg px-4 py-3 font-bold transition-colors disabled:opacity-40";
const primary = `${btn} bg-[#0e5e73] text-white hover:bg-[#0b4c5e]`;
const ghost = `${btn} border border-slate-300 bg-white hover:bg-slate-50`;

/* ---------- Timer cuci luka 15 menit ---------- */
const TOTAL = 900;
const C = 2 * Math.PI * 52;

function WashTimer({ lang, firstAid }: { lang: Lang; firstAid: string }) {
  const [left, setLeft] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        setRunning(false);
        try { navigator.vibrate?.(400); } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const start = () => { endAt.current = Date.now() + left * 1000; setRunning(true); };
  const reset = () => { setRunning(false); setLeft(TOTAL); };
  const done = left === 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{t(lang, "washT")}</h2>
      <p className="mt-1 text-[15px] leading-relaxed">{firstAid}</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <svg viewBox="0 0 120 120" className="size-40" role="img" aria-label={`${mm}:${ss}`}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#d5e3e2" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
            stroke={done ? "#1f8a5b" : "#0e7c86"}
            strokeDasharray={C} strokeDashoffset={C * (left / TOTAL)}
            transform="rotate(-90 60 60)"
            className="transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
          />
          <text x="60" y="68" textAnchor="middle" fontSize="24" fontWeight="700" fill="#0b3a4a">{mm}:{ss}</text>
        </svg>
        <div role="status" className="min-h-6 text-center font-bold text-emerald-800">{done ? t(lang, "washDone") : ""}</div>
        <div className="flex w-full gap-2">
          {done ? (
            <button onClick={reset} className={`${ghost} flex-1`}>{t(lang, "reset")}</button>
          ) : running ? (
            <button onClick={() => setRunning(false)} className={`${primary} flex-1`}>{t(lang, "pause")}</button>
          ) : (
            <button onClick={start} className={`${primary} flex-1`}>{left === TOTAL ? t(lang, "washGo") : t(lang, "resume")}</button>
          )}
          {!done && left !== TOTAL && <button onClick={reset} className={ghost}>{t(lang, "reset")}</button>}
        </div>
      </div>
    </section>
  );
}

/* ---------- Halaman utama ---------- */
export default function Home() {
  const [lang, setLang] = useState<Lang>("id");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Data | null>(null);
  const [form, setForm] = useState<Data | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState(false);
  const [area, setArea] = useState("all");
  const [fu, setFu] = useState<Msg[]>([]);
  const [fuInput, setFuInput] = useState("");
  const [fuBusy, setFuBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.language.toLowerCase().startsWith("en")) setLang("en");
  }, []);
  useEffect(() => {
    if (msgs.length || pending || form || result) end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, pending, form, result, busy, fu]);

  const blank = (): Data => ({ animal: "?", contact: "bite", skin: "bleeding", mucous: "unknown", symptoms: false, language: lang });

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", messages: next }),
      });
      const j = await r.json();
      if (!r.ok || j.type === "fallback") throw new Error("fallback");
      if (j.language) setLang(j.language);
      if (j.type === "ask") setMsgs([...next, { role: "assistant", content: j.reply }]);
      else setPending(j.data);
    } catch {
      setForm(blank());
    } finally {
      setBusy(false);
    }
  }

  async function finish(d: Data) {
    setBusy(true);
    setPending(null);
    setForm(null);
    setData(d);
    setLang(d.language);
    setArea("all");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "classify", data: d }),
      });
      if (!r.ok) throw new Error();
      setResult(await r.json());
    } catch {
      setResult(buildResult(d)); // server tidak terjangkau: aturan WHO tetap jalan di peramban
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setMsgs([]); setInput(""); setPending(null); setForm(null); setResult(null); setData(null); setCopied(false);
    setFu([]); setFuInput(""); setFuBusy(false);
  }

  async function askFollow(textArg?: string) {
    const q = (textArg ?? fuInput).trim();
    if (!q || fuBusy || !data || !result) return;
    const next: Msg[] = [...fu, { role: "user", content: q }];
    setFu(next);
    setFuInput("");
    setFuBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "followup", data, messages: next }),
      });
      const j = await r.json();
      if (!r.ok || !j.reply) throw new Error();
      setFu([...next, { role: "assistant", content: j.reply }]);
    } catch {
      setFu([...next, { role: "assistant", content: t(lang, "fuErr") }]);
    } finally {
      setFuBusy(false);
    }
  }

  function summary() {
    if (!result || !data) return "";
    return [
      `RabiGuard - WHO ${t(lang, "cat")} ${result.category}`,
      `${t(lang, "animal")}: ${data.animal}`,
      `${t(lang, "contact")}: ${pick(lang, OPT.contact[data.contact])}`,
      `${t(lang, "skin")}: ${pick(lang, OPT.skin[data.skin])}`,
      `${t(lang, "mucous")}: ${pick(lang, OPT.mucous[data.mucous])}`,
      data.symptoms ? `${t(lang, "symptoms")}: ${t(lang, "yesW")}` : "",
      result.advice,
      result.disclaimer,
    ].filter(Boolean).join("\n");
  }

  async function copy() {
    const text = summary();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const step = result ? 3 : pending || form ? 2 : 1;
  const firstAid = buildResult({ ...blank(), language: lang }).firstAid;
  const areas = result ? Array.from(new Set(result.facilities.map((f) => f.area))) : [];
  const shown = result ? result.facilities.filter((f) => area === "all" || f.area === area) : [];

  const row = (label: string, v: string) => (
    <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-bold">{v}</span>
    </div>
  );

  return (
    <div className="min-h-dvh pb-8">
      <header className="bg-[#0b3a4a] px-4 pb-14 pt-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
              <path d="M16 2 4 7v8c0 7.5 5 13 12 15 7-2 12-7.500 12-15V7z" fill="#4fd1c5" />
              <path d="M16 8v11M10.500 13.500h11" stroke="#0b3a4a" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <h1 className="text-xl font-bold leading-tight">RabiGuard</h1>
              <p className="text-sm text-teal-100">{t(lang, "sub")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:112" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700" aria-label={t(lang, "call")}>112</a>
            <button
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="rounded-lg border border-teal-200/60 px-3 py-2 text-sm font-bold hover:bg-white/10"
              aria-label="Switch language"
            >
              {lang === "id" ? "EN" : "ID"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto -mt-8 grid max-w-5xl gap-4 px-4 md:grid-cols-[340px_1fr] md:items-start">
        <aside className="flex flex-col gap-4 md:sticky md:top-4">
          <WashTimer lang={lang} firstAid={firstAid} />
          <p className="rounded-xl bg-white/70 p-4 text-sm leading-relaxed">{t(lang, "fact")}</p>
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <ol className="flex gap-2 text-sm font-bold" aria-label="Progress">
            {(["s1", "s2", "s3"] as const).map((k, i) => (
              <li key={k} aria-current={step === i + 1 ? "step" : undefined}
                className={`flex-1 rounded-lg px-3 py-2 text-center ${step === i + 1 ? "bg-[#0e5e73] text-white" : step > i + 1 ? "bg-teal-100 text-teal-900" : "bg-white/70 text-slate-500"}`}>
                {i + 1}. {t(lang, k)}
              </li>
            ))}
          </ol>

          {!result && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">{t(lang, "h1")}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{t(lang, "intro")}</p>

              {msgs.length === 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold text-slate-600">{t(lang, "tryT")}</p>
                  <div className="flex flex-col gap-2">
                    {EXAMPLES.map((e, i) => (
                      <button key={i} onClick={() => send(pick(lang, e))} disabled={busy}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-[15px] hover:border-[#0e7c86] hover:bg-teal-50 disabled:opacity-50">
                        {pick(lang, e)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3" aria-live="polite">
                {msgs.map((m, i) => (
                  <div key={i} className={m.role === "user"
                    ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#0e5e73] p-3 text-white"
                    : "max-w-[88%] rounded-2xl rounded-bl-sm bg-teal-50 p-3"}>
                    {m.content}
                  </div>
                ))}
                {busy && <p className="text-sm text-slate-600">{t(lang, "thinking")}</p>}
              </div>

              {pending && (
                <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                  <h3 className="mb-1 font-bold">{t(lang, "confirmT")}</h3>
                  {row(t(lang, "animal"), pending.animal)}
                  {row(t(lang, "contact"), pick(lang, OPT.contact[pending.contact]))}
                  {row(t(lang, "skin"), pick(lang, OPT.skin[pending.skin]))}
                  {row(t(lang, "mucous"), pick(lang, OPT.mucous[pending.mucous]))}
                  {pending.symptoms && row(t(lang, "symptoms"), t(lang, "yesW"))}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => finish(pending)} disabled={busy} className={`${primary} flex-1`}>{t(lang, "yes")}</button>
                    <button onClick={() => { setForm(pending); setPending(null); }} className={ghost}>{t(lang, "edit")}</button>
                  </div>
                </div>
              )}

              {form && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <p className="mb-3 text-sm">{t(lang, "fbT")}</p>
                  {(["contact", "skin", "mucous"] as const).map((k) => (
                    <label key={k} className="mb-3 block text-sm font-bold">
                      {t(lang, k)}
                      <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value } as Data)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base font-normal">
                        {Object.entries(OPT[k]).map(([v, l]) => <option key={v} value={v}>{pick(lang, l)}</option>)}
                      </select>
                    </label>
                  ))}
                  <label className="mb-4 flex items-center gap-3 text-sm">
                    <input type="checkbox" checked={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.checked })} className="size-5" />
                    {t(lang, "symptom")}
                  </label>
                  <button onClick={() => finish({ ...form, language: lang })} disabled={busy} className={`${primary} w-full`}>{t(lang, "fbGo")}</button>
                </div>
              )}

              {!pending && !form && (
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t(lang, "placeholder")}
                    maxLength={800} aria-label={t(lang, "placeholder")}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3 text-base" />
                  <button type="submit" disabled={busy || !input.trim()} className={primary}>{t(lang, "send")}</button>
                </form>
              )}
            </div>
          )}

          {result && data && (
            <>
              {result.warning && <div role="alert" className="rounded-2xl bg-red-700 p-4 font-bold text-white">{result.warning}</div>}
              <section className={`rounded-2xl p-6 ${CAT[result.category]}`}>
                <p className="text-sm font-bold opacity-90">WHO</p>
                <p className="text-4xl font-bold">{t(lang, "cat")} {result.category}</p>
                <p className="mt-2 text-lg leading-relaxed">{result.advice}</p>
              </section>
              {result.explanation && <p className="rounded-2xl bg-white p-5 leading-relaxed shadow-sm">{result.explanation}</p>}

              <details className="rounded-2xl bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-bold">{t(lang, "why")}</summary>
                <div className="mt-2">
                  {row(t(lang, "animal"), data.animal)}
                  {row(t(lang, "contact"), pick(lang, OPT.contact[data.contact]))}
                  {row(t(lang, "skin"), pick(lang, OPT.skin[data.skin]))}
                  {row(t(lang, "mucous"), pick(lang, OPT.mucous[data.mucous]))}
                  {data.symptoms && row(t(lang, "symptoms"), t(lang, "yesW"))}
                </div>
              </details>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">{t(lang, "fac")}</h2>
                <p className="mb-3 text-sm text-slate-600">{t(lang, "facNote")}</p>
                <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-2">
                  {["all", ...areas].map((a) => (
                    <button key={a} onClick={() => setArea(a)} aria-pressed={area === a}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold ${area === a ? "border-[#0e5e73] bg-[#0e5e73] text-white" : "border-slate-300 bg-white"}`}>
                      {a === "all" ? t(lang, "all") : a}
                    </button>
                  ))}
                </div>
                <ul>
                  {shown.map((f) => (
                    <li key={f.name} className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-0">
                      <span><span className="font-bold">{f.name}</span><br /><span className="text-sm text-slate-600">{f.area}</span></span>
                      <a href={f.map} target="_blank" rel="noreferrer"
                        className="shrink-0 rounded-lg border border-[#0e5e73] px-3 py-2 text-sm font-bold text-[#0e5e73] hover:bg-teal-50">{t(lang, "map")}</a>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">{t(lang, "fuT")}</h2>
                {fu.length === 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["fu1", "fu2", "fu3"] as const).map((k) => (
                      <button key={k} onClick={() => askFollow(t(lang, k))} disabled={fuBusy}
                        className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm hover:border-[#0e7c86] hover:bg-teal-50 disabled:opacity-50">
                        {t(lang, k)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-col gap-3" aria-live="polite">
                  {fu.map((m, i) => (
                    <div key={i} className={m.role === "user"
                      ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#0e5e73] p-3 text-white"
                      : "max-w-[88%] rounded-2xl rounded-bl-sm bg-teal-50 p-3"}>
                      {m.content}
                    </div>
                  ))}
                  {fuBusy && <p className="text-sm text-slate-600">{t(lang, "thinking")}</p>}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); askFollow(); }} className="mt-3 flex gap-2">
                  <input value={fuInput} onChange={(e) => setFuInput(e.target.value)} placeholder={t(lang, "fuPh")}
                    maxLength={400} aria-label={t(lang, "fuPh")}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3 text-base" />
                  <button type="submit" disabled={fuBusy || !fuInput.trim()} className={primary}>{t(lang, "ask")}</button>
                </form>
              </section>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={copy} className={`${ghost} flex-1`}>{copied ? t(lang, "copied") : t(lang, "copy")}</button>
                <button onClick={reset} className={`${primary} flex-1`}>{t(lang, "again")}</button>
              </div>
            </>
          )}

          <p className="px-1 text-sm text-slate-600">{result ? result.disclaimer : t(lang, "disc")}</p>
          <div ref={end} />
        </section>
      </main>
    </div>
  );
}
