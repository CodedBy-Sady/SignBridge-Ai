import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#070B1A] text-[#CBD5E1] transition-colors duration-200">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Top Row */}
        <div className="pt-16 pb-10 flex flex-col md:flex-row items-start justify-between gap-12">
          
          {/* Left Column: Brand & Mission */}
          <div className="max-w-[420px] space-y-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-3 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl"
              aria-label="SignBridge AI Homepage"
            >
              <div 
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-white sb-logo-glow"
                style={{ background: 'linear-gradient(135deg, #2F55E6, #6B3FE0)' }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#fff" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  aria-hidden="true" 
                  className="w-4 h-4"
                >
                  <path d="M3 18V12a9 9 0 0 1 18 0v6" />
                  <path d="M3 18h4M17 18h4" />
                </svg>
              </div>
              <div className="flex items-baseline font-display text-[19px] font-extrabold tracking-tight">
                <span className="text-white">SignBridge</span>
                <span className="ml-1 text-[#8FB0FF]">AI</span>
              </div>
            </Link>

            <p className="text-[15px] text-[#94A3B8] leading-relaxed">
              An assistive, real-time two-way communication platform bridging Deaf or non-speaking people and hearing participants.
            </p>
          </div>

          {/* Right Link Columns */}
          <div className="flex flex-wrap sm:flex-nowrap gap-12 sm:gap-16 text-[15px]">
            {/* Product Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#mission" className="text-[#94A3B8] hover:text-white transition-colors">
                    Our goal
                  </a>
                </li>
                <li>
                  <a href="#how" className="text-[#94A3B8] hover:text-white transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-[#94A3B8] hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column (Part 3 Rule 9) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li>
                  {/* TODO: Accessibility statement route */}
                  <a href="#" className="text-[#94A3B8] hover:text-white transition-colors" title="Coming soon">
                    Accessibility statement
                  </a>
                </li>
                <li>
                  {/* TODO: Privacy policy route */}
                  <a href="#" className="text-[#94A3B8] hover:text-white transition-colors" title="Coming soon">
                    Privacy
                  </a>
                </li>
                <li>
                  {/* TODO: Contact page route */}
                  <a href="#" className="text-[#94A3B8] hover:text-white transition-colors" title="Coming soon">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[14px] text-[#94A3B8] gap-3">
          <p>© 2026 SignBridge AI. Built for universal accessibility.</p>
          <p className="text-right">
            Made for the Deaf and Hard of Hearing community.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
