package com.tunit.invitation;

import com.tunit.auth.*;
import com.tunit.common.error.*;
import com.tunit.common.persistence.UserPairLocks;
import com.tunit.match.*;
import com.tunit.taste.*;
import java.net.URI;
import java.time.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
public class InvitationService {
    private final CurrentUser current;
    private final UserPairLocks pairs;
    private final InvitationRepository invitations;
    private final InvitationTokens tokens;
    private final TasteFeatureLoader features;
    private final MatchingService matching;
    private final Clock clock;
    private final String base;
    public InvitationService(CurrentUser current, UserPairLocks pairs, InvitationRepository invitations, InvitationTokens tokens,
                             TasteFeatureLoader features, MatchingService matching, Clock clock, @Value("${app.public-url}") String base) {
        this.current=current; this.pairs=pairs; this.invitations=invitations; this.tokens=tokens;
        this.features=features; this.matching=matching; this.clock=clock;
        URI url=URI.create(base);
        boolean local=url.getHost()!=null && java.util.Set.of("localhost","127.0.0.1","[::1]").contains(url.getHost());
        if (url.getHost()==null || url.getUserInfo()!=null || url.getFragment()!=null || url.getQuery()!=null
            || !("https".equalsIgnoreCase(url.getScheme()) || local && "http".equalsIgnoreCase(url.getScheme())))
            throw new IllegalArgumentException("APP_PUBLIC_URL requires HTTPS (local HTTP allowed)");
        this.base=base.replaceAll("/+$", "");
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public InvitationCreateResponse create(TunitPrincipal p) {
        var inviter=current.lock(p); requireReady(features.load(inviter));
        var raw=tokens.generate(); var now=clock.instant(); var expiry=now.plus(Duration.ofHours(24));
        invitations.saveAndFlush(new Invitation(UUID.randomUUID(),inviter,tokens.hash(raw),expiry,now));
        return new InvitationCreateResponse(base+"/#/invite/"+raw,expiry,InvitationStatus.PENDING);
    }
    public InvitationStatusResponse status(TunitPrincipal p,String raw) {
        var invitation=invitations.findByTokenHash(tokens.hash(raw)).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));
        var actor=p==null ? null : current.read(p);
        boolean valid=valid(invitation); boolean participant=actor!=null && (actor.getId().equals(invitation.getInviter().getId())
            || invitation.getAcceptedBy()!=null && actor.getId().equals(invitation.getAcceptedBy().getId()));
        boolean ready=valid && participant && invitation.getStatus()==InvitationStatus.COMPLETED && bothReady(invitation);
        InvitationStatus state=clock.instant().isBefore(invitation.getExpiresAt()) ? invitation.getStatus() : InvitationStatus.EXPIRED;
        String role=actor==null ? "ANONYMOUS" : actor.getId().equals(invitation.getInviter().getId()) ? "INVITER" : participant ? "RECIPIENT" : "VISITOR";
        return new InvitationStatusResponse(state,valid,actor==null,ready,role,invitation.getExpiresAt());
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public InvitationStatusResponse complete(TunitPrincipal p,String raw) {
        var actor=current.read(p);
        var party=invitations.parties(tokens.hash(raw)).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));
        if (actor.getId().equals(party.getInviterId())) throw new BusinessException(ErrorCode.SELF_REQUEST);
        var locked=pairs.lock(party.getInviterId(),actor.getId());
        var invitation=invitations.lockById(party.getId()).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));
        if (!valid(invitation)) throw new BusinessException(ErrorCode.INVITATION_NOT_FOUND);
        if (invitation.getStatus()!=InvitationStatus.PENDING) throw new BusinessException(ErrorCode.INVITATION_ALREADY_USED);
        requireReady(features.load(locked.get(actor.getId()))); requireReady(features.load(locked.get(party.getInviterId())));
        invitation.complete(locked.get(actor.getId()),clock.instant()); invitations.flush();
        return new InvitationStatusResponse(InvitationStatus.COMPLETED,true,false,true,"RECIPIENT",invitation.getExpiresAt());
    }
    public MatchDetailResponse compare(TunitPrincipal p,String raw) {
        var actor=current.read(p);
        var invitation=invitations.findByTokenHash(tokens.hash(raw)).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));
        if (!valid(invitation)) throw new BusinessException(ErrorCode.INVITATION_NOT_FOUND);
        boolean inviter=actor.getId().equals(invitation.getInviter().getId());
        if (!inviter && (invitation.getAcceptedBy()==null || !actor.getId().equals(invitation.getAcceptedBy().getId())))
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        if (invitation.getStatus()!=InvitationStatus.COMPLETED) throw new BusinessException(ErrorCode.INVALID_STATE);
        var own=features.load(actor); var other=features.load(inviter ? invitation.getAcceptedBy() : invitation.getInviter());
        requireReady(own); requireReady(other);
        return matching.compare(own,other);
    }
    private boolean valid(Invitation i) { return clock.instant().isBefore(i.getExpiresAt()) && (i.getStatus()==InvitationStatus.PENDING || i.getStatus()==InvitationStatus.COMPLETED); }
    private boolean bothReady(Invitation i) { return ready(features.load(i.getInviter())) && i.getAcceptedBy()!=null && ready(features.load(i.getAcceptedBy())); }
    private boolean ready(TasteFeatures f) { return f.user().getDeletedAt()==null && f.complete() && f.isPublic() && f.consent(); }
    private void requireReady(TasteFeatures f) {
        MatchingService.requireComplete(f);
        if (!ready(f)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
    }
}
