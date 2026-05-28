export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { settingsCache } from '@/lib/cache';
import Background from '@/components/Background';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';
import type { ViewMode } from '@/types';

async function checkDashboardAccess() {
  const CACHE_KEY = "dashboard_access_settings";
  let isProtected = settingsCache.get<{ dashboardProtected: boolean }>(CACHE_KEY)?.dashboardProtected;

  if (isProtected === undefined) {
    const settings = await prisma.settings.findFirst();
    isProtected = settings?.dashboardProtected ?? false;
    settingsCache.set(CACHE_KEY, { dashboardProtected: isProtected }, 60);
  }

  // If not protected, allow access
  if (!isProtected) {
    return { protected: false, hasAccess: true };
  }

  // Check if user has admin auth (admins always have dashboard access)
  const auth = await verifyAuth();
  if (auth) {
    return { protected: true, hasAccess: true, isAdmin: true };
  }

  // Check dashboard-specific access
  const cookieStore = await cookies();
  const dashboardToken = cookieStore.get('dashboard-token')?.value;

  if (dashboardToken) {
    const session = await prisma.session.findUnique({
      where: { token: dashboardToken },
    });

    if (session && session.expiresAt > new Date()) {
      return { protected: true, hasAccess: true, isAdmin: false };
    }
  }

  // No access - redirect to login
  return { protected: true, hasAccess: false };
}

async function fetchCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { disabled: false },
      orderBy: { sortOrder: 'asc' },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Filter out categories with zero blocks and transform nulls
    return categories
      .filter((category) => category.blocks.length > 0)
      .map((category) => ({
        ...category,
        blocks: category.blocks.map((block) => ({
          ...block,
          description: block.description ?? undefined,
          icon: block.icon ?? undefined,
          serviceUrl: block.serviceUrl ?? undefined,
          serviceType: block.serviceType ?? undefined,
          healthCheckUrl: block.healthCheckUrl ?? undefined,
          lastStatus: block.lastStatus ?? undefined,
          lastCheckedAt: block.lastCheckedAt ?? undefined,
        })),
      }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

async function fetchDefaultView(): Promise<ViewMode> {
  try {
    const settings = await prisma.settings.findFirst();
    const view = settings?.defaultView;
    if (view === 'comfortable' || view === 'compact' || view === 'dense' || view === 'list') {
      return view;
    }
    return 'comfortable';
  } catch {
    return 'comfortable';
  }
}

async function fetchOpenInNewTab(): Promise<boolean> {
  try {
    const settings = await prisma.settings.findFirst();
    return settings?.openInNewTab ?? true;
  } catch {
    return true;
  }
}

async function fetchNavTransitionEnabled(): Promise<boolean> {
  try {
    const settings = await prisma.settings.findFirst();
    return settings?.navTransitionEnabled ?? false;
  } catch {
    return false;
  }
}

async function fetchNavTransitionType(): Promise<'overlay' | 'exit'> {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings?.navTransitionType === 'overlay' || settings?.navTransitionType === 'exit') {
      return settings.navTransitionType;
    }
    return 'overlay';
  } catch {
    return 'overlay';
  }
}

async function fetchNewsEnabled(): Promise<boolean> {
  try {
    const settings = await prisma.settings.findFirst();
    return settings?.newsEnabled ?? false;
  } catch {
    return false;
  }
}

export default async function Home() {
  const access = await checkDashboardAccess();

  // Redirect to login if protected and no access
  if (access.protected && !access.hasAccess) {
    redirect('/dashboard-login');
  }

  const categories = await fetchCategories();
  const defaultView = await fetchDefaultView();
  const openInNewTab = await fetchOpenInNewTab();
  const navTransitionEnabled = await fetchNavTransitionEnabled();
  const navTransitionType = await fetchNavTransitionType();
  const newsEnabled = await fetchNewsEnabled();

  return (
    <>
      <Background />
      <div className="min-h-screen px-4 py-8 md:py-10 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
          <Header
            categories={categories}
            openInNewTab={openInNewTab}
            navTransitionEnabled={navTransitionEnabled}
            navTransitionType={navTransitionType}
          />
          <Dashboard
            isAdmin={access.isAdmin}
            isProtected={access.protected}
            defaultView={defaultView}
            openInNewTab={openInNewTab}
            navTransitionEnabled={navTransitionEnabled}
            navTransitionType={navTransitionType}
            newsEnabled={newsEnabled}
          />
          <Footer isAdmin={access.isAdmin} />
        </div>
      </div>
    </>
  );
}
