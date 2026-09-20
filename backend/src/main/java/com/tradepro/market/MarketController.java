package com.tradepro.market;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    // Stock search over the static NSE universe. Fast, no external call.
    @GetMapping("/search")
    public List<StockUniverse.Stock> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "10") int limit) {
        return StockUniverse.search(q, Math.min(limit, 30));
    }
}
