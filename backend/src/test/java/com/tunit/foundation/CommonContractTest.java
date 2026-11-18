package com.tunit.foundation;

import com.tunit.common.api.PageResponse;
import com.tunit.common.error.*;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class CommonContractTest {
    @Test void openApiRequiredFieldsMatchTheActualRequestAndResponseRecords() throws Exception {
        var json = tools.jackson.databind.json.JsonMapper.builder().build();
        var contract = json.readTree(java.nio.file.Files.readString(java.nio.file.Path.of("../contracts/backend-foundation.openapi.json")));
        var records = java.util.Map.ofEntries(
            java.util.Map.entry("LoginRequest", com.tunit.auth.LoginRequest.class),
            java.util.Map.entry("AuthUserResponse", com.tunit.auth.AuthUserResponse.class),
            java.util.Map.entry("CsrfResponse", com.tunit.auth.CsrfResponse.class),
            java.util.Map.entry("SignupRequest", com.tunit.auth.SignupRequest.class),
            java.util.Map.entry("SignupResponse", com.tunit.auth.SignupResponse.class),
            java.util.Map.entry("TasteReplaceRequest", com.tunit.taste.TasteReplaceRequest.class),
            java.util.Map.entry("TasteResponse", com.tunit.taste.TasteResponse.class),
            java.util.Map.entry("ProfileSettings", com.tunit.taste.ProfileSettings.class),
            java.util.Map.entry("TagSummary", com.tunit.music.TagSummary.class),
            java.util.Map.entry("ApiErrorResponse", ApiErrorResponse.class),
            java.util.Map.entry("FieldErrorDetail", FieldErrorDetail.class),
            java.util.Map.entry("PageResponse", PageResponse.class));
        records.forEach((name, type) -> {
            var required = new java.util.HashSet<String>();
            contract.get("components").get("schemas").get(name).get("required").forEach(field -> required.add(field.asText()));
            var properties = new java.util.HashSet<String>();
            contract.get("components").get("schemas").get(name).get("properties").propertyNames().forEach(properties::add);
            var components = java.util.Arrays.stream(type.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName).collect(java.util.stream.Collectors.toSet());
            assertThat(components).as(name + " required").isEqualTo(required);
            assertThat(components).as(name + " properties").isEqualTo(properties);
        });
    }
    @Test void pageResponseCopiesItsItemsAndDoesNotInventSizeLimits() {
        var items = new ArrayList<>(List.of("item"));
        var page = new PageResponse<>(items, 0, 10000, 1);
        items.clear();
        assertThat(page.items()).containsExactly("item");
        assertThatThrownBy(() -> page.items().add("other")).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> new PageResponse<>(List.of(), -1, 20, 0)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void errorPathsRemoveQueryStringsAndOpaqueInvitationTokens() {
        var error = ApiErrorResponse.of(ErrorCode.UNAUTHORIZED, "/api/v1/invitations/private-token/compare?password=private-value");
        assertThat(error.path()).isEqualTo("/api/v1/invitations/{token}/compare");
        assertThat(error.fieldErrors()).isEmpty();
        assertThat(error.timestamp()).isNotNull();
    }
    @Test void credentialDtoToStringDoesNotExposeInputs() {
        var input = new com.tunit.auth.LoginRequest(" Listener@EXAMPLE.TEST ", "test-only-sensitive-input");
        assertThat(input.email()).isEqualTo("listener@example.test");
        assertThat(input.toString()).doesNotContain("sensitive-input", "listener@", "EXAMPLE");
        var signup = new com.tunit.auth.SignupRequest("listener@example.test", "test-only-private", "private nickname");
        assertThat(signup.toString()).doesNotContain("listener", "test-only-private", "nickname");
    }
}
