import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface ProjectHeaderProps {
  onAddCredential: () => void;
  projectCreatedAt: null | undefined | { nanoseconds: number; seconds: number };
  projectName: string;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  onAddCredential,
  projectCreatedAt,
  projectName,
}) => {
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
      <button
        className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md whitespace-nowrap"
        onClick={onAddCredential}
      >
        Add Credential
      </button>
    </div>
  );
};

export default ProjectHeader;
