// DATA AWAL: verifikasi nama, layanan VAR/SAR, dan kontak ke sumber resmi Dinkes Bali sebelum submit.
export type Facility = { name: string; area: string; map: string };
const f = (name: string, area: string): Facility => ({
  name,
  area,
  map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " Bali")}`,
});

export const FACILITIES: Facility[] = [
  f("RSUP Prof. dr. I.G.N.G. Ngoerah", "Denpasar"),
  f("RSUD Wangaya", "Denpasar"),
  f("RSUD Mangusada", "Badung"),
  f("RSUD Sanjiwani", "Gianyar"),
  f("RSUD Tabanan", "Tabanan"),
  f("RSUD Buleleng", "Buleleng"),
  f("RSUD Karangasem", "Karangasem"),
  f("RSUD Klungkung", "Klungkung"),
  f("RSUD Bangli", "Bangli"),
  f("RSU Negara", "Jembrana"),
];
