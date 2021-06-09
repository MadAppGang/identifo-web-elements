import { ApiError, IdentifoAuth, SuccessResponse, TFAType } from '@identifo/identifo-auth-js';
import { Component, h, Prop, State } from '@stencil/core';
import { afterLoginRedirect, loginCatchRedirect } from '../../utils/redirects';

type Routes = 'login' | 'register' | 'tfa/verify' | 'tfa/setup' | 'password/reset' | 'password/forgot' | 'callback';

@Component({
  tag: 'identifo-form',
  styleUrl: 'identifo-form.css',
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

  // /**
  //  * The last name
  //  */
  // @Prop() last: string;

  // private getText(): string {
  //   return format(this.first, this.middle, this.last);
  // }
  processError(e: ApiError) {
    this.lastError = e;
  }
  async signIn() {
    await this.auth.api
      .login(this.username, this.password, '', [''])
      .then(afterLoginRedirect)
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  async signUp() {
    await this.auth.api
      .register(this.username, this.password, '', '')
      .then(afterLoginRedirect)
      .catch(loginCatchRedirect)
      .then(route => this.openRoute(route))
      .catch(e => this.processError(e));
  }
  finishLogin() {}
  async verifyTFA() {
    this.auth.api.verifyTFA(this.tfaCode, []).then(e => {
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
      .then((e: SuccessResponse) => {
        this.success = true;
      })
      .catch((data: ApiError) => {
        console.log(data);
        this.lastError = data;
      });
  }
  setNewPassword() {}
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
          <div>
            <div class="form-floating">
              <input type="text" class="form-control" id="floatingInput" value={this.username} placeholder="username" onInput={event => this.usernameChange(event as InputEvent)} />
              <label htmlFor="floatingInput">Username</label>
            </div>
            <div class="form-floating">
              <input
                type="password"
                class="form-control"
                id="floatingPassword"
                value={this.password}
                placeholder="password"
                onInput={event => this.passwordChange(event as InputEvent)}
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}
            <button onClick={() => this.signIn()} class="w-100 btn btn-lg btn-primary my-3">
              Sign in
            </button>
            <div class="d-flex flex-column">
              <a onClick={() => this.openRoute('password/forgot')}>Forgot password</a>
              {!this.registrationForbidden && <a onClick={() => this.openRoute('register')}>Register new account</a>}

              <a href="user-agreement">User agreement</a>
              <a href="privacy-policy">Privacy policy</a>
            </div>
          </div>
        );
      case 'register':
        return (
          <div>
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                id="floatingUsername"
                value={this.username}
                placeholder="username"
                onInput={event => this.usernameChange(event as InputEvent)}
              />
              <label htmlFor="floatingUsername">Username</label>
            </div>
            <div class="form-floating">
              <input
                type="password"
                class="form-control"
                id="floatingPassword"
                value={this.password}
                placeholder="password"
                onInput={event => this.passwordChange(event as InputEvent)}
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <button onClick={() => this.signUp()} class="w-100 btn btn-lg btn-primary my-3">
              Sign up
            </button>
            <div class="d-flex flex-column">
              <a href="user-agreement">By clicking register I accept user agreement</a>
              <a onClick={() => this.openRoute('login')}>Go back to login</a>
            </div>
          </div>
        );
      case 'tfa/setup':
        return (
          <div>
            {!!(this.tfaType === TFAType.TFATypeApp) && (
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
            {!!this.tfaMandatory && <button onClick={() => this.finishLogin()}>Skip</button>}
          </div>
        );
      case 'tfa/verify':
        return (
          <div>
            <div>
              {!!(this.tfaType === TFAType.TFATypeApp) && `Please use google authenticator app and enter code`}
              {!!(this.tfaType === TFAType.TFATypeSMS) && `Please check your phone number ${this.phone} for the code`}
              {!!(this.tfaType === TFAType.TFATypeEmail) && `Check your email ${this.email}`}
            </div>
            Please enter code
            <br />
            <div class="form-floating">
              <input type="text" class="form-control" id="floatingCode" value={this.tfaCode} placeholder="XXXX" onInput={event => this.tfaCodeChange(event as InputEvent)} />
              <label htmlFor="floatingCode">Verify code</label>
            </div>
            <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.verifyTFA()}>
              Ok
            </button>
            <div class="d-flex flex-column">
              <a onClick={() => this.openRoute('login')}>Go back</a>
              <a href="">I am not reciving code</a>
            </div>
          </div>
        );
      case 'password/forgot':
        return (
          <div>
            <div class="form-floating">
              <input type="username" class="form-control" id="floatingUsername" value={this.username} placeholder="username" />
              <label htmlFor="floatingUsername">Username</label>
            </div>

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            {!this.success && (
              <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.restorePassword()}>
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
                New password has been set. Return to <a onClick={() => this.openRoute('login')}>login</a>
              </div>
            )}
            <div class="d-flex flex-column">
              <a onClick={() => this.openRoute('login')}>Back to login</a>
            </div>
          </div>
        );
    }
  }

  async componentWillLoad() {
    console.log(this.appId, this.url);
    this.auth = new IdentifoAuth({ appId: this.appId, url: this.url });
    const settings = await this.auth.api.getAppSettings();
    this.registrationForbidden = settings.registrationForbidden;
    this.tfaType = settings.tfaType;
  }

  render() {
    return (
      <div>
        {this.route}
        {this.renderRoute(this.route)}
      </div>
    );
  }
}
