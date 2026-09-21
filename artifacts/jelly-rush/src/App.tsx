import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowRight, Award, BadgeCheck, BarChart3, BatteryCharging, Boxes, Check, ChevronRight, CircleDollarSign, Factory, Flame, Gauge, HandCoins, Heart, Leaf, Lightbulb, LockKeyhole, PackageCheck, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Star, Store, TrendingUp, Truck, Users, Zap } from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Phase = 'welcome' | 'profile' | 'game' | 'final';
type Round = 1 | 2 | 3 | 4 | 5;
type Mood = 'happy' | 'thinking' | 'concerned' | 'celebrate';

type Option = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  cost: number;
  profit: number;
  capacity: number;
  inventory: number;
  reputation: number;
  rationale: string;
  tag?: string;
  icon: typeof Zap;
  tone: string;
};

const queryClient = new QueryClient();
const rupiah = (value: number) => `Rp${Math.round(value).toLocaleString('id-ID')}`;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'JM';

const roundInfo: Record<Round, { title: string; subtitle: string; icon: typeof Store; color: string; order: string; pulse?: string }> = {
  1: { title: 'Pesanan pembuka', subtitle: 'Toko Rasa ingin mencoba 400 cup.', icon: Store, color: '#f7c948', order: '400 cup · Rp7.000 / cup' },
  2: { title: 'Pesanan besar masuk', subtitle: 'Festival kampus memesan 1.000 cup.', icon: Flame, color: '#ef7957', order: '1.000 cup · Rp7.000 / cup', pulse: 'Peluang besar' },
  3: { title: 'Masalah pemasok', subtitle: 'Bahan utama terlambat di dermaga.', icon: Truck, color: '#65c7c2', order: 'Kualitas & waktu dipertaruhkan', pulse: 'Acak terarah' },
  4: { title: 'Pasar sedang naik', subtitle: 'Demam jelly membuat demand melonjak 40%.', icon: TrendingUp, color: '#f78eb2', order: '+40% permintaan · jaga reputasi', pulse: 'Demand spike' },
  5: { title: 'Pesanan final', subtitle: 'Distributor nasional mengetuk pintu.', icon: Award, color: '#c9a3ff', order: '1.800 cup · momen pembuktian', pulse: 'Babak final' },
};

