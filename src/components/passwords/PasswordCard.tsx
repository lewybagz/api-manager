import React from "react";

interface PasswordCardProps {
  name: string;
  username?: string;
  onCopy: () => void;
}

export default function PasswordCard({
  name,
  onCopy,
  username,
}: PasswordCardProps) {
  return (
    <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-red-200 font-medium">{name}</p>
          {username ? (
            <p className="text-red-300/70 text-sm">{username}</p>
          ) : null}
        </div>
        <button
          className="text-black bg-red-500 hover:bg-red-400 rounded-lg px-3 py-1 text-sm font-semibold"
          onClick={onCopy}
          type="button"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
