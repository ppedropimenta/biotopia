package dev.pedropim.aquarium.identity;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration(proxyBeanMethods = false)
class SecurityConfig {

	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	@Bean
	UserDetailsService userDetailsService(UserRepository users) {
		return email -> users.findByEmail(email)
			.map(AccountDetails::of)
			.orElseThrow(() -> new UsernameNotFoundException("No account for this email"));
	}

	/**
	 * Checks an email and password against the stored hash. The provider spends the time of a hash comparison even
	 * for an unknown email, so response time does not show which addresses have accounts.
	 */
	@Bean
	AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(provider);
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository securityContextRepository,
			UserRepository users) throws Exception {
		// The SPA reads the XSRF-TOKEN cookie and sends it back in the X-XSRF-TOKEN header. A page on another site
		// cannot read our cookie, so it cannot forge a write. A null attribute name makes the token load on every
		// request, so the cookie exists before the first write.
		CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
		csrfHandler.setCsrfRequestAttributeName(null);

		return http
			.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
				.csrfTokenRequestHandler(csrfHandler))
			.securityContext(context -> context.securityContextRepository(securityContextRepository))
			// Not a bean: a Filter bean would also be registered in the servlet chain and run twice.
			.addFilterAfter(new StaleSessionFilter(users), SecurityContextHolderFilter.class)
			.authorizeHttpRequests(requests -> requests
				.requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/confirm",
						"/api/auth/resend-confirmation", "/api/auth/login", "/api/auth/forgot-password",
						"/api/auth/reset-password")
				.permitAll()
				// What a visitor may read: the Demo Tank and the fixed Parameter list. A Tank path is open to the
				// network but answers 401 unless the Tank is the Demo Tank. No write is open.
				.requestMatchers(HttpMethod.GET, "/api/demo", "/api/parameters", "/api/tanks/*", "/api/tanks/*/**")
				.permitAll()
				.requestMatchers("/api/**")
				.authenticated()
				.anyRequest()
				.permitAll())
			.exceptionHandling(handling -> handling.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
			.logout(logout -> logout.logoutUrl("/api/auth/logout")
				.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
			.httpBasic(basic -> basic.disable())
			.formLogin(form -> form.disable())
			.build();
	}

}
