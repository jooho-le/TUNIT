package com.tunit.auth;

import com.tunit.user.TunitUserRepository;
import java.util.Locale;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final TunitUserRepository users;
    public DatabaseUserDetailsService(TunitUserRepository users) { this.users = users; }
    @Override @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        return users.findActiveByEmail(email.strip().toLowerCase(Locale.ROOT))
            .map(TunitPrincipal::new).orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
}
