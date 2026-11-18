package com.tunit.foundation;

import java.nio.file.*;
import java.util.HashSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import static org.assertj.core.api.Assertions.*;

class ApiRouteContractTest extends FoundationIntegrationTest {
    @Autowired RequestMappingHandlerMapping mappings;
    @Test void openApiOperationsMatchEveryProductionControllerAndSecurityLogout() throws Exception {
        var actual = new HashSet<String>();
        mappings.getHandlerMethods().forEach((mapping, handler) -> {
            var name = handler.getBeanType().getName();
            if (!name.startsWith("com.tunit.") || name.contains(".foundation.")) return;
            for (var path : mapping.getPatternValues())
                for (var method : mapping.getMethodsCondition().getMethods()) actual.add(method.name().toLowerCase(java.util.Locale.ROOT) + " " + path);
        });
        actual.add("post /api/v1/auth/logout"); // A Security filter endpoint, covered by the real logout integration test.
        var document = mapper.readTree(Files.readString(Path.of("../contracts/backend-foundation.openapi.json")));
        var paths = document.get("paths"); var declared = new HashSet<String>();
        for (String path : paths.propertyNames())
            for (String method : paths.get(path).propertyNames())
                if (java.util.Set.of("get", "post", "put", "patch", "delete").contains(method)) declared.add(method + " /api/v1" + path);
        assertThat(actual).containsExactlyInAnyOrderElementsOf(declared);
    }
}
