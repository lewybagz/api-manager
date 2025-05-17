import { Menu, Shield } from "lucide-react";
import React from "react";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuOpen }) => {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-brand-dark-secondary p-4 border-b border-gray-700 sm:px-6 lg:px-8">
      <div className="flex items-center">
        {/* Placeholder for a logo or app name if desired in the header */}
        <Shield className="h-6 w-6 text-brand-blue" />
        <span className="ml-2 text-lg font-bold text-white">Zeker</span>
      </div>
      <button
        aria-label="Open navigation menu"
        className="text-gray-300 hover:text-white focus:outline-none rounded-md p-1 -mr-1"
        onClick={onMenuOpen}
      >
        <Menu className="h-6 w-6" />
      </button>
    </header>
  );
};

export default MobileHeader;
