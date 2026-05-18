import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Save, X } from "lucide-react";

import usePasswordStore from "../../stores/passwordStore";
import { getSecureRandomInt } from "../../utils/cryptoSafe";

const zkField =
  "w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-3 font-zk-sans text-sm text-zk-text transition-colors placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30";
const zkLabel = "mb-2 block text-sm font-medium text-zk-muted";

interface PasswordModalProps {
  onClose: () => void;
  initial?: {
    id?: string;
    name?: string;
    username?: string;
    url?: string;
    notes?: string;
    password?: string;
  };
}

export default function PasswordModal({
  onClose,
  initial,
}: PasswordModalProps) {
  const { addPassword, updatePassword, isLoading } = usePasswordStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [masked, setMasked] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Gamer-focused metadata
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
  const [platform, setPlatform] = useState<string>("");
  const [gamerTag, setGamerTag] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [twoFA, setTwoFA] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string>("");
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [] as string[];
    return popularPlatforms
      .filter((p) => p.toLowerCase().includes(q))
      .slice(0, 8);
  }, [name, popularPlatforms]);

  const strength = useMemo(() => {
    const pwd = password;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;
    const levels = [
      "Very weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
      "Very strong",
    ];
    const label = levels[Math.min(score, levels.length - 1)];
    const colors = [
      "bg-red-500",
      "bg-red-400",
      "bg-orange-400",
      "bg-yellow-500",
      "bg-green-500",
      "bg-emerald-500",
    ];
    const color = colors[Math.min(score, colors.length - 1)];
    return { score, label, color };
  }, [password]);

  function generatePassword() {
    const length = 24;
    const lowers = "abcdefghijkmnopqrstuvwxyz"; // exclude l
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude O
    const digits = "23456789"; // exclude 0/1
    const symbols = "!@#$%^&*()-_=+[]{};:,.<>/?";
    const all = lowers + uppers + digits + symbols;

    const cryptoRand = (max: number): number => getSecureRandomInt(max);

    const pick = (set: string) => set[cryptoRand(set.length)];

    // Ensure at least one from each class
    const chars: string[] = [
      pick(lowers),
      pick(uppers),
      pick(digits),
      pick(symbols),
    ];
    for (let i = chars.length; i < length; i++) {
      chars.push(pick(all));
    }

    // Fisher–Yates shuffle using crypto randomness
    for (let i = chars.length - 1; i > 0; i--) {
      const j = cryptoRand(i + 1);
      const t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }

    setPassword(chars.join(""));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zk-border bg-zk-elevated font-zk-sans shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zk-border bg-zk-surface/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
              <KeyRound className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="truncate text-xl font-semibold tracking-[-0.02em] text-zk-text">
              {initial?.id ? "Edit password" : "Add password"}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={zkLabel} htmlFor="pw-modal-name">
                Name
              </label>
              <div className="relative">
                <input
                  className={zkField}
                  id="pw-modal-name"
                  placeholder="e.g. Steam, PSN, Epic Games, custom…"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 0);
                  }}
                />
                {showSuggestions && suggestions.length > 0 ? (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zk-border bg-zk-elevated shadow-lg">
                    {suggestions.map((s) => (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-zk-text transition-colors hover:bg-zk-base/80"
                        key={s}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setName(s);
                          setPlatform(s);
                          setShowSuggestions(false);
                        }}
                        type="button"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <label className={zkLabel} htmlFor="pw-modal-username">
                Username
              </label>
              <input
                className={zkField}
                id="pw-modal-username"
                placeholder="optional"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className={zkLabel} htmlFor="pw-modal-url">
                URL
              </label>
              <input
                className={zkField}
                id="pw-modal-url"
                placeholder="https://... (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className={zkLabel} htmlFor="pw-modal-platform">
                Platform
              </label>
              <select
                className={zkField}
                id="pw-modal-platform"
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
              <label className={zkLabel} htmlFor="pw-modal-gamertag">
                Gamer tag / ID
              </label>
              <input
                className={zkField}
                id="pw-modal-gamertag"
                placeholder="e.g. YourPSN, SteamID, Gamertag (optional)"
                value={gamerTag}
                onChange={(e) => setGamerTag(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={zkLabel} htmlFor="pw-modal-password">
                Password
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${zkField} min-w-0 flex-1`}
                  id="pw-modal-password"
                  placeholder="Enter password"
                  type={masked ? "password" : "text"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label="Toggle visibility"
                  className="rounded-xl border border-zk-border px-3 py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60"
                  onClick={() => setMasked((m) => !m)}
                  type="button"
                >
                  {masked ? (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
                <button
                  aria-label="Copy"
                  className="rounded-xl border border-zk-border px-3 py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60"
                  onClick={() => {
                    void navigator.clipboard.writeText(password);
                  }}
                  type="button"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  className="rounded-xl border border-zk-border px-3 py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60"
                  onClick={generatePassword}
                  type="button"
                >
                  Generate
                </button>
              </div>
              {password ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5, 6].map((lvl) => (
                        <div
                          className={`h-1.5 w-6 rounded-full ${
                            strength.score >= lvl
                              ? strength.color
                              : "bg-zk-border"
                          }`}
                          key={lvl}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zk-muted">{strength.label}</span>
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <label className={zkLabel} htmlFor="pw-modal-region">
                Region / server
              </label>
              <input
                className={zkField}
                id="pw-modal-region"
                placeholder="e.g. NA-East, EU-West (optional)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div>
              <label className={zkLabel} htmlFor="pw-modal-2fa">
                2FA method
              </label>
              <select
                className={zkField}
                id="pw-modal-2fa"
                value={twoFA}
                onChange={(e) => setTwoFA(e.target.value)}
              >
                <option value="">Select 2FA method (optional)</option>
                <option value="auth_app">Authenticator app</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="hardware_key">Hardware key</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={zkLabel} htmlFor="pw-modal-notes">
                Notes
              </label>
              <textarea
                className={`${zkField} min-h-24 resize-y`}
                id="pw-modal-notes"
                placeholder="optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={zkLabel} htmlFor="pw-modal-backup">
                Backup codes
              </label>
              <textarea
                className={`${zkField} min-h-24 resize-y`}
                id="pw-modal-backup"
                placeholder="One per line (optional)"
                value={backupCodes}
                onChange={(e) => setBackupCodes(e.target.value)}
              />
            </div>
          </div>
        </div>
        <footer className="flex shrink-0 gap-3 border-t border-zk-border px-5 py-4">
          <button
            className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zk-indigo py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!name || !password || isLoading}
            onClick={async () => {
              let composedNotes = notes;
              const lines: string[] = [];
              if (platform) lines.push(`Platform: ${platform}`);
              if (gamerTag) lines.push(`GamerTag: ${gamerTag}`);
              if (region) lines.push(`Region: ${region}`);
              if (twoFA) lines.push(`2FA: ${twoFA}`);
              if (backupCodes) lines.push(`Backup Codes:\n${backupCodes}`);
              if (lines.length > 0) {
                composedNotes = notes
                  ? `${notes}\n\n${lines.join("\n")}`
                  : lines.join("\n");
              }
              if (initial?.id) {
                await updatePassword(initial.id, {
                  name,
                  username: username || undefined,
                  url: url || undefined,
                  notes: composedNotes || undefined,
                  password,
                });
              } else {
                await addPassword({
                  name,
                  username: username || undefined,
                  url: url || undefined,
                  notes: composedNotes || undefined,
                  password,
                });
              }
              onClose();
            }}
            type="button"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} />
            {initial?.id ? "Save changes" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
