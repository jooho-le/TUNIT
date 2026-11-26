package com.tunit.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tunit.user.TunitUser;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public final class TunitPrincipal implements UserDetails, CredentialsContainer, Serializable {
    private static final long serialVersionUID = 1L;
    private final UUID id;
    private final String email;
    private String passwordHash;
    public TunitPrincipal(TunitUser user) { id = user.getId(); email = user.getEmail(); passwordHash = user.getPasswordHash(); }
    public UUID id() { return id; }
    @Override public String getUsername() { return email; }
    @Override @JsonIgnore public String getPassword() { return passwordHash; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public void eraseCredentials() { passwordHash = null; }
    @Override public String toString() { return "TunitPrincipal[id=" + id + "]"; }
}
