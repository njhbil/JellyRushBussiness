import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowRight, Award, BadgeCheck, BarChart3, BatteryCharging, Boxes, Check, ChevronRight,
  CircleDollarSign, Factory, Flame, Gauge, Gift, HandCoins, Heart, Lightbulb, LockKeyhole,
  Medal, PackageCheck, Pause, RotateCcw, ShieldCheck, Sparkles, Star, Store, Target, TrendingUp,
  Truck, Zap,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';

type Phase = 'welcome' | 'profile' | 'game' | 'final';
type Round = 1 | 2 | 3 | 4 | 5;
type Mood = 'happy' | 'thinking' | 'concerned' | 'celebrate';
type Option = {
  id: string; title: string; eyebrow: string; description: string; cost: number; profit: number;
  capacity: number; inventory: number; reputation: number; rationale: string; tag?: string;
  icon: typeof Zap; tone: string;
};
type RoundChallenge = { title: string; detail: string };
type ChallengeResult = { success: boolean; title: string; detail: string };
type Reward = { id: string; title: string; detail: string; icon: typeof Star; tone: 'mint' | 'yellow' | 'pink' | 'lavender' };

const queryClient = new QueryClient();
const rupiah = (value: number) => `Rp${Math.round(value).toLocaleString('id-ID')}`;
const roundInfo: Record<Round, { title: string; subtitle: string; icon: typeof Store; color: string; order: string; pulse?: string }> = {
  1: { title: 'Pesanan pembuka', subtitle: 'Toko Rasa ingin mencoba 400 cup.', icon: Store, color: '#d39d00', order: '400 cup · Rp7.000 / cup' },
  2: { title: 'Pesanan besar masuk', subtitle: 'Festival kampus memesan 1.000 cup.', icon: Flame, color: '#cf4b81', order: '1.000 cup · Rp7.000 / cup', pulse: 'Peluang besar' },
  3: { title: 'Masalah pemasok', subtitle: 'Bahan utama terlambat di dermaga.', icon: Truck, color: '#178e83', order: 'Kualitas & waktu dipertaruhkan', pulse: 'Acak terarah' },
  4: { title: 'Pasar sedang naik', subtitle: 'Demam jelly membuat permintaan melonjak 40%.', icon: TrendingUp, color: '#cf4b81', order: '+40% permintaan · jaga reputasi', pulse: 'Lonjakan permintaan' },
  5: { title: 'Pesanan final', subtitle: 'Distributor nasional mengetuk pintu.', icon: Award, color: '#7055be', order: '1.800 cup · momen pembuktian', pulse: 'Babak final' },
};
const optionsByRound: Record<Round, Option[]> = {
  1: [
    { id: 'steady', title: 'Produksi sesuai pesanan', eyebrow: 'Aman & rapi', description: 'Penuhi pesanan dengan ritme pabrik saat ini.', cost: 1100000, profit: 1700000, capacity: 0, inventory: 0, reputation: 3, rationale: 'Langkah ini menjaga arus kas tetap sehat dan menghindari stok menganggur. Kamu belajar bahwa pesanan kecil adalah ruang untuk membangun reputasi.', icon: PackageCheck, tone: 'mint' },
    { id: 'stock', title: 'Buat stok ekstra', eyebrow: 'Berani berspekulasi', description: 'Produksi 100 cup tambahan untuk peluang berikutnya.', cost: 1450000, profit: 2100000, capacity: -30, inventory: 100, reputation: 1, rationale: 'Stok ekstra bisa jadi senjata saat order besar datang, tetapi modalmu ikut terkunci. Persediaan adalah aset hanya kalau bergerak.', icon: Boxes, tone: 'yellow' },
  ],
  2: [
    { id: 'shift', title: 'Tambah shift malam', eyebrow: 'Andalkan tim inti', description: 'Bayar lembur dan dorong kapasitas pabrik.', cost: 1850000, profit: 5150000, capacity: 200, inventory: -100, reputation: 4, rationale: 'Shift tambahan memperluas kapasitas tanpa investasi mesin. Biaya tenaga kerja naik, tetapi kamu mempertahankan kontrol kualitas dan reputasi.', tag: 'REKOMENDASI', icon: BatteryCharging, tone: 'pink' },
    { id: 'bulk', title: 'Beli bahan grosir', eyebrow: 'Efisiensi biaya', description: 'Kunci harga bahan baku untuk beberapa ronde.', cost: 2300000, profit: 5600000, capacity: 80, inventory: -100, reputation: 2, rationale: 'Harga per cup lebih murah dan kamu siap menghadapi demand spike. Risikonya, uang tunai lebih cepat terkunci di bahan.', icon: Boxes, tone: 'mint' },
    { id: 'outsource', title: 'Outsource 400 cup', eyebrow: 'Kolaborasi cepat', description: 'Percayakan sebagian produksi ke pabrik tetangga.', cost: 2550000, profit: 3850000, capacity: 0, inventory: -100, reputation: -2, rationale: 'Outsource menyelamatkan pesanan, namun margin dan konsistensi rasa lebih sulit dikendalikan. Pilihan cepat tidak selalu pilihan paling sehat.', icon: HandCoins, tone: 'lavender' },
    { id: 'reject', title: 'Tolak pesanan', eyebrow: 'Lindungi modal', description: 'Tutup pintu kali ini dan fokus pada operasi kecil.', cost: 0, profit: 850000, capacity: 0, inventory: 0, reputation: -8, rationale: 'Menolak order menghindarkanmu dari risiko operasional, tetapi reputasi di mata pasar turun. Bisnis perlu tahu kapan berkata tidak — dan kapan berani tumbuh.', icon: ShieldCheck, tone: 'sand' },
  ],
  3: [
    { id: 'wait', title: 'Tunggu pemasok utama', eyebrow: 'Kualitas nomor satu', description: 'Pertahankan resep, terima keterlambatan 1 hari.', cost: 500000, profit: 1200000, capacity: 0, inventory: -30, reputation: 4, rationale: 'Menjaga bahan dari pemasok utama mempertahankan rasa dan reputasi. Namun, keterlambatan membuat peluang penjualan hari ini terlewat.', icon: ShieldCheck, tone: 'mint' },
    { id: 'backup', title: 'Aktifkan pemasok cadangan', eyebrow: 'Adaptif', description: 'Bayar premium untuk bahan yang tersedia sekarang.', cost: 900000, profit: 1950000, capacity: 100, inventory: -50, reputation: 1, rationale: 'Pemasok cadangan mengajarkan pentingnya redundansi. Biaya sedikit lebih tinggi, tetapi pabrik tetap bergerak dan pelanggan tidak menunggu.', tag: 'SEIMBANG', icon: Truck, tone: 'pink' },
    { id: 'pause', title: 'Jeda produksi', eyebrow: 'Main aman', description: 'Gunakan stok yang ada dan tunggu situasi reda.', cost: 0, profit: 500000, capacity: -50, inventory: 20, reputation: -3, rationale: 'Jeda menghemat kas, tetapi mesin yang berhenti dan pelanggan yang menunggu punya biaya tersembunyi. Stabil bukan berarti diam.', icon: Pause, tone: 'sand' },
  ],
  4: [
    { id: 'scale', title: 'Naikkan produksi', eyebrow: 'Tangkap momentum', description: 'Gunakan reputasi untuk memenuhi demam jelly.', cost: 1700000, profit: 3250000, capacity: 100, inventory: -80, reputation: 5, rationale: 'Saat pasar tumbuh, kapasitas yang siap menjadi keunggulan. Kamu mengubah demand menjadi kas, tanpa mengorbankan janji pada pelanggan.', tag: 'GERAK CEPAT', icon: TrendingUp, tone: 'pink' },
    { id: 'price', title: 'Naikkan harga sedikit', eyebrow: 'Uji batas pasar', description: 'Jaga volume, tambah margin per cup.', cost: 800000, profit: 2800000, capacity: 0, inventory: -60, reputation: 0, rationale: 'Harga yang lebih sehat memberi ruang bernapas untuk bisnis. Pastikan pengalaman pelanggan tetap terasa sepadan dengan harga baru.', icon: CircleDollarSign, tone: 'yellow' },
  ],
  5: [
    { id: 'grand', title: 'Terima & ekspansi', eyebrow: 'Momen pembuktian', description: 'Kirim semua tenaga untuk order distributor nasional.', cost: 3000000, profit: 6700000, capacity: 180, inventory: -150, reputation: 6, rationale: 'Keputusan berani ini memaksimalkan profit akhir dan mengubah pabrik kecil menjadi partner yang dipercaya. Pastikan kas dan kapasitasmu cukup.', tag: 'FINAL MOVE', icon: Award, tone: 'lavender' },
    { id: 'selective', title: 'Ambil sebagian', eyebrow: 'Tumbuh bertahap', description: 'Kirim 1.000 cup dan jaga napas bisnis.', cost: 1850000, profit: 4200000, capacity: 80, inventory: -80, reputation: 3, rationale: 'Pertumbuhan bertahap menurunkan risiko dan tetap memberi sinyal positif ke distributor. Bukan semua peluang harus diambil sekaligus.', icon: Gauge, tone: 'mint' },
  ],
};
const challenges: Record<Round, RoundChallenge> = {
  1: { title: 'Lindungi reputasi pembuka', detail: 'Buktikan bahwa pesanan pertama tiba rapi sebelum mengejar stok tambahan.' },
  2: { title: 'Selamatkan order besar', detail: 'Festival menunggu. Pilih cara yang membuat produksi tetap sanggup mengirim 1.000 cup.' },
  3: { title: 'Jaga mesin tetap bergerak', detail: 'Pemasok terlambat. Cari ritme agar pelanggan tidak ikut menunggu.' },
  4: { title: 'Kapitalisasi demam jelly', detail: 'Permintaan naik 40%. Ubah momentum menjadi penjualan tanpa merusak kepercayaan.' },
  5: { title: 'Tutup dengan kas sehat', detail: 'Buktikan bisnis siap tumbuh: ambil peluang sambil menyisakan napas untuk besok.' },
};

