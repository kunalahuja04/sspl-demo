import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import {
  RegisterRequest,
  RegisterResponse,
  RegisterRequestBody,
  RegistrationResponseBody,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);

  /**
   * Submits a new customer registration request (/TestBedGateway/API/banking/customer/register).
   */
  register(payload: RegisterRequestBody['registerRequest']): Observable<RegistrationResponseBody['registrationResponse']> {
    const normalizedPayload = {
      ...payload,
      bankId: payload.bankId || payload.bankCode || '',
    };
    const body: RegisterRequestBody = { registerRequest: normalizedPayload };
    const request: RegisterRequest = this.requestBuilder.buildRequest(body);

    return this.http.post<RegisterResponse>(API_ENDPOINTS.BANKING.REGISTER, request).pipe(
      map((response) => {
        if (response.header.status !== 'success') {
          const errorMsg =
            response.header.errorMessage ||
            response.header.message ||
            `Registration failed (${response.header.errorCode || 'Error'})`;
          throw new Error(errorMsg);
        }
        return response.body!.registrationResponse;
      }),
    );
  }
}

