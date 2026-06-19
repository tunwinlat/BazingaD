'use client';

import React from 'react';
import { type SportEvent, type TeamStat, type TeamLeader, type MatchDetail } from '@/lib/sports';

interface MatchFactsProps {
  match: SportEvent;
}

const STAT_PRIORITY = [
  'possessionpct',
  'pp',
  'pos',
  'pts',
  'points',
  'totalshots',
  'shot',
  'shots',
  'shotsongoal',
  'sog',
  'shotsontarget',
  'fgo',
  'fieldgoalpct',
  'fg%',
  'threepointpct',
  '3p%',
  'threepointfieldgoalpct',
  'freethrowpct',
  'ft%',
  'rebounds',
  'reb',
  'assists',
  'ast',
  'blocks',
  'blk',
  'steals',
  'stl',
  'saves',
  'sav',
  'hits',
  'woncorners',
  'cw',
  'foulscommitted',
  'fc',
];

const LEADER_PRIORITY = ['pts', 'points', 'g', 'goals', 'reb', 'rebounds', 'ast', 'assists', 'rat', 'rating', 'saves', 'sv'];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickStats(stats: TeamStat[]): TeamStat[] {
  const order = new Map<string, number>();
  STAT_PRIORITY.forEach((k, i) => order.set(k, i));

  const sorted = [...stats]
    .map((s) => ({ ...s, key: normalizeKey(s.abbreviation) }))
    .sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));

  return sorted.slice(0, 5);
}

function getCommonStats(away: TeamStat[], home: TeamStat[]): TeamStat[] {
  const awayKeys = new Set(away.map((s) => normalizeKey(s.abbreviation)));
  const homeKeys = new Set(home.map((s) => normalizeKey(s.abbreviation)));
  const common = [...awayKeys].filter((k) => homeKeys.has(k));
  const order = new Map<string, number>();
  STAT_PRIORITY.forEach((k, i) => order.set(k, i));
  return common
    .sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999))
    .map((key) => {
      const a = away.find((s) => normalizeKey(s.abbreviation) === key)!;
      return a;
    });
}

function pickLeaders(leaders: TeamLeader[]): TeamLeader[] {
  const order = new Map<string, number>();
  LEADER_PRIORITY.forEach((k, i) => order.set(k, i));
  return [...leaders]
    .sort((a, b) => (order.get(normalizeKey(a.category)) ?? 999) - (order.get(normalizeKey(b.category)) ?? 999))
    .slice(0, 3);
}

function renderDetailIcon(type: MatchDetail['type']) {
  if (type === 'goal') {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
        ⚽
      </span>
    );
  }
  if (type === 'redCard') {
    return <span className="w-2.5 h-3.5 rounded-sm bg-red-500 inline-block" />;
  }
  if (type === 'yellowCard') {
    return <span className="w-2.5 h-3.5 rounded-sm bg-amber-400 inline-block" />;
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />;
}

export default function MatchFacts({ match }: MatchFactsProps) {
  const awayStats = pickStats(match.away.stats);
  const homeStats = pickStats(match.home.stats);
  const commonStats = getCommonStats(awayStats, homeStats);

  const awayLeaders = pickLeaders(match.away.leaders);
  const homeLeaders = pickLeaders(match.home.leaders);
  const hasLeaders = awayLeaders.length > 0 || homeLeaders.length > 0;

  const details = match.details
    .filter((d) => d.type !== 'other')
    .slice(0, 8);

  if (commonStats.length === 0 && !hasLeaders && details.length === 0) {
    return null;
  }

  return (
    <div className="match-facts mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {commonStats.length > 0 && (
        <div className="grid gap-y-1.5" style={{ gridTemplateColumns: '1fr auto auto' }}>
          <div />
          <span className="text-[10px] font-medium text-center text-white/40 uppercase tracking-wider px-1">
            {match.away.abbreviation}
          </span>
          <span className="text-[10px] font-medium text-center text-white/40 uppercase tracking-wider px-1">
            {match.home.abbreviation}
          </span>
          {commonStats.map((stat) => {
            const a = match.away.stats.find((s) => normalizeKey(s.abbreviation) === normalizeKey(stat.abbreviation));
            const h = match.home.stats.find((s) => normalizeKey(s.abbreviation) === normalizeKey(stat.abbreviation));
            return (
              <React.Fragment key={stat.abbreviation}>
                <span className="text-[11px] text-white/50 truncate pr-2">{stat.abbreviation}</span>
                <span className="text-[11px] text-white/90 text-center tabular-nums px-1">{a?.displayValue ?? '-'}</span>
                <span className="text-[11px] text-white/90 text-center tabular-nums px-1">{h?.displayValue ?? '-'}</span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {hasLeaders && (
        <div className="grid grid-cols-2 gap-3">
          <LeaderColumn team={match.away.abbreviation} leaders={awayLeaders} />
          <LeaderColumn team={match.home.abbreviation} leaders={homeLeaders} />
        </div>
      )}

      {details.length > 0 && (
        <div className="space-y-1">
          {details.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {renderDetailIcon(d.type)}
              <span className="text-[10px] text-white/40 w-8">{d.clock}</span>
              <span className="text-white/70 truncate flex-1" title={d.athleteName}>
                {d.athleteName}
              </span>
              {d.displayValue && d.type === 'goal' && (
                <span className="text-[10px] text-white/50">{d.displayValue}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderColumn({ team, leaders }: { team: string; leaders: TeamLeader[] }) {
  if (leaders.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">{team}</div>
      <div className="space-y-1">
        {leaders.map((l, i) => (
          <div key={i} className="flex justify-between gap-2 text-xs">
            <span className="text-white/60 truncate" title={l.athleteName}>
              {l.athleteName}
            </span>
            <span className="text-white/80 whitespace-nowrap">{l.displayValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

