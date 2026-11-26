package com.tunit.connection;

import com.tunit.auth.*;
import com.tunit.common.api.*;
import com.tunit.common.error.*;
import com.tunit.common.persistence.UserPairLocks;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(isolation=Isolation.READ_COMMITTED)
public class ConnectionService {
    private final CurrentUser current;
    private final UserPairLocks pairs;
    private final ConnectionRepository connections;
    public ConnectionService(CurrentUser current, UserPairLocks pairs, ConnectionRepository connections) { this.current=current; this.pairs=pairs; this.connections=connections; }
    @Transactional(readOnly=true)
    public PageResponse<ConnectionSummary> list(TunitPrincipal p,int page,int size) {
        var own=current.read(p);
        return PageResponse.from(connections.forUser(own.getId(), QueryBounds.page(page,size,Sort.by(Sort.Order.desc("createdAt"),Sort.Order.desc("id")))).map(c -> {
            var partner=c.getUserA().getId().equals(own.getId()) ? c.getUserB() : c.getUserA();
            return new ConnectionSummary(c.getId(),partner.getId(),partner.getNickname(),c.getCreatedAt());
        }));
    }
    public void delete(TunitPrincipal p,UUID id) {
        var actor=current.read(p);
        var party=connections.parties(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        if (!actor.getId().equals(party.getUserA()) && !actor.getId().equals(party.getUserB())) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        pairs.lock(party.getUserA(),party.getUserB());
        var connection=connections.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        connections.delete(connection); connections.flush();
    }
}
