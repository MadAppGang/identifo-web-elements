import { ApiError, IdentifoAuth, TFAType } from '@identifo/identifo-auth-js';
import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';
import { afterLoginRedirect, loginCatchRedirect } from '../../utils/redirects';

type Routes = 'login' | 'register' | 'tfa/verify' | 'tfa/setup' | 'password/reset' | 'password/forgot' | 'callback' | 'otp/login' | 'error';

@Component({
  tag: 'identifo-form',
  styleUrl: '../../styles/identifo-form/main.scss',
  shadow: true,
})
export class MyComponent {
  /**
   * The first name
   */
  @State() auth: IdentifoAuth;
  @State() route: Routes = 'login';

  @Prop() appId: string;
  @Prop() url: string;
  @Prop() theme: 'dark' | 'light';

  @State() username: string;
  @State() password: string;
  @State() phone: string;
  @State() email: string;
  @State() registrationForbidden: boolean;
  @State() lastError: ApiError;
  @State() tfaCode: string;
  @State() tfaType: TFAType;
  @State() tfaMandatory: boolean;
  @State() provisioningURI: string;
  @State() provisioningQR: string;
  @State() token: string;
  @State() success: boolean;

  @Event() loginComplete: EventEmitter<string>;
  @Event() onError: EventEmitter<ApiError>;

  // /**
  //  * The last name
  //  */
  // @Prop() last: string;