const optionsByRound: Record<Round, Option[]> = {
  1: [
    { id: 'steady', title: 'Produksi sesuai pesanan', eyebrow: 'Aman & rapi', description: 'Penuhi pesanan dengan ritme pabrik saat ini.', cost: 1100000, profit: 1700000, capacity: 0, inventory: 0, reputation: 3, rationale: 'Langkah ini menjaga arus kas tetap sehat dan menghindari stok menganggur. Kamu belajar bahwa pesanan kecil adalah ruang untuk membangun reputasi.', icon: PackageCheck, tone: 'teal' },
    { id: 'stock', title: 'Buat stok ekstra', eyebrow: 'Berani berspekulasi', description: 'Produksi 100 cup tambahan untuk peluang berikutnya.', cost: 1450000, profit: 2100000, capacity: -30, inventory: 100, reputation: 1, rationale: 'Stok ekstra bisa jadi senjata saat order besar datang, tetapi modalmu ikut terkunci. Persediaan adalah aset hanya kalau bergerak.', icon: Boxes, tone: 'yellow' },
  ],
  2: [
    { id: 'shift', title: 'Tambah shift malam', eyebrow: 'Andalkan tim inti', description: 'Bayar lembur dan dorong kapasitas pabrik.', cost: 1850000, profit: 5150000, capacity: 200, inventory: -100, reputation: 4, rationale: 'Shift tambahan memperluas kapasitas tanpa investasi mesin. Biaya tenaga kerja naik, tetapi kamu mempertahankan kontrol kualitas dan reputasi.', tag: 'REKOMENDASI', icon: BatteryCharging, tone: 'pink' },
    { id: 'bulk', title: 'Beli bahan grosir', eyebrow: 'Efisiensi biaya', description: 'Kunci harga bahan baku untuk beberapa ronde.', cost: 2300000, profit: 5600000, capacity: 80, inventory: -100, reputation: 2, rationale: 'Harga per cup lebih murah dan kamu siap menghadapi demand spike. Risikonya, uang tunai lebih cepat terkunci di bahan.', icon: Boxes, tone: 'teal' },
    { id: 'outsource', title: 'Outsource 400 cup', eyebrow: 'Kolaborasi cepat', description: 'Percayakan sebagian produksi ke pabrik tetangga.', cost: 2550000, profit: 3850000, capacity: 0, inventory: -100, reputation: -2, rationale: 'Outsource menyelamatkan pesanan, namun margin dan konsistensi rasa lebih sulit dikendalikan. Pilihan cepat tidak selalu pilihan paling sehat.', icon: HandCoins, tone: 'lavender' },
    { id: 'reject', title: 'Tolak pesanan', eyebrow: 'Lindungi modal', description: 'Tutup pintu kali ini dan fokus pada operasi kecil.', cost: 0, profit: 850000, capacity: 0, inventory: 0, reputation: -8, rationale: 'Menolak order menghindarkanmu dari risiko operasional, tetapi reputasi di mata pasar turun. Bisnis perlu tahu kapan berkata tidak — dan kapan berani tumbuh.', icon: ShieldCheck, tone: 'sand' },
  ],
  3: [
    { id: 'wait', title: 'Tunggu pemasok utama', eyebrow: 'Kualitas nomor satu', description: 'Pertahankan resep, terima keterlambatan 1 hari.', cost: 500000, profit: 1200000, capacity: 0, inventory: -30, reputation: 4, rationale: 'Menjaga bahan dari pemasok utama mempertahankan rasa dan reputasi. Namun, keterlambatan membuat peluang penjualan hari ini terlewat.', icon: ShieldCheck, tone: 'teal' },
    { id: 'backup', title: 'Aktifkan pemasok cadangan', eyebrow: 'Adaptif', description: 'Bayar premium untuk bahan yang tersedia sekarang.', cost: 900000, profit: 1950000, capacity: 100, inventory: -50, reputation: 1, rationale: 'Pemasok cadangan mengajarkan pentingnya redundansi. Biaya sedikit lebih tinggi, tetapi pabrik tetap bergerak dan pelanggan tidak menunggu.', tag: 'SEIMBANG', icon: Truck, tone: 'pink' },
    { id: 'pause', title: 'Jeda produksi', eyebrow: 'Main aman', description: 'Gunakan stok yang ada dan tunggu situasi reda.', cost: 0, profit: 500000, capacity: -50, inventory: 20, reputation: -3, rationale: 'Jeda menghemat kas, tetapi mesin yang berhenti dan pelanggan yang menunggu punya biaya tersembunyi. Stabil bukan berarti diam.', icon: Pause, tone: 'sand' },
  ],
  4: [
    { id: 'scale', title: 'Naikkan produksi', eyebrow: 'Tangkap momentum', description: 'Gunakan reputasi untuk memenuhi demam jelly.', cost: 1700000, profit: 3250000, capacity: 100, inventory: -80, reputation: 5, rationale: 'Saat pasar tumbuh, kapasitas yang siap menjadi keunggulan. Kamu mengubah demand menjadi kas, tanpa mengorbankan janji pada pelanggan.', tag: 'GERAK CEPAT', icon: TrendingUp, tone: 'pink' },
    { id: 'price', title: 'Naikkan harga sedikit', eyebrow: 'Uji batas pasar', description: 'Jaga volume, tambah margin per cup.', cost: 800000, profit: 2800000, capacity: 0, inventory: -60, reputation: 0, rationale: 'Harga yang lebih sehat memberi ruang bernapas untuk bisnis. Pastikan pengalaman pelanggan tetap terasa sepadan dengan harga baru.', icon: CircleDollarSign, tone: 'yellow' },
  ],
  5: [
    { id: 'grand', title: 'Terima & ekspansi', eyebrow: 'Momen pembuktian', description: 'Kirim semua tenaga untuk order distributor nasional.', cost: 3000000, profit: 6700000, capacity: 180, inventory: -150, reputation: 6, rationale: 'Keputusan berani ini memaksimalkan profit akhir dan mengubah pabrik kecil menjadi partner yang dipercaya. Pastikan kas dan kapasitasmu cukup.', tag: 'FINAL MOVE', icon: Award, tone: 'lavender' },
    { id: 'selective', title: 'Ambil sebagian', eyebrow: 'Tumbuh bertahap', description: 'Kirim 1.000 cup dan jaga napas bisnis.', cost: 1850000, profit: 4200000, capacity: 80, inventory: -80, reputation: 3, rationale: 'Pertumbuhan bertahap menurunkan risiko dan tetap memberi sinyal positif ke distributor. Bukan semua peluang harus diambil sekaligus.', icon: Gauge, tone: 'teal' },
  ],
};

