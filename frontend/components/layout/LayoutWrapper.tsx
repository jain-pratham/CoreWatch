"use client";

import React from "react";
import { LayoutProvider, useLayout } from "./LayoutContext";
import Sidebar, { NavItem } from "./Sidebar";
import { LayoutDashboard, Users, Settings } from "lucide-react";

// 1. Define your sidebar links data!
const NAVIGATION_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    children: [
      { label: "All Customers", href: "/customers" },
      { label: "Add Customer", href: "/customers/create" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useLayout();

  // Replace this with your project's actual Auth context/hook
  const dummyUser = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "admin",
  };

  const handleLogout = () => {
    console.log("User logged out");
  };

  const sidebarWidth = collapsed ? "68px" : "260px";

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sidebar Component */}
      <Sidebar
        items={NAVIGATION_ITEMS}
        user={dummyUser}
        logoIcon={LayoutDashboard}
        logoTitle="MY BRAND"
        logoSubtitle="Control Center"
        profileHref="/profile"
        changePasswordHref="/settings/password"
        twoFactorHref="/settings/security"
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        onLogout={handleLogout}
      />

      {/* Background Overlay for mobile view */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Main Layout Area */}
      <main
        className="pt-4 transition-all duration-300 ml-0 lg:ml-[var(--sidebar-width)]"
        style={{ "--sidebar-width": sidebarWidth } as React.CSSProperties}
      >
        {/* Mobile Header Menu Button */}
        <div className="flex items-center gap-3 p-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-white/25 bg-white/10 text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LayoutProvider>
  );
}
