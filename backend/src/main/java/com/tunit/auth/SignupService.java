package com.tunit.auth;

import com.tunit.common.error.*;
import com.tunit.user.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class SignupService {
    private final TunitUserRepository users;
    private final PasswordEncoder passwords;
    private final TransactionTemplate transactions;
    private static final Set<String> EMAIL_CONSTRAINTS = Set.of("users_email_key", "uq_users_email_lower");

    public SignupService(TunitUserRepository users, PasswordEncoder passwords, PlatformTransactionManager manager) {
        this.users = users; this.passwords = passwords; this.transactions = new TransactionTemplate(manager);
    }
    public SignupResponse signup(SignupRequest input) {
        if (users.existsByEmailIgnoreCase(input.email())) throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        var hash = passwords.encode(input.password());
        try {
            // Translate a known duplicate only after the failed transaction has rolled back.
            return transactions.execute(transaction -> {
                var user = users.saveAndFlush(new TunitUser(UUID.randomUUID(), input.email(), hash, input.nickname(), Instant.now()));
                return new SignupResponse(user.getId(), user.getEmail(), user.getNickname(), user.getCreatedAt());
            });
        } catch (DataIntegrityViolationException exception) {
            for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
                if (cause instanceof ConstraintViolationException constraint && "23505".equals(constraint.getSQLState())
                    && constraint.getConstraintName() != null && EMAIL_CONSTRAINTS.contains(constraint.getConstraintName())) {
                    throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
                }
            }
            throw exception;
        }
    }
}