  // private getText(): string {
  //   return format(this.first, this.middle, this.last);
  // }
  processError(e: ApiError) {
    this.lastError = e;
    this.onError.emit(e);
  }
  async signIn() {
    await this.auth.api
      .login(this.username, this.password, '', [''])
      .then((e) => {
        this.phone = e.user.phone || ''
        this.email = e.user.email || ''
        return afterLoginRedirect(e)
      })
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  async signUp() {
    await this.auth.api
      .register(this.username, this.password)
      .then((e) => afterLoginRedirect(e))
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  async finishLogin() {
    const token = this.auth.getToken().token;
    this.loginComplete.emit(token);
  }
  async verifyTFA() {
    if (this.lastError) console.log(JSON.stringify(this.lastError.message))
    this.auth.api.verifyTFA(this.tfaCode, [])
      .then(() => this.finishLogin().then(() => this.openRoute('callback')))
      .catch(e => this.processError(e))
  }
  async setupTFA() {
    if (this.tfaType == TFAType.TFATypeSMS) {
      try {
        await this.auth.api.updateUser({ new_phone: this.phone })
      } catch (e) {
        this.processError(e)
      }
    }

    if (this.tfaType == TFAType.TFATypeEmail) {
      try {
        await this.auth.api.updateUser({ new_email: this.email });
      } catch (e) {
        this.processError(e)
      }
    }

    await this.auth.api.enableTFA().then(r => {
      if (!r.provisioning_uri) {
        this.openRoute('tfa/verify');
      }
      if (r.provisioning_uri) {
        this.provisioningURI = r.provisioning_uri;
        this.provisioningQR = r.provisioning_qr;
        this.openRoute('tfa/verify');
      }
    })
  }
  restorePassword() {
    this.auth.api
      .requestResetPassword(this.username)
      .then(() => {
        this.success = true;
      })
      .catch(e => this.processError(e));
  }
  setNewPassword() {
    this.auth.api
      .resetPassword(this.password)
      .then(() => {
        this.success = true;
      })
      .catch(e => this.processError(e));
  }
  openRoute(route: Routes) {
    this.lastError = undefined
    this.route = route;
  }
  usernameChange(event: InputEvent) {
    this.username = (event.target as HTMLInputElement).value;
  }
  passwordChange(event: InputEvent) {
    this.password = (event.target as HTMLInputElement).value;
  }
  emailChange(event: InputEvent) {
    this.email = (event.target as HTMLInputElement).value;
  }
  phoneChange(event: InputEvent) {
    this.phone = (event.target as HTMLInputElement).value;
  }
  tfaCodeChange(event: InputEvent) {
    this.tfaCode = (event.target as HTMLInputElement).value;
  }
  renderRoute(route: Routes) {
    switch (route) {
      case 'login':
        return (
          <div class="login-form">
            <p class="login-form__register-text">
              Don't have an account?
              <a onClick={() => this.openRoute('register')} class="login-form__register-link">
                {' '}
                Sign Up
              </a>
            </p>
            <input
              type="text"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingInput"
              value={this.username}
              placeholder="Username"
              onInput={event => this.usernameChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.username && this.password) && this.signIn()}
            />
            <input
              type="password"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingPassword"
              value={this.password}
              placeholder="Password"
              onInput={event => this.passwordChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.username && this.password) && this.signIn()}
            />

            {!!this.lastError && (
              <div class="error" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <div class={`login-form__buttons ${!!this.lastError ? "login-form__buttons_mt-32" : ""}`}>
              <button
                onClick={() => this.signIn()}
                class="primary-button"
                disabled={!this.username || !this.password}
              >
                Login
              </button>
              <a onClick={() => this.openRoute("password/forgot")} class="login-form__forgot-pass">
                Forgot password
              </a>
            </div>
            <div class="social-buttons">
              <p class="social-buttons__text">or continue with</p>
              <div class="social-buttons__social-medias">
                <div class="social-buttons__media">
                  <img src="../../assets/images/apple.svg" class="social-buttons__image" alt="login via apple" />
                </div>
                <div class="social-buttons__media">
                  <img src="../../assets/images/google.svg" class="social-buttons__image" alt="login via google" />
                </div>
                <div class="social-buttons__media">
                  <img src="../../assets/images/fb.svg" class="social-buttons__image" alt="login via facebook" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'register':
        return (
          <div class="register-form">
            <input
              type="text"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingInput"
              value={this.username}
              placeholder="Username"
              onInput={event => this.usernameChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.password && this.username) && this.signUp()}
            />
            <input
              type="password"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingPassword"
              value={this.password}
              placeholder="Password"
              onInput={event => this.passwordChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.password && this.username) && this.signUp()}
            />

            {!!this.lastError && (
              <div class="error" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <div class={`register-form__buttons ${!!this.lastError ? "register-form__buttons_mt-32" : ""}`}>
              <button onClick={() => this.signUp()} class="primary-button" disabled={!this.username || !this.password}>
                Continue
              </button>
              <a onClick={() => this.openRoute('login')} class="register-form__log-in">
                Go back to login
              </a>
            </div>
          </div>
        );
      case 'otp/login':
        return (
          <div class="otp-login">
            <p class="otp-login__register-text">
              Don't have an account?
              <a onClick={() => this.openRoute('register')} class="login-form__register-link">
                {' '}
                Sign Up
              </a>
            </p>
            <input type="phone" class="form-control" id="floatingInput" value={this.phone} placeholder="Phone number" onInput={event => this.phoneChange(event as InputEvent)} />
            <button onClick={() => this.openRoute('tfa/verify')} class="primary-button" disabled={!this.phone}>
              Continue
            </button>
            <div class="social-buttons">
              <p class="social-buttons__text">or continue with</p>
              <div class="social-buttons__social-medias">
                <div class="social-buttons__media">
                  <img src="../../assets/images/apple.svg" class="social-buttons__image" alt="login via apple" />
                </div>
                <div class="social-buttons__media">
                  <img src="../../assets/images/google.svg" class="social-buttons__image" alt="login via google" />
                </div>
                <div class="social-buttons__media">
                  <img src="../../assets/images/fb.svg" class="social-buttons__image" alt="login via facebook" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'tfa/setup':
        return (
          <div class="tfa-setup">
            <p class="tfa-setup__text">Protect your account with 2-step verification</p>
            {this.tfaType === TFAType.TFATypeApp && (
              <div class="info-card">
                <div class="info-card__controls">
                  <p class="info-card__title">Authenticator app</p>
                  <button type="button" class="info-card__button" onClick={() => this.setupTFA()} >
                    Setup
                  </button>
                </div>
                <p class="info-card__text">Use the Authenticator app to get free verification codes, even when your phone is offline. Available for Android and iPhone.</p>
              </div>
            )}
            {this.tfaType === TFAType.TFATypeEmail && (
              <div class="tfa-setup__form">
                <p class="tfa-setup__subtitle"> Use email as 2fa, please check your email bellow, we will send confirmation code to this email</p>
                <input
                  type="text"
                  class={`form-control ${this.lastError && 'form-control-danger'}`}
                  id="floatingEmail"
                  value={this.email}
                  placeholder="Email"
                  onInput={event => this.emailChange(event as InputEvent)}
                  onKeyPress={(e) => !!(e.key === "Enter" && this.email) && this.setupTFA()}
                />

                {!!this.lastError && (
                  <div class="error" role="alert">
                    {this.lastError?.detailedMessage}
                  </div>
                )}

                <button
                  onClick={() => this.setupTFA()}
                  class={`primary-button ${this.lastError && 'primary-button-mt-32'}`}
                  disabled={!this.email}
                >
                  Setup email
                </button>
              </div>
            )}
            {this.tfaType === TFAType.TFATypeSMS && (
              <div class="tfa-setup__form">
                <p class="tfa-setup__subtitle"> Use phone as 2fa, please check your phone bellow, we will send confirmation code to this phone</p>
                <input
                  type="number"
                  class={`form-control ${this.lastError && 'form-control-danger'}`}
                  id="floatingInput"
                  value={this.phone}
                  placeholder="Phone"
                  onInput={event => this.phoneChange(event as InputEvent)}
                  onKeyPress={(e) => !!(e.key === "Enter" && this.phone) && this.setupTFA()}
                />

                {!!this.lastError && (
                  <div class="error" role="alert">
                    {this.lastError?.detailedMessage}
                  </div>
                )}

                <button
                  onClick={() => this.setupTFA()}
                  class={`primary-button ${this.lastError && 'primary-button-mt-32'}`}
                  disabled={!this.phone}
                >
                  Setup phone
                </button>
              </div>
            )}
          </div>
        );
      case 'tfa/verify':
        return (
          <div class="tfa-verify">
            {!!(this.tfaType === TFAType.TFATypeApp) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class={this.provisioningURI ? "tfa-verify__title" : "tfa-verify__title_mb-40"}>
                  {!!this.provisioningURI ? 'Please scan QR-code with the app' : 'Use GoogleAuth as 2fa'}
                </h2>
                {!!this.provisioningURI && (
                  <img
                    src={`data:image/png;base64, ${this.provisioningQR}`}
                    alt={this.provisioningURI}
                    class="tfa-verify__qr-code"
                  />
                )}
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeSMS) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class="tfa-verify__title">Enter the code sent to your phone number</h2>
                <p class="tfa-verify__subtitle">The code has been sent to {this.phone}</p>
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeEmail) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class="tfa-verify__title">Enter the code sent to your email address</h2>
                <p class="tfa-verify__subtitle">The email has been sent to {this.email}</p>
              </div>
            )}
            <input
              type="text"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingCode"
              value={this.tfaCode}
              placeholder="Verify code"
              onInput={event => this.tfaCodeChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.tfaCode) && this.verifyTFA()}
            />

            {!!this.lastError && (
              <div class="error" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <button
              type="button"
              class={`primary-button ${this.lastError && 'primary-button-mt-32'}`}
              disabled={!this.tfaCode}
              onClick={() => this.verifyTFA()}
            >
              Confirm
            </button>
          </div>
        );
      case 'password/forgot':
        return (
          <div class="forgot-password">
            <h2 class="forgot-password__title">
              Enter the username you gave when you registered
            </h2>
            <p class="forgot-password__subtitle">
              We will send you a link to create a new password on email
            </p>
            <input
              type="username"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingUsername"
              value={this.username}
              placeholder="Username"
              onInput={event => this.usernameChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.username) && this.restorePassword()}
            />

            {!!this.lastError && (
              <div class="error" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <button
              type="button"
              class={`primary-button ${this.lastError && 'primary-button-mt-32'}`}
              disabled={!this.username}
              onClick={() => this.restorePassword()}
            >
              Send the link
            </button>
          </div>
        );
      case 'password/reset':
        return (
          <div class="reset-password">
            <h2 class="reset-password__title">
              Set up a new password to log in to the website
            </h2>
            <p class="reset-password__subtitle">
              Memorize your code and do not give it to anyone.
            </p>
            <input
              type="password"
              class={`form-control ${this.lastError && 'form-control-danger'}`}
              id="floatingPassword"
              value={this.password}
              placeholder="Password"
              onInput={event => this.passwordChange(event as InputEvent)}
              onKeyPress={(e) => !!(e.key === "Enter" && this.password) && this.setNewPassword()}
            />

            {!!this.lastError && (
              <div class="error" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <button
              type="button"
              class={`primary-button ${this.lastError && 'primary-button-mt-32'}`}
              disabled={!this.password}
              onClick={() => this.setNewPassword()}
            >
              Save password
            </button>
          </div>
        );
      case 'error':
        return (
          <div class="error-view">
            <div class="error-view__message">{this.lastError.message}</div>
            <div class="error-view__details">{this.lastError.detailedMessage}</div>
          </div>
        );
    }
  }

  async componentWillLoad() {
    this.auth = new IdentifoAuth({ appId: this.appId, url: this.url });

    try {
      const settings = await this.auth.api.getAppSettings();
      this.registrationForbidden = settings.registrationForbidden;
      this.tfaType = settings.tfaType;
    } catch (err) {
      this.route = 'error';
      this.lastError = err as ApiError;
    }
  }

  render() {
    return <div class={{ 'wrapper': this.theme === 'light', 'wrapper-dark': this.theme === 'dark' }}>{this.renderRoute(this.route)}</div>;
  }
}
