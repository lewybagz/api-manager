import React from "react";
// Legend removed; colors are shown via tooltip on each file card

import FileList from "../files/FileList";
import FileUploadArea from "../files/FileUploadArea";

interface FilesViewProps {
  projectId: string;
  searchQuery: string;
}

const FilesView: React.FC<FilesViewProps> = ({ projectId, searchQuery }) => {
  return (
    <div className="mt-0 bg-transparent border-none">
      <FileUploadArea projectId={projectId} />

      <FileList projectId={projectId} searchQuery={searchQuery} />
    </div>
  );
};

export default FilesView;
