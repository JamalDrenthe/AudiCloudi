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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-orange-500/15 text-orange-400 hover:bg-orange-500/20 mb-4 border border-orange-500/30 px-3 py-1 text-xs">
            Transparante Credits & Bundels
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Kies het plan dat past bij jouw <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">muzikale reis</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Elk abonnement werkt met een maandelijks creditsaldo. Ongebruikte credits neem je gewoon mee naar de volgende maand.
          </p>

          {/* Current user status indicator */}
          {isAuthenticated && (
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/80 border border-border">
              <span className="text-sm text-muted-foreground">Huidig abonnement:</span>
              <span className="text-sm font-bold text-orange-400 capitalize">{plan || 'Artiest'}</span>
              <span className="text-border">•</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 text-zinc-100">
                <Coins className="w-4 h-4 text-orange-400" />
                {(credits || 0).toLocaleString()} credits
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-stretch">
          {plans.map((p) => {
            const Icon = p.icon;
            const isCurrentPlan = isAuthenticated && plan === p.id;

            return (
              <Card
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-gradient-to-b ${p.color} bg-card/60 backdrop-blur border transition-all duration-300 hover:scale-[1.02] ${
                  p.popular ? 'ring-2 ring-orange-500 shadow-2xl shadow-orange-500/10' : ''
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-orange-500 text-white rounded-full shadow-md">
                      {p.badge}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {!p.popular && (
                      <Badge variant="outline" className="text-xs">
                        {p.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold">{p.name}</CardTitle>
                  <CardDescription className="text-sm min-h-[40px]">
                    {p.description}
                  </CardDescription>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">€{p.price},-</span>
                      <span className="text-muted-foreground text-sm font-medium">/ maand</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-orange-400 font-semibold">
                      <Coins className="w-4 h-4" />
                      <span>{p.creditsIncluded.toLocaleString()} credits per maand</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2.5 text-sm pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inbegrepen extra's:</p>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-200">{feat}</span>
                      </div>
                    ))}
                    {p.notAllowed.map((notFeat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-muted-foreground line-through opacity-70">
                        <span className="w-4 h-4 text-center leading-4 text-xs font-bold">✕</span>
                        <span>{notFeat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/40">
                  <Button
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full rounded-xl font-semibold h-11 ${
                      isCurrentPlan
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                        : p.popular
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {isCurrentPlan ? 'Huidig Actief Plan' : p.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* How Credits Work Section */}
        <div className="mb-20 bg-card/60 border border-border/60 rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10" />

          <div className="max-w-3xl mb-8">
            <Badge className="bg-orange-500/15 text-orange-400 mb-3 border border-orange-500/30">
              Credits Economie
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Hoe werkt het credit-systeem?
            </h2>
            <p className="text-muted-foreground">
              Credits zijn de valuta binnen CloudiAudi. Je credits staan synchroon met je abonnement en vervallen nooit: ongebruikte credits neem je elke maand automatisch mee.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background/80 border border-border/80 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">5.000 Credits</h3>
              <p className="text-xs text-orange-400 font-semibold mb-2">Waarde: €5,-</p>
              <p className="text-sm text-muted-foreground">
                Kosten per track upload. Gratis uitbrengen op alle streaming platforms mits gemixt en gemastered.
              </p>
            </div>

            <div className="bg-background/80 border border-border/80 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">50.000 Credits</h3>
              <p className="text-xs text-purple-400 font-semibold mb-2">Waarde: €50,-</p>
              <p className="text-sm text-muted-foreground">
                Professioneel laten mixen en masteren van 1 track via het platform voor club- & streamingkwaliteit.
              </p>
            </div>

            <div className="bg-background/80 border border-border/80 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">Gratis Release</h3>
              <p className="text-xs text-emerald-400 font-semibold mb-2">0 extra distributiekosten</p>
              <p className="text-sm text-muted-foreground">
                Elk gemixt en gemastered bestand wordt direct kosteloos gedistribueerd naar Spotify, Apple Music & meer.
              </p>
            </div>

            <div className="bg-background/80 border border-border/80 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">Credits Rollover</h3>
              <p className="text-xs text-blue-400 font-semibold mb-2">Geen verloopdatum</p>
              <p className="text-sm text-muted-foreground">
                Al je ongebruikte credits neem je elke maand mee. Spaar gerust voor een groot album of studio mix sessie.
              </p>
            </div>
          </div>
        </div>

        {/* Top-up Extra Credits Section */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Extra Credits Opwaarderen</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Kom je net credits tekort voor een release of studio mix? Koop direct extra credits bij.
              </p>
            </div>
            {isAuthenticated && (
              <div className="text-sm font-mono text-zinc-400">
                Huidig saldo: <span className="font-bold text-orange-400">{(credits || 0).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPacks.map((pack) => (
              <Card
                key={pack.credits}
                className={`bg-card/70 border-border/70 hover:border-orange-500/50 transition-all duration-300 rounded-2xl ${
                  pack.popular ? 'border-orange-500/40 bg-orange-500/5' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">{pack.label}</span>
                    {pack.popular && (
                      <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                        Populair
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-extrabold flex items-center gap-1.5 mt-2">
                    <Coins className="w-5 h-5 text-orange-400" />
                    {pack.credits.toLocaleString()}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {(pack.credits / 5000)} uploads of {(pack.credits / 50000).toFixed(0)} mix & master
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button
                    onClick={() => handleTopupCredits(pack.credits, pack.price)}
                    variant={pack.popular ? 'default' : 'outline'}
                    className={`w-full rounded-xl font-medium ${
                      pack.popular ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Koop voor €{pack.price},-
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Veelgestelde Vragen</h2>
          <div className="space-y-4">
            <div className="bg-card/60 border border-border/60 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-2">Waarom mag een 'Gebruiker' niet uploaden?</h3>
              <p className="text-sm text-muted-foreground">
                Het Gebruiker-abonnement (€10,- p/m) is puur bedoeld voor muziekliefhebbers die willen streamen, playlists willen bouwen en artiesten willen supporten. Wil je zelf muziek uitbrengen? Upgrade dan naar Artiest (€50,- p/m) of Label (€200,- p/m).
              </p>
            </div>

            <div className="bg-card/60 border border-border/60 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-2">Wat gebeurt er met ongebruikte credits aan het eind van de maand?</h3>
              <p className="text-sm text-muted-foreground">
                Je credits vervallen nooit! Elke maand worden je nieuwe credits bovenop je bestaande saldo geteld. Je kunt dus gerust sparen voor een heel album of meerdere mix & master sessies.
              </p>
            </div>

            <div className="bg-card/60 border border-border/60 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-2">Waarom moet een track gemixt en gemastered zijn voor distributie?</h3>
              <p className="text-sm text-muted-foreground">
                Streaming platforms zoals Spotify en Apple Music hanteren strenge kwaliteitseisen (LUFS normen, dynamisch bereik). Als je track al gemixt en gemastered is, is distributie 100% gratis inbegrepen. Zo niet, dan kun je voor 50.000 credits onze studio mix & master service inschakelen.
              </p>
            </div>

            <div className="bg-card/60 border border-border/60 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-2">Kan ik korte video's uploaden als artwork?</h3>
              <p className="text-sm text-muted-foreground">
                Ja! Als Artiest of Label kun je bij elke track een korte MP4 video canvas uploaden van maximaal 1 minuut (60 seconden). Deze speelt automatisch in een loop af in de audiospeler en op de trackpagina.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
