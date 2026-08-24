import { Injectable } from '@angular/core';
import { DeviceInfo } from '../../models/api-envelope.model';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {
  private cachedDeviceInfo: DeviceInfo | null = null;
  private reqCounter = 120;

  /**
   * Retrieves client device metadata.
   * Auto-detects OS, OS version, and maintains a persistent deviceId.
   */
  getDeviceInfo(): DeviceInfo {
    if (this.cachedDeviceInfo) {
      return this.cachedDeviceInfo;
    }

    const deviceId = this.getOrCreateDeviceId();
    const { os, osVersion } = this.detectOperatingSystem();

    this.cachedDeviceInfo = {
      deviceId,
      os,
      osVersion,
      appVersion: '1.0.0'
    };

    return this.cachedDeviceInfo;
  }

  /**
   * Generates a sequential/timestamped request number e.g. "REQ122".
   */
  generateRequestNo(): string {
    this.reqCounter++;
    return `REQ${this.reqCounter}`;
  }

  /**
   * Generates a realistic transaction ID e.g. "1785927966931ZSOFXmXLq2I945728".
   */
  generateTxnId(): string {
    const timestamp = Date.now().toString();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < 16; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${timestamp}${randomStr}`;
  }

  private getOrCreateDeviceId(): string {
    const storageKey = 'sspl_device_id';
    try {
      let id = localStorage.getItem(storageKey);
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(storageKey, id);
      }
      return id;
    } catch {
      return 'abskc'; // fallback mock device id matching sample
    }
  }

  private detectOperatingSystem(): { os: string; osVersion: string } {
    if (typeof navigator === 'undefined') {
      return { os: 'jhbca', osVersion: '917' };
    }

    const userAgent = navigator.userAgent;

    if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X ([\d_]+)/);
      return {
        os: 'macOS',
        osVersion: match ? match[1].replace(/_/g, '.') : '14.0'
      };
    } else if (userAgent.includes('Windows NT')) {
      const match = userAgent.match(/Windows NT ([\d.]+)/);
      return {
        os: 'Windows',
        osVersion: match ? match[1] : '11.0'
      };
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android ([\d.]+)/);
      return {
        os: 'Android',
        osVersion: match ? match[1] : '14.0'
      };
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      const match = userAgent.match(/OS ([\d_]+)/);
      return {
        os: 'iOS',
        osVersion: match ? match[1].replace(/_/g, '.') : '17.0'
      };
    } else if (userAgent.includes('Linux')) {
      return { os: 'Linux', osVersion: 'x86_64' };
    }

    return { os: 'jhbca', osVersion: '917' };
  }
}
