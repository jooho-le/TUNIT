package com.tunit.common.persistence;

import java.util.UUID;

/** PostgreSQL UUID compares unsigned bytes; UUID.compareTo uses signed longs. */
public final class UuidOrder {
    private UuidOrder() {}
    public static int compare(UUID a, UUID b) {
        int high = Long.compareUnsigned(a.getMostSignificantBits(), b.getMostSignificantBits());
        return high != 0 ? high : Long.compareUnsigned(a.getLeastSignificantBits(), b.getLeastSignificantBits());
    }
}
