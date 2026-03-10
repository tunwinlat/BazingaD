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
import InfoBar from '@/components/InfoBar';
import DashboardHeader from '@/components/DashboardHeader';

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
      orderBy: { sortOrder: 'asc' },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    
    // Transform null values to undefined to match TypeScript types
    return categories.map(category => ({
      ...category,
      blocks: category.blocks.map(block => ({
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

export default async function Home() {
  const access = await checkDashboardAccess();
  
  // Redirect to login if protected and no access
  if (access.protected && !access.hasAccess) {
    redirect('/dashboard-login');
  }
  
  const categories = await fetchCategories();
  
  return (
    <>
      <Background />
      <div className="min-h-screen px-4 py-8 md:py-10 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
          {/* Protected indicator and logout */}
          {access.protected && (
            <DashboardHeader isAdmin={access.isAdmin} />
          )}
          
          {/* Info Bar - Weather & Traffic */}
          <InfoBar />
          
          <Header categories={categories} />
          <Dashboard />
          <Footer />
        </div>
      </div>
    </>
  );
}