function FloatingParticles() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 13 }).map((_, index) => <span key={index} className="float-particle absolute h-2 w-2 rounded-full" style={{ left: `${7 + ((index * 17) % 88)}%`, bottom: `${-5 + ((index * 13) % 30)}%`, background: ['#f7c948', '#f78eb2', '#65c7c2', '#c9a3ff'][index % 4], animationDelay: `${index * .37}s`, animationDuration: `${3.7 + (index % 3) * .7}s` }} />)}
  </div>;
}

function JellyMascot({ mood, compact = false }: { mood: Mood; compact?: boolean }) {
  const face = mood === 'concerned' ? '◠  ◠' : mood === 'thinking' ? '•  •' : '•  •';
  return <div className={`relative flex flex-col items-center ${compact ? 'scale-75' : ''}`} aria-label={`Maskot sedang ${mood}`}>
    <div className={`absolute -inset-4 rounded-full border-2 border-dashed border-[#f7c948]/30 ${mood === 'celebrate' ? 'pulse-ring' : ''}`} />
    <div className={`jelly-breathe relative h-[104px] w-[122px] rounded-[44%_44%_38%_38%] border-[3px] border-[#241c3d] bg-gradient-to-br from-[#ffacd0] via-[#f47daa] to-[#d94d8c] shadow-[inset_-10px_-12px_0_rgba(112,36,91,.13),0_12px_0_#3b2853] ${mood === 'concerned' ? 'rotate-[-5deg]' : ''}`}>
      <div className="absolute left-[20px] top-[13px] h-6 w-9 rotate-[-32deg] rounded-full bg-white/50" />
      <div className="absolute left-[29px] top-[48px] text-[17px] font-bold tracking-[10px] text-[#32203d]">{face}</div>
      <div className={`absolute left-[52px] top-[69px] h-3 w-7 rounded-b-full border-b-2 border-[#32203d] ${mood === 'concerned' ? 'rotate-180' : ''}`} />
      <div className="absolute -right-3 top-9 h-11 w-7 rotate-12 rounded-full border-2 border-[#241c3d] bg-[#ef79ad]" />
      <div className="absolute -left-3 top-9 h-11 w-7 -rotate-12 rounded-full border-2 border-[#241c3d] bg-[#ef79ad]" />
    </div>
    <div className="mt-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[.18em] text-[#f8eeca]">{mood === 'happy' ? 'siap bantu' : mood === 'thinking' ? 'hmm… pilihanmu?' : mood === 'concerned' ? 'jaga kas ya' : 'kita menang!'}</div>
  </div>;
}

