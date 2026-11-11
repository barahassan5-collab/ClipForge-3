import React from 'react';
import { Video, ShieldCheck, Sun, Moon, Globe } from 'lucide-react';
import { Language, ToolMode } from '../types';
import { translations } from '../utils/translations';

interface NavbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  language,
  onSelectLanguage,
  isDark,
  onToggleTheme,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Video className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            ClipForge
          </span>
        </div>

        {/* Zone 2: Navigation Links for 4 primary tools */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectMode('compress')}
            className={`px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentMode === 'compress'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {language === 'ar' ? 'ضغط الفيديو' : language === 'fr' ? 'Compresser' : 'Compress'}
          </button>

          <button
            onClick={() => onSelectMode('mp3')}
            className={`px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentMode === 'mp3'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {language === 'ar' ? 'فيديو ← MP3' : language === 'fr' ? 'Vidéo → MP3' : 'Video → MP3'}
          </button>

          <button
            onClick={() => onSelectMode('trim')}
            className={`px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentMode === 'trim'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {language === 'ar' ? 'قص وتقطيع' : language === 'fr' ? 'Couper' : 'Trim & Cut'}
          </button>

          <button
            onClick={() => onSelectMode('convert')}
            className={`px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentMode === 'convert'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {language === 'ar' ? 'تحويل الصيغة' : language === 'fr' ? 'Convertir' : 'Convert'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action area: Language Picker & Theme toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => onSelectLanguage('ar')}
              title="العربية (AR)"
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                language === 'ar'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              AR
            </button>
            <button
              onClick={() => onSelectLanguage('fr')}
              title="Français (FR)"
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                language === 'fr'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => onSelectLanguage('en')}
              title="English (EN)"
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                language === 'en'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-t border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => onSelectMode('compress')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            currentMode === 'compress' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          {language === 'ar' ? 'ضغط' : 'Compress'}
        </button>
        <button
          onClick={() => onSelectMode('mp3')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            currentMode === 'mp3' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          MP3
        </button>
        <button
          onClick={() => onSelectMode('trim')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            currentMode === 'trim' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          {language === 'ar' ? 'قص' : 'Trim'}
        </button>
        <button
          onClick={() => onSelectMode('convert')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            currentMode === 'convert' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          {language === 'ar' ? 'تحويل' : 'Convert'}
        </button>
      </div>
    </header>
  );
};
