"use client";

import CoreWatchLogo from "../common/CoreWatchLogo";
import React, { useState, useCallback, useEffect, useRef, ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils"; // standard clsx/tailwind-merge helper
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  UserCircle,
  KeyRound,
  Fingerprint,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavChild[];
  activePrefix?: string;
  roles?: string[];
}

export interface SidebarProps {
  items: NavItem[];
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
  logoIcon?: ComponentType<{ className?: string }>;
  logoTitle?: string;
  logoSubtitle?: string;
  profileHref: string;
  changePasswordHref: string;
  twoFactorHref: string;
  showAccountLinks?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
  onLogout: () => void;
}

// Helper to determine initials for avatar bubble
function getInitials(firstName?: string, lastName?: string, email?: string, role?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

// Scoring logic for finding exact matching active route
function getRouteScore(
  targetHref: string,
  currentPathname: string,
  searchParams: URLSearchParams,
  activePrefix?: string
): number {
  if (activePrefix && (currentPathname === activePrefix || currentPathname.startsWith(activePrefix + "/"))) {
    return 100;
  }

  const queryIdx = targetHref.indexOf("?");
  const targetPath = queryIdx !== -1 ? targetHref.slice(0, queryIdx) : targetHref;

  if (currentPathname !== targetPath) {
    return -1;
  }

  if (queryIdx === -1) {
    return 0;
  }

  const targetQuery = targetHref.slice(queryIdx + 1);
  const targetParams = new URLSearchParams(targetQuery);
  let matchedCount = 0;

  for (const [key, val] of targetParams.entries()) {
    if (searchParams.get(key) !== val) {
      return -1;
    }
    matchedCount++;
  }

  return matchedCount;
}

// Custom Accordion panel with smooth transition
const AccordionPanel = React.memo(function AccordionPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight);
  }, [children]);

  return (
    <div
      style={{
        height: open ? height : 0,
        overflow: "hidden",
        transition: "height 220ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
});

// Single Row Component
interface NavItemRowProps {
  item: NavItem;
  collapsed: boolean;
  onClose?: () => void;
  isOpen: boolean;
  onToggle: (label: string) => void;
  isActive: boolean;
  activeChildHref: string | null;
}

const NavItemRow = React.memo(function NavItemRow({
  item,
  collapsed,
  onClose,
  isOpen,
  onToggle,
  isActive,
  activeChildHref,
}: NavItemRowProps) {
  const Icon = item.icon;
  const anyChildActive = !!activeChildHref;
  const hasChildren = !!item.children?.length;

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onToggle(item.label);
    },
    [onToggle, item.label]
  );

  if (hasChildren) {
    return (
      <div>
        <Link
          href={item.href}
          onClick={collapsed ? undefined : handleToggleClick}
          aria-expanded={isOpen}
          title={collapsed ? item.label : undefined}
          className={cn(
            "relative w-full flex items-center gap-3 px-4 py-[9px] text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground/40 dark:ring-white/40 rounded-none",
            anyChildActive || isOpen
              ? "text-sidebar-foreground dark:text-white opacity-100"
              : "text-sidebar-foreground/75 dark:text-sidebar-foreground dark:text-white/75 hover:opacity-100 hover:text-sidebar-foreground dark:text-white"
          )}
        >
          {anyChildActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--primary)]" />
          )}
          <Icon
            className={cn(
              "h-[17px] w-[17px] flex-shrink-0",
              anyChildActive ? "text-[var(--primary)]" : "text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70"
            )}
          />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-sidebar-foreground/50 dark:text-sidebar-foreground dark:text-white/50 transition-transform duration-200 flex-shrink-0",
                  isOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </>
          )}
          {collapsed && anyChildActive && (
            <span className="absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          )}
        </Link>

        {!collapsed && (
          <AccordionPanel open={isOpen}>
            <div className="pb-1">
              {item.children!.map((child) => {
                const childActive = child.href === activeChildHref;
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.label}
                    href={child.href}
                    onClick={onClose}
                    aria-current={childActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 pl-[42px] pr-4 py-[7px] text-[12.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground/40 dark:ring-white/40",
                      childActive
                        ? "text-[var(--primary)] font-semibold"
                        : "text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70 font-normal hover:text-sidebar-foreground dark:text-white"
                    )}
                  >
                    {ChildIcon ? (
                      <ChildIcon
                        className={cn(
                          "h-[14px] w-[14px] flex-shrink-0",
                          childActive ? "text-[var(--primary)]" : "text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70"
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors",
                          childActive ? "bg-[var(--primary)]" : "bg-sidebar-foreground/40 dark:bg-white/40"
                        )}
                      />
                    )}
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </AccordionPanel>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-4 py-[9px] text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground/40 dark:ring-white/40",
        isActive
          ? "text-sidebar-foreground dark:text-white opacity-100 bg-sidebar-foreground/10 dark:bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-sidebar-foreground/75 dark:text-sidebar-foreground dark:text-white/75 opacity-75 hover:opacity-100 hover:text-sidebar-foreground dark:text-white hover:bg-sidebar-foreground/5 dark:bg-white/5"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--primary)]" />
      )}
      <Icon
        className={cn(
          "h-[17px] w-[17px] flex-shrink-0",
          isActive ? "text-[var(--primary)]" : "text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70"
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-sidebar-foreground dark:text-white leading-none">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--primary)]" />
      )}
    </Link>
  );
});

