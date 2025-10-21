import { useMemo, useState } from "react";
import { Eye, EyeOff, Copy, Save, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logger, ErrorCategory } from "../services/logger";

import usePasswordStore from "../stores/passwordStore";
import TagPicker from "../components/pw/TagPicker";

export default function AddPasswordPage() {
  const navigate = useNavigate();
  const { addPassword } = usePasswordStore();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [masked, setMasked] = useState(true);
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Gamer-focused metadata (same as modal)
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
  const [platform, setPlatform] = useState("");
  const [gamerTag, setGamerTag] = useState("");
  const [region, setRegion] = useState("");
  const [twoFA, setTwoFA] = useState("");
  const [backupCodes, setBackupCodes] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.<>/?";
    const all = lowers + uppers + digits + symbols;
    const cryptoRand = (max: number): number => {
      const arr = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      let x = 0;
      do {
        crypto.getRandomValues(arr);
        x = arr[0];
      } while (x >= limit);
      return x % max;
    };
    const pick = (set: string) => set[cryptoRand(set.length)];
    const chars: string[] = [
      pick(lowers),
      pick(uppers),
      pick(digits),
      pick(symbols),
    ];
    for (let i = chars.length; i < length; i++) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = cryptoRand(i + 1);
      const t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    setPassword(chars.join(""));
  }

  function fillWithMock() {
    setName("Acme Inc — VPN");
    setUsername("jane.doe@acme.com");
    setUrl("https://vpn.acme.com/login");
    setPlatform("Steam");
    setGamerTag("JaneDoe#1234");
    setRegion("NA-East");
    setTwoFA("auth_app");
    setBackupCodes(
      [
        "ABCD-EFGH-IJKL",
        "MNOP-QRST-UVWX",
        "YZ12-3456-7890",
        "1A2B-3C4D-5E6F",
        "7G8H-9I0J-KLMN",
      ].join("\n")
    );
    setNotes(
      "Work account. VPN access only. Rotate every 90 days.\n2FA: Authenticator App"
    );
    setShowSuggestions(false);
    generatePassword();
  }

  return (
    <div className="space-y-4">
      <div className="pw-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-red-200">Add Password</h1>
            <p className="text-[color:var(--pw-muted)] text-sm">
              Enter details below.
            </p>
          </div>
          <div>
            <button
              className="pw-btn-ghost"
              onClick={fillWithMock}
              type="button"
            >
              <Wand2 className="h-4 w-4 mr-2 inline" /> Fill with mock
            </button>
          </div>
        </div>
      </div>

      <div className="pw-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-[color:var(--pw-muted)]">Name</label>
            <div className="relative">
              <input
                className="pw-input w-full"
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
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[color:var(--pw-border)] bg-[color:var(--pw-bg-1)] shadow-xl">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-[color:var(--pw-bg-2)]"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setName(s);
                        setPlatform(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Username
            </label>
            <input
              className="pw-input w-full"
              placeholder="optional"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">URL</label>
            <input
              className="pw-input w-full"
              placeholder="https://... (optional)"
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
              placeholder="e.g. YourPSN, SteamID, Gamertag (optional)"
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-[color:var(--pw-muted)]">
              Password
            </label>
            <div className="flex items-center gap-2">
              <input
                className="pw-input flex-1"
                placeholder="Enter password"
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
              <button
                type="button"
                className="pw-btn-ghost"
                onClick={generatePassword}
              >
                Generate
              </button>
            </div>
            {password && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1.5 w-6 rounded-full ${
                          strength.score >= lvl ? strength.color : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[color:var(--pw-muted)]">
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[color:var(--pw-muted)]">
              Region / Server
            </label>
            <input
              className="pw-input w-full"
              placeholder="e.g. NA-East, EU-West (optional)"
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

          <div className="sm:col-span-2">
            <label className="text-xs text-[color:var(--pw-muted)]">Tags</label>
            <div className="mt-2">
              <TagPicker value={tagIds} onChange={setTagIds} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-[color:var(--pw-muted)]">
              Notes
            </label>
            <textarea
              className="pw-input w-full min-h-24"
              placeholder="optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-[color:var(--pw-muted)]">
              Backup Codes
            </label>
            <textarea
              className="pw-input w-full min-h-24"
              placeholder="One per line (optional)"
              value={backupCodes}
              onChange={(e) => setBackupCodes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            className="pw-btn-ghost"
            onClick={() => navigate(-1)}
            type="button"
          >
            Cancel
          </button>
          <button
            className="pw-btn-primary"
            disabled={!name || !password || submitting}
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              const toastId = toast.loading("Saving password…");
              logger.info(
                ErrorCategory.CREDENTIAL,
                "AddPassword submit clicked",
                {
                  field_name_present: Boolean(name),
                  field_password_present: Boolean(password),
                  field_username_present: Boolean(username),
                  field_url_present: Boolean(url),
                }
              );
              let composedNotes = notes;
              const lines: string[] = [];
              if (platform) lines.push(`Platform: ${platform}`);
              if (gamerTag) lines.push(`GamerTag: ${gamerTag}`);
              if (region) lines.push(`Region: ${region}`);
              if (twoFA) lines.push(`2FA: ${twoFA}`);
              if (backupCodes) lines.push(`Backup Codes:\n${backupCodes}`);
              if (lines.length > 0)
                composedNotes = notes
                  ? `${notes}\n\n${lines.join("\n")}`
                  : lines.join("\n");
              try {
                const ok = await addPassword({
                  name,
                  username: username || undefined,
                  url: url || undefined,
                  notes: composedNotes || undefined,
                  password,
                  tagIds,
                });
                if (ok) {
                  logger.info(
                    ErrorCategory.CREDENTIAL,
                    "AddPassword succeeded",
                    {
                      field_name_length: name.length,
                      field_username_present: Boolean(username),
                      field_url_present: Boolean(url),
                    }
                  );
                  toast.success("Password saved", { id: toastId });
                  navigate("/pw", { replace: true });
                } else {
                  const latestError = usePasswordStore.getState().error;
                  logger.warn(
                    ErrorCategory.CREDENTIAL,
                    "AddPassword returned false",
                    latestError ?? undefined,
                    {
                      error_message: latestError?.message,
                    }
                  );
                  toast.error(
                    latestError?.message ?? "Failed to save password",
                    {
                      id: toastId,
                    }
                  );
                }
              } catch (e) {
                logger.error(ErrorCategory.CREDENTIAL, "AddPassword threw", e);
                toast.error(e instanceof Error ? e.message : String(e), {
                  id: toastId,
                });
              } finally {
                setSubmitting(false);
              }
            }}
            type="button"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
