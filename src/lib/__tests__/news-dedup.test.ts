import { describe, it, expect } from 'vitest';
import { extractStorySignature, calculateStorySimilarity, isSimilarStory } from '../news';

describe('extractStorySignature', () => {
  it('should extract version numbers', () => {
    const sig = extractStorySignature('Anthropic Releases Opus 4.8 with Dynamic Workflows Tool');
    expect(sig).toContain('n:4.8');
  });

  it('should extract plain numbers', () => {
    const sig = extractStorySignature('iPhone 16 Released');
    expect(sig).toContain('n:16');
  });

  it('should extract significant stemmed words', () => {
    const sig = extractStorySignature('Dynamic Workflows Tool for Developers');
    expect(sig).toContain('w:dynamic');
    expect(sig).toContain('w:workflow');
    expect(sig).toContain('w:developer');  // developers → developer (plural stripped)
  });

  it('should stem common suffixes', () => {
    const sig = extractStorySignature('Google Successfully Completes Orbital Test');
    expect(sig).toContain('w:success');   // successfully → success
    expect(sig).toContain('w:complet');   // completes → complet
    expect(sig).toContain('w:orbit');     // orbital → orbit
  });

  it('should filter out stop words', () => {
    const sig = extractStorySignature('The New Releases and Updates for You');
    expect(sig).not.toContain('w:the');
    expect(sig).not.toContain('w:and');
    expect(sig).not.toContain('w:for');
    expect(sig).not.toContain('w:you');
  });

  it('should not include common news verbs', () => {
    const sig = extractStorySignature('Apple Releases New iPhone with Updated Features');
    expect(sig).not.toContain('w:releas');
    expect(sig).not.toContain('w:updat');
    expect(sig).toContain('w:apple');
    expect(sig).toContain('w:iphone');
    expect(sig).toContain('w:featur');
  });

  it('should not over-stem words ending in ss', () => {
    const sig = extractStorySignature('NVIDIA Stock Drops After Earnings Miss');
    expect(sig).toContain('w:miss');   // should stay "miss", not "mis"
  });

  it('should not duplicate numbers as words', () => {
    const sig = extractStorySignature('Chrome 120 Adds Dark Mode');
    const n120 = sig.filter(s => s === 'n:120').length;
    const w120 = sig.filter(s => s === 'w:120').length;
    expect(n120).toBe(1);
    expect(w120).toBe(0); // 120 should NOT also appear as a word
  });

  it('should deduplicate repeated tokens', () => {
    const sig = extractStorySignature('Apple Apple iPhone iPhone');
    const appleCount = sig.filter(s => s === 'w:apple').length;
    expect(appleCount).toBe(1);
  });

  it('should return sorted array', () => {
    const sig = extractStorySignature('Zebra Apple');
    expect(sig[0]).toBe('w:apple');
    expect(sig[sig.length - 1]).toBe('w:zebra');
  });
});

describe('calculateStorySimilarity', () => {
  it('should return 1.0 for identical signatures', () => {
    const sig = extractStorySignature('Anthropic Releases Claude Opus 4.8');
    expect(calculateStorySimilarity(sig, sig)).toBe(1);
  });

  it('should return 0.0 for completely different signatures', () => {
    const sig1 = extractStorySignature('Bitcoin Hits Record High');
    const sig2 = extractStorySignature('Mars Rover Discovers Water');
    expect(calculateStorySimilarity(sig1, sig2)).toBe(0);
  });
});

describe('isSimilarStory — real-world news dedup cases', () => {
  // The exact case from the user's screenshot
  it('should flag three Anthropic Opus 4.8 articles as duplicates', () => {
    const t1 = 'Anthropic Releases Opus 4.8 with Dynamic Workflows Tool';
    const t2 = 'Anthropic Releases More Honest Claude Opus 4.8 Model';
    const t3 = 'Anthropic Releases Claude Opus 4.8 Model Update';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);
    const sig3 = extractStorySignature(t3);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(true);
    expect(isSimilarStory(t2, sig2, t3, sig3)).toBe(true);
    expect(isSimilarStory(t1, sig1, t3, sig3)).toBe(true);
  });

  it('should flag OpenAI GPT-5 articles from different sources', () => {
    const t1 = 'OpenAI Launches GPT-5 with Multimodal Support';
    const t2 = 'OpenAI Announces GPT-5, Available Today';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(true);
  });

  it('should NOT flag different Apple product releases', () => {
    const t1 = 'Apple Releases iPhone 16 with New Features';
    const t2 = 'Apple Releases iPad Pro 2024';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });

  it('should NOT flag unrelated tech news about the same company', () => {
    const t1 = 'NVIDIA Stock Drops 5% After Earnings Miss';
    const t2 = 'NVIDIA Stock Rises 3% on AI Demand Surge';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });

  it('should NOT flag different Bitcoin price movements', () => {
    const t1 = 'Bitcoin Hits $100K for the First Time';
    const t2 = 'Bitcoin Drops to $90K After Market Correction';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });

  it('should flag same Chrome version articles despite different angles', () => {
    const t1 = 'Google Chrome 120 Released with New Features';
    const t2 = 'Google Chrome 120 Beta Adds Dark Mode Support';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(true);
  });

  it('should flag iOS articles about same version as duplicates (borderline but acceptable)', () => {
    // Both mention Apple, iOS, 18 — within a short time window they're likely
    // covering the same announcement cycle. Acceptable to dedupe.
    const t1 = 'Apple Releases iOS 18 with New Features';
    const t2 = 'Apple Seeds iOS 18 Beta to Developers';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(true);
  });

  it('should handle short titles gracefully', () => {
    const t1 = 'Bitcoin Hits $100K';
    const t2 = 'Bitcoin Drops to $90K';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });

  it('should detect duplicate even with very different wording', () => {
    const t1 = 'SpaceX Starship Successfully Completes Orbital Test Flight';
    const t2 = 'Starship Reaches Orbit in Historic SpaceX Mission';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(true);
  });

  it('should NOT flag opposite Fed rate actions as duplicates', () => {
    const t1 = 'Fed Raises Interest Rates by 0.25%';
    const t2 = 'Fed Cuts Interest Rates by 0.25%';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    // High similarity but contradictory actions — should NOT be flagged
    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });

  it('should NOT flag NVIDIA stock drop vs rise as duplicates', () => {
    const t1 = 'NVIDIA Stock Drops After Earnings Miss';
    const t2 = 'NVIDIA Stock Surges on AI Demand';

    const sig1 = extractStorySignature(t1);
    const sig2 = extractStorySignature(t2);

    expect(isSimilarStory(t1, sig1, t2, sig2)).toBe(false);
  });
});
