import { APP_INITIALIZER, NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { RuntimeConfigService } from './services/runtime-config.service';

export function initializeKeycloak(keycloak: KeycloakService, runtimeConfig: RuntimeConfigService) {
  return () =>
    runtimeConfig.load().then(() =>
      keycloak.init({
        config: {
          url: runtimeConfig.keycloakUrl,
          realm: runtimeConfig.keycloakRealm,
          clientId: runtimeConfig.keycloakClientId
        },
        initOptions: {
          onLoad: 'login-required',
          silentCheckSsoRedirectUri:
            window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false
        },
        enableBearerInterceptor: false,
        bearerExcludedUrls: []
      })
    );
}

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    KeycloakAngularModule
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it only in AppModule.');
    }
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: initializeKeycloak,
          multi: true,
          deps: [KeycloakService, RuntimeConfigService]
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
      ]
    };
  }
}
