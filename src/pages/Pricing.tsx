import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sparkles,
  Music,
  Building2,
  Sliders,
  UploadCloud,
  Coins,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function Pricing() {
  const { isAuthenticated, plan, credits, updatePlan, addCredits } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (newPlan: 'gebruiker' | 'artiest' | 'label') => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }
    await updatePlan(newPlan);
    const planNames = {
      gebruiker: 'Gebruiker (€10,- p/m)',
      artiest: 'Artiest (€50,- p/m)',
      label: 'Label (€200,- p/m)',
    };
    toast.success(`Abonnement gewijzigd naar ${planNames[newPlan]}! Je credits zijn bijgewerkt.`);
  };

  const handleTopupCredits = async (amount: number, euroPrice: number) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }
    await addCredits(amount);
    toast.success(`+${amount.toLocaleString()} credits succesvol toegevoegd (€${euroPrice},-)!`);
  };

  const plans = [
    {
      id: 'gebruiker' as const,
      name: 'Gebruiker',
      badge: 'Voor Luisteraars',
      price: 10,
      creditsIncluded: 10000,
      uploadLimit: 0,
      description: 'Voor de pure muziekliefhebber die onbeperkt wil genieten, playlists wil maken en credits spaart.',
      icon: Music,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
      popular: false,
      features: [
        '10.000 credits inbegrepen per maand',
        'Ongebruikte credits neem je elke maand mee',
        'Onbeperkt muziek streamen in lossless kwaliteit',
        'Afspeellijsten en collecties maken & delen',
        'Artiesten volgen, liken en reacties plaatsen',
        'Geen uploads toegestaan (upgrade voor releases)',
      ],
      notAllowed: ['Tracks uploaden of distribueren'],
      ctaText: 'Kies Gebruiker',
    },
    {
      id: 'artiest' as const,
      name: 'Artiest',
      badge: 'Meest Gekozen',
      price: 50,
      creditsIncluded: 50000,
      uploadLimit: 10,
      description: 'Voor producers en artiesten die maandelijks professionele tracks willen uploaden en distribueren.',
      icon: Sparkles,
      color: 'from-orange-500/20 to-amber-500/10 border-orange-500/50',
      popular: true,
      features: [
        '50.000 credits inbegrepen per maand',
        'Ongebruikte credits neem je elke maand mee',
        'Max 10 tracks per maand uploaden (5.000 credits / track)',
        'Gratis uitbrengen op alle platforms (Spotify, Apple Music etc.)*',
        'Optie voor professioneel Mixen & Masteren (50.000 credits / track)',
        'Korte video canvas (tot 1 min MP4) ondersteuning',
        'Verifieerbaar artiestenprofiel & luisteraars analytics',
      ],
      notAllowed: [],
      ctaText: 'Kies Artiest',
    },
    {
      id: 'label' as const,
      name: 'Label',
      badge: 'Voor Labels & Teams',
      price: 200,
      creditsIncluded: 200000,
      uploadLimit: 50,
      description: 'Voor platenlabels, studio’s en collectieven met een hoge release-frequentie en meerdere artiesten.',
      icon: Building2,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40',
      popular: false,
      features: [
        '200.000 credits inbegrepen per maand',
        'Ongebruikte credits neem je elke maand mee',
        'Max 50 tracks per maand uploaden (5.000 credits / track)',
        'Gratis distributie op alle platforms voor gemixte tracks*',
        'Meerdere artiesten beheren onder één labelaccount',
        'Priority studio Mix & Master verwerking (50.000 credits / track)',
        'Geavanceerd label dashboard, royalty splits & metadata export',
      ],
      notAllowed: [],
      ctaText: 'Kies Label',
    },
  ];

  const creditPacks = [
    { credits: 10000, price: 10, label: 'Starter Pack', popular: false },
    { credits: 50000, price: 50, label: 'Producer Pack', popular: true },
    { credits: 100000, price: 100, label: 'Studio Pack', popular: false },
    { credits: 200000, price: 200, label: 'Label Pack', popular: false },
  ];

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] pb-32">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Apple Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#f5f5f7] text-xs font-semibold tracking-wider uppercase mb-4">
            CloudiAudi Services & Plans
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.035em] text-white mb-4">
            Het juiste plan voor jouw muzikale visie.
          </h1>
          <p className="text-lg text-[#86868b] leading-relaxed max-w-2xl mx-auto tracking-[-0.01em]">
            Ieder abonnement omvat een maandelijks creditsaldo. Ongebruikte credits neem je automatisch mee naar de volgende maand.
          </p>

          {/* User Status Pill */}
          {isAuthenticated && (
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs">
              <span className="text-[#86868b]">Huidig plan:</span>
              <span className="font-semibold text-white capitalize">{plan || 'Artiest'}</span>
              <span className="text-white/20">•</span>
              <span className="font-mono flex items-center gap-1.5 text-amber-400">
                <Coins className="w-3.5 h-3.5" />
                {(credits || 0).toLocaleString()} credits
              </span>
            </div>
          )}
        </div>

        {/* Apple Services 3-Column Bento Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-20 items-stretch">
          {plans.map((p) => {
            const Icon = p.icon;
            const isCurrentPlan = isAuthenticated && plan === p.id;

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 bg-[#161617]/90 border backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
                  p.popular
                    ? 'border-white/20 shadow-[0_20px_50px_rgba(250,35,59,0.15)] ring-1 ring-white/20'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#fa233b] text-white rounded-full shadow-md">
                      {p.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    {!p.popular && (
                      <span className="text-xs text-[#86868b] font-medium bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-semibold tracking-tight text-white">{p.name}</h3>
                  <p className="text-xs text-[#86868b] mt-1.5 min-h-[36px] leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/[0.08]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight text-white">€{p.price}</span>
                      <span className="text-[#86868b] text-sm font-normal">/ maand</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-mono font-medium">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{p.creditsIncluded.toLocaleString()} credits p/m</span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3 text-xs pt-6 border-t border-white/[0.06] mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Inbegrepen:</p>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[#f5f5f7] leading-relaxed">{feat}</span>
                      </div>
                    ))}
                    {p.notAllowed.map((notFeat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[#6e6e73] line-through">
                        <span className="w-4 h-4 text-center leading-4 text-xs">✕</span>
                        <span>{notFeat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleSelectPlan(p.id)}
                    variant={isCurrentPlan ? "secondary" : p.popular ? "default" : "apple"}
                    size="lg"
                    className="w-full text-sm font-semibold h-11"
                  >
                    {isCurrentPlan ? 'Huidig Actief Plan' : p.ctaText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* How Credits Work Section */}
        <div className="mb-24 bg-[#161617]/80 border border-white/[0.08] rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fa233b]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-3xl mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#fa233b]/10 text-[#fa233b] border border-[#fa233b]/20 mb-3">
              <Coins className="w-3.5 h-3.5" />
              Credits Economie
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Hoe werkt het credit-systeem?
            </h2>
            <p className="text-[#86868b] text-base leading-relaxed">
              Credits zijn de universele valuta binnen CloudiAudi. Je credits staan synchroon met je lidmaatschap en vervallen nooit: ongebruikte credits neem je elke maand automatisch mee.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#1c1c1e]/70 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#242426]/70 transition-all">
              <div className="w-10 h-10 rounded-full bg-[#fa233b]/10 text-[#fa233b] flex items-center justify-center mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1 tracking-tight">5.000 Credits</h3>
              <p className="text-xs text-[#fa233b] font-semibold mb-2">Waarde: €5,-</p>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Kosten per track upload. Gratis uitbrengen op alle streaming platforms mits gemixt en gemastered.
              </p>
            </div>

            <div className="bg-[#1c1c1e]/70 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#242426]/70 transition-all">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1 tracking-tight">50.000 Credits</h3>
              <p className="text-xs text-purple-400 font-semibold mb-2">Waarde: €50,-</p>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Professioneel laten mixen en masteren van 1 track via het platform voor club- & streamingkwaliteit.
              </p>
            </div>

            <div className="bg-[#1c1c1e]/70 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#242426]/70 transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1 tracking-tight">Gratis Release</h3>
              <p className="text-xs text-emerald-400 font-semibold mb-2">0 extra distributiekosten</p>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Elk gemixt en gemastered bestand wordt direct kosteloos gedistribueerd naar Spotify, Apple Music & meer.
              </p>
            </div>

            <div className="bg-[#1c1c1e]/70 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#242426]/70 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1 tracking-tight">Credits Rollover</h3>
              <p className="text-xs text-blue-400 font-semibold mb-2">Geen verloopdatum</p>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Al je ongebruikte credits neem je elke maand mee. Spaar gerust voor een groot album of studio mix sessie.
              </p>
            </div>
          </div>
        </div>

        {/* Top-up Extra Credits Section */}
        <div className="mb-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#fa233b] mb-1">Waardekaarten</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Extra Credits Opwaarderen</h2>
              <p className="text-[#86868b] mt-1 text-sm">
                Kom je net credits tekort voor een release of studio mix? Waardeer je saldo direct op.
              </p>
            </div>
            {isAuthenticated && (
              <div className="text-xs font-mono text-[#86868b] bg-[#161617] border border-white/[0.08] px-3.5 py-2 rounded-full flex items-center gap-2">
                <span>Huidig saldo:</span>
                <span className="font-bold text-[#f5f5f7]">{(credits || 0).toLocaleString()}</span>
                <Coins className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-[#161617]/90 border border-white/[0.08] hover:border-white/[0.2] transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between ${
                  pack.popular ? 'ring-1 ring-[#fa233b]/40 shadow-[0_0_30px_rgba(250,35,59,0.12)]' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">{pack.label}</span>
                    {pack.popular && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#fa233b] bg-[#fa233b]/10 border border-[#fa233b]/20 px-2.5 py-0.5 rounded-full">
                        Meest Gekozen
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white flex items-center gap-2 mt-2">
                    <Coins className="w-6 h-6 text-amber-400" />
                    {pack.credits.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#86868b] mt-2">
                    {(pack.credits / 5000)} uploads of {(pack.credits / 50000).toFixed(0)} studio mix & master
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06]">
                  <Button
                    onClick={() => handleTopupCredits(pack.credits, pack.price)}
                    variant={pack.popular ? 'default' : 'secondary'}
                    size="default"
                    className="w-full text-xs font-semibold h-10"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Koop voor €{pack.price},-
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#86868b] mb-1">Ondersteuning</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Veelgestelde Vragen</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-[#161617]/80 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#1c1c1e]/80 transition-all">
              <h3 className="font-semibold text-base text-white tracking-tight mb-2">Waarom mag een 'Gebruiker' niet uploaden?</h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Het Gebruiker-abonnement (€10,- p/m) is puur bedoeld voor muziekliefhebbers die willen streamen, playlists willen bouwen en artiesten willen supporten. Wil je zelf muziek uitbrengen? Upgrade dan naar Artiest (€50,- p/m) of Label (€200,- p/m).
              </p>
            </div>

            <div className="bg-[#161617]/80 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#1c1c1e]/80 transition-all">
              <h3 className="font-semibold text-base text-white tracking-tight mb-2">Wat gebeurt er met ongebruikte credits aan het eind van de maand?</h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Je credits vervallen nooit! Elke maand worden je nieuwe credits bovenop je bestaande saldo geteld. Je kunt dus gerust sparen voor een heel album of meerdere mix & master sessies.
              </p>
            </div>

            <div className="bg-[#161617]/80 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#1c1c1e]/80 transition-all">
              <h3 className="font-semibold text-base text-white tracking-tight mb-2">Waarom moet een track gemixt en gemastered zijn voor distributie?</h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Streaming platforms zoals Spotify en Apple Music hanteren strenge kwaliteitseisen (LUFS normen, dynamisch bereik). Als je track al gemixt en gemastered is, is distributie 100% gratis inbegrepen. Zo niet, dan kun je voor 50.000 credits onze studio mix & master service inschakelen.
              </p>
            </div>

            <div className="bg-[#161617]/80 border border-white/[0.08] rounded-2xl p-6 hover:bg-[#1c1c1e]/80 transition-all">
              <h3 className="font-semibold text-base text-white tracking-tight mb-2">Kan ik korte video's uploaden als artwork?</h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                Ja! Als Artiest of Label kun je bij elke track een korte MP4 video canvas uploaden van maximaal 1 minuut (60 seconden). Deze speelt automatisch in een loop af in de audiospeler en op de trackpagina.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
