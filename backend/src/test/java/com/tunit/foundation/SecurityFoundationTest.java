package com.tunit.foundation;

import com.tunit.auth.TunitPrincipal;
import com.tunit.common.error.*;
import com.tunit.common.api.PageResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(SecurityFoundationTest.ProbeConfiguration.class)
class SecurityFoundationTest extends FoundationIntegrationTest {
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean
    com.tunit.taste.TasteProfileRepository profiles;
    record Browser(MockHttpSession session, String header, String token) {}
    Browser csrf(MockHttpSession session) throws Exception {
        var request = get("/api/v1/auth/csrf");
        if (session != null) request.session(session);
        var result = mvc.perform(request).andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store")).andReturn();
        var body = mapper.readTree(result.getResponse().getContentAsString());
        return new Browser((MockHttpSession) result.getRequest().getSession(false), body.get("headerName").asText(), body.get("token").asText());
    }
    Browser login() throws Exception {
        String password = UUID.randomUUID().toString();
        var user = user(password);
        var browser = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", user.getEmail(), "password", password))))
            .andExpect(status().isOk());
        return csrf(browser.session());
    }

    @Test void unauthenticatedRequestsHaveAJson401AndNoRedirect() throws Exception {
        mvc.perform(get("/api/v1/auth/me").queryParam("private", "must-not-appear"))
            .andExpect(status().isUnauthorized()).andExpect(header().doesNotExist("Location"))
            .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.fieldErrors").isArray())
            .andExpect(jsonPath("$.timestamp").isString())
            .andExpect(jsonPath("$.path").value("/api/v1/auth/me"))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test void csrfIsRequiredForLoginAndForAnonymousProtectedMutations() throws Exception {
        long before = users.count();
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        mvc.perform(post("/api/v1/interests"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        var browser = csrf(null);
        mvc.perform(post("/api/v1/interests").session(browser.session()).header(browser.header(), browser.token()))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        assertThat(users.count()).isEqualTo(before);
    }

    @Test void loginPersistsASessionChangesItsIdAndInvalidatesTheOldCsrfToken() throws Exception {
        String password = UUID.randomUUID().toString();
        var user = user(password);
        var browser = csrf(null);
        String previousId = browser.session().getId();
        var result = mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .with(request -> {
                // MockMvc.session() alone does not simulate a valid incoming session cookie.
                request.setRequestedSessionId(previousId);
                request.setRequestedSessionIdValid(true);
                request.setRequestedSessionIdFromCookie(true);
                return request;
            })
            .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", user.getEmail().toUpperCase(java.util.Locale.ROOT), "password", password))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(user.getId().toString()))
            .andExpect(jsonPath("$.nickname").value("테스트 사용자"))
            .andExpect(jsonPath("$.tasteStatus").value("INCOMPLETE"))
            .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
        var session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session.getId()).isNotEqualTo(previousId);
        var context = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");
        assertThat(((TunitPrincipal) context.getAuthentication().getPrincipal()).getPassword()).isNull();
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(user.getId().toString()));
        mvc.perform(post("/api/v1/auth/logout").session(session).header(browser.header(), browser.token()))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        assertThat(session.isInvalid()).isFalse();
    }

    @Test void invalidCredentialsDoNotRevealWhetherAnEmailExists() throws Exception {
        var user = user(UUID.randomUUID().toString());
        for (String email : List.of(user.getEmail(), UUID.randomUUID() + "@example.test")) {
            var browser = csrf(null);
            mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
                .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", "test-only-wrong-value"))))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
        }
    }

    @Test void failedLoginResponseMustNotLeaveANewAuthenticatedSession() throws Exception {
        String password = UUID.randomUUID().toString();
        var user = user(password);
        var browser = csrf(null);
        org.mockito.Mockito.doThrow(new org.springframework.dao.DataAccessResourceFailureException("test-only-db-unavailable"))
            .when(profiles).findById(user.getId());
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", user.getEmail(), "password", password))))
            .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("SERVICE_UNAVAILABLE"));
        assertThat(browser.session().getAttribute("SPRING_SECURITY_CONTEXT")).isNull();
        mvc.perform(get("/api/v1/auth/me").session(browser.session()))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test void numericPasswordsAreRejectedAsInvalidJsonTypes() throws Exception {
        long numericPassword = 123456789012345678L;
        var user = user(Long.toString(numericPassword));
        var browser = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", user.getEmail(), "password", numericPassword))))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        assertThat(browser.session().getAttribute("SPRING_SECURITY_CONTEXT")).isNull();
    }

    @Test void csrfTokensCannotBeUsedWithAnotherSession() throws Exception {
        var first = csrf(null);
        var second = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(second.session()).header(first.header(), first.token())
            .contentType("application/json").content("{}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        assertThat(second.session().getAttribute("SPRING_SECURITY_CONTEXT")).isNull();
    }

    @Test void booleanAndFloatingPointPasswordsAreRejectedAsInvalidJsonTypes() throws Exception {
        var browser = csrf(null);
        for (Object value : List.of(true, 12.5)) {
            mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
                .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", "typed@example.test", "password", value))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        }
    }

    @Test void deletedAccountsCannotAuthenticate() throws Exception {
        String password = UUID.randomUUID().toString(); var user = user(password);
        jdbc.update("update users set deleted_at=now() where id=?", user.getId());
        var browser = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("email", user.getEmail(), "password", password))))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test void inputErrorsAndMalformedJsonUseSafeFieldErrors() throws Exception {
        var browser = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content("{\"email\":\"invalid-email\",\"password\":\"\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"))
            .andExpect(jsonPath("$.fieldErrors.length()").value(2)).andExpect(jsonPath("$.fieldErrors[0].rejectedValue").doesNotExist());
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content("{\"email\":"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }

    @Test void logoutRequiresCurrentCsrfAndInvalidatesTheSessionWithANoContentResponse() throws Exception {
        var browser = login();
        mvc.perform(post("/api/v1/auth/logout").session(browser.session()).header(browser.header(), browser.token()))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        assertThat(browser.session().isInvalid()).isTrue();
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        var anonymous = csrf(null);
        mvc.perform(post("/api/v1/auth/logout").session(anonymous.session()).header(anonymous.header(), anonymous.token()))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test void controllerErrorsRetainTheirStatusAndNeverExposeDatabaseDetailsOrTokens() throws Exception {
        var browser = login();
        mvc.perform(get("/api/v1/_foundation/uuid/not-a-uuid").session(browser.session()))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_UUID"));
        mvc.perform(get("/api/v1/_foundation/state").session(browser.session()))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("INVALID_STATE"));
        mvc.perform(get("/api/v1/_foundation/denied").session(browser.session()))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        var result = mvc.perform(get("/api/v1/_foundation/database").session(browser.session()))
            .andExpect(status().isInternalServerError()).andExpect(jsonPath("$.code").value("INTERNAL_ERROR")).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("private-sql-value", "SQLException", "stackTrace");
        mvc.perform(get("/api/v1/_foundation/auth-service").session(browser.session()))
            .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("SERVICE_UNAVAILABLE"));
        mvc.perform(get("/api/v1/_foundation/missing").session(browser.session()))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        mvc.perform(get("/api/v1/invitations/test-only-sensitive-token/compare").queryParam("private", "hidden"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.path").value("/api/v1/invitations/{token}/compare"));
    }

    @Test void successDtoIsDirectAndUsesTheSpecifiedPageShape() throws Exception {
        var browser = login();
        mvc.perform(get("/api/v1/_foundation/page").session(browser.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.totalElements").value(0)).andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test void unsupportedMethodsAndContentTypesAreProtocolErrorsRatherThanServerFailures() throws Exception {
        var browser = login();
        mvc.perform(put("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("application/json").content("{}"))
            .andExpect(status().isMethodNotAllowed()).andExpect(header().string("Allow", "POST"))
            .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
        mvc.perform(post("/api/v1/auth/login").session(browser.session()).header(browser.header(), browser.token())
            .contentType("text/plain").content("unsupported"))
            .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
    }

    @TestConfiguration
    static class ProbeConfiguration { @Bean ProbeController probeController() { return new ProbeController(); } }
    /** Only imported by tests; no test or business endpoints are packaged in bootJar. */
    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/_foundation/uuid/{id}") UUID uuid(@PathVariable UUID id) { return id; }
        @GetMapping("/api/v1/_foundation/state") void state() { throw new BusinessException(ErrorCode.INVALID_STATE); }
        @GetMapping("/api/v1/_foundation/denied") void denied() { throw new AccessDeniedException("test-only"); }
        @GetMapping("/api/v1/_foundation/database") void database() { throw new DataIntegrityViolationException("private-sql-value"); }
        @GetMapping("/api/v1/_foundation/auth-service") void authService() { throw new org.springframework.security.authentication.InternalAuthenticationServiceException("private-db-info"); }
        @GetMapping("/api/v1/_foundation/page") PageResponse<String> page() { return new PageResponse<>(List.of(), 0, 20, 0); }
    }
}