function evaluateChallenge(round: Round, option: Option, cashAfter: number): ChallengeResult {
  const outcomes: Record<Round, ChallengeResult> = {
    1: option.id === 'steady'
      ? { success: true, title: 'Reputasi aman', detail: 'Pesanan pembuka rapi. Pasar melihat pabrikmu bisa dipercaya.' }
      : { success: false, title: 'Modal tertahan', detail: 'Stok ekstra membuka peluang, tetapi reputasi belum mendapat bukti baru.' },
    2: option.id === 'shift' || option.id === 'bulk'
      ? { success: true, title: 'Order besar terselamatkan', detail: 'Kapasitas dan suplai cukup untuk menyambut festival.' }
      : { success: false, title: 'Peluang terlewat', detail: 'Keputusan ini mengurangi tekanan hari ini, namun festival belum merasakan kekuatan pabrikmu.' },
    3: option.id === 'backup'
      ? { success: true, title: 'Mesin tetap menyala', detail: 'Pemasok cadangan membuat alur produksi terus bergerak.' }
      : { success: false, title: 'Ritme melambat', detail: 'Kualitas tetap penting, tetapi ada pelanggan yang harus menunggu.' },
    4: option.id === 'scale'
      ? { success: true, title: 'Momentum tertangkap', detail: 'Kamu mengubah lonjakan permintaan menjadi volume dan reputasi.' }
      : { success: false, title: 'Momentum belum maksimal', detail: 'Margin membaik, tetapi kapasitas belum ikut menangkap demam jelly.' },
    5: cashAfter >= 7000000
      ? { success: true, title: 'Kas punya napas', detail: 'Babak final selesai dengan buffer yang cukup untuk langkah berikutnya.' }
      : { success: false, title: 'Buffer menipis', detail: 'Ekspansi berhasil, namun kas perlu dipulihkan sebelum tumbuh lagi.' },
  };
  return outcomes[round];
}

