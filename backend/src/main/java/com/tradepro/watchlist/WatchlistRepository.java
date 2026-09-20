package com.tradepro.watchlist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, UUID> {

    List<WatchlistItem> findByUserId(UUID userId);

    boolean existsByUserIdAndSymbol(UUID userId, String symbol);

    void deleteByUserIdAndSymbol(UUID userId, String symbol);
}
