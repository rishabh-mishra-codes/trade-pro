package com.tradepro.alert;

import com.tradepro.auth.AuthException;
import com.tradepro.market.StockUniverse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final PriceAlertRepository repository;

    public AlertController(PriceAlertRepository repository) {
        this.repository = repository;
    }

    public record CreateRequest(String symbol, String name, double targetPrice, String direction) {}

    @GetMapping
    public List<PriceAlert> list(Authentication auth) {
        return repository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<PriceAlert> create(Authentication auth, @RequestBody CreateRequest req) {
        if (req.targetPrice() <= 0) throw new AuthException("Target price must be positive");
        String dir = "BELOW".equalsIgnoreCase(req.direction()) ? "BELOW" : "ABOVE";

        PriceAlert alert = new PriceAlert();
        alert.setUserId(UUID.fromString(auth.getName()));
        alert.setSymbol(req.symbol());
        alert.setName(req.name() != null ? req.name() : StockUniverse.nameFor(req.symbol()));
        alert.setTargetPrice(req.targetPrice());
        alert.setDirection(dir);
        return ResponseEntity.ok(repository.save(alert));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(Authentication auth, @PathVariable UUID id) {
        UUID userId = UUID.fromString(auth.getName());
        repository.findById(id)
                .filter(a -> a.getUserId().equals(userId))
                .ifPresent(repository::delete);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }
}
