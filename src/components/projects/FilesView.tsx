import React from "react";

import FileList from "../files/FileList";
import FileUploadArea from "../files/FileUploadArea";

interface FilesViewProps {
  projectId: string;
}

const FilesView: React.FC<FilesViewProps> = ({ projectId }) => {
  return (
    <div className="mt-0">
      <FileUploadArea projectId={projectId} />
      <FileList projectId={projectId} />
    </div>
  );
};

export default FilesView;
