import { ApiError, IdentifoAuth } from '@identifo/identifo-auth-js';
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
  @State() registrationForbidden: boolean;
  @State() lastError: ApiError;

  // /**
  //  * The last name
  //  */
  // @Prop() last: string;

  // private getText(): string {
  //   return format(this.first, this.middle, this.last);
  // }
  openRoute(route: Routes) {
    this.route = route;
  }
  renderRoute(route: Routes) {
    switch (route) {
      case 'login':
        return (
          <div>
            <div class="form-floating">
              <input type="text" class="form-control" id="floatingInput" value={this.username} placeholder="username" />
              <label htmlFor="floatingInput">Username</label>
            </div>
            <div class="form-floating">
              <input type="password" class="form-control" id="floatingPassword" value={this.password} placeholder="Password" />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {!!this.lastError && (
              <div class="alert alert-danger" role="alert">
                {this.lastError?.detailedMessage}
              </div>
            )}
            <button class="w-100 btn btn-lg btn-primary my-3">Sign in</button>
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
        return 'tfa/setup';
      case 'tfa/verify':
        return 'tfa/verify';
      case 'password/forgot':
        return 'password/forgot';
      case 'password/reset':
        return 'password/reset';
    }
  }

  async componentWillLoad() {
    console.log(this.appId, this.url);
    this.auth = new IdentifoAuth({ appId: this.appId, url: this.url });
    const settings = await this.auth.api.getAppSettings();
    this.registrationForbidden = settings.registrationForbidden;
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
