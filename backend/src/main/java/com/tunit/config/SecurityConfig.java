package com.tunit.config;

import com.tunit.auth.DatabaseUserDetailsService;
import com.tunit.common.error.*;
import java.util.List;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.*;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean AuthenticationManager authenticationManager(DatabaseUserDetailsService users, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
    @Bean SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(new RequestAttributeSecurityContextRepository(), new HttpSessionSecurityContextRepository());
    }
    @Bean CsrfTokenRepository csrfTokenRepository() { return new HttpSessionCsrfTokenRepository(); }
    @Bean SessionAuthenticationStrategy sessionAuthenticationStrategy(CsrfTokenRepository csrf) {
        return new CompositeSessionAuthenticationStrategy(List.of(new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrf)));
    }
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository contexts,
                                                CsrfTokenRepository csrf, ApiErrorWriter errors) throws Exception {
        http.formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable);
        // Keep framework defaults for CSRF masking and session-backed expected tokens.
        http.csrf(config -> config.csrfTokenRepository(csrf));
        http.securityContext(config -> config.securityContextRepository(contexts));
        http.sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
        http.authorizeHttpRequests(config -> config
            .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/invitations/{token}").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup").permitAll()
            .anyRequest().authenticated());
        http.exceptionHandling(config -> config
            .authenticationEntryPoint((req, res, ex) -> errors.write(req, res, ErrorCode.UNAUTHORIZED))
            .accessDeniedHandler((req, res, ex) -> errors.write(req, res, ex instanceof CsrfException ? ErrorCode.CSRF_INVALID : ErrorCode.ACCESS_DENIED)));
        http.logout(config -> config.logoutUrl("/api/v1/auth/logout")
            .invalidateHttpSession(true).clearAuthentication(true).deleteCookies("JSESSIONID")
            .logoutSuccessHandler((req, res, authentication) -> {
                if (authentication == null || authentication instanceof AnonymousAuthenticationToken) errors.write(req, res, ErrorCode.UNAUTHORIZED);
                else res.setStatus(204);
            }));
        return http.build();
    }
}
