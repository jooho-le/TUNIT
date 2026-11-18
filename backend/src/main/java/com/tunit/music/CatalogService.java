package com.tunit.music;

import com.tunit.auth.*;
import com.tunit.common.persistence.UuidOrder;
import com.tunit.taste.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
    private final CurrentUser current;
    private final TasteTagRepository tags;
    public CatalogService(CurrentUser current, TasteTagRepository tags) { this.current = current; this.tags = tags; }
    @Transactional(readOnly = true)
    public List<TagSummary> tags(TunitPrincipal principal, TagType type) {
        current.read(principal);
        return tags.findByTypeAndActiveTrue(type).stream().sorted((a, b) -> UuidOrder.compare(a.getId(), b.getId()))
            .map(tag -> new TagSummary(tag.getId(), tag.getName(), tag.getType())).toList();
    }
}
