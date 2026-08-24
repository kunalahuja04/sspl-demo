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
   * Submits a new customer registration request.
   */
  register(payload: RegisterRequestBody['registerRequest']): Observable<RegistrationResponseBody['registrationResponse']> {
    const body: RegisterRequestBody = { registerRequest: payload };
    const request: RegisterRequest = this.requestBuilder.buildRequest(body);

    return this.http.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, request).pipe(
      map((response) => {
        if (response.header.status !== 'success') {
          throw new Error(response.header.status || 'Registration failed');
        }
        return response.body!.registrationResponse;
      }),
    );
  }
}
