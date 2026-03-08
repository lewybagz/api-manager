import { Files, LayoutDashboard, Search, X } from "lucide-react";
import React from "react";

interface ProjectTabsProps {
  activeTab: "credentials" | "files";
  onSearchChange: (value: string) => void;
  onTabChange: (tab: "credentials" | "files") => void;
  searchQuery: string;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  activeTab,
  onSearchChange,
  onTabChange,
  searchQuery,
}) => {
  return (
    <div className="mb-3 border-b border-gray-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <nav aria-label="Tabs" className="-mb-px flex space-x-6">
          <button
            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center 
            ${
              activeTab === "credentials"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
            }`}
            onClick={() => {
              onTabChange("credentials");
            }}
            type="button"
          >
            <LayoutDashboard className="mr-2 h-5 w-5" /> Credentials
          </button>
          <button
            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center 
            ${
              activeTab === "files"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
            }`}
            onClick={() => {
              onTabChange("files");
            }}
            type="button"
          >
            <Files className="mr-2 h-5 w-5" /> Files
          </button>
        </nav>

        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            aria-label="Search project items"
            className="w-full rounded-xl border border-gray-700/60 bg-brand-dark-secondary/80 py-2.5 pl-10 pr-10 text-sm text-brand-light placeholder:text-gray-500 outline-none transition-colors duration-200 focus:border-brand-blue"
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            placeholder="Search credentials and files..."
            type="text"
            value={searchQuery}
          />
          {searchQuery.trim() && (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-brand-light"
              onClick={() => {
                onSearchChange("");
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTabs;
