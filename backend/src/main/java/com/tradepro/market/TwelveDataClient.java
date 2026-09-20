package com.tradepro.market;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal server-side Twelve Data client used by the alert scheduler.
 * Uses the JDK HttpClient (no extra deps). Returns latest price per symbol.
 */
@Component
public class TwelveDataClient {

    private static final Logger log = LoggerFactory.getLogger(TwelveDataClient.class);
    private static final String BASE = "https://api.twelvedata.com";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.twelvedata.api-key:}")
    private String apiKey;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Returns symbol -> last price. Empty on any failure. */
    public Map<String, Double> getPrices(List<String> symbols) {
        Map<String, Double> out = new HashMap<>();
        if (!isConfigured() || symbols.isEmpty()) return out;

        try {
            String joined = String.join(",", symbols);
            String url = BASE + "/quote?symbol="
                    + URLEncoder.encode(joined, StandardCharsets.UTF_8)
                    + "&apikey=" + apiKey;

            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return out;

            JsonNode root = mapper.readTree(res.body());
            if (symbols.size() == 1) {
                addPrice(out, symbols.get(0), root);
            } else {
                for (String s : symbols) {
                    JsonNode node = root.get(s);
                    if (node != null) addPrice(out, s, node);
                }
            }
        } catch (Exception ex) {
            log.debug("TwelveData fetch failed: {}", ex.getMessage());
        }
        return out;
    }

    private void addPrice(Map<String, Double> out, String symbol, JsonNode node) {
        JsonNode close = node.get("close");
        if (close != null && close.isTextual()) {
            try {
                out.put(symbol, Double.parseDouble(close.asText()));
            } catch (NumberFormatException ignored) {
            }
        }
    }
}
