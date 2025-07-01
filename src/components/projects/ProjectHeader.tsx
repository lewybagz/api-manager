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
    <div className="mb-8">
      <Link
        className="text-brand-blue hover:underline text-sm mb-2 block flex items-center"
        to="/dashboard"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl truncate">{projectName}</h1>
        <button
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md whitespace-nowrap"
          onClick={onAddCredential}
        >
          Add Credential
        </button>
      </div>
      {projectCreatedAt && (
        <p className="text-sm text-gray-400 mt-1">
          Created:{" "}
          {new Date(projectCreatedAt.seconds * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default ProjectHeader;
