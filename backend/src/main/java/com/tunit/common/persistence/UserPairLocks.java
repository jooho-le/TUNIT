package com.tunit.common.persistence;

import com.tunit.common.error.*;
import com.tunit.user.*;
import java.util.*;
import org.springframework.stereotype.Component;

/** Every social mutation takes user rows in PostgreSQL UUID order BEFORE resource rows. */
@Component
public class UserPairLocks {
    private final TunitUserRepository users;
    public UserPairLocks(TunitUserRepository users) { this.users = users; }
    public Map<UUID,TunitUser> lock(UUID first, UUID second) {
        var result = new HashMap<UUID,TunitUser>();
        for (var id : java.util.stream.Stream.of(first,second).distinct().sorted(UuidOrder::compare).toList())
            result.put(id, users.findActiveForUpdate(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND)));
        return result;
    }
}