// Sidebar Core
const Sidebar = React.memo(function Sidebar({
  items,
  user,
  logoIcon: LogoIcon,
  logoTitle,
  logoSubtitle,
  profileHref,
  changePasswordHref,
  twoFactorHref,
  showAccountLinks = true,
  mobileOpen = false,
  onClose,
  collapsed = false,
  onCollapse,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const activeHref = React.useMemo(() => {
    let bestHref: string | null = null;
    let bestScore = -1;

    items.forEach((item) => {
      const mainScore = getRouteScore(item.href, pathname, searchParams, item.activePrefix);
      if (mainScore > bestScore) {
        bestScore = mainScore;
        bestHref = item.href;
      }
      if (item.children) {
        item.children.forEach((child) => {
          const childScore = getRouteScore(child.href, pathname, searchParams);
          if (childScore > bestScore) {
            bestScore = childScore;
            bestHref = child.href;
          }
        });
      }
    });

    return bestHref;
  }, [items, pathname, searchParams]);

  const visibleItems = React.useMemo(() => {
    const userRole = user?.role;
    return items.filter((item) => {
      if (item.roles && (!userRole || !item.roles.includes(userRole))) {
        return false;
      }
      return true;
    });
  }, [items, user?.role]);

  useEffect(() => {
    if (activeHref) {
      const activeParentItem = items.find((item) =>
        item.children?.some((c) => c.href === activeHref)
      );
      if (activeParentItem) {
        setExpandedMenu(activeParentItem.label);
      }
    }
  }, [activeHref, items]);

  const initials = getInitials(user?.firstName, user?.lastName, user?.email, user?.role);
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] ?? "User";

  const handleToggle = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  return (
    <aside
      className={cn(
        "fixed lg:static left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-out lg:translate-x-0 lg:z-20 font-sans antialiased",
        "bg-[var(--sidebar-background)] dark:bg-gradient-to-b dark:from-[#0A0B0E] dark:via-[#050608] dark:to-black border-r border-[var(--sidebar-border)] shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.8)]",
        collapsed ? "w-[68px]" : "w-[260px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between border-b border-sidebar-foreground/15 dark:border-white/15 px-4 py-[14px] flex-shrink-0">
        {collapsed ? (
          <div 
            className="mx-auto flex items-center justify-center cursor-pointer transition-transform hover:scale-105" 
            onClick={() => onCollapse?.(!collapsed)} 
            title="CoreWatch"
          >
            <CoreWatchLogo className="h-8 w-auto" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 select-none">
              <CoreWatchLogo className="h-9 w-auto shrink-0" />
              <div className="flex flex-col">
                <span className="text-[17px] font-black tracking-tight text-sidebar-foreground dark:text-white leading-tight">
                  CoreWatch
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--primary)] leading-none mt-0.5">
                  {logoSubtitle || "Control Center"}
                </span>
              </div>
            </div>
            <button
              onClick={() => onCollapse?.(!collapsed)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 dark:text-sidebar-foreground dark:text-white/60 transition-colors hover:bg-sidebar-foreground/10 dark:bg-white/10 hover:text-sidebar-foreground dark:text-white cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* User Info */}
      <div className={cn("flex-shrink-0 border-b border-sidebar-foreground/15 dark:border-white/15 px-4 py-3", collapsed && "px-2")}>
        {collapsed ? (
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-sidebar-foreground dark:text-white shadow-lg">
                {initials}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-sidebar-foreground dark:text-white shadow-lg">
                {initials}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-sidebar-foreground dark:text-white leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60 dark:text-sidebar-foreground dark:text-white/60 leading-tight mt-0.5">
                {user?.email}
              </p>
            </div>
            <Link href={profileHref} className="flex-shrink-0 text-sidebar-foreground/60 dark:text-sidebar-foreground dark:text-white/60 hover:text-sidebar-foreground dark:text-white transition-colors">
              <UserCircle className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Links Menu Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const isActive = item.href === activeHref;
          const activeChildHref = item.children?.find((c) => c.href === activeHref)?.href || null;

          return (
            <NavItemRow
              key={item.href + item.label}
              item={item}
              collapsed={collapsed}
              onClose={onClose}
              isOpen={expandedMenu === item.label}
              onToggle={handleToggle}
              isActive={isActive}
              activeChildHref={activeChildHref}
            />
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="flex-shrink-0 border-t border-sidebar-foreground/15 dark:border-white/15">
        {!collapsed && showAccountLinks && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-foreground/10 dark:border-white/10">
            <Link href={profileHref} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70 hover:text-sidebar-foreground dark:text-white hover:bg-sidebar-foreground/10 dark:bg-white/10">
              <UserCircle className="h-3.5 w-3.5" />
              Profile
            </Link>
            <Link href={changePasswordHref} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70 hover:text-sidebar-foreground dark:text-white hover:bg-sidebar-foreground/10 dark:bg-white/10">
              <KeyRound className="h-3.5 w-3.5" />
              Pass
            </Link>
            <Link href={twoFactorHref} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-sidebar-foreground/70 dark:text-sidebar-foreground dark:text-white/70 hover:text-sidebar-foreground dark:text-white hover:bg-sidebar-foreground/10 dark:bg-white/10">
              <Fingerprint className="h-3.5 w-3.5" />
              2FA
            </Link>
          </div>
        )}

        <button
          onClick={onLogout}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-[10px] text-[13px] font-medium text-[var(--primary)] transition-all duration-150 hover:text-sidebar-foreground dark:text-white hover:bg-[var(--primary)]/20",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-[17px] w-[17px]" />
          {!collapsed && <span>Logout</span>}
        </button>

        {collapsed && (
          <button
            onClick={() => onCollapse?.(false)}
            className="flex w-full items-center justify-center py-2 text-sidebar-foreground/50 dark:text-sidebar-foreground dark:text-white/50 hover:text-sidebar-foreground dark:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;