function makeReward(round: Round, option: Option, challenge: ChallengeResult, streak: number): Reward {
  if (challenge.success && streak >= 3) return { id: `streak-${round}`, title: `Seri ${streak} ronde`, detail: 'Tiga langkah positif beruntun. Ritmemu sedang panas.', icon: Flame, tone: 'pink' };
  if (challenge.success) {
    const titles: Record<Round, string> = { 1: 'Stempel reputasi', 2: 'Medali order besar', 3: 'Lencana operasi lancar', 4: 'Piala momentum', 5: 'Medali kas sehat' };
    return { id: `success-${round}`, title: titles[round], detail: `Tantangan ronde ${round} tembus lewat ${option.title.toLowerCase()}.`, icon: Medal, tone: 'yellow' };
  }
  return { id: `learn-${round}`, title: 'Lencana belajar', detail: 'Tidak ada jalan buntu. Insight ini ikut menguatkan manajermu.', icon: Lightbulb, tone: 'mint' };
}

function FloatingParticles() {
  const colors = ['var(--yellow)', 'var(--pink)', 'var(--mint)', 'var(--lavender)'];
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">{Array.from({ length: 13 }).map((_, index) => <span key={index} className="float-particle absolute h-2 w-2 rounded-full" style={{ left: `${7 + ((index * 17) % 88)}%`, bottom: `${-5 + ((index * 13) % 30)}%`, background: colors[index % 4], animationDelay: `${index * .37}s`, animationDuration: `${3.7 + (index % 3) * .7}s` }} />)}</div>;
}

function JellyMascot({ mood, compact = false }: { mood: Mood; compact?: boolean }) {
  const face = mood === 'concerned' ? '◠  ◠' : '•  •';
  const label = mood === 'happy' ? 'siap bantu' : mood === 'thinking' ? 'hmm… pilihanmu?' : mood === 'concerned' ? 'jaga kas ya' : 'kita menang!';
  return <div className={`relative flex flex-col items-center ${compact ? 'scale-75' : ''}`} aria-label={`Maskot sedang ${mood}`}>
    <div className={`absolute -inset-4 rounded-full border-2 border-dashed border-[var(--yellow)]/40 ${mood === 'celebrate' ? 'pulse-ring' : ''}`} />
    <div className={`jelly-breathe relative h-[104px] w-[122px] rounded-[44%_44%_38%_38%] border-[3px] border-[var(--ink)] bg-gradient-to-br from-[#ffd0e4] via-[#f58bb8] to-[#d64c8b] shadow-[inset_-10px_-12px_0_rgba(112,36,91,.13),0_9px_0_#b9cde0] ${mood === 'concerned' ? 'rotate-[-5deg]' : ''}`}>
      <div className="absolute left-[20px] top-[13px] h-6 w-9 rotate-[-32deg] rounded-full bg-white/60" />
      <div className="absolute left-[29px] top-[48px] text-[17px] font-bold tracking-[10px] text-[var(--ink)]">{face}</div>
      <div className={`absolute left-[52px] top-[69px] h-3 w-7 rounded-b-full border-b-2 border-[var(--ink)] ${mood === 'concerned' ? 'rotate-180' : ''}`} />
      <div className="absolute -right-3 top-9 h-11 w-7 rotate-12 rounded-full border-2 border-[var(--ink)] bg-[#ef79ad]" />
      <div className="absolute -left-3 top-9 h-11 w-7 -rotate-12 rounded-full border-2 border-[var(--ink)] bg-[#ef79ad]" />
    </div>
    <div className="relative mt-4 rounded-full border border-[#b9d9ed] bg-white/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[.18em] text-[var(--blue-deep)]">{label}</div>
  </div>;
}

