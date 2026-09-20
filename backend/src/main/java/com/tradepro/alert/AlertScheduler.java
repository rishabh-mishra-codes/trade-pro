package com.tradepro.alert;

import com.tradepro.market.TwelveDataClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Periodically checks untriggered price alerts against live prices and marks
 * them triggered. Batches distinct symbols into a single market call to stay
 * within the free API rate limit.
 */
@Component
public class AlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertScheduler.class);

    private final PriceAlertRepository repository;
    private final TwelveDataClient marketClient;

    public AlertScheduler(PriceAlertRepository repository, TwelveDataClient marketClient) {
        this.repository = repository;
        this.marketClient = marketClient;
    }

    // Every 60s. Skips work when nothing is pending or API isn't configured.
    @Scheduled(fixedDelayString = "${app.alerts.check-interval-ms:60000}")
    public void checkAlerts() {
        if (!marketClient.isConfigured()) return;

        List<PriceAlert> pending = repository.findAll().stream()
                .filter(a -> !a.isTriggered())
                .toList();
        if (pending.isEmpty()) return;

        List<String> symbols = pending.stream()
                .map(PriceAlert::getSymbol)
                .distinct()
                .toList();

        Map<String, Double> prices = marketClient.getPrices(symbols);
        if (prices.isEmpty()) return;

        for (PriceAlert alert : pending) {
            Double price = prices.get(alert.getSymbol());
            if (price == null) continue;

            boolean hit = "ABOVE".equals(alert.getDirection())
                    ? price >= alert.getTargetPrice()
                    : price <= alert.getTargetPrice();

            if (hit) {
                alert.setTriggered(true);
                repository.save(alert);
                log.info("Price alert triggered: {} {} {} (now {})",
                        alert.getSymbol(), alert.getDirection(),
                        alert.getTargetPrice(), price);
            }
        }
    }
}
