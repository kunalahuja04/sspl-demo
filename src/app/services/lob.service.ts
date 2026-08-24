import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import {
  LobListRequest,
  LobListRequestBody,
  LobListResponse,
  LobItem,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class LobService {
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);

  /**
   * Fetches the list of Lines of Business supported by a given bank.
   * (/TestBedGateway/API/banking/lob/list)
   */
  fetchLobsForBank(bankId: string): Observable<LobItem[]> {
    const body: LobListRequestBody = { lobRequest: { bankId, bankCode: bankId } };
    const request: LobListRequest = this.requestBuilder.buildRequest(body);

    return this.http.post<LobListResponse>(API_ENDPOINTS.BANKING.LOB_LIST, request).pipe(
      map((response) => response.body?.lobListResponse?.lobs ?? []),
    );
  }
}

