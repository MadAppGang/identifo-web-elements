import { ApiError, APIErrorCodes, LoginResponse } from '@identifo/identifo-auth-js';

export function afterLoginRedirect(e: LoginResponse) {
  if (e.require_2fa) {
    if (!e.enabled_2fa) {
      return 'tfa/setup';
    }
    if (e.enabled_2fa) {
      return 'tfa/verify';
    }
  }
  if (e.access_token && e.refresh_token) {
    return 'callback';
  }
  if (e.access_token && !e.refresh_token) {
    return 'callback';
  }
}
export function loginCatchRedirect(data: ApiError): 'tfa/setup' {
  if (data.id === APIErrorCodes.PleaseEnableTFA) {
    return 'tfa/setup';
  }
  throw data;
}
