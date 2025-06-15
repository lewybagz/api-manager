"use client";

import type React from "react";

import { Menu, Shield, Sparkles } from "lucide-react";

import EncryptionStatusIndicator from "../auth/EncryptionStatusIndicator";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuOpen }) => {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-gradient-to-r from-brand-dark-secondary/95 to-brand-dark-secondary/90 backdrop-blur-xl p-4 border-b border-gray-700/50 sm:px-6 lg:px-8 shadow-lg">
      <div className="flex items-center group">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkles className="w-1.5 h-1.5 text-white m-0.5" />
          </div>
        </div>
        <span className="ml-3 text-xl font-bold text-white group-hover:text-brand-blue transition-colors duration-300">
          Zeker
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
          <EncryptionStatusIndicator />
        </div>
        <button
          aria-label="Open navigation menu"
          className="text-gray-300 hover:text-white focus:outline-none rounded-xl p-2 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 transition-all duration-300 backdrop-blur-sm group"
          onClick={onMenuOpen}
        >
          <div className="w-6 h-6 bg-gradient-to-r from-gray-700/50 to-gray-800/30 rounded-lg flex items-center justify-center group-hover:from-brand-blue/20 group-hover:to-brand-primary/20 transition-all duration-300">
            <Menu className="h-4 w-4" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
