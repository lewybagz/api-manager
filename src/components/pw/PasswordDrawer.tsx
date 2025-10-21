import { useEffect, useMemo, useState } from "react";
import { X, Eye, EyeOff, Copy, Save } from "lucide-react";
import usePasswordStore from "../../stores/passwordStore";
import TagPicker from "./TagPicker";

interface PasswordDrawerProps {
  id: string;
  onClose: () => void;
}

export default function PasswordDrawer({ id, onClose }: PasswordDrawerProps) {
  const { passwords, updatePassword } = usePasswordStore();
  const item = passwords.find((p) => p.id === id);
  const [name, setName] = useState(item?.name ?? "");
  const [username, setUsername] = useState(item?.username ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [password, setPassword] = useState(item?.password ?? "");
  const [masked, setMasked] = useState(true);
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);
  // Parsed metadata and base notes
  const popularPlatforms = useMemo(
    () => [
      "Steam",
      "Epic Games",
      "PlayStation Network (PSN)",
      "Xbox Live / Microsoft",
      "Nintendo Account",
      "Battle.net (Blizzard)",
      "Ubisoft Connect",
      "EA App (Origin)",
      "Riot Games (League/Valorant)",
      "GOG Galaxy",
      "Bethesda.net",
      "Rockstar Social Club",
      "Square Enix",
      "2K",
      "Paradox",
      "Itch.io",
      "Discord",
      "Twitch",
      "Minecraft / Mojang",
      "Oculus / Meta",
      "Viveport",
      "Battlestate (Escape from Tarkov)",
      "Wargaming (WG, WoT/Warships)",
    ],
    []
  );

  const initialParsed = useMemo(() => {
    const raw = item?.notes ?? "";
    const lines = raw.split("\n");
    const kept: string[] = [];
    let platform: string = "";
    let gamerTag: string = "";
    let region: string = "";
    let twoFA: string = "";
    let backupCodes: string = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const m = /^(Platform|GamerTag|Region|2FA):\s*(.*)$/.exec(line);
      if (m) {
        const key = m[1];
        const value = m[2] ?? "";
        if (key === "Platform") platform = value;
        else if (key === "GamerTag") gamerTag = value;
        else if (key === "Region") region = value;
        else if (key === "2FA") twoFA = value;
        i++;
        continue;
      }
      if (/^Backup Codes:\s*$/.test(line)) {
        i++;
        const codes: string[] = [];
        while (i < lines.length && lines[i].trim().length > 0) {
          codes.push(lines[i]);
          i++;
        }
        backupCodes = codes.join("\n");
        continue;
      }
      kept.push(line);
      i++;
    }
    const baseNotes = kept.join("\n").trim();
    return { baseNotes, platform, gamerTag, region, twoFA, backupCodes };
  }, [item?.notes]);

  const [notes, setNotes] = useState(initialParsed.baseNotes);
  const sanitizeNote = (input: string): string => {
    const cleaned = input.replace(/[<>`{}]/g, "");
    return cleaned.replace(/\s+/g, " ").trim();
  };
  const [platform, setPlatform] = useState(initialParsed.platform);
  const [gamerTag, setGamerTag] = useState(initialParsed.gamerTag);
  const [region, setRegion] = useState(initialParsed.region);
  const [twoFA, setTwoFA] = useState(initialParsed.twoFA);
  const [backupCodes, setBackupCodes] = useState(initialParsed.backupCodes);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute inset-x-0 bottom-0 top-auto w-full max-h-[85vh] bg-[color:var(--pw-bg-1)] border-t border-[color:var(--pw-border)] shadow-2xl p-4 overflow-y-auto rounded-t-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-red-200">Quick Edit</h2>
          <button
            className="pw-btn-ghost"
            aria-label="Close"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">Name</label>
            <input
              className="pw-input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Username
            </label>
            <input
              className="pw-input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">URL</label>
            <input
              className="pw-input w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Platform
            </label>
            <select
              className="pw-input w-full"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">Select platform (optional)</option>
              {popularPlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Gamer Tag / ID
            </label>
            <input
              className="pw-input w-full"
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Password
            </label>
            <div className="flex items-center gap-2">
              <input
                className="pw-input flex-1"
                type={masked ? "password" : "text"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="pw-btn-ghost"
                onClick={() => setMasked((m) => !m)}
                type="button"
                aria-label="Toggle visibility"
              >
                {masked ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
              <button
                className="pw-btn-ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(password);
                }}
                type="button"
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Region / Server
            </label>
            <input
              className="pw-input w-full"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              2FA Method
            </label>
            <select
              className="pw-input w-full"
              value={twoFA}
              onChange={(e) => setTwoFA(e.target.value)}
            >
              <option value="">Select 2FA method (optional)</option>
              <option value="auth_app">Authenticator App</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="hardware_key">Hardware Key</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Notes
            </label>
            <textarea
              className="pw-input w-full min-h-24"
              value={notes}
              maxLength={100}
              onChange={(e) => {
                const v = sanitizeNote(e.target.value).slice(0, 100);
                setNotes(v);
              }}
            />
            <div className="text-[10px] text-[color:var(--pw-muted)] mt-1">
              {notes.length}/100
            </div>
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">Tags</label>
            <TagPicker value={tagIds} onChange={setTagIds} />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Backup Codes
            </label>
            <textarea
              className="pw-input w-full min-h-24"
              value={backupCodes}
              onChange={(e) => setBackupCodes(e.target.value)}
              placeholder="One per line (optional)"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              className="pw-btn-primary"
              onClick={async () => {
                await updatePassword(item.id, {
                  name,
                  username: username || undefined,
                  url: url || undefined,
                  notes: sanitizeNote(notes) || undefined,
                  password,
                  tagIds,
                });
                onClose();
              }}
              type="button"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
