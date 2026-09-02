import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import {
  ProfileRequest,
  ProfileResponse,
  UserProfileData,
} from '../models';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);
  private authService = inject(AuthService);

  private profileSignal = signal<UserProfileData | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly profile = this.profileSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /**
   * Fetches user profile from the backend API (/TestBedGateway/API/banking/customer/profile).
   */
  fetchProfile(): Observable<UserProfileData | null> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const request: ProfileRequest = this.requestBuilder.buildRequest({});

    return this.http.post<ProfileResponse>(API_ENDPOINTS.BANKING.PROFILE, request).pipe(
      map((response) => {
        if (response.header.status !== 'success') {
          throw new Error(
            response.header.errorMessage ||
            response.header.message ||
            'Failed to fetch user profile',
          );
        }
        return response.body?.profileResponse ?? null;
      }),
      tap((data) => {
        if (data) {
          this.profileSignal.set(data);
          if (data.fullName) {
            this.authService.updateUserName(data.fullName);
          }
        }
        this.isLoadingSignal.set(false);
      }),
      catchError((err) => {
        const errorMsg = err?.message || 'Unable to retrieve profile information';
        this.errorSignal.set(errorMsg);
        this.isLoadingSignal.set(false);
        return of(null);
      }),
    );
  }
}
