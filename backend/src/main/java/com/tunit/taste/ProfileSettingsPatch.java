package com.tunit.taste;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.tunit.common.error.*;
import tools.jackson.databind.JsonNode;

public record ProfileSettingsPatch(Boolean isPublic, Boolean comparisonConsent) {
    public ProfileSettingsPatch {
        if (isPublic == null && comparisonConsent == null) throw new BusinessException(ErrorCode.INVALID_INPUT);
    }
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static ProfileSettingsPatch read(JsonNode input) {
        if (!input.isObject() || input.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        for (String field : input.propertyNames()) {
            if ((!field.equals("isPublic") && !field.equals("comparisonConsent")) || !input.get(field).isBoolean())
                throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return new ProfileSettingsPatch(input.has("isPublic") ? input.get("isPublic").booleanValue() : null,
            input.has("comparisonConsent") ? input.get("comparisonConsent").booleanValue() : null);
    }
}
