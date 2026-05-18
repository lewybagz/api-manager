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
  const tabBtn = (active: boolean) =>
    active
      ? "border-zk-indigo text-zk-indigo"
      : "border-transparent text-zk-muted hover:border-zk-border hover:text-zk-text";

  return (
    <div className="mb-3 border-b border-zk-border font-zk-sans">
      <nav aria-label="Tabs" className="-mb-px flex gap-8">
        <button
          className={`flex items-center whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${tabBtn(activeTab === "credentials")}`}
          onClick={() => {
            onTabChange("credentials");
          }}
          type="button"
        >
          <LayoutDashboard className="mr-2 h-5 w-5 shrink-0" strokeWidth={1.5} />
          Credentials
        </button>
        <button
          className={`flex items-center whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${tabBtn(activeTab === "files")}`}
          onClick={() => {
            onTabChange("files");
          }}
          type="button"
        >
          <Files className="mr-2 h-5 w-5 shrink-0" strokeWidth={1.5} />
          Files
        </button>
      </nav>
    </div>
  );
};

export default ProjectTabs;
