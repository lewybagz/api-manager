import React, { useEffect } from "react";
import { Link } from "react-router-dom"; // Assuming project items will link somewhere
import useProjectStore from "../../stores/projectStore"; // Adjust path as needed
import useAuthStore from "../../stores/authStore";
import { ChevronRight } from "lucide-react";

const Sidebar: React.FC = () => {
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const { user, masterPasswordSet } = useAuthStore();

  useEffect(() => {
    // Fetch projects when the component mounts and user is available and master password is set
    if (user && masterPasswordSet) {
      fetchProjects();
    } else if (user && !masterPasswordSet) {
      // If master password not set, projects can't be decrypted/managed yet,
      // so don't fetch, or clear them if already fetched and MP is revoked.
      // The projectStore already clears projects on logout.
    }
  }, [user, masterPasswordSet, fetchProjects]);

  return (
    <aside className="fixed left-0 top-16 w-64 bg-brand-dark-secondary text-brand-light-secondary p-4 space-y-4 h-[calc(100vh-4rem)] shadow-lg overflow-y-auto">
      <h3 className="text-lg font-semibold text-brand-light mb-2 px-3">
        Projects
      </h3>
      {isLoading && <p className="px-3 text-sm">Loading projects...</p>}
      {error && (
        <p className="px-3 text-sm text-red-400">Error: {error.message}</p>
      )}
      {!user && <p className="px-3 text-sm">Login to see projects.</p>}
      {user && !masterPasswordSet && (
        <p className="px-3 text-sm">Enter master password to view projects.</p>
      )}
      {user &&
        masterPasswordSet &&
        !isLoading &&
        !error &&
        projects.length === 0 && (
          <p className="px-3 text-sm">
            No projects yet. Add one on the dashboard!
          </p>
        )}
      {user && masterPasswordSet && projects.length > 0 && (
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Projects
          </h3>
          <div className="mt-1 space-y-1">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ChevronRight className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-300" />
                {project.projectName}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
