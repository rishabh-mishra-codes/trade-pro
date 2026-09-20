package com.tradepro.chat;

import com.tradepro.market.TwelveDataClient;
import com.tradepro.trade.Holding;
import com.tradepro.trade.TradeService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatService {

    private final GeminiClient gemini;
    private final TradeService tradeService;
    private final TwelveDataClient marketClient;

    public ChatService(
            GeminiClient gemini,
            TradeService tradeService,
            TwelveDataClient marketClient) {
        this.gemini = gemini;
        this.tradeService = tradeService;
        this.marketClient = marketClient;
    }

    public String answer(UUID userId, String question) {
        if (question == null || question.isBlank()) {
            return "Ask me about your holdings, P&L, cash balance, or a stock price.";
        }

        double wallet = tradeService.getWallet(userId);
        List<Holding> holdings = tradeService.getHoldings(userId);

        // Fetch live prices for the user's holdings (best effort).
        Map<String, Double> prices = holdings.isEmpty()
                ? Map.of()
                : marketClient.getPrices(holdings.stream().map(Holding::getSymbol).distinct().toList());

        String prompt = buildPrompt(wallet, holdings, prices, question);
        return gemini.generate(prompt);
    }

    private String buildPrompt(
            double wallet, List<Holding> holdings,
            Map<String, Double> prices, String question) {

        StringBuilder ctx = new StringBuilder();
        ctx.append("You are TradePro Assistant, a concise, friendly assistant inside a ")
           .append("stock trading app for Indian (NSE) markets. Answer ONLY using the ")
           .append("portfolio data and live prices provided below. If asked something ")
           .append("outside this data or for financial advice, say you can share data ")
           .append("but cannot give investment advice. Use ₹ for money. Keep answers short.\n\n");

        ctx.append("=== USER PORTFOLIO ===\n");
        ctx.append(String.format(Locale.ENGLISH, "Available cash: ₹%,.2f%n", wallet));

        if (holdings.isEmpty()) {
            ctx.append("Holdings: none yet.\n");
        } else {
            ctx.append("Holdings:\n");
            double totalValue = 0, totalInvested = 0;
            for (Holding h : holdings) {
                double last = prices.getOrDefault(h.getSymbol(), h.getAvgPrice());
                double value = last * h.getQuantity();
                double invested = h.getAvgPrice() * h.getQuantity();
                double pnl = value - invested;
                totalValue += value;
                totalInvested += invested;
                ctx.append(String.format(Locale.ENGLISH,
                        "- %s (%s): qty %d, avg ₹%,.2f, LTP ₹%,.2f, value ₹%,.2f, P&L ₹%,.2f%n",
                        h.getName(), h.getSymbol(), h.getQuantity(),
                        h.getAvgPrice(), last, value, pnl));
            }
            double totalPnl = totalValue - totalInvested;
            ctx.append(String.format(Locale.ENGLISH,
                    "Total holdings value: ₹%,.2f | Invested: ₹%,.2f | Total P&L: ₹%,.2f%n",
                    totalValue, totalInvested, totalPnl));
            ctx.append(String.format(Locale.ENGLISH,
                    "Total portfolio (cash + holdings): ₹%,.2f%n", wallet + totalValue));
        }

        if (!prices.isEmpty()) {
            ctx.append("\nLive prices:\n");
            prices.forEach((sym, p) ->
                    ctx.append(String.format(Locale.ENGLISH, "- %s: ₹%,.2f%n", sym, p)));
        } else {
            ctx.append("\n(Live prices are currently unavailable.)\n");
        }

        ctx.append("\n=== USER QUESTION ===\n").append(question);
        return ctx.toString();
    }
}
