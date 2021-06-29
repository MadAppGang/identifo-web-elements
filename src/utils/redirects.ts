import { ApiError, APIErrorCodes, LoginResponse } from '@identifo/identifo-auth-js';

export function afterLoginRedirect(e: LoginResponse) {
  var urlParams = new URLSearchParams(window.location.search);
  const callback = urlParams.get('callback_uri');
  const appId = urlParams.get('app_id') || urlParams.get('appId');

  if (e.require_2fa) {
    if (!e.enabled_2fa) {
      var urlParams = new URLSearchParams({
        mandatory: 'true',
        token: e.access_token,
        callback_uri: callback,
        app_id: appId,
      });
      return 'tfa/setup';
    }
    if (e.enabled_2fa) {
      var urlParams = new URLSearchParams({
        token: e.access_token,
        callback_uri: callback,
        app_id: appId,
      });
      return 'tfa/verify';
    }
  }
  if (callback && e.access_token && e.refresh_token) {
    var urlParams = new URLSearchParams({
      access_token: e.access_token,
      refresh_token: e.refresh_token,
      app_id: appId,
    });
    return 'callback';
  }
  if (callback && e.access_token && !e.refresh_token) {
    var urlParams = new URLSearchParams({
      access_token: e.access_token,
      app_id: appId,
    });
    return 'callback';
  }
}
export function loginCatchRedirect(data: ApiError): 'tfa/setup' {
  var urlParams = new URLSearchParams(window.location.search);
  const callback = urlParams.get('callback_uri');
  const appId = urlParams.get('app_id') || urlParams.get('appId');

  if (data.id === APIErrorCodes.PleaseEnableTFA) {
    var urlParams = new URLSearchParams({
      mandatory: 'true',
      app_id: appId,
      callback_uri: callback,
    });
    return 'tfa/setup';
  }
  throw data;
}
