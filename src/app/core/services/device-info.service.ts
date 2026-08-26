import { Injectable } from '@angular/core';
import { DeviceInfo } from '../../models/api-envelope.model';

@Injectable({
  providedIn: 'root',
})
export class DeviceInfoService {
  private reqCounter = 120;

  /**
   * Retrieves client device metadata strictly conforming to backend spec:
   * Only `browser` and `browserVersion`.
   */
  getDeviceInfo(): DeviceInfo {
    return {
      browser: 'Google',
      browserVersion: '12345560.150150.5115',
    };
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
}
