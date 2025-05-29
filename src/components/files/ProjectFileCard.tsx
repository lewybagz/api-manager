import { Download, MoreVertical, Trash2 } from "lucide-react";
import React from "react";

import { type FileMetadata } from "../../stores/fileStore";
import { formatFileSize } from "../../utils/formatters";

interface ProjectFileCardProps {
  file: FileMetadata;
  isMenuOpen: boolean;
  onDelete: () => void;
  onDownload: () => void;
  onToggleMenu: () => void;
}

const ProjectFileCard: React.FC<ProjectFileCardProps> = ({
  file,
  isMenuOpen,
  onDelete,
  onDownload,
  onToggleMenu,
}) => {
  return (
    <div
      className="bg-brand-dark-secondary p-3 rounded-lg shadow-md flex flex-col justify-between h-full"
      key={file.id}
    >
      <div>
        <div className="flex justify-between items-start mb-1.5">
          <h3
            className="text-base font-semibold text-brand-blue truncate mr-2"
            title={file.fileName}
          >
            {file.fileName}
          </h3>
          <div className="relative flex-shrink-0">
            <button
              aria-label="Toggle file menu"
              className="p-0.5 text-gray-400 hover:text-white"
              onClick={onToggleMenu}
              title="More options"
            >
              <MoreVertical size={18} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                <button
                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-200 hover:bg-gray-600 flex items-center"
                  onClick={onDownload}
                >
                  <Download className="mr-1.5" size={14} /> Download
                </button>
                <button
                  className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-gray-600 flex items-center"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5" size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-2xs text-gray-400 mb-0.5">
          Type: {file.contentType || "N/A"}
        </p>
        <p className="text-2xs text-gray-400 mb-0.5">
          Size: {formatFileSize(file.size)}
        </p>
        <p className="text-2xs text-gray-400 mb-2">
          Uploaded:{" "}
          {new Date(file.uploadedAt.seconds * 1000).toLocaleDateString()}
        </p>
      </div>
      {/* Preview placeholder - actual preview depends heavily on file type and is complex */}
      {/* <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-300 overflow-auto max-h-20">
        <p>File preview could go here for certain types.</p>
      </div> */}
    </div>
  );
};

export default ProjectFileCard;
