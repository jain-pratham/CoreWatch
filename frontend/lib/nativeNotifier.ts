// ============================================================================
// CoreWatch Native Operating System Notification Service
// Wraps the HTML5 Web Notification API with deduplication & deep link routing
// ============================================================================

export interface NativeNotificationPayload {
  id?: string;
  cameraKey: string;
  cameraName?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  message: string;
  reason?: string;
  timestamp?: string | Date;
  zoneName?: string;
}

class NativeNotificationService {
  private recentNotificationTags: Set<string> = new Set();

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return this.getPermission();
    }
  }

  public sendNotification(
    alert: NativeNotificationPayload,
    onClickCallback?: () => void
  ) {
    if (!this.isSupported()) return;
    if (Notification.permission !== 'granted') return;

    // Deduplication check: for zone monitoring alerts, debounce by camera + category + zone to avoid spamming the OS notification center
    const zoneOrMsg = alert.zoneName ? `zone_${alert.zoneName}` : (alert.message || '').slice(0, 25);
    const tag = `cw_${alert.cameraKey}_${alert.category || 'alert'}_${zoneOrMsg}`;
    if (this.recentNotificationTags.has(tag)) {
      return;
    }
    this.recentNotificationTags.add(tag);
    const debounceMs = alert.category?.includes('Zone') || alert.zoneName ? 30000 : 15000;
    setTimeout(() => {
      this.recentNotificationTags.delete(tag);
    }, debounceMs); // 30-second debounce for zone monitoring, 15s for others

    // Severity icons and title prefix
    let prefix = 'ℹ️ [SECURITY ALERT]';
    if (alert.severity === 'CRITICAL') {
      prefix = '🚨 [CRITICAL SECURITY BREACH]';
    } else if (alert.severity === 'HIGH') {
      prefix = '⚠️ [HIGH PRIORITY ALERT]';
    } else if (alert.severity === 'MEDIUM') {
      prefix = '🛡️ [OPERATIONAL WARNING]';
    }

    const camName = alert.cameraName ? `${alert.cameraName} (${alert.cameraKey})` : alert.cameraKey;
    const title = `${prefix} ${alert.category || 'Security Incident'}`;
    const timeStr = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    const zoneStr = alert.zoneName ? `[${alert.zoneName}] ` : '';
    const reasonStr = alert.reason ? `\nReason: ${alert.reason}` : '';

    const body = `${camName}: ${zoneStr}${alert.message}${reasonStr}\nTime: ${timeStr} · Click to inspect incident`;

    try {
      const notification = new Notification(title, {
        body,
        tag,
        icon: '/favicon.ico',
        requireInteraction: alert.severity === 'CRITICAL', // Critical stays on screen until dismissed or clicked
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onClickCallback) {
          onClickCallback();
        }
      };
    } catch (err) {
      console.warn("Native Notification failed to dispatch:", err);
    }
  }
}

export const nativeNotifier = new NativeNotificationService();
