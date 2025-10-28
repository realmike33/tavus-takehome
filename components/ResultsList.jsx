"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Star } from "lucide-react";

export default function ResultsList() {
  const { results, bookmarks, toggleBookmark } = useAppStore();
  const [openId, setOpenId] = useState(null);

  return (
    <div className="grid gap-4">
      {results.map((r) => {
        const open = openId === r.id;
        const starred = bookmarks.has(r.id);
        return (
          <div key={r.id} className="card" data-result-id={r.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{r.name}</div>
                <div className="text-white/60 text-sm">
                  {r.category} • Alameda County {r.needsReferral ? "• referral" : ""}
                </div>
              </div>
              <button
                aria-label="bookmark"
                onClick={() => toggleBookmark(r.id)}
                className={`p-2 rounded-full border ${starred ? "bg-brand text-ink border-transparent":"border-white/20"}`}
              >
                <Star size={16} fill={starred ? "currentColor" : "none"} />
              </button>
            </div>
            <button className="mt-2 text-brand underline" onClick={() => setOpenId(open ? null : r.id)}>
              {open ? "Hide details" : "View details"}
            </button>
            {open && (
              <div className="mt-2 space-y-1">
                <p className="text-white/80">{r.summary}</p>
                <a href={r.url} target="_blank" className="text-brand underline">Website</a>
                <div className="text-white/60 text-sm">{r.phone}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
