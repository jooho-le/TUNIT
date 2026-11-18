package com.tunit.auth;

public record CsrfResponse(String token, String headerName) {}
