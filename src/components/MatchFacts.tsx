'use client';

import React from 'react';
import {
  type SportEvent,
  type TeamStat,
  type MatchDetail,
} from '@/lib/sports';

interface MatchFactsProps {
  match: SportEvent;
}

const STAT_PRIORITY = [
  { keys: ['possessionpct', 'pp', 'pos'], label: 'Possession' },
  { keys: ['totalshots', 'shot', 'shots'], label: 'Shots' },
  { keys: ['shotsongoal', 'sog', 'shotsontarget', 'fgo'], label: 'Shots on Target' },
  { keys: ['pts', 'points'], label: 'Points' },
  { keys: ['fieldgoalpct', 'fg%'], label: 'FG%' },
  { keys: ['threepointpct', '3p%', 'threepointfieldgoalpct'], label: '3P%' },
  { keys: ['freethrowpct', 'ft%'], label: 'FT%' },
  { keys: ['rebounds', 'reb'], label: 'Rebounds' },
  { keys: ['assists', 'ast'], label: 'Assists' },
  { keys: ['blocks', 'blk'], label: 'Blocks' },
  { keys: ['steals', 'stl'], label: 'Steals' },
  { keys: ['saves', 'sav'], label: 'Saves' },
  { keys: ['hits'], label: 'Hits' },
  { keys: ['woncorners', 'cw'], label: 'Corners' },
  { keys: ['foulscommitted', 'fc'], label: 'Fouls' },
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findStatLabel(stat: TeamStat): string {
  const key = normalizeKey(stat.abbreviation);
  const found = STAT_PRIORITY.find((s) => s.keys.includes(key));
  return found?.label || stat.abbreviation;
}

function pickCommonStats(away: TeamStat[], home: TeamStat[]): TeamStat[] {
  const awayByKey = new Map(
    away.map((s) => [normalizeKey(s.abbreviation), s])
  );
  const common: TeamStat[] = [];
  for (const s of home) {
    const key = normalizeKey(s.abbreviation);
    if (awayByKey.has(key)) {
      common.push(awayByKey.get(key)!);
    }
  }

  const order = new Map<string, number>();
  STAT_PRIORITY.forEach((s, i) => s.keys.forEach((k) => order.set(k, i)));

  return common
    .filter((s, i, arr) => arr.findIndex((x) => normalizeKey(x.abbreviation) === normalizeKey(s.abbreviation)) === i)
    .sort((a, b) => {
      const ao = order.get(normalizeKey(a.abbreviation)) ?? 999;
      const bo = order.get(normalizeKey(b.abbreviation)) ?? 999;
      return ao - bo;
    })
    .slice(0, 6);
}

function hasMeaningfulValue(stats: TeamStat[]): boolean {
  return stats.some((s) => {
    const v = s.displayValue;
    return v && v !== '0' && v !== '0.0' && v !== '0%' && v !== '-';
  });
}

function renderDetailIcon(type: MatchDetail['type']) {
  if (type === 'goal') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
        ⚽
      </span>
    );
  }
  if (type === 'redCard') {
    return <span className="w-3 h-4 rounded-sm bg-red-500 inline-block" />;
  }
  if (type === 'yellowCard') {
    return <span className="w-3 h-4 rounded-sm bg-amber-400 inline-block" />;
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />;
}

export default function MatchFacts({ match }: MatchFactsProps) {
  const commonStats = pickCommonStats(match.away.stats, match.home.stats);
  const showStats =
    commonStats.length > 0 &&
    (match.status.state !== 'pre' || hasMeaningfulValue(commonStats));

  const details = match.details
    .filter((d) => d.type !== 'other')
    .sort((a, b) => {
      const aMin = parseInt(a.clock.replace(/\D/g, '') || '0', 10);
      const bMin = parseInt(b.clock.replace(/\D/g, '') || '0', 10);
      return aMin - bMin;
    });

  if (!showStats && details.length === 0) {
    return null;
  }

  return (
    <div
      className="match-facts mt-3 pt-3 space-y-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {showStats && (
        <div
          className="grid gap-y-2"
          style={{ gridTemplateColumns: '1fr auto auto' }}
        >
          <div />
          <span className="text-[10px] font-semibold text-center text-white/40 uppercase tracking-wider px-2">
            {match.away.abbreviation}
          </span>
          <span className="text-[10px] font-semibold text-center text-white/40 uppercase tracking-wider px-2">
            {match.home.abbreviation}
          </span>
          {commonStats.map((stat) => {
            const a = match.away.stats.find(
              (s) => normalizeKey(s.abbreviation) === normalizeKey(stat.abbreviation)
            );
            const h = match.home.stats.find(
              (s) => normalizeKey(s.abbreviation) === normalizeKey(stat.abbreviation)
            );
            return (
              <React.Fragment key={stat.abbreviation}>
                <span className="text-xs text-white/50 truncate pr-2">
                  {findStatLabel(stat)}
                </span>
                <span className="text-xs text-white/90 text-center tabular-nums px-2">
                  {a?.displayValue ?? '-'}
                </span>
                <span className="text-xs text-white/90 text-center tabular-nums px-2">
                  {h?.displayValue ?? '-'}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {details.length > 0 && (
        <div className="space-y-1.5">
          {details.map((d, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              {renderDetailIcon(d.type)}
              <span className="text-[10px] text-white/40 w-9">{d.clock}</span>
              <span
                className="text-white/70 truncate flex-1"
                title={d.athleteName}
              >
                {d.athleteName}
              </span>
              {d.type === 'goal' && d.displayValue && (
                <span className="text-[10px] text-white/50">{d.displayValue}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
