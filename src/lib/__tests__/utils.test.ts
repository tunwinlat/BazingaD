import { describe, it, expect } from 'vitest';
import { sortAlphabetically } from '../utils';

describe('sortAlphabetically', () => {
  it('sorts a simple array of objects by title alphabetically', () => {
    const input = [
      { id: 1, title: 'Zebra' },
      { id: 2, title: 'Apple' },
      { id: 3, title: 'Monkey' },
    ];

    const result = sortAlphabetically(input);

    expect(result).toEqual([
      { id: 2, title: 'Apple' },
      { id: 3, title: 'Monkey' },
      { id: 1, title: 'Zebra' },
    ]);
  });

  it('sorts case-insensitively', () => {
    const input = [
      { id: 1, title: 'banana' },
      { id: 2, title: 'Apple' },
      { id: 3, title: 'cherry' },
    ];

    const result = sortAlphabetically(input);

    expect(result).toEqual([
      { id: 2, title: 'Apple' },
      { id: 1, title: 'banana' },
      { id: 3, title: 'cherry' },
    ]);
  });

  it('handles an empty array', () => {
    const input: { title: string }[] = [];
    const result = sortAlphabetically(input);
    expect(result).toEqual([]);
  });

  it('handles a single element array', () => {
    const input = [{ title: 'Only item' }];
    const result = sortAlphabetically(input);
    expect(result).toEqual([{ title: 'Only item' }]);
  });

  it('maintains order for identical titles', () => {
    const input = [
      { id: 1, title: 'Same' },
      { id: 2, title: 'Same' },
    ];

    const result = sortAlphabetically(input);

    // They are considered equal by localeCompare, the exact order of identical elements
    // depends on the JavaScript engine's sort stability. Modern browsers/Node use stable sort.
    expect(result.map(r => r.id).sort()).toEqual([1, 2]);
    expect(result[0].title).toBe('Same');
    expect(result[1].title).toBe('Same');
  });

  it('handles numbers and punctuation in titles', () => {
    const input = [
      { id: 1, title: '2 Apples' },
      { id: 2, title: '@Banana' },
      { id: 3, title: '10 Zebras' },
    ];

    const result = sortAlphabetically(input);

    // localeCompare sorts punctuation before numbers
    expect(result).toEqual([
      { id: 2, title: '@Banana' },
      { id: 3, title: '10 Zebras' },
      { id: 1, title: '2 Apples' },
    ]);
  });

  it('does not mutate the original array', () => {
    const input = [
      { id: 1, title: 'B' },
      { id: 2, title: 'A' },
    ];

    const originalInput = [...input];

    const result = sortAlphabetically(input);

    // The returned array should be sorted
    expect(result).toEqual([
      { id: 2, title: 'A' },
      { id: 1, title: 'B' },
    ]);

    // The original array should remain unchanged
    expect(input).toEqual(originalInput);
  });
});
