package com.tunit.foundation;

import com.tunit.user.TunitUser;
import com.tunit.user.TunitUserRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc(print = org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint.NONE)
@ActiveProfiles("test")
abstract class FoundationIntegrationTest {
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected TunitUserRepository users;
    @Autowired protected PasswordEncoder encoder;
    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper mapper;
    protected TunitUser user(String password) {
        return users.saveAndFlush(new TunitUser(UUID.randomUUID(), UUID.randomUUID() + "@example.test", encoder.encode(password), "테스트 사용자", Instant.now()));
    }
}
