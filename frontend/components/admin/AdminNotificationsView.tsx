'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  Video,
  VideoOff,
  CreditCard,
  CheckCircle2,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react';

interface AdminNotificationsViewProps {
  dbAlerts: any[];
  setDbAlerts?: React.Dispatch<React.SetStateAction<any[]>>;
  customers?: any[];
  cameras?: any[];
  dbInvoices?: any[];
  onNavigateTab?: (tab: string) => void;
  token?: string;
}

export default function AdminNotificationsView({
  dbAlerts = [],
  setDbAlerts,
  customers = [],
  cameras = [],
  dbInvoices = [],
  onNavigateTab,
  token
}: AdminNotificationsViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'security' | 'subscribers' | 'cameras' | 'billing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  // Format real relative time
  const formatTimeAgo = (dateStr?: string | Date) => {
    if (!dateStr) return 'Just now';
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Compile unified list of real system notifications from DB collections
  const notificationsList = useMemo(() => {
    const list: any[] = [];

    // 1. Security Alert Events from MongoDB
    dbAlerts.forEach((alert) => {
      const isCritical = alert.severity === 'critical' || alert.type?.toLowerCase().includes('intrusion') || alert.type?.toLowerCase().includes('fire');
      const isWarning = alert.severity === 'warning';
      list.push({
        id: `alert-${alert._id || alert.id || Math.random()}`,
        rawId: alert._id || alert.id,
        source: 'security',
        type: isCritical ? 'critical' : isWarning ? 'warning' : 'info',
        title: alert.type || alert.category || 'Security Alert',
        message: alert.message || `Incident logged on camera: ${alert.cameraKey || alert.camera || 'Active Feed'}`,
        cameraKey: alert.cameraKey || alert.camera,
        snapshotUrl: alert.snapshotUrl || alert.imageUrl,
        timestamp: alert.createdAt || alert.timestamp,
        isRead: Boolean(alert.isRead || alert.acknowledged),
        badgeText: alert.severity ? alert.severity.toUpperCase() : 'ALERT',
        actionLabel: 'View Camera',
        targetTab: 'live_camera',
      });
    });

    // 2. Client / Subscriber Activity from MongoDB
    customers.forEach((cust) => {
      const isPending = cust.status === 'Pending';
      list.push({
        id: `cust-${cust._id || cust.id || Math.random()}`,
        source: 'subscribers',
        type: isPending ? 'warning' : 'success',
        title: isPending ? 'New Subscriber Pending Approval' : 'Active Client Subscription',
        message: `Company: "${cust.company || cust.name || 'Enterprise'}" with ${cust.cameras || 5} cameras quota on ${cust.plan || 'Enterprise Pro'}.`,
        timestamp: cust.createdAt || cust.updatedAt,
        isRead: !isPending,
        badgeText: cust.status ? cust.status.toUpperCase() : 'CLIENT',
        actionLabel: 'Inspect Client',
        targetTab: 'all_customers',
      });
    });

    // 3. Camera Streams Status from MongoDB / Local
    cameras.forEach((cam) => {
      const isOffline = cam.status === 'offline' || cam.status === 'Inactive' || cam.isOnline === false;
      if (isOffline) {
        list.push({
          id: `cam-${cam.id || cam.key || Math.random()}`,
          source: 'cameras',
          type: 'warning',
          title: 'Camera Stream Offline / Signal Lost',
          message: `Camera "${cam.name || cam.key}" is currently unreachable or disconnected.`,
          timestamp: cam.updatedAt || cam.lastSeen,
          isRead: false,
          badgeText: 'OFFLINE',
          actionLabel: 'Camera Hub',
          targetTab: 'all_cameras',
        });
      }
    });

    // 4. Invoices and Billing Activity from MongoDB
    dbInvoices.forEach((inv) => {
      const isPaid = inv.status === 'Paid';
      list.push({
        id: `inv-${inv._id || inv.id || Math.random()}`,
        source: 'billing',
        type: isPaid ? 'success' : 'info',
        title: isPaid ? 'Subscription Payment Received' : 'Billing Invoice Generated',
        message: `Invoice #${inv.invoiceNumber || inv.id} for ${inv.company || 'Subscriber'} (₹${inv.amount || 0})`,
        timestamp: inv.createdAt || inv.date,
        isRead: true,
        badgeText: inv.status ? inv.status.toUpperCase() : 'INVOICE',
        actionLabel: 'View Billing',
        targetTab: 'billing_invoices',
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => {
      const tA = new Date(a.timestamp || 0).getTime();
      const tB = new Date(b.timestamp || 0).getTime();
      return tB - tA;
    });
  }, [dbAlerts, customers, cameras, dbInvoices]);

  // Statistics
  const totalCount = notificationsList.length;
  const criticalCount = notificationsList.filter((n) => n.type === 'critical').length;
  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((item) => {
      // Category filter
      if (selectedFilter !== 'all' && item.source !== selectedFilter) return false;
      // Unread only toggle
      if (onlyUnread && item.isRead) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchMsg = item.message?.toLowerCase().includes(q);
        const matchBadge = item.badgeText?.toLowerCase().includes(q);
        return matchTitle || matchMsg || matchBadge;
      }
      return true;
    });
  }, [notificationsList, selectedFilter, onlyUnread, searchQuery]);

  // Mark single event as read
  const handleMarkSingleRead = async (item: any) => {
    if (item.source === 'security' && item.rawId) {
      const userToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      try {
        await fetch(`${API_URL}/api/events/${item.rawId}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${userToken}` },
        });
      } catch {}
    }

    if (setDbAlerts) {
      setDbAlerts((prev) =>
        prev.map((a) => (a._id === item.rawId || a.id === item.rawId ? { ...a, isRead: true, acknowledged: true } : a))
      );
    }
  };

  // Mark all security events as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    const userToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      await fetch(`${API_URL}/api/events/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch {}

    if (setDbAlerts) {
      setDbAlerts((prev) => prev.map((a) => ({ ...a, isRead: true, acknowledged: true })));
    }
    setIsMarkingAll(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="border border-border bg-gradient-to-r from-card via-card to-brand-navy/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-950/30">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground tracking-tight">System & Client Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 tracking-wider uppercase font-mono animate-pulse">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time incident dispatches, security policy breaches, customer registrations, and hardware stream health.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || unreadCount === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real System Counts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
          }`}
        >
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Total Ingested</span>
          <span className="text-2xl font-black text-foreground mt-1 block">{totalCount}</span>
          <span className="text-[10px] text-muted-foreground">Aggregated events</span>
        </div>

        <div 
          onClick={() => { setSelectedFilter('security'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'security' ? 'border-red-500 bg-red-500/10' : 'border-border bg-card hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Critical Risks</span>
            {criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          </div>
          <span className="text-2xl font-black text-red-400 mt-1 block">{criticalCount}</span>
          <span className="text-[10px] text-muted-foreground">High priority events</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('subscribers')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'subscribers' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
          }`}
        >
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Subscribers</span>
          <span className="text-2xl font-black text-foreground mt-1 block">{customers.length}</span>
          <span className="text-[10px] text-muted-foreground">Registered accounts</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('cameras')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
            selectedFilter === 'cameras' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card hover:border-emerald-500/40'
          }`}
        >
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Active Feeds</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{cameras.length}</span>
          <span className="text-[10px] text-muted-foreground">RTSP streams online</span>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-border bg-card p-3 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts, client names, camera keys..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({totalCount})
          </button>

          <button
            onClick={() => setSelectedFilter('security')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'security'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Security ({dbAlerts.length})
          </button>

          <button
            onClick={() => setSelectedFilter('subscribers')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'subscribers'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Clients ({customers.length})
          </button>

          <button
            onClick={() => setSelectedFilter('cameras')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'cameras'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Cameras ({cameras.length})
          </button>

          <button
            onClick={() => setSelectedFilter('billing')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'billing'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Billing ({dbInvoices.length})
          </button>

          <button
            onClick={() => setOnlyUnread(!onlyUnread)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap border transition-colors cursor-pointer ${
              onlyUnread
                ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* 4. Real Notifications List Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="border border-border bg-card rounded-2xl p-12 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Notifications Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || onlyUnread || selectedFilter !== 'all'
                ? 'Try resetting your filter or clearing the search term to view all system events.'
                : 'All clear. Zero unacknowledged system events logged in database.'}
            </p>
            {(searchQuery || onlyUnread || selectedFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedFilter('all');
                  setSearchQuery('');
                  setOnlyUnread(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isCritical = item.type === 'critical';
            const isWarning = item.type === 'warning';
            const isSuccess = item.type === 'success';

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  !item.isRead
                    ? 'border-primary/40 bg-card/95 shadow-md shadow-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card/60 hover:bg-card'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isCritical
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : isSuccess
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-primary/15 text-primary border border-primary/30'
                    }`}
                  >
                    {isCritical ? (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : item.source === 'subscribers' ? (
                      <UserPlus className="w-5 h-5" />
                    ) : item.source === 'cameras' ? (
                      <Video className="w-5 h-5" />
                    ) : item.source === 'billing' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                          isCritical
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-primary/20 text-primary border border-primary/30'
                        }`}
                      >
                        {item.badgeText}
                      </span>

                      <h4 className="text-sm font-bold text-foreground tracking-tight truncate">
                        {item.title}
                      </h4>

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-background" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      {item.message}
                    </p>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimeAgo(item.timestamp)}</span>
                      </span>

                      {item.cameraKey && (
                        <span className="px-2 py-0.5 rounded bg-muted text-foreground text-[10px] font-semibold font-mono">
                          Camera: {item.cameraKey}
                        </span>
                      )}

                      {item.snapshotUrl && (
                        <a
                          href={item.snapshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Snapshot</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkSingleRead(item)}
                      title="Mark as read"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}

                  {item.targetTab && onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab(item.targetTab)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

