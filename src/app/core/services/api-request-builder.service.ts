import { Injectable, inject } from '@angular/core';
import { DeviceInfoService } from './device-info.service';
import { ApiRequest, ApiRequestHeader } from '../../models/api-envelope.model';

@Injectable({
  providedIn: 'root',
})
export class ApiRequestBuilderService {
  private deviceInfoService = inject(DeviceInfoService);

  /**
   * Wraps a payload inside the standard SSPL Bank ApiRequest envelope.
   */
  buildRequest<TBody = Record<string, unknown>>(body: TBody = {} as TBody): ApiRequest<TBody> {
    const header: ApiRequestHeader = {
      requestNo: this.deviceInfoService.generateRequestNo(),
      deviceInfo: this.deviceInfoService.getDeviceInfo(),
    };

    return {
      header,
      body,
    };
  }
}
