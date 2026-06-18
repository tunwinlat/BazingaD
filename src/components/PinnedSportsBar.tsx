'use client';

import { PinOff, Radio } from 'lucide-react';
import { useSports } from '@/components/SportsContext';
import { formatEventStatus } from '@/lib/sports';

export default function PinnedSportsBar() {
  const { pinned, unpinMatch } = useSports();

  if (pinned.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-2xl p-4 animate-fadeInUp"
      style={{
        background:
          'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(24px)',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Pinned Matches
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {pinned.map((match) => (
          <div
            key={match.id}
            className="flex-shrink-0 min-w-[220px] max-w-[280px] rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-white/40 truncate max-w-[100px]"
                title={match.leagueName}
              >
                {match.leagueAbbreviation}
              </span>
              <div className="flex items-center gap-2">
                {match.status.state === 'in' && <LiveDot />}
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    match.status.state === 'in'
                      ? 'text-emerald-400'
                      : 'text-white/45'
                  }`}
                >
                  {formatEventStatus(match)}
                </span>
                <button
                  type="button"
                  onClick={() => unpinMatch(match.id)}
                  className="p-1 rounded-md transition-colors hover:bg-white/10 text-white/40 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Unpin match"
                  title="Unpin match"
                >
                  <PinOff className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <TeamRow team={match.away} />
              <TeamRow team={match.home} />
            </div>

            {match.broadcast && (
              <div className="mt-2.5 pt-2 text-[10px] text-white/35 truncate"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {match.broadcast}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: { logo: string; abbreviation: string; shortName: string; name: string; score: string; winner?: boolean } }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt={team.abbreviation}
            className="w-8 h-8 object-contain flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {team.abbreviation.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div className={`text-sm truncate ${team.winner ? 'text-white font-semibold' : 'text-white/90'}`}>
            {team.shortName || team.name}
          </div>
          <div className="text-[10px] text-white/40">{team.abbreviation}</div>
        </div>
      </div>
      <span className={`text-lg font-bold tabular-nums ${team.winner ? 'text-white' : 'text-white/80'}`}>
        {team.score}
      </span>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  );
}
