import React from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onLoginClick: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLoginClick }) => {
  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col font-sans">
      
      {/* Background Image with increased blur */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <img 
          src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop" 
          alt="School Campus Background" 
          className="w-full h-full object-cover opacity-50 scale-110"
          style={{ filter: 'blur(8px)' }}
        />
        {/* Dark gradient overlay for text contrast (darker on the left where text is) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-transparent" />
      </div>

      {/* Top Right Sign In Button */}
      <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-20">
        <button 
          onClick={onLoginClick}
          className="px-6 py-3 bg-white text-sky-900 font-bold rounded-xl text-sm sm:text-base shadow-lg hover:scale-105 hover:shadow-xl hover:bg-sky-50 transition-all duration-300 flex items-center gap-2 group"
        >
          Sign In
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Content - Left Aligned */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-32 animate-in slide-in-from-left-8 duration-1000 fade-in pt-12">
        
        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 mb-6 shrink-0">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
        </div>
        
        <h1 className="font-black text-white tracking-tight leading-[1.1] drop-shadow-lg mb-4 sm:mb-6 text-[clamp(2.5rem,7vh,5rem)] xl:text-[clamp(3.5rem,8vh,6rem)]">
          Pirnav <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-300">Educational</span> <br />
          Institution
        </h1>
        
        <p className="font-medium max-w-xl drop-shadow-md leading-relaxed border-l-4 border-sky-500 pl-4 text-slate-300 text-[clamp(0.875rem,2vh,1.125rem)] xl:text-[clamp(1rem,2vh,1.25rem)]">
          Fostering Excellence. Building Character. Empowering the Next Generation of Global Leaders.
        </p>

      </div>

      {/* Footer text pinned to bottom left */}
      <div className="relative z-10 px-6 sm:px-12 lg:px-32 pb-6 sm:pb-8 mt-auto">
        <p className="text-slate-400/80 text-[10px] sm:text-sm font-medium tracking-wide">
          © {new Date().getFullYear()} Pirnav Educational Institution. All rights reserved.
        </p>
      </div>
    </div>
  );
};