function LogoMark() {
  return <div className="flex items-center gap-3"><div className="logo-mark relative grid h-10 w-10 place-items-center rounded-[14px] border-2"><span className="logo-jelly h-5 w-6 rounded-[45%]" /></div><div><div className="logo-word font-display text-xl font-bold tracking-[-.05em]">JELLY RUSH</div><div className="logo-sub font-mono text-[9px] uppercase tracking-[.24em]">permainan bisnis</div></div></div>;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return <main className="game-shell relative min-h-[100dvh] overflow-hidden"><FloatingParticles /><div className="factory-grid absolute inset-0 opacity-60" /><div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-14">
    <header className="flex items-center justify-between"><LogoMark /><span className="hidden rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 font-mono text-[10px] uppercase tracking-[.22em] text-[var(--muted-ink)] sm:block">simulasi 01 / 05</span></header>
    <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_420px] lg:gap-24 lg:py-0"><section className="screen-pop max-w-2xl"><div className="eyebrow mb-7 inline-flex items-center gap-2 rounded-full border border-[#b9d9ed] bg-white/75 px-3 py-2 font-mono text-[10px] uppercase tracking-[.18em]"><Sparkles className="h-3.5 w-3.5" /> mode studio · 5 ronde</div><h1 className="font-display text-[clamp(4.5rem,12vw,9.2rem)] font-bold leading-[.78] tracking-[-.09em] text-[var(--blue-deep)]">Jelly<br /><span className="text-[var(--pink)]">Rush</span><span className="text-[var(--yellow)]">.</span></h1><p className="muted-ink mt-8 max-w-lg text-lg leading-relaxed sm:text-xl">Kamu memegang kunci pabrik jelly kecil yang sedang punya mimpi besar. Baca sinyal pasar, berani memilih, lalu lihat konsekuensinya bergerak.</p><button data-testid="button-start-game" onClick={onStart} className="button-yellow group mt-10 inline-flex items-center gap-3 rounded-2xl border-2 px-6 py-4 font-display text-base font-bold transition-transform hover:-translate-y-1 active:translate-y-0">Masuk ke pabrik <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button><div className="muted-ink mt-9 flex flex-wrap gap-x-7 gap-y-3 font-mono text-[10px] uppercase tracking-[.16em]"><span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 yellow" /> keputusan nyata</span><span className="flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 mint" /> profit terlihat</span></div></section>
      <section className="relative mx-auto w-full max-w-[390px] lg:mr-6"><div className="absolute -inset-10 rounded-full bg-[var(--mint)]/25 blur-3xl" /><div className="surface relative rounded-[38px] p-8"><div className="mb-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-[var(--muted-ink)]"><span>lantai produksi</span><span className="mint">aktif</span></div><JellyMascot mood="happy" /><div className="surface-yellow mt-9 rounded-2xl p-4"><div className="flex items-center justify-between text-sm"><span className="muted-ink">modal awal</span><span className="font-mono blue">{rupiah(10000000)}</span></div><div className="mt-3 h-2 rounded-full bg-[#e3edf3]"><div className="h-full w-[72%] rounded-full bg-[var(--blue)]" /></div><div className="muted-ink mt-2 flex justify-between font-mono text-[10px]"><span>kapasitas 600 cup</span><span>5 anggota tim</span></div></div><p className="ink mt-5 text-center font-display text-sm leading-relaxed">“Halo, manajer. Mari bikin keputusan yang terasa di setiap cup.”</p></div></section></div>
    <footer className="muted-ink flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5 font-mono text-[9px] uppercase tracking-[.18em]"><span>jelly rush factory / build 01</span><span>untuk belajar · untuk berani mencoba</span></footer>
  </div></main>;
}

function ProfileScreen({ onContinue }: { onContinue: (name: string, brand: string) => void }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Jelly Lab');
  const invalid = name.length > 0 && name.trim().length < 2;
  return <main className="game-shell min-h-[100dvh] px-5 py-6 sm:px-10 lg:px-14"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><LogoMark /><span className="muted-ink font-mono text-[10px] uppercase tracking-[.18em]">setup / 01</span></header><div className="grid items-center gap-10 py-14 lg:grid-cols-[.9fr_1.1fr] lg:py-24"><div className="screen-pop"><JellyMascot mood="thinking" /><p className="ink mx-auto mt-9 max-w-xs text-center font-display text-lg leading-relaxed">Sebelum mesin dinyalakan, aku perlu tahu siapa yang akan memimpin lantai produksi.</p></div><form className="surface screen-pop rounded-[32px] p-6 sm:p-9" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onContinue(name.trim(), brand.trim() || 'Jelly Lab'); }}><div className="mb-8"><span className="eyebrow font-mono text-[10px] uppercase tracking-[.2em]">cek identitas</span><h1 className="ink mt-3 font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Bangun identitas<br /><span className="text-[var(--pink)]">manajermu.</span></h1></div><label className="mb-6 block"><span className="muted-ink mb-2 block font-mono text-[10px] uppercase tracking-[.15em]">nama manajer</span><input data-testid="input-manager-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="contoh: Raka Putra" aria-invalid={invalid} className={`profile-input w-full rounded-xl border px-4 py-3 outline-none transition ${invalid ? 'border-[#e05b7f]' : ''}`} />{invalid && <span className="mt-2 block text-xs text-[#c64368]">Isi setidaknya dua karakter.</span>}</label><label className="mb-8 block"><span className="muted-ink mb-2 block font-mono text-[10px] uppercase tracking-[.15em]">nama pabrik</span><input data-testid="input-factory-name" value={brand} onChange={(event) => setBrand(event.target.value)} className="profile-input w-full rounded-xl border px-4 py-3 outline-none transition" /></label><div className="mb-8 grid grid-cols-3 gap-2">{[['modal','10 jt'],['kapasitas','600'],['tim','5']].map(([label, value]) => <div key={label} className="surface-mint rounded-xl p-3"><div className="muted-ink font-mono text-[9px] uppercase tracking-[.12em]">{label}</div><div className="ink mt-1 font-display text-lg font-bold">{value}</div></div>)}</div><button data-testid="button-confirm-profile" disabled={!name.trim() || invalid} className="button-yellow group flex w-full items-center justify-center gap-3 rounded-xl border-2 px-5 py-3.5 font-display font-bold transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-45">Buka pintu pabrik <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button></form></div></div></main>;
}

