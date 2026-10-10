import { Link } from 'react-router-dom';
import { Twitter, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.08] text-[#86868b] pb-24 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 text-xs">
        {/* Apple Style Footnote Disclaimer */}
        <div className="pb-8 border-b border-white/[0.08] text-[11px] text-[#6e6e73] leading-relaxed space-y-2">
          <p>
            * CloudiAudi en Lossless Studio Master streaming zijn onderdeel van een onafhankelijk muziekstreamingplatform. Alle audiobestanden worden afgespeeld in originele kwaliteit zonder advertentie-onderbrekingen.
          </p>
          <p>
            Credits kunnen worden ingewisseld voor track uploads, artist promo’s en exclusieve community privileges. Tarieven kunnen variëren per regio.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 py-10">
          {/* Brand & Mission */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#fc3c44] to-[#fa233b] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-[#f5f5f7]">
                CloudiAudi
              </span>
            </Link>
            <p className="text-xs text-[#86868b] mb-4 leading-relaxed">
              Puur geluid. Grenzeloos gedeeld. Voor onafhankelijke artiesten wereldwijd.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
                aria-label="Discord"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-semibold text-xs text-[#f5f5f7] mb-3">Ontdekken</h4>
            <ul className="space-y-2.5">
              <li><Link to="/charts" className="text-xs text-[#86868b] hover:text-white transition-colors">Top 20 Hitlijst</Link></li>
              <li><Link to="/artists" className="text-xs text-[#86868b] hover:text-white transition-colors">Artiesten Roster</Link></li>
              <li><Link to="/label/zheavenzy" className="text-xs text-[#86868b] hover:text-white transition-colors">Zheavenzy Label</Link></li>
              <li><Link to="/library" className="text-xs text-[#86868b] hover:text-white transition-colors">Mijn Bibliotheek</Link></li>
              <li><Link to="/pricing" className="text-xs text-[#86868b] hover:text-white transition-colors">Abonnementen</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-semibold text-xs text-[#f5f5f7] mb-3">Community</h4>
            <ul className="space-y-2.5">
              <li><Link to="/upload" className="text-xs text-[#86868b] hover:text-white transition-colors">Upload Muziek</Link></li>
              <li><Link to="/pricing" className="text-xs text-[#86868b] hover:text-white transition-colors">Credits & Munten</Link></li>
              <li><Link to="/guidelines" className="text-xs text-[#86868b] hover:text-white transition-colors">Richtlijnen</Link></li>
              <li><Link to="/creators" className="text-xs text-[#86868b] hover:text-white transition-colors">Voor Makers</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="font-semibold text-xs text-[#f5f5f7] mb-3">Platform</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-xs text-[#86868b] hover:text-white transition-colors">Over CloudiAudi</Link></li>
              <li><Link to="/careers" className="text-xs text-[#86868b] hover:text-white transition-colors">Vacatures</Link></li>
              <li><Link to="/status" className="text-xs text-[#86868b] hover:text-white transition-colors">Systeemstatus</Link></li>
              <li><Link to="/contact" className="text-xs text-[#86868b] hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Links Column 4 */}
          <div>
            <h4 className="font-semibold text-xs text-[#f5f5f7] mb-3">Juridisch</h4>
            <ul className="space-y-2.5">
              <li><Link to="/terms" className="text-xs text-[#86868b] hover:text-white transition-colors">Voorwaarden</Link></li>
              <li><Link to="/privacy" className="text-xs text-[#86868b] hover:text-white transition-colors">Privacybeleid</Link></li>
              <li><Link to="/cookies" className="text-xs text-[#86868b] hover:text-white transition-colors">Cookiebeleid</Link></li>
              <li><Link to="/copyright" className="text-xs text-[#86868b] hover:text-white transition-colors">Auteursrechten</Link></li>
            </ul>
          </div>
        </div>

        {/* Apple Style Copyright Bar */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] text-[#6e6e73]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Copyright © 2026 CloudiAudi Inc. Alle rechten voorbehouden.</span>
            <div className="flex items-center gap-3 text-[#86868b]">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacybeleid</Link>
              <span>|</span>
              <Link to="/terms" className="hover:text-white transition-colors">Gebruiksvoorwaarden</Link>
              <span>|</span>
              <Link to="/legal" className="hover:text-white transition-colors">Juridische info</Link>
              <span>|</span>
              <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#86868b]">
            <span>Nederland (Nederlands)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
