import React from "react";

import FileList from "../files/FileList";
import FileUploadArea from "../files/FileUploadArea";

interface FilesViewProps {
  projectId: string;
  searchQuery: string;
}

const FilesView: React.FC<FilesViewProps> = ({ projectId, searchQuery }) => {
  return (
    <div className="mt-0 rounded-2xl border border-zk-border bg-zk-elevated/20 p-4 font-zk-sans sm:p-6">
      <div className="space-y-8">
        <FileUploadArea projectId={projectId} />
        <div className="border-t border-zk-border pt-8">
          <FileList projectId={projectId} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};

export default FilesView;
