package com.tunit.music;

import java.net.URI;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** An empty allowlist deliberately exposes no unreviewed provider/artwork URLs. No URL is fetched. */
@Component
public class SafeCatalogLinks {
    private final Set<String> externalHosts;
    private final Set<String> artworkHosts;
    public SafeCatalogLinks(@Value("${app.catalog.external-hosts:}") String external,
                            @Value("${app.catalog.artwork-hosts:}") String artwork) {
        externalHosts = hosts(external); artworkHosts = hosts(artwork);
    }
    private Set<String> hosts(String values) {
        var hosts = new HashSet<String>();
        for (String host : values.split(",")) if (!host.isBlank()) hosts.add(host.strip().toLowerCase(Locale.ROOT));
        return Set.copyOf(hosts);
    }
    public String external(String value) { return safe(value, externalHosts); }
    public String artwork(String value) { return safe(value, artworkHosts); }
    private String safe(String value, Set<String> allowed) {
        if (value == null || value.length() > 4096) return null;
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                || (uri.getPort() != -1 && uri.getPort() != 443) || !allowed.contains(uri.getHost().toLowerCase(Locale.ROOT))) return null;
            return uri.toASCIIString();
        } catch (IllegalArgumentException exception) { return null; }
    }
}