function TopBar({ cash, name, brand, onRestart }: { round: Round; cash: number; name: string; brand: string; onRestart: () => void }) {
  return <header className="topbar relative z-10 flex flex-wrap items-center justify-between gap-5 border-b px-5 py-5 sm:px-8 lg:px-12"><div className="flex items-center gap-4"><LogoMark /><div className="hidden h-7 w-px bg-[var(--line)] sm:block" /><div className="hidden sm:block"><div className="ink font-display text-sm font-bold">{brand}</div><div className="muted-ink font-mono text-[9px] uppercase tracking-[.14em]">{name} · manager</div></div></div><div className="flex items-center gap-3"><div className="surface-yellow rounded-xl px-3 py-2"><div className="muted-ink font-mono text-[9px] uppercase tracking-[.14em]">kas tersedia</div><div data-testid="text-cash" className="metric-value stat-number font-display text-base font-bold">{rupiah(cash)}</div></div><button data-testid="button-restart-game" onClick={onRestart} title="Mulai dari awal" aria-label="Mulai dari awal" className="button-quiet grid h-10 w-10 place-items-center rounded-xl transition"><RotateCcw className="h-4 w-4" /></button></div></header>;
}

function ProgressRail({ round }: { round: Round }) {
  return <div className="mb-8 flex items-center gap-2" aria-label={`Ronde ${round} dari 5`}>{([1, 2, 3, 4, 5] as Round[]).map((item) => <div key={item} className="flex flex-1 items-center gap-2"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all ${item < round ? 'progress-done' : item === round ? 'progress-current' : 'progress-future'}`}>{item < round ? <Check className="h-4 w-4" /> : `0${item}`}</div>{item !== 5 && <div className={`h-1 flex-1 rounded-full ${item < round ? 'progress-line-done' : 'progress-line-future'}`} />}</div>)}</div>;
}

function StatCard({ icon: Icon, label, value, detail, accent }: { icon: typeof Zap; label: string; value: string; detail: string; accent: string }) {
  return <div className="stat-card rounded-2xl border p-4"><div className="mb-3 flex items-center justify-between"><span className="muted-ink font-mono text-[9px] uppercase tracking-[.15em]">{label}</span><Icon className="h-4 w-4" style={{ color: accent }} /></div><div data-testid={`stat-${label.replaceAll(' ', '-')}`} className="metric-value stat-number font-display text-2xl font-bold">{value}</div><div className="stat-detail mt-1 font-mono text-[9px]">{detail}</div></div>;
}

function DecisionCard({ option, selected, disabled, onChoose }: { option: Option; selected: boolean; disabled: boolean; onChoose: () => void }) {
  const Icon = option.icon;
  const styles: Record<string, { bg: string; icon: string }> = { pink: { bg: 'var(--pink)', icon: 'var(--ink)' }, mint: { bg: 'var(--mint)', icon: 'var(--ink)' }, yellow: { bg: 'var(--yellow)', icon: 'var(--ink)' }, lavender: { bg: 'var(--lavender)', icon: 'var(--ink)' }, sand: { bg: '#f1dfb2', icon: 'var(--ink)' } };
  const style = styles[option.tone];
  return <button data-testid={`button-decision-${option.id}`} disabled={disabled} onClick={onChoose} className={`decision-card group relative flex h-full flex-col rounded-2xl border-2 p-5 text-left ${selected ? 'is-selected' : ''}`}>
    {option.tag && <span className="absolute -top-3 right-4 rounded-full border-2 border-[var(--ink)] bg-[var(--yellow)] px-2 py-1 font-mono text-[8px] font-bold tracking-[.14em] text-[var(--ink)]">{option.tag}</span>}
    <div className="mb-5 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[var(--ink)]" style={{ background: style.bg, color: style.icon }}><Icon className="h-5 w-5" /></div><ChevronRight className={`h-5 w-5 text-[#8aa0bc] transition-transform ${selected ? 'rotate-90 text-[var(--blue)]' : 'group-hover:translate-x-1 group-hover:text-[var(--blue)]'}`} /></div><div className="font-mono text-[9px] uppercase tracking-[.17em]" style={{ color: style.bg === 'var(--yellow)' ? '#9b7000' : style.bg }}>{option.eyebrow}</div><h3 className="decision-title mt-2 font-display text-xl font-bold leading-tight">{option.title}</h3><p className="decision-description mt-2 flex-1 text-sm leading-relaxed">{option.description}</p><div className="decision-rule mt-5 grid grid-cols-2 gap-2 border-t pt-4 font-mono text-[10px]"><span className="muted-ink">investasi <strong className="ml-1 ink">{rupiah(option.cost)}</strong></span><span className="muted-ink text-right">potensi <strong className="ml-1 mint">+{rupiah(option.profit)}</strong></span></div>
  </button>;
}

function ResultPanel({ option, round, challenge, reward, streak, onNext }: { option: Option; round: Round; challenge: ChallengeResult; reward: Reward; streak: number; onNext: () => void }) {
  const RewardIcon = reward.icon;
  return <div className="result-panel slide-in mt-8 overflow-hidden rounded-3xl border-2">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 px-5 py-4 sm:px-7">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mint)] text-[var(--ink)]"><Check className="h-5 w-5" /></div><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[#b5f2e8]">keputusan dikunci</div><div className="font-display font-bold">{option.title}</div></div></div>
      <div className="rounded-full bg-white/15 px-3 py-1 font-mono text-[10px] text-[#e3f7ff]">profit simulasi +{rupiah(option.profit)}</div>
    </div>
    <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-7">
      <div>
        <div className={`challenge-result ${challenge.success ? 'challenge-success' : 'challenge-learn'} mb-4 flex items-start gap-3 rounded-2xl border px-3 py-3`}>
          <Target className="mt-0.5 h-5 w-5 shrink-0" />
          <div><div className="font-mono text-[9px] uppercase tracking-[.16em]">{challenge.success ? 'tantangan tembus' : 'catatan ronde'}</div><div className="font-display text-lg font-bold">{challenge.title}</div><p className="mt-1 text-xs leading-relaxed">{challenge.detail}</p></div>
        </div>
          <div data-testid="status-reward-unlocked" className="reward-unlock flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3">
          <div className="reward-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl"><RewardIcon className="h-6 w-6" /></div>
          <div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#b5f2e8]">hadiah masuk rak</div><div className="font-display font-bold">{reward.title}</div><p className="text-xs text-[#d7eaff]">{reward.detail}</p></div>
          {streak > 1 && <div className="ml-auto flex items-center gap-1 rounded-full bg-[var(--yellow)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--ink)]"><Flame className="h-3 w-3" /> {streak}</div>}
        </div>
        <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.17em] text-[var(--yellow)]"><Lightbulb className="h-3.5 w-3.5" /> kenapa ini penting</div><p className="mt-2 max-w-2xl text-sm leading-relaxed">{option.rationale}</p>
      </div>
      <button data-testid="button-next-round" onClick={onNext} className="button-yellow group self-end rounded-xl border-2 px-4 py-3 font-display text-sm font-bold transition hover:-translate-y-1 sm:min-w-[155px]">Lanjut ronde {round < 5 ? round + 1 : 'akhir'} <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
    </div>
  </div>;
}

function GameScreen({ name, brand, onFinish, onRestart }: { name: string; brand: string; onFinish: (score: number, profit: number, reputation: number, rewards: Reward[], bestStreak: number) => void; onRestart: () => void }) {
  const [round, setRound] = useState<Round>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [cash, setCash] = useState(10000000);
  const [profit, setProfit] = useState(0);
  const [reputation, setReputation] = useState(62);
  const [capacity, setCapacity] = useState(600);
  const [inventory, setInventory] = useState(100);
  const [mood, setMood] = useState<Mood>('happy');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [lastChallenge, setLastChallenge] = useState<ChallengeResult | null>(null);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const info = roundInfo[round];
  const options = optionsByRound[round];
  const activeOption = options.find((option) => option.id === selected);
  const score = Math.max(0, Math.round((profit / 100000) + reputation * 2 + capacity / 10 + inventory / 5 + bestStreak * 12 + rewards.length * 8));
  const choose = (option: Option) => {
    if (selected) return;
    const cashAfter = cash - option.cost + option.profit;
    const challenge = evaluateChallenge(round, option, cashAfter);
    const positiveMove = option.reputation > 0 && option.profit > option.cost;
    const nextStreak = option.reputation < 0 ? 0 : positiveMove ? streak + 1 : Math.max(0, streak - 1);
    const reward = makeReward(round, option, challenge, nextStreak);
    setSelected(option.id); setCash(cashAfter); setProfit((value) => value + option.profit);
    setReputation((value) => Math.max(0, Math.min(100, value + option.reputation))); setCapacity((value) => Math.max(220, value + option.capacity)); setInventory((value) => Math.max(0, value + option.inventory));
    setStreak(nextStreak); setBestStreak((value) => Math.max(value, nextStreak)); setLastChallenge(challenge); setLastReward(reward); setRewards((value) => [...value, reward]);
    setMood(option.reputation < 0 || !challenge.success ? 'concerned' : challenge.success && (positiveMove || option.profit > 3000000) ? 'celebrate' : 'thinking');
  };
  const next = () => { if (round === 5) onFinish(score, profit, reputation, rewards, bestStreak); else { setRound((value) => (value + 1) as Round); setSelected(null); setMood('happy'); setLastChallenge(null); setLastReward(null); } };
  const mascotMessage = lastChallenge?.success ? (bestStreak >= 3 ? 'Mantap! Medali efisiensi masuk.' : 'Mantap! Tantangan ronde tembus.') : lastChallenge ? 'Belajar juga bagian dari menang.' : 'Pilih langkah yang membuat pabrik bergerak.';
  return <main className="game-shell min-h-[100dvh]"><TopBar round={round} cash={cash} name={name} brand={brand} onRestart={onRestart} /><div className="relative mx-auto max-w-[1450px] px-5 py-7 sm:px-8 lg:px-12"><FloatingParticles /><ProgressRail round={round} /><div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_310px]"><section><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.2em]"><span>round {String(round).padStart(2, '0')}</span><span className="h-px w-9 bg-[var(--line)]" /><span style={{ color: info.color }}>{info.pulse ?? 'on track'}</span></div><h1 className="ink font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">{info.title}</h1><p className="muted-ink mt-2 text-base">{info.subtitle}</p></div><div className="surface-yellow rounded-2xl px-4 py-3 text-right"><div className="muted-ink font-mono text-[9px] uppercase tracking-[.14em]">brief pesanan</div><div className="yellow mt-1 font-display text-lg font-bold">{info.order}</div></div></div>
           <div className="challenge-card mb-6 flex items-start gap-3 rounded-2xl border px-4 py-4"><Target className="challenge-target mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--blue)]">tantangan ronde {round}</div><h2 className="ink mt-1 font-display text-lg font-bold">{challenges[round].title}</h2><p className="muted-ink mt-1 text-sm">{challenges[round].detail}</p></div><div data-testid={`status-challenge-${round}`} className={`challenge-status hidden rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[.1em] sm:block ${lastChallenge ? (lastChallenge.success ? 'is-success' : 'is-learning') : ''}`}>{lastChallenge ? (lastChallenge.success ? 'tembus' : 'belajar') : 'menunggu'}</div></div>
          <div className={`grid gap-4 ${options.length > 2 ? 'md:grid-cols-2' : 'lg:grid-cols-2'}`}>{options.map((option, index) => <div key={option.id} className="screen-pop" style={{ animationDelay: `${index * .08}s` }}><DecisionCard option={option} selected={selected === option.id} disabled={Boolean(selected)} onChoose={() => choose(option)} /></div>)}</div>{activeOption && lastChallenge && lastReward && <ResultPanel option={activeOption} round={round} challenge={lastChallenge} reward={lastReward} streak={streak} onNext={next} />}</section><aside className="xl:sticky xl:top-6 xl:self-start"><div className="mascot-zone relative mb-5 flex justify-center xl:justify-end"><div className={`mascot-toast ${lastChallenge ? 'toast-visible' : ''}`} role="status"><Gift className="h-4 w-4 shrink-0" /><span>{mascotMessage}</span></div><div className="reward-float grid h-10 w-10 place-items-center rounded-xl border-2"><Gift className="h-5 w-5" /></div><JellyMascot mood={mood} compact /></div><div className="streak-card mb-4 flex items-center justify-between rounded-2xl border px-4 py-3"><div><div className="font-mono text-[9px] uppercase tracking-[.16em]">combo manager</div><div className="font-display text-lg font-bold">{streak} langkah positif</div></div><div className="streak-flame grid h-10 w-10 place-items-center rounded-xl"><Flame className="h-5 w-5" /></div></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-1"><StatCard icon={CircleDollarSign} label="profit berjalan" value={rupiah(profit)} detail="akumulasi 5 ronde" accent="var(--mint)" /><StatCard icon={Gauge} label="kapasitas" value={`${capacity} cup`} detail="kemampuan produksi" accent="var(--pink)" /><StatCard icon={Boxes} label="inventory" value={`${inventory} cup`} detail="stok siap kirim" accent="var(--yellow)" /><StatCard icon={Heart} label="reputasi" value={`${reputation}/100`} detail="kepercayaan pasar" accent="var(--lavender)" /></div><div className="intel-card mt-5 hidden rounded-2xl border p-4 xl:block"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em]"><LockKeyhole className="h-3.5 w-3.5 yellow" /> intel manager</div><p className="mt-3 text-xs leading-relaxed">Jangan hanya mengejar profit. Kas, kapasitas, inventory, dan reputasi saling tarik-menarik.</p></div></aside></div></div></main>;
}

function FinalScreen({ name, brand, score, profit, reputation, rewards, bestStreak, onRestart }: { name: string; brand: string; score: number; profit: number; reputation: number; rewards: Reward[]; bestStreak: number; onRestart: () => void }) {
  const rank = score > 420 ? 'Legenda Pabrik' : score > 300 ? 'Strategi Jelly' : 'Perintis Berani';
  const [shareText, setShareText] = useState('Bagikan hasil');
  const confetti = useMemo(() => Array.from({ length: 24 }), []);
  const share = () => { setShareText('Hasil tersalin'); navigator.clipboard?.writeText(`Jelly Rush — ${rank}, score ${score}, profit ${rupiah(profit)}, combo ${bestStreak}`); };
  return <main className="game-shell relative min-h-[100dvh] overflow-hidden px-5 py-6 sm:px-10 lg:px-14"><FloatingParticles /><div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">{confetti.map((_, index) => <span key={index} className="confetti-piece absolute h-3 w-2 rounded-sm" style={{ left: `${12 + ((index * 19) % 76)}%`, top: `${index % 4 * 7}px`, background: ['var(--yellow)', 'var(--pink)', 'var(--mint)', 'var(--lavender)'][index % 4], animationDelay: `${index * .07}s`, transform: `rotate(${index * 31}deg)` }} />)}</div><div className="relative mx-auto flex min-h-[100dvh] max-w-5xl flex-col"><header className="flex items-center justify-between"><LogoMark /><span className="muted-ink font-mono text-[10px] uppercase tracking-[.18em]">simulasi selesai / 05</span></header><div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[.8fr_1.2fr]"><div className="screen-pop text-center lg:text-left"><JellyMascot mood="celebrate" /><div className="eyebrow mt-7 font-mono text-[10px] uppercase tracking-[.24em]">pabrikmu selesai beroperasi</div><h1 className="ink mt-3 font-display text-5xl font-bold leading-[.9] tracking-[-.07em]">Kerja bagus,<br /><span className="text-[var(--pink)]">{name}.</span></h1><p className="muted-ink mx-auto mt-6 max-w-md lg:mx-0">Dari 100 cup di gudang sampai keputusan final — kamu berhasil memberi nyawa pada {brand}.</p><div className="final-celebration mt-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em]"><Gift className="h-4 w-4" /> {rewards.length} hadiah terkumpul · combo terbaik {bestStreak}</div><button data-testid="button-restart-final" onClick={onRestart} className="button-yellow mt-8 inline-flex items-center gap-3 rounded-xl border-2 px-5 py-3 font-display font-bold transition hover:-translate-y-1"><RotateCcw className="h-4 w-4" /> Main lagi</button></div><section className="surface screen-pop rounded-[34px] p-6 sm:p-9"><div className="flex items-center justify-between border-b border-[var(--line)] pb-5"><div><div className="muted-ink font-mono text-[10px] uppercase tracking-[.18em]">performa akhir</div><div className="ink mt-1 font-display text-2xl font-bold">{rank}</div></div><div className="final-score grid h-16 w-16 place-items-center rounded-2xl border-2 text-center"><div className="font-display text-2xl font-bold">{score}</div><div className="font-mono text-[8px] uppercase">nilai</div></div></div><div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-3"><div className="surface-mint rounded-2xl p-4"><CircleDollarSign className="mint h-4 w-4" /><div className="muted-ink mt-3 font-mono text-[9px] uppercase tracking-[.12em]">profit bersih</div><div data-testid="text-final-profit" className="metric-value ink mt-1 font-display text-xl font-bold">{rupiah(profit)}</div></div><div className="surface-pink rounded-2xl p-4"><Heart className="pink h-4 w-4" /><div className="muted-ink mt-3 font-mono text-[9px] uppercase tracking-[.12em]">reputasi</div><div data-testid="text-final-reputation" className="metric-value ink mt-1 font-display text-xl font-bold">{reputation}/100</div></div><div className="surface-yellow col-span-2 rounded-2xl p-4 sm:col-span-1"><BadgeCheck className="yellow h-4 w-4" /><div className="muted-ink mt-3 font-mono text-[9px] uppercase tracking-[.12em]">combo tertinggi</div><div className="ink mt-1 font-display text-xl font-bold">{bestStreak} langkah</div></div></div><div className="reward-shelf rounded-2xl border p-4"><div className="mb-3 flex items-center justify-between"><div className="mint flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em]"><Medal className="h-3.5 w-3.5" /> rak hadiah</div><span className="muted-ink font-mono text-[9px]">{rewards.length}/5 terkumpul</span></div><div className="grid gap-2 sm:grid-cols-2">{rewards.map((reward) => { const RewardIcon = reward.icon; return <div key={reward.id} data-testid={`reward-${reward.id}`} className="reward-shelf-item flex items-center gap-3 rounded-xl px-3 py-2"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"><RewardIcon className="h-4 w-4" /></div><div><div className="font-display text-sm font-bold">{reward.title}</div><div className="muted-ink text-[10px]">{reward.detail}</div></div></div>; })}</div></div><div className="surface-mint mt-4 rounded-2xl p-4"><div className="mint flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em]"><Star className="h-3.5 w-3.5" /> catatan untuk presentasi</div><p className="muted-ink mt-2 text-sm leading-relaxed">Kamu tidak cuma memilih profit terbesar. Kamu membaca tarik-ulur antara modal, kapasitas, stok, kualitas, dan reputasi di setiap ronde.</p></div><button data-testid="button-share-result" onClick={share} className="share-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-[10px] uppercase tracking-[.15em] transition"><Sparkles className="h-4 w-4" /> {shareText}</button></section></div><footer className="muted-ink border-t border-[var(--line)] pt-5 text-center font-mono text-[9px] uppercase tracking-[.18em]">Jelly Rush · dibuat untuk manajer yang mau mencoba</footer></div></main>;
}

