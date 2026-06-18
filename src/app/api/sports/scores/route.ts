import { NextRequest, NextResponse } from 'next/server';
import { SPORTS_LEAGUES, normalizeEspnEvent, type SportEvent } from '@/lib/sports';
import { sportsCache } from '@/lib/cache';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaguesParam = searchParams.get('leagues') || '';
    const requestedSlugs = leaguesParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const leagues = requestedSlugs
      .map((slug) => SPORTS_LEAGUES.find((l) => l.slug === slug))
      .filter((l): l is (typeof SPORTS_LEAGUES)[number] => Boolean(l));

    if (leagues.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const cacheKey = `sports:${leagues
      .map((l) => l.slug)
      .sort()
      .join(',')}`;
    const cached = sportsCache.get<SportEvent[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ events: cached });
    }

    const events: SportEvent[] = [];

    await Promise.all(
      leagues.map(async (league) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`${ESPN_BASE}/${league.sportPath}/scoreboard?limit=25`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) {
            console.warn(`ESPN ${league.slug} returned ${res.status}`);
            return;
          }

          const data = (await res.json()) as { events?: unknown[] };
          const rawEvents = (data.events || []).slice(0, 20);

          for (const raw of rawEvents) {
            const normalized = normalizeEspnEvent(raw, league);
            if (normalized) {
              events.push(normalized);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch ESPN scores for ${league.slug}:`, err);
        }
      })
    );

    sportsCache.set(cacheKey, events, 30);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Sports scores API error:', error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
