import React from "react";

import FileList from "../files/FileList";

interface FilesViewProps {
  projectId: string;
  searchQuery: string;
}

const FilesView: React.FC<FilesViewProps> = ({ projectId, searchQuery }) => {
  return (
    <div className="mt-0 rounded-2xl border border-zk-border bg-zk-elevated/20 p-4 font-zk-sans sm:p-6">
      <FileList projectId={projectId} searchQuery={searchQuery} />
    </div>
  );
};

export default FilesView;
