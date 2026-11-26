package com.tunit.foundation;

import com.tunit.common.api.ApiRequestLogFilter;
import ch.qos.logback.classic.*;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.slf4j.*;
import org.springframework.mock.web.*;
import static org.assertj.core.api.Assertions.*;

class RequestLoggingTest {
    @Test void logsStatusDurationAndOwnRequestIdButNeverCredentialsOrRawInvitation() throws Exception {
        var logger=(ch.qos.logback.classic.Logger)LoggerFactory.getLogger(ApiRequestLogFilter.class);
        var previous=logger.getLevel(); var appender=new ListAppender<ILoggingEvent>(); appender.start(); logger.addAppender(appender); logger.setLevel(Level.INFO);
        String raw="SECRET_INVITATION_TOKEN", secret="NEVER_LOG_PASSWORD_COOKIE_CSRF";
        var request=new MockHttpServletRequest("POST","/api/v1/invitations/"+raw+"/complete");
        request.setQueryString("password="+secret); request.setContent(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        request.addHeader("Cookie",secret); request.addHeader("X-CSRF-TOKEN",secret); request.addHeader("X-Request-Id",secret);
        var response=new MockHttpServletResponse(); MDC.put("requestId","previous-context");
        try {
            new ApiRequestLogFilter().doFilter(request,response,(req,res) -> {req.setAttribute(ApiRequestLogFilter.ERROR_CODE,"CSRF_INVALID"); ((HttpServletResponse)res).setStatus(403);});
            String log=appender.list.get(0).getFormattedMessage();
            assertThat(log).contains("status=403","durationMs=","errorCode=CSRF_INVALID","{token}").doesNotContain(raw,secret,"password=");
            assertThat(response.getHeader("X-Request-Id")).matches("[0-9a-f-]{36}").isNotEqualTo(secret);
            assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
            assertThat(MDC.get("requestId")).isEqualTo("previous-context");
        } finally {MDC.remove("requestId"); logger.detachAppender(appender); logger.setLevel(previous);}
    }
}
