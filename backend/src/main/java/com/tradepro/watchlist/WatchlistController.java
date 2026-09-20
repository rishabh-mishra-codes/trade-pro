package com.tradepro.watchlist;

import com.tradepro.market.StockUniverse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistRepository repository;

    public WatchlistController(WatchlistRepository repository) {
        this.repository = repository;
    }

    public record AddRequest(String symbol, String name) {}

    @GetMapping
    public ResponseEntity<List<WatchlistItem>> list(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<WatchlistItem> items = repository.findByUserId(userId);
        if (items.isEmpty()) {
            // Seed with a few defaults on first use.
            StockUniverse.ALL.stream().limit(5).forEach(s -> {
                WatchlistItem item = new WatchlistItem();
                item.setUserId(userId);
                item.setSymbol(s.symbol());
                item.setName(s.name());
                repository.save(item);
            });
            items = repository.findByUserId(userId);
        }
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<?> add(Authentication auth, @RequestBody AddRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        if (!repository.existsByUserIdAndSymbol(userId, req.symbol())) {
            WatchlistItem item = new WatchlistItem();
            item.setUserId(userId);
            item.setSymbol(req.symbol());
            item.setName(req.name() != null ? req.name() : StockUniverse.nameFor(req.symbol()));
            repository.save(item);
        }
        return ResponseEntity.ok(repository.findByUserId(userId));
    }

    @DeleteMapping("/{symbol}")
    @Transactional
    public ResponseEntity<?> remove(Authentication auth, @PathVariable String symbol) {
        UUID userId = UUID.fromString(auth.getName());
        repository.deleteByUserIdAndSymbol(userId, symbol);
        return ResponseEntity.ok(Map.of("message", "removed"));
    }
}
