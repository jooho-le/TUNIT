package com.tunit.common.api;

import com.tunit.common.error.ApiErrorResponse;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

/** Request metadata only: never headers, query, payload, principal, token, SQL, or exception messages. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class ApiRequestLogFilter extends OncePerRequestFilter {
    public static final String ERROR_CODE = "tunit.publicErrorCode";
    private static final Logger log=LoggerFactory.getLogger(ApiRequestLogFilter.class);
    @Override protected boolean shouldNotFilter(HttpServletRequest request) { return !request.getRequestURI().startsWith("/api/"); }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String requestId=UUID.randomUUID().toString(), previous=MDC.get("requestId"); long started=System.nanoTime();
        response.setHeader("X-Request-Id",requestId); response.setHeader("Cache-Control","no-store"); MDC.put("requestId",requestId);
        try { chain.doFilter(request,response); }
        finally {
            Object matched=request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            String path=matched instanceof String pattern ? pattern : ApiErrorResponse.safePath(request.getRequestURI());
            path=path.replaceAll("[\\r\\n\\t]","_");
            if (path.length()>240) path=path.substring(0,240);
            long duration=(System.nanoTime()-started)/1_000_000;
            var event=response.getStatus()>=500 ? log.atError() : response.getStatus()>=400 ? log.atWarn() : log.atInfo();
            event.log("requestId={} method={} path={} status={} durationMs={} errorCode={}", requestId, request.getMethod(),path,response.getStatus(),duration,request.getAttribute(ERROR_CODE));
            if (previous==null) MDC.remove("requestId"); else MDC.put("requestId",previous);
        }
    }
}
