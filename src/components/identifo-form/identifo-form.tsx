import { ApiError, IdentifoAuth, TFAType } from '@identifo/identifo-auth-js';
import { Component, h, Prop, State } from '@stencil/core';

type Routes = 'login' | 'register' | 'tfa/verify' | 'tfa/setup' | 'password/reset' | 'password/forgot';

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
  @State() code: string;
  @State() tfaType: TFAType;
  @State() tfaMandatory: boolean;
  @State() provisioningURI: string;
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
    const login = await this.auth.api.login(this.username, this.password, '', ['']).catch(e => this.processError(e));
    if (login) {
      this.tfaMandatory = login.require_2fa;
      if (login.require_2fa) {
        if (!login.enabled_2fa) {
          this.token = login.access_token;
          this.openRoute('tfa/setup');
          return;
        }
        if (login.enabled_2fa) {
          this.token = login.access_token;
          this.openRoute('tfa/verify');
          return;
        }
      }
    }
  }
  verifyTFA() {}
  setupTFA() {}
  openRoute(route: Routes) {
    this.route = route;
  }
  usernameChange(event: InputEvent) {
    this.username = (event.target as HTMLInputElement).value;
  }
  passwordChange(event: InputEvent) {
    this.password = (event.target as HTMLInputElement).value;
  }
  renderRoute(route: Routes) {
    switch (route) {
      case 'login':
        return (
          <div>
            <div class="form-floating">
              <input type="text" class="form-control" id="floatingInput" value={this.username} placeholder="username" onInput={this.usernameChange} />
              <label htmlFor="floatingInput">Username</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="floatingPassword" value={this.password} placeholder="Password" onInput={this.passwordChange} />
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
              <a>Forgot password</a>
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
              <input type="text" class="form-control" id="floatingUsername" value={this.username} placeholder="username" />
              <label htmlFor="floatingUsername">Username</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="floatingPassword" value={this.password} placeholder="Password" />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {!!this.lastError || (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            <button class="w-100 btn btn-lg btn-primary my-3">Sign up</button>
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
                    <img src="{`data:image/png;base64, ${this.qrBase64}`}" alt="{this.provisioningURI}" />
                    <div>{this.provisioningURI}</div>
                    <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.verifyTFA()}>
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
                  <input type="email" class="form-control" id="floatingInput" value={this.phone} placeholder="+1 234 567 89 00" />
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
                  <input type="email" class="form-control" id="floatingInput" value={this.email} placeholder="user@domain.com" />
                  <label htmlFor="floatingInput">Email</label>
                </div>
                <button class="w-100 btn btn-lg btn-primary my-3" onClick={() => this.setupTFA()}>
                  Setup phone
                </button>
              </div>
            )}
            {!!this.tfaMandatory && <button>Skip</button>}
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
              <input type="text" class="form-control" id="floatingUsername" value={this.code} placeholder="XXXX" />
              <label htmlFor="floatingInput">Verify code</label>
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

            {!!this.lastError || (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            {!this.success || <button class="w-100 btn btn-lg btn-primary my-3">Restore password</button>}
            {this.success || (
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

            {!!this.lastError || (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}

            {!this.success || <button class="w-100 btn btn-lg btn-primary my-3">Ok</button>}
            {this.success || (
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
