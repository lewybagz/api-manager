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
      className="bg-brand-dark-secondary p-4 rounded-lg shadow-md flex flex-col justify-between"
      key={file.id} // Key should ideally be on the mapped element in the parent, but can be here too if this is the top-level element returned by map's callback
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3
            className="text-lg font-semibold text-brand-blue truncate mr-2"
            title={file.fileName}
          >
            {file.fileName}
          </h3>
          <div className="relative">
            <button
              className="p-1 text-gray-400 hover:text-white"
              onClick={onToggleMenu} // Use the passed-in handler
            >
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && ( // Use the passed-in boolean to control visibility
              <div className="absolute right-0 mt-1 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center"
                  onClick={onDownload} // Use the passed-in handler
                >
                  <Download className="mr-2" size={16} /> Download
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center"
                  onClick={onDelete} // Use the passed-in handler
                >
                  <Trash2 className="mr-2" size={16} /> Delete
                </button>
                {/* Placeholder for a future 'View Details' or preview action 
                 <button className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center">
                   <Eye size={16} className="mr-2" /> View Details
                 </button> 
                 */}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-1">Type: {file.contentType}</p>
        <p className="text-xs text-gray-400 mb-1">
          Size: {formatFileSize(file.size)}
        </p>
        <p className="text-xs text-gray-400 mb-3">
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
