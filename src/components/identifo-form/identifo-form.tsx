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
      .login(this.email, this.password, '', [''])
      .then(afterLoginRedirect)
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  async signUp() {
    await this.auth.api
      .register(this.username, this.password, this.email, this.phone)
      .then(afterLoginRedirect)
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  async finishLogin() {
    const token = this.auth.getToken().token;
    this.loginComplete.emit(token);
  }
  async verifyTFA() {
    this.auth.api.verifyTFA(this.tfaCode, []).then(() => {
      this.finishLogin();
    });
  }
  async setupTFA() {
    if (this.tfaType == TFAType.TFATypeSMS) {
      await this.auth.api.updateUser({ new_phone: this.phone });
    }

    if (this.tfaType == TFAType.TFATypeEmail) {
      await this.auth.api.updateUser({ new_email: this.email });
    }

    await this.auth.api.enableTFA().then(r => {
      if (!r.provisioning_uri) {
        this.openRoute('tfa/verify');
      }
      if (r.provisioning_uri) {
        this.provisioningURI = r.provisioning_uri;
        this.provisioningQR = r.provisioning_qr;
      }
    });
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
            <input type="text" class="form-control" id="floatingInput" value={this.email} placeholder="Email" onInput={event => this.emailChange(event as InputEvent)} />
            <input
              type="password"
              class="form-control"
              id="floatingPassword"
              value={this.password}
              placeholder="Password"
              onInput={event => this.passwordChange(event as InputEvent)}
            />

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <div class="login-form__buttons">
              <button onClick={() => this.signIn()} class="primary-button" disabled={!this.email || !this.password}>
                Login
              </button>
              <a onClick={() => this.openRoute('password/forgot')} class="login-form__forgot-pass">
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
            <div class="upload-photo">
              <input type="file" name="photo" id="photo" accept="image/*" class="upload-photo__field" />
              <label htmlFor="photo" class="upload-photo__label">
                <div class="upload-photo__avatar" id="avatar" />
              </label>
              <label htmlFor="photo" class="upload-photo__label">
                <p class="upload-photo__text">Upload avatar</p>
              </label>
            </div>
            <input type="text" class="form-control" id="floatingInput" value={this.email} placeholder="Email" onInput={event => this.emailChange(event as InputEvent)} />
            <input type="phone" class="form-control" id="floatingInput" value={this.phone} placeholder="Phone number" onInput={event => this.phoneChange(event as InputEvent)} />
            <input
              type="text"
              class="form-control"
              id="floatingUsername"
              value={this.username}
              placeholder="Username"
              onInput={event => this.usernameChange(event as InputEvent)}
            />
            <input
              type="password"
              class="form-control"
              id="floatingPassword"
              value={this.password}
              placeholder="Password"
              onInput={event => this.passwordChange(event as InputEvent)}
            />

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <div class="register-form__buttons">
              <button onClick={() => this.signUp()} class="primary-button" disabled={!this.email || !this.password || !this.phone || !this.username}>
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
            <div class="info-card">
              <div class="info-card__controls">
                <p class="info-card__title">Authenticator app</p>
                <button type="button" class="info-card__button">
                  Setup
                </button>
              </div>
              <p class="info-card__text">Use the Authenticator app to get free verification codes, even when your phone is offline. Available for Android and iPhone.</p>
            </div>
            <div class="info-card">
              <div class="info-card__controls">
                <p class="info-card__title">Email</p>
                <button type="button" class="info-card__button">
                  Update
                </button>
              </div>
              {!!this.email && <p class="info-card__subtitle">roman@identifo.com</p>}
              <p class="info-card__text">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
            <div class="info-card">
              <div class="info-card__controls">
                <p class="info-card__title">Phone number</p>
                <button type="button" class="info-card__button">
                  Update
                </button>
              </div>
              {!!this.phone && <p class="info-card__subtitle">+7 903 123 45 67</p>}
              <p class="info-card__text">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat</p>
            </div>
            <button class="primary-button" type="button">
              Done
            </button>
            {/* {!!(this.tfaType === TFAType.TFATypeApp) && (
              <div>
                Use GoogleAuth as 2fa
                {!!this.provisioningURI && (
                  <div>
                    <img src={`data:image/png;base64, ${this.provisioningQR}`} alt="{this.provisioningURI}" />
                    <div>{this.provisioningURI}</div>
                    <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.openRoute('tfa/verify')}>
                      Next
                    </button>
                  </div>
                )}
                {!this.provisioningURI && (
                  <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.setupTFA()}>
                    Setup
                  </button>
                )}
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeSMS) && (
              <div>
                Use phone as 2fa, please check your phone bellow, we will send confirmation code to this phone
                <div class="form-floating">
                  <input
                    type="phone"
                    class="form-control"
                    id="floatingInput"
                    value={this.phone}
                    placeholder="+1 234 567 89 00"
                    onInput={event => this.phoneChange(event as InputEvent)}
                  />
                  <label htmlFor="floatingInput">Phone number</label>
                </div>
                <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.setupTFA()}>
                  Setup email
                </button>
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeEmail) && (
              <div>
                Use email as 2fa, please check your email bellow, we will send confirmation code to this email
                <div class="form-floating">
                  <input
                    type="email"
                    class="form-control"
                    id="floatingInput"
                    value={this.email}
                    placeholder="user@domain.com"
                    onInput={event => this.emailChange(event as InputEvent)}
                  />
                  <label htmlFor="floatingInput">Email</label>
                </div>
                <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.setupTFA()}>
                  Setup phone
                </button>
              </div>
            )}
            {!!this.tfaMandatory && <button onClick={() => this.finishLogin()}>Skip</button>} */}
          </div>
        );
      case 'tfa/verify':
        return (
          <div class="tfa-verify">
            {!!(this.tfaType === TFAType.TFATypeApp) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class="tfa-verify__title">Please scan QR-code with the app</h2>
                <button type="button" class="tfa-verify__app-button">
                  Regenerate
                </button>
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeSMS) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class="tfa-verify__title">Enter the code sent to your phone number</h2>
                <p class="tfa-verify__subtitle">The code has been sent to +971 55 987 6543.</p>
              </div>
            )}
            {!!(this.tfaType === TFAType.TFATypeEmail) && (
              <div class="tfa-verify__title-wrapper">
                <h2 class="tfa-verify__title">Enter the code sent to your email address</h2>
                <p class="tfa-verify__subtitle">The email has been sent to mail@identifo.com</p>
              </div>
            )}
            <input type="text" class="form-control" id="floatingCode" value={this.tfaCode} placeholder="Verify code" onInput={event => this.tfaCodeChange(event as InputEvent)} />
            <button type="button" class="primary-button" disabled={!this.tfaCode}>
              Confirm
            </button>
            <a class="tfa-verify__back">Back to settings</a>
          </div>
        );
      case 'password/forgot':
        return (
          <div class="forgot-password">
            <div class="form-floating">
              <input type="username" class="form-control" id="floatingUsername" value={this.username} placeholder="username" />
              <label htmlFor="floating Username">Username</label>
            </div>
            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}
            {!this.success && (
              <button class="w-100 btn btn-lg btn- primary my-3" onClick={() => this.restorePassword()}>
                Restore password
              </button>
            )}

            {this.success && (
              <div class="alert alert-success my-3" role="alert">
                Reset password link sended to email
              </div>
            )}

            <div class="d-flex flex-column">
              <a onClick={() => this.openRoute('login')}>Back to login</a>
            </div>
          </div>
        );
      case 'password/reset':
        return (
          <div>
            <div class="form-floating">
              <input type="password" class="form-control" id="floatingPassword" value={this.password} placeholder="Password" />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            {!this.success && (
              <button onClick={() => this.setNewPassword()} class="w-100 btn btn-lg btn-primary my-3">
                Ok
              </button>
            )}

            {this.success && (
              <div class="alert alert-success my-3" role="alert">
                New password has been set.Return to <a onClick={() => this.openRoute('login')}> login</a>
              </div>
            )}

            <div class="d-flex flex-column">
              <a onClick={() => this.openRoute('login')}>Back to login</a>
            </div>
          </div>
        );
      case 'error':
        return (
          <div>
            <div>{this.lastError.id}</div>
            <div>{this.lastError.message}</div>
            <div>{this.lastError.detailedMessage}</div>
          </div>
        );
    }
  }

  async componentWillLoad() {
    console.log(this.appId, this.url);
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
