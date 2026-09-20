package com.tradepro.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Minimal client for Google Gemini generateContent. Keeps the API key
 * server-side. Uses the JDK HttpClient to avoid extra dependencies.
 */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-flash-latest}")
    private String model;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Sends a single prompt (system context + user question already combined)
     * and returns the model's text reply.
     */
    public String generate(String prompt) {
        if (!isConfigured()) {
            return "The AI assistant isn't configured. Set app.gemini.api-key on the server.";
        }
        try {
            ObjectNode root = mapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", prompt);

            String url = String.format(ENDPOINT, model);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("X-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(root)))
                    .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("Gemini returned {}: {}", res.statusCode(), res.body());
                return "Sorry, the AI service is unavailable right now.";
            }

            JsonNode body = mapper.readTree(res.body());
            JsonNode text = body.at("/candidates/0/content/parts/0/text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                return "I couldn't generate a response. Please try rephrasing.";
            }
            return text.asText().trim();
        } catch (Exception ex) {
            log.error("Gemini call failed: {}", ex.getMessage());
            return "Sorry, I ran into an error reaching the AI service.";
        }
    }
}
