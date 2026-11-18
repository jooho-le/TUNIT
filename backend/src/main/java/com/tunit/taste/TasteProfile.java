package com.tunit.taste;

import com.tunit.user.TunitUser;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity @Table(name = "taste_profiles")
public class TasteProfile {
    @Id @Column(name = "user_id", nullable = false)
    private UUID userId;
    @MapsId @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private TunitUser user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private TasteStatus status;
    @Column(columnDefinition = "text")
    private String summary;
    @Column(name = "is_public", nullable = false)
    private boolean isPublic;
    @Column(name = "comparison_consent", nullable = false)
    private boolean comparisonConsent;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    protected TasteProfile() {}
    public TasteProfile(TunitUser user, Instant now) {
        this.user = Objects.requireNonNull(user); this.userId = user.getId();
        this.status = TasteStatus.INCOMPLETE; this.updatedAt = Objects.requireNonNull(now);
    }
    public UUID getUserId() { return userId; }
    public TunitUser getUser() { return user; }
    public TasteStatus getStatus() { return status; }
    public String getSummary() { return summary; }
    public boolean isPublic() { return isPublic; }
    public boolean isComparisonConsent() { return comparisonConsent; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void updateSelections(TasteStatus status, Instant now) {
        this.status = Objects.requireNonNull(status); this.summary = null; this.updatedAt = Objects.requireNonNull(now);
    }
    public void updateSettings(ProfileSettingsPatch patch, Instant now) {
        if (patch.isPublic() != null) this.isPublic = patch.isPublic();
        if (patch.comparisonConsent() != null) this.comparisonConsent = patch.comparisonConsent();
        this.updatedAt = Objects.requireNonNull(now);
    }
}