function LogoMark() {
  return <div className="flex items-center gap-3"><div className="relative grid h-10 w-10 place-items-center rounded-[14px] border-2 border-[#241c3d] bg-[#f78eb2] shadow-[3px_3px_0_#f7c948]"><span className="h-5 w-6 rounded-[45%] bg-[#ffc2dc] shadow-[inset_-3px_-3px_0_#d85891]" /></div><div><div className="font-display text-xl font-bold tracking-[-.05em] text-[#fff4d7]">JELLY RUSH</div><div className="font-mono text-[9px] uppercase tracking-[.24em] text-[#a99dbc]">business game</div></div></div>;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return <main className="game-shell relative min-h-[100dvh] overflow-hidden text-[#fff4d7]">
    <FloatingParticles />
    <div className="factory-grid absolute inset-0 opacity-30" />
    <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-14">
      <header className="flex items-center justify-between"><LogoMark /><span className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#b7aac7] sm:block">simulasi 01 / 05</span></header>
      <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_420px] lg:gap-24 lg:py-0">
        <section className="screen-pop max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f7c948]/40 bg-[#f7c948]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#f7c948]"><Sparkles className="h-3.5 w-3.5" /> studio mode · 5 ronde</div>
          <h1 className="font-display text-[clamp(4.5rem,12vw,9.2rem)] font-bold leading-[.78] tracking-[-.09em] text-[#fff4d7]">Jelly<br /><span className="text-[#f78eb2]">Rush</span><span className="text-[#f7c948]">.</span></h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#c8bad1] sm:text-xl">Kamu memegang kunci pabrik jelly kecil yang sedang punya mimpi besar. Baca sinyal pasar, berani memilih, lalu lihat konsekuensinya bergerak.</p>
          <button data-testid="button-start-game" onClick={onStart} className="group mt-10 inline-flex items-center gap-3 rounded-2xl border-2 border-[#241c3d] bg-[#f7c948] px-6 py-4 font-display text-base font-bold text-[#241c3d] shadow-[5px_5px_0_#f78eb2] transition-transform hover:-translate-y-1 hover:shadow-[7px_8px_0_#f78eb2] active:translate-y-0 active:shadow-[2px_2px_0_#f78eb2]">Masuk ke pabrik <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 font-mono text-[10px] uppercase tracking-[.16em] text-[#9488a5]"><span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-[#f7c948]" /> keputusan nyata</span><span className="flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-[#65c7c2]" /> profit terlihat</span></div>
        </section>
        <section className="relative mx-auto w-full max-w-[390px] lg:mr-6">
          <div className="absolute -inset-10 rounded-full bg-[#f78eb2]/10 blur-3xl" />
          <div className="relative rounded-[38px] border-2 border-white/15 bg-[#28203f]/85 p-8 shadow-[0_30px_80px_rgba(0,0,0,.28)] backdrop-blur-sm">
            <div className="mb-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-[#9e92ae]"><span>manager cockpit</span><span className="text-[#65c7c2]">online</span></div>
            <JellyMascot mood="happy" />
            <div className="mt-9 rounded-2xl border border-white/10 bg-[#17132a]/60 p-4"><div className="flex items-center justify-between text-sm"><span className="text-[#c8bad1]">modal awal</span><span className="font-mono text-[#f7c948]">{rupiah(10000000)}</span></div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#f7c948]" /></div><div className="mt-2 flex justify-between font-mono text-[10px] text-[#817693]"><span>kapasitas 600 cup</span><span>5 anggota tim</span></div></div>
            <p className="mt-5 text-center font-display text-sm leading-relaxed text-[#f8eeca]">“Halo, manager. Mari bikin keputusan yang terasa di setiap cup.”</p>
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[9px] uppercase tracking-[.18em] text-[#827694]"><span>jelly rush factory / build 01</span><span>untuk belajar · untuk berani mencoba</span></footer>
    </div>
  </main>;
}

function ProfileScreen({ onContinue }: { onContinue: (name: string, brand: string) => void }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Jelly Lab');
  return <main className="game-shell min-h-[100dvh] px-5 py-6 text-[#fff4d7] sm:px-10 lg:px-14"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><LogoMark /><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#988aa6]">setup / 01</span></header><div className="grid items-center gap-10 py-14 lg:grid-cols-[.9fr_1.1fr] lg:py-24"><div className="screen-pop"><JellyMascot mood="thinking" /><p className="mx-auto mt-9 max-w-xs text-center font-display text-lg leading-relaxed text-[#f8eeca]">Sebelum mesin dinyalakan, aku perlu tahu siapa yang akan memimpin lantai produksi.</p></div><form className="screen-pop rounded-[32px] border border-white/15 bg-[#28203f]/90 p-6 shadow-[0_25px_70px_rgba(0,0,0,.22)] sm:p-9" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onContinue(name.trim(), brand.trim() || 'Jelly Lab'); }}><div className="mb-8"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-[#f7c948]">identity check</span><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Bangun identitas<br /><span className="text-[#f78eb2]">managermu.</span></h1></div><label className="mb-6 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-[#b8a9c7]">nama manager</span><input data-testid="input-manager-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="contoh: Raka Putra" className="w-full rounded-xl border border-white/15 bg-[#17132a] px-4 py-3 text-[#fff4d7] placeholder:text-[#776b88] outline-none transition focus:border-[#f7c948]" /></label><label className="mb-8 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-[#b8a9c7]">nama pabrik</span><input data-testid="input-factory-name" value={brand} onChange={(event) => setBrand(event.target.value)} className="w-full rounded-xl border border-white/15 bg-[#17132a] px-4 py-3 text-[#fff4d7] outline-none transition focus:border-[#f78eb2]" /></label><div className="mb-8 grid grid-cols-3 gap-2">{[['modal','10 jt'],['kapasitas','600'],['tim','5']].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8f829e]">{label}</div><div className="mt-1 font-display text-lg font-bold text-[#f8eeca]">{value}</div></div>)}</div><button data-testid="button-confirm-profile" disabled={!name.trim()} className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#241c3d] bg-[#f7c948] px-5 py-3.5 font-display font-bold text-[#241c3d] shadow-[4px_4px_0_#f78eb2] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40">Buka pintu pabrik <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button></form></div></div></main>;
}

function TopBar({ round, cash, name, brand, onRestart }: { round: Round; cash: number; name: string; brand: string; onRestart: () => void }) {
  return <header className="relative z-10 flex flex-wrap items-center justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12"><div className="flex items-center gap-4"><LogoMark /><div className="hidden h-7 w-px bg-white/15 sm:block" /><div className="hidden sm:block"><div className="font-display text-sm font-bold text-[#f8eeca]">{brand}</div><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8e819e]">{name} · manager</div></div></div><div className="flex items-center gap-3"><div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#9285a3]">cash on hand</div><div data-testid="text-cash" className="stat-number font-display text-base font-bold text-[#f7c948]">{rupiah(cash)}</div></div><button data-testid="button-restart-game" onClick={onRestart} title="Mulai dari awal" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#b9acc8] transition hover:border-[#f78eb2]/60 hover:text-[#f78eb2]"><RotateCcw className="h-4 w-4" /></button></div></header>;
}

