package com.tradepro.trade;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class TradeController {

    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    public record TradeRequest(String symbol, String name, double price, int qty) {}
    public record FundsRequest(double amount) {}
    public record LimitOrderRequest(String symbol, String name, String side, double price, int qty) {}

    @GetMapping("/portfolio")
    public ResponseEntity<Map<String, Object>> portfolio(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<Holding> holdings = tradeService.getHoldings(userId);
        return ResponseEntity.ok(Map.of(
                "wallet", tradeService.getWallet(userId),
                "holdings", holdings));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderRecord>> orders(Authentication auth) {
        return ResponseEntity.ok(tradeService.getOrders(UUID.fromString(auth.getName())));
    }

    @PostMapping("/orders/limit")
    public ResponseEntity<OrderRecord> limitOrder(
            Authentication auth, @RequestBody LimitOrderRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        OrderRecord.Side side = "SELL".equalsIgnoreCase(req.side())
                ? OrderRecord.Side.SELL : OrderRecord.Side.BUY;
        return ResponseEntity.ok(tradeService.placeLimitOrder(
                userId, req.symbol(), req.name(), side, req.price(), req.qty()));
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<Map<String, String>> cancelOrder(
            Authentication auth, @PathVariable UUID id) {
        tradeService.cancelOrder(UUID.fromString(auth.getName()), id);
        return ResponseEntity.ok(Map.of("message", "Order cancelled"));
    }

    @PostMapping("/trades/buy")
    public ResponseEntity<Map<String, String>> buy(
            Authentication auth, @RequestBody TradeRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        tradeService.buy(userId, req.symbol(), req.name(), req.price(), req.qty());
        return ResponseEntity.ok(Map.of("message", "Buy order executed"));
    }

    @PostMapping("/trades/sell")
    public ResponseEntity<Map<String, String>> sell(
            Authentication auth, @RequestBody TradeRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        tradeService.sell(userId, req.symbol(), req.price(), req.qty());
        return ResponseEntity.ok(Map.of("message", "Sell order executed"));
    }

    @PostMapping("/wallet/add-funds")
    public ResponseEntity<Map<String, Object>> addFunds(
            Authentication auth, @RequestBody FundsRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        double balance = tradeService.addFunds(userId, req.amount());
        return ResponseEntity.ok(Map.of("wallet", balance));
    }
}
