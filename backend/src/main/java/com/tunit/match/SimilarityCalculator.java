package com.tunit.match;

import java.util.*;
import org.springframework.stereotype.Component;

/** Version 1 hypothesis approved for initial implementation: 30/30/40, not a relationship probability. */
@Component
public class SimilarityCalculator {
    public record Result(Double score, SimilarityBreakdown breakdown) {}
    public Result compare(Set<UUID> artistsA, Set<UUID> artistsB, Set<UUID> tracksA, Set<UUID> tracksB,
                          Map<UUID, Double> genresA, Map<UUID, Double> genresB) {
        Double artist = jaccard(artistsA, artistsB), track = jaccard(tracksA, tracksB), genre = cosine(genresA, genresB);
        double numerator = 0, denominator = 0;
        if (artist != null) { numerator += .3 * artist; denominator += .3; }
        if (track != null) { numerator += .3 * track; denominator += .3; }
        if (genre != null) { numerator += .4 * genre; denominator += .4; }
        return new Result(denominator == 0 ? null : clamp(numerator / denominator), new SimilarityBreakdown(artist, track, genre));
    }
    private Double jaccard(Set<UUID> a, Set<UUID> b) {
        if (a.isEmpty() || b.isEmpty()) return null;
        var union = new HashSet<>(a); union.addAll(b);
        long common = a.stream().filter(b::contains).count();
        return (double) common / union.size();
    }
    public Double cosine(Map<UUID, Double> a, Map<UUID, Double> b) {
        if (a.isEmpty() || b.isEmpty()) return null;
        double dot = a.entrySet().stream().mapToDouble(e -> e.getValue() * b.getOrDefault(e.getKey(), 0d)).sum();
        double aa = a.values().stream().mapToDouble(x -> x*x).sum(), bb = b.values().stream().mapToDouble(x -> x*x).sum();
        return aa == 0 || bb == 0 ? null : clamp(dot / Math.sqrt(aa * bb));
    }
    private double clamp(double value) { return Math.max(0, Math.min(1, value)); }
}