function ProgressRail({ round }: { round: Round }) {
  return <div className="mb-8 flex items-center gap-2">{([1,2,3,4,5] as Round[]).map((item) => <div key={item} className="flex flex-1 items-center gap-2"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all ${item < round ? 'border-[#65c7c2] bg-[#65c7c2] text-[#241c3d]' : item === round ? 'border-[#f7c948] bg-[#f7c948] text-[#241c3d] shadow-[0_0_0_5px_rgba(247,201,72,.15)]' : 'border-white/20 bg-white/5 text-[#817594]'}`}>{item < round ? <Check className="h-4 w-4" /> : `0${item}`}</div>{item !== 5 && <div className={`h-1 flex-1 rounded-full ${item < round ? 'bg-[#65c7c2]' : 'bg-white/10'}`} />}</div>)}</div>;
}

function StatCard({ icon: Icon, label, value, detail, accent }: { icon: typeof Zap; label: string; value: string; detail: string; accent: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#28203f]/90 p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#91849f]">{label}</span><Icon className="h-4 w-4" style={{ color: accent }} /></div><div data-testid={`stat-${label.replaceAll(' ', '-')}`} className="stat-number font-display text-2xl font-bold text-[#f8eeca]">{value}</div><div className="mt-1 font-mono text-[9px] text-[#8a7c98]">{detail}</div></div>;
}

function DecisionCard({ option, selected, disabled, onChoose }: { option: Option; selected: boolean; disabled: boolean; onChoose: () => void }) {
  const Icon = option.icon;
  const styles: Record<string, { bg: string; icon: string; border: string }> = { pink: { bg: '#f78eb2', icon: '#3a2140', border: '#f78eb2' }, teal: { bg: '#65c7c2', icon: '#203b43', border: '#65c7c2' }, yellow: { bg: '#f7c948', icon: '#3a2a26', border: '#f7c948' }, lavender: { bg: '#c9a3ff', icon: '#322346', border: '#c9a3ff' }, sand: { bg: '#efe0bc', icon: '#3a2a26', border: '#efe0bc' } };
  const style = styles[option.tone];
  return <button data-testid={`button-decision-${option.id}`} disabled={disabled} onClick={onChoose} className={`decision-card group relative flex h-full flex-col rounded-2xl border-2 p-5 text-left ${selected ? 'border-[#f7c948] bg-[#3d2f55] shadow-[0_0_0_4px_rgba(247,201,72,.16)]' : 'border-white/10 bg-[#28203f]/90 hover:border-white/30'} disabled:cursor-default disabled:hover:transform-none`}>
    {option.tag && <span className="absolute -top-3 right-4 rounded-full border border-[#241c3d] bg-[#f7c948] px-2 py-1 font-mono text-[8px] font-bold tracking-[.14em] text-[#241c3d]">{option.tag}</span>}
    <div className="mb-5 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#241c3d]" style={{ background: style.bg, color: style.icon }}><Icon className="h-5 w-5" /></div><ChevronRight className={`h-5 w-5 text-[#6e627e] transition-transform ${selected ? 'rotate-90 text-[#f7c948]' : 'group-hover:translate-x-1 group-hover:text-[#f7c948]'}`} /></div>
    <div className="font-mono text-[9px] uppercase tracking-[.17em]" style={{ color: style.bg }}>{option.eyebrow}</div><h3 className="mt-2 font-display text-xl font-bold leading-tight text-[#fff4d7]">{option.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-[#ac9db7]">{option.description}</p><div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 font-mono text-[10px]"><span className="text-[#8d809b]">investasi <strong className="ml-1 text-[#f8eeca]">{rupiah(option.cost)}</strong></span><span className="text-right text-[#8d809b]">potensi <strong className="ml-1 text-[#65c7c2]">+{rupiah(option.profit)}</strong></span></div>
  </button>;
}

function ResultPanel({ option, round, onNext }: { option: Option; round: Round; onNext: () => void }) {
  return <div className="slide-in mt-8 overflow-hidden rounded-3xl border-2 border-[#65c7c2]/45 bg-[#203a45] shadow-[0_20px_50px_rgba(20,35,50,.2)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#65c7c2] text-[#203a45]"><Check className="h-5 w-5" /></div><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8fded7]">keputusan dikunci</div><div className="font-display font-bold text-[#fff4d7]">{option.title}</div></div></div><div className="rounded-full bg-[#65c7c2]/15 px-3 py-1 font-mono text-[10px] text-[#a8eee7]">profit simulasi +{rupiah(option.profit)}</div></div><div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-7"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.17em] text-[#f7c948]"><Lightbulb className="h-3.5 w-3.5" /> kenapa ini penting</div><p className="max-w-2xl text-sm leading-relaxed text-[#c5d9d7]">{option.rationale}</p></div><button data-testid="button-next-round" onClick={onNext} className="group self-end rounded-xl border-2 border-[#241c3d] bg-[#f7c948] px-4 py-3 font-display text-sm font-bold text-[#241c3d] shadow-[3px_3px_0_#f78eb2] transition hover:-translate-y-1 sm:min-w-[155px]">Lanjut ronde {round < 5 ? round + 1 : 'akhir'} <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div></div>;
}

function GameScreen({ name, brand, onFinish, onRestart }: { name: string; brand: string; onFinish: (score: number, profit: number, reputation: number) => void; onRestart: () => void }) {
  const [round, setRound] = useState<Round>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [cash, setCash] = useState(10000000);
  const [profit, setProfit] = useState(0);
  const [reputation, setReputation] = useState(62);
  const [capacity, setCapacity] = useState(600);
  const [inventory, setInventory] = useState(100);
  const [mood, setMood] = useState<Mood>('happy');
  const info = roundInfo[round];
  const options = optionsByRound[round];
  const activeOption = options.find((option) => option.id === selected);
  const score = Math.max(0, Math.round((profit / 100000) + reputation * 2 + capacity / 10 + inventory / 5));
  const roundNumber = String(round).padStart(2, '0');
  const choose = (option: Option) => {
    if (selected) return;
    setSelected(option.id);
    setCash((value) => value - option.cost + option.profit);
    setProfit((value) => value + option.profit);
    setReputation((value) => Math.max(0, Math.min(100, value + option.reputation)));
    setCapacity((value) => Math.max(220, value + option.capacity));
    setInventory((value) => Math.max(0, value + option.inventory));
    setMood(option.reputation < 0 ? 'concerned' : option.profit > 3000000 ? 'celebrate' : 'thinking');
  };
  const next = () => { if (round === 5) onFinish(score, profit, reputation); else { setRound((value) => (value + 1) as Round); setSelected(null); setMood('happy'); } };
  return <main className="game-shell min-h-[100dvh] text-[#fff4d7]"><TopBar round={round} cash={cash} name={name} brand={brand} onRestart={onRestart} /><div className="relative mx-auto max-w-[1450px] px-5 py-7 sm:px-8 lg:px-12"><FloatingParticles /><ProgressRail round={round} /><div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_310px]"><section><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.2em]" style={{ color: info.color }}><span>round {roundNumber}</span><span className="h-px w-9 bg-white/20" /><span>{info.pulse ?? 'on track'}</span></div><h1 className="font-display text-4xl font-bold tracking-[-.06em] text-[#fff4d7] sm:text-5xl">{info.title}</h1><p className="mt-2 text-base text-[#ad9fb9]">{info.subtitle}</p></div><div className="rounded-2xl border border-[#f7c948]/25 bg-[#f7c948]/10 px-4 py-3 text-right"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#c6ae64]">brief pesanan</div><div className="mt-1 font-display text-lg font-bold text-[#f7c948]">{info.order}</div></div></div><div className={`grid gap-4 ${options.length > 2 ? 'md:grid-cols-2' : 'lg:grid-cols-2'}`}>{options.map((option, index) => <div key={option.id} className="screen-pop" style={{ animationDelay: `${index * .08}s` }}><DecisionCard option={option} selected={selected === option.id} disabled={Boolean(selected)} onChoose={() => choose(option)} /></div>)}</div>{activeOption && <ResultPanel option={activeOption} round={round} onNext={next} />}</section><aside className="xl:sticky xl:top-6 xl:self-start"><div className="mb-5 flex justify-center xl:justify-end"><JellyMascot mood={mood} compact /></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-1"><StatCard icon={CircleDollarSign} label="profit berjalan" value={rupiah(profit)} detail="akumulasi 5 ronde" accent="#65c7c2" /><StatCard icon={Gauge} label="kapasitas" value={`${capacity} cup`} detail="kemampuan produksi" accent="#f78eb2" /><StatCard icon={Boxes} label="inventory" value={`${inventory} cup`} detail="stok siap kirim" accent="#f7c948" /><StatCard icon={Heart} label="reputasi" value={`${reputation}/100`} detail="kepercayaan pasar" accent="#c9a3ff" /></div><div className="mt-5 hidden rounded-2xl border border-white/10 bg-[#28203f]/65 p-4 xl:block"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#968aa6]"><LockKeyhole className="h-3.5 w-3.5 text-[#f7c948]" /> intel manager</div><p className="mt-3 text-xs leading-relaxed text-[#a99bb6]">Jangan hanya mengejar profit. Cash, kapasitas, inventory, dan reputasi saling tarik-menarik.</p></div></aside></div></div></main>;
}

function FinalScreen({ name, brand, score, profit, reputation, onRestart }: { name: string; brand: string; score: number; profit: number; reputation: number; onRestart: () => void }) {
  const rank = score > 420 ? 'Factory Legend' : score > 300 ? 'Jelly Strategist' : 'Brave Builder';
  const [shareText, setShareText] = useState('Bagikan hasil');
  const confetti = useMemo(() => Array.from({ length: 24 }), []);
  return <main className="game-shell relative min-h-[100dvh] overflow-hidden px-5 py-6 text-[#fff4d7] sm:px-10 lg:px-14"><FloatingParticles /><div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">{confetti.map((_, index) => <span key={index} className="confetti-piece absolute h-3 w-2 rounded-sm" style={{ left: `${12 + ((index * 19) % 76)}%`, top: `${index % 4 * 7}px`, background: ['#f7c948','#f78eb2','#65c7c2','#c9a3ff'][index % 4], animationDelay: `${index * .07}s`, transform: `rotate(${index * 31}deg)` }} />)}</div><div className="relative mx-auto flex min-h-[100dvh] max-w-5xl flex-col"><header className="flex items-center justify-between"><LogoMark /><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#988aa6]">run complete / 05</span></header><div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[.8fr_1.2fr]"><div className="screen-pop text-center lg:text-left"><JellyMascot mood="celebrate" /><div className="mt-7 font-mono text-[10px] uppercase tracking-[.24em] text-[#f7c948]">pabrikmu selesai beroperasi</div><h1 className="mt-3 font-display text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl">Kerja bagus,<br /><span className="text-[#f78eb2]">{name}.</span></h1><p className="mx-auto mt-6 max-w-md text-[#c1b2c8] lg:mx-0">Dari 100 cup di gudang sampai keputusan final — kamu berhasil memberi nyawa pada {brand}.</p><button data-testid="button-restart-final" onClick={onRestart} className="mt-8 inline-flex items-center gap-3 rounded-xl border-2 border-[#241c3d] bg-[#f7c948] px-5 py-3 font-display font-bold text-[#241c3d] shadow-[4px_4px_0_#f78eb2] transition hover:-translate-y-1"><RotateCcw className="h-4 w-4" /> Main lagi</button></div><section className="screen-pop rounded-[34px] border border-white/15 bg-[#28203f]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,.25)] sm:p-9"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#9688a3]">final performance</div><div className="mt-1 font-display text-2xl font-bold text-[#f8eeca]">{rank}</div></div><div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[#f7c948] bg-[#f7c948]/15 text-center"><div className="font-display text-2xl font-bold text-[#f7c948]">{score}</div><div className="font-mono text-[8px] uppercase text-[#d0b85d]">score</div></div></div><div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-3"><div className="rounded-2xl bg-[#17132a]/65 p-4"><CircleDollarSign className="h-4 w-4 text-[#65c7c2]" /><div className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8e829c]">profit bersih</div><div data-testid="text-final-profit" className="mt-1 font-display text-xl font-bold text-[#f8eeca]">{rupiah(profit)}</div></div><div className="rounded-2xl bg-[#17132a]/65 p-4"><Heart className="h-4 w-4 text-[#f78eb2]" /><div className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8e829c]">reputasi</div><div data-testid="text-final-reputation" className="mt-1 font-display text-xl font-bold text-[#f8eeca]">{reputation}/100</div></div><div className="col-span-2 rounded-2xl bg-[#17132a]/65 p-4 sm:col-span-1"><BadgeCheck className="h-4 w-4 text-[#f7c948]" /><div className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8e829c]">pelajaran</div><div className="mt-1 font-display text-sm font-bold leading-snug text-[#f8eeca]">Kas sehat + keputusan berani = bisnis tumbuh.</div></div></div><div className="rounded-2xl border border-[#65c7c2]/25 bg-[#65c7c2]/10 p-4"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#9be2db]"><Star className="h-3.5 w-3.5" /> catatan untuk presentasi</div><p className="mt-2 text-sm leading-relaxed text-[#c4dcda]">Kamu tidak cuma memilih profit terbesar. Kamu membaca trade-off antara modal, kapasitas, stok, kualitas, dan reputasi di setiap ronde.</p></div><button data-testid="button-share-result" onClick={() => { setShareText('Hasil tersalin'); navigator.clipboard?.writeText(`Jelly Rush — ${rank}, score ${score}, profit ${rupiah(profit)}`); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[.15em] text-[#d8cde0] transition hover:border-[#f7c948]/60 hover:text-[#f7c948]"><Sparkles className="h-4 w-4" /> {shareText}</button></section></div><footer className="border-t border-white/10 pt-5 text-center font-mono text-[9px] uppercase tracking-[.18em] text-[#827694]">Jelly Rush · dibuat untuk manager yang mau mencoba</footer></div></main>;
}

function Home() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [profile, setProfile] = useState({ name: '', brand: '' });
  const [result, setResult] = useState({ score: 0, profit: 0, reputation: 62 });
  const restart = () => { setPhase('welcome'); setProfile({ name: '', brand: '' }); setResult({ score: 0, profit: 0, reputation: 62 }); };
  return phase === 'welcome' ? <WelcomeScreen onStart={() => setPhase('profile')} /> : phase === 'profile' ? <ProfileScreen onContinue={(name, brand) => { setProfile({ name, brand }); setPhase('game'); }} /> : phase === 'game' ? <GameScreen name={profile.name} brand={profile.brand} onFinish={(score, profit, reputation) => { setResult({ score, profit, reputation }); setPhase('final'); }} onRestart={restart} /> : <FinalScreen name={profile.name} brand={profile.brand} {...result} onRestart={restart} />;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route component={() => <div className="grid min-h-[100dvh] place-items-center bg-[#17132a] text-[#fff4d7]">Halaman tidak ditemukan.</div>} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><Router /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
