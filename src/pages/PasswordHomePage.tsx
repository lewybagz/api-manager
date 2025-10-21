import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PasswordToolbar, {
  type SortKey,
  type ViewMode,
} from "../components/pw/PasswordToolbar";
import PasswordList from "../components/pw/PasswordList";
import TagFilterBar from "../components/pw/TagFilterBar";
import usePasswordStore from "../stores/passwordStore";
import { Timestamp } from "firebase/firestore";
import PasswordRow from "../components/pw/PasswordRow";
import PasswordCard from "../components/pw/PasswordCard";

export default function PasswordHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<ViewMode>("list");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"or" | "and">("or");
  const { passwords, isLoading } = usePasswordStore();
  const [exampleMasked, setExampleMasked] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tags = params.get("tags");
    if (tags) setActiveTagIds(tags.split(",").filter(Boolean));
  }, [location.search]);

  useEffect(() => {
    const onKeyDownCapture = (e: KeyboardEvent) => {
      const isFind = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";
      if (!isFind) return;
      e.preventDefault();
      e.stopPropagation();
      const el = document.getElementById(
        "pw-search"
      ) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.select();
      }
    };
    window.addEventListener("keydown", onKeyDownCapture, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDownCapture, {
        capture: true,
      } as any);
  }, []);
  const showEmptyDemo = useMemo(
    () => !isLoading && (!passwords || passwords.length === 0),
    [isLoading, passwords]
  );
  const exampleNow = useMemo(() => Timestamp.fromDate(new Date()), []);
  return (
    <div className="space-y-6">
      <div className="pw-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-red-200">
            Password Vault <br />
            <h1 className="text-sm text-gray-500">
              How fast can you type the word "giggles"?
            </h1>
          </h1>
          <button
            onClick={() => navigate("/pw/add")}
            className="pw-btn-primary"
          >
            Add Password
          </button>
        </div>
      </div>
      <PasswordToolbar
        query={query}
        onQueryChange={setQuery}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortKeyChange={setSortKey}
        onSortDirToggle={() =>
          setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        }
        viewMode={view}
        onViewModeChange={setView}
        selectedCount={0}
        onClearSelection={() => undefined}
        onBulkDelete={() => undefined}
      />
      <TagFilterBar
        activeTagIds={activeTagIds}
        onChange={setActiveTagIds}
        filterMode={filterMode}
        onModeChange={setFilterMode}
      />
      {showEmptyDemo ? (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="p-4">
              <h3 className="text-md font-semibold text-red-200 mb-3">
                Example (List)
              </h3>
              <PasswordRow
                id="example-list"
                name="Acme Inc — VPN"
                username="jane.doe@acme.com"
                url="https://vpn.acme.com/login"
                masked={exampleMasked}
                password=">bN9#/%I(@4G6*9G7%-E9#~4%R^2l@)g"
                notes={"Too much sauce for a password manager"}
                createdAt={exampleNow}
                updatedAt={exampleNow}
                tagIds={[]}
                selected={false}
                onToggleSelect={() => undefined}
                onToggleMask={() => setExampleMasked((m) => !m)}
                onEdit={() => undefined}
              />
            </div>
            <div className="p-4">
              <h3 className="text-md font-semibold text-red-200 mb-3">
                Example (Card)
              </h3>
              <PasswordCard
                id="example-card"
                name="Acme Inc — VPN"
                username="jane.doe@acme.com"
                url="https://vpn.acme.com/login"
                password=">bN9#/%I(@4G6*9G7%-E9#~4%R^2l@)g"
                notes={
                  "As far back as I can remember, I really just wanted to get me some money.\n― Gucci Mane, The Autobiography of Gucci Mane\n2FA: Authenticator App"
                }
                createdAt={exampleNow}
                updatedAt={exampleNow}
                lastAccessedAt={undefined}
                tagIds={[]}
                onCopy={() => undefined}
                onEdit={() => undefined}
              />
            </div>
          </div>
        </div>
      ) : null}
      <PasswordList
        query={query}
        sortKey={sortKey}
        sortDir={sortDir}
        viewMode={view}
        activeTagIds={activeTagIds}
        filterMode={filterMode}
      />
    </div>
  );
}
