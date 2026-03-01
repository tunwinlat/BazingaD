import { NextResponse } from 'next/server';
import { themes } from '@/lib/themes';

export async function GET() {
  try {
    // Return themes without internal color values (just id and name for selector)
    const themeList = themes.map(theme => ({
      id: theme.id,
      name: theme.name,
    }));
    
    return NextResponse.json(themeList);
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}
