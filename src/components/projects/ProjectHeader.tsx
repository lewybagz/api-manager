import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import useProjectStore, { type ProjectStatus } from "../../stores/projectStore";

interface ProjectHeaderProps {
  onAddCredential: () => void;
  projectCreatedAt: null | undefined | { nanoseconds: number; seconds: number };
  projectName: string;
  projectId?: string;
  status?: ProjectStatus;
  categoryFilter?: string; // 'all' | specific category
  onCategoryFilterChange?: (value: string) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  onAddCredential,
  projectCreatedAt,
  projectName,
  projectId,
  status = "active",
  categoryFilter = "all",
  onCategoryFilterChange,
}) => {
  const { updateProject } = useProjectStore();
  return (
    <div className="py-2 px-4 flex justify-between items-center">
      <div className="flex flex-col items-start gap-1">
        <Link
          className="text-brand-blue hover:underline text-sm block flex items-center"
          to="/dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl truncate">{projectName}</h1>
        {projectCreatedAt && (
          <p className="text-sm text-gray-400 mt-1">
            Created:{" "}
            {new Date(projectCreatedAt.seconds * 1000).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {projectId && (
          <select
            aria-label="Project Status"
            className="px-3 py-2 bg-brand-dark-secondary border border-gray-700/50 rounded-md text-sm"
            onChange={(e) => {
              const newStatus = e.target.value as ProjectStatus;
              void updateProject(projectId, { status: newStatus });
            }}
            value={status}
          >
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        )}
        <select
          aria-label="Category Filter"
          className="px-3 py-2 bg-brand-dark-secondary border border-gray-700/50 rounded-md text-sm"
          onChange={(e) => {
            onCategoryFilterChange?.(e.target.value);
          }}
          value={categoryFilter}
        >
          <option value="all">All categories</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="database">Database</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="devops">DevOps</option>
          <option value="mobile">Mobile</option>
          <option value="analytics">Analytics</option>
          <option value="other">Other</option>
          <option value="none">None</option>
        </select>
        <button
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md whitespace-nowrap"
          onClick={onAddCredential}
        >
          Add Credential
        </button>
      </div>
    </div>
  );
};

export default ProjectHeader;