function Home() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [profile, setProfile] = useState({ name: '', brand: '' });
  const [result, setResult] = useState<{ score: number; profit: number; reputation: number; rewards: Reward[]; bestStreak: number }>({ score: 0, profit: 0, reputation: 62, rewards: [], bestStreak: 0 });
  const restart = () => { setPhase('welcome'); setProfile({ name: '', brand: '' }); setResult({ score: 0, profit: 0, reputation: 62, rewards: [], bestStreak: 0 }); };
  return phase === 'welcome' ? <WelcomeScreen onStart={() => setPhase('profile')} /> : phase === 'profile' ? <ProfileScreen onContinue={(name, brand) => { setProfile({ name, brand }); setPhase('game'); }} /> : phase === 'game' ? <GameScreen name={profile.name} brand={profile.brand} onFinish={(score, profit, reputation, rewards, bestStreak) => { setResult({ score, profit, reputation, rewards, bestStreak }); setPhase('final'); }} onRestart={restart} /> : <FinalScreen name={profile.name} brand={profile.brand} {...result} onRestart={restart} />;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route component={() => <div className="not-found grid min-h-[100dvh] place-items-center"><div className="surface max-w-sm rounded-3xl p-8 text-center"><Factory className="blue mx-auto h-10 w-10" /><h1 className="ink mt-4 font-display text-3xl font-bold">Pintu ini belum dibuat.</h1><p className="muted-ink mt-2">Kembali ke lantai produksi untuk melanjutkan perjalananmu.</p></div></div>} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><Router /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;