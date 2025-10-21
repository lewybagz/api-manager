import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Tag, Trash2, Settings, LockKeyhole } from "lucide-react";
import usePasswordStore from "../../stores/passwordStore";

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}> = ({ to, icon, label, badge }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active ? "bg-pw-card" : "hover:bg-pw-bg-2"
      }`}
    >
      <span className="text-red-400">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-[color:var(--pw-border)] text-[color:var(--pw-muted)]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
};

export default function SidebarNav() {
  // Use the store directly to get reactive updates
  const { trashCount, fetchTrashed } = usePasswordStore();

  // Fetch trash count on mount to ensure it's up to date
  React.useEffect(() => {
    void fetchTrashed();
  }, [fetchTrashed]);
  return (
    <nav className="pw-card p-3">
      <div className="text-xs uppercase tracking-wide text-[color:var(--pw-muted)] px-2 mb-2">
        Navigation
      </div>
      <div className="grid gap-1">
        <NavItem
          to="/pw"
          icon={<LockKeyhole className="h-4 w-4" />}
          label="Password Vault"
        />

        <NavItem
          to="/pw/tags"
          icon={<Tag className="h-4 w-4" />}
          label="Tags"
        />
      </div>
      <div className="h-px my-3 bg-[color:var(--pw-border)]" />
      <div className="grid gap-1">
        <NavItem
          to="/pw/trash"
          icon={<Trash2 className="h-4 w-4" />}
          label="Trash"
          badge={`${trashCount ?? 0}/5`}
        />
        <NavItem
          to="/pw/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
        />
      </div>
    </nav>
  );
}
