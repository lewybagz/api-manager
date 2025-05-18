import { Files, LayoutDashboard } from "lucide-react";
import React from "react";

interface ProjectTabsProps {
  activeTab: "credentials" | "files";
  onTabChange: (tab: "credentials" | "files") => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="mb-6 border-b border-gray-700">
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
    </div>
  );
};

export default ProjectTabs;
