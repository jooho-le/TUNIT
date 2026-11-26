package com.tunit.interest;

import com.tunit.auth.*;
import com.tunit.common.api.*;
import com.tunit.common.error.*;
import com.tunit.common.persistence.*;
import com.tunit.connection.*;
import com.tunit.match.MatchingService;
import com.tunit.taste.TasteFeatureLoader;
import java.time.Clock;
import java.util.*;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class InterestService {
    private final CurrentUser current;
    private final UserPairLocks pairs;
    private final InterestRequestRepository requests;
    private final ConnectionRepository connections;
    private final TasteFeatureLoader features;
    private final Clock clock;
    public InterestService(CurrentUser current, UserPairLocks pairs, InterestRequestRepository requests,
                           ConnectionRepository connections, TasteFeatureLoader features, Clock clock) {
        this.current = current; this.pairs = pairs; this.requests = requests; this.connections = connections; this.features = features; this.clock = clock;
    }
    public InterestResponse create(TunitPrincipal principal, InterestCreateRequest input) {
        var sender = current.read(principal); var recipientId = input.recipientId();
        if (sender.getId().equals(recipientId)) throw new BusinessException(ErrorCode.SELF_REQUEST);
        var locked = pairs.lock(sender.getId(), recipientId);
        var own = features.load(locked.get(sender.getId())); var other = features.load(locked.get(recipientId));
        MatchingService.requireComplete(own);
        if (!other.complete() || !other.isPublic()) throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
        UUID a = UuidOrder.compare(sender.getId(),recipientId) < 0 ? sender.getId() : recipientId;
        UUID b = a.equals(recipientId) ? sender.getId() : recipientId;
        if (connections.existsByUserA_IdAndUserB_Id(a,b)) throw new BusinessException(ErrorCode.ALREADY_CONNECTED);
        if (requests.pendingBetween(sender.getId(),recipientId)) throw new BusinessException(ErrorCode.REQUEST_ALREADY_EXISTS);
        var request = new InterestRequest(UUID.randomUUID(), locked.get(sender.getId()), locked.get(recipientId),clock.instant());
        return response(requests.saveAndFlush(request));
    }
    @Transactional(readOnly = true)
    public PageResponse<InterestResponse> list(TunitPrincipal principal, boolean inbox, int page, int size) {
        var user = current.read(principal);
        var bounds = QueryBounds.page(page,size,Sort.by(Sort.Order.desc("createdAt"),Sort.Order.desc("id")));
        return PageResponse.from((inbox ? requests.findByRecipient_IdOrderByCreatedAtDesc(user.getId(),bounds)
            : requests.findBySender_IdOrderByCreatedAtDesc(user.getId(),bounds)).map(InterestService::response));
    }
    public InterestActionResponse act(TunitPrincipal principal, UUID id, InterestStatus target) {
        var actor = current.read(principal);
        var party = requests.parties(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        UUID required = target == InterestStatus.CANCELLED ? party.getSenderId() : party.getRecipientId();
        if (!actor.getId().equals(required)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        pairs.lock(party.getSenderId(),party.getRecipientId());
        // First materialize the entity only AFTER waiting for the pair lock, so no stale PENDING is reused.
        var request = requests.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        request.resolve(target,clock.instant());
        requests.flush();
        UUID connectionId = null;
        if (target == InterestStatus.ACCEPTED) {
            UUID a = UuidOrder.compare(party.getSenderId(),party.getRecipientId()) < 0 ? party.getSenderId() : party.getRecipientId();
            UUID b = a.equals(party.getSenderId()) ? party.getRecipientId() : party.getSenderId();
            if (connections.existsByUserA_IdAndUserB_Id(a,b)) throw new BusinessException(ErrorCode.ALREADY_CONNECTED);
            var connection = new Connection(UUID.randomUUID(),request.getSender(),request.getRecipient(),request,clock.instant());
            connectionId = connections.saveAndFlush(connection).getId();
        }
        requests.flush();
        return new InterestActionResponse(request.getId(),request.getStatus(),connectionId,request.getResolvedAt());
    }
    private static InterestResponse response(InterestRequest r) { return new InterestResponse(r.getId(),r.getSender().getId(),r.getRecipient().getId(),r.getStatus(),r.getCreatedAt(),r.getResolvedAt()); }
}
