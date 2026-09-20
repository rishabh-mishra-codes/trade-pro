package com.tradepro.market;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Static list of popular NSE symbols for search. In a real app this would come
 * from an exchange master API; kept static here to avoid extra API calls.
 */
public final class StockUniverse {

    public record Stock(String symbol, String name) {}

    public static final List<Stock> ALL = List.of(
            new Stock("RELIANCE:NSE", "Reliance Industries"),
            new Stock("TCS:NSE", "Tata Consultancy Services"),
            new Stock("INFY:NSE", "Infosys"),
            new Stock("HDFCBANK:NSE", "HDFC Bank"),
            new Stock("ICICIBANK:NSE", "ICICI Bank"),
            new Stock("SBIN:NSE", "State Bank of India"),
            new Stock("TATAMOTORS:NSE", "Tata Motors"),
            new Stock("WIPRO:NSE", "Wipro"),
            new Stock("HINDUNILVR:NSE", "Hindustan Unilever"),
            new Stock("ITC:NSE", "ITC"),
            new Stock("BHARTIARTL:NSE", "Bharti Airtel"),
            new Stock("KOTAKBANK:NSE", "Kotak Mahindra Bank"),
            new Stock("LT:NSE", "Larsen & Toubro"),
            new Stock("AXISBANK:NSE", "Axis Bank"),
            new Stock("BAJFINANCE:NSE", "Bajaj Finance"),
            new Stock("MARUTI:NSE", "Maruti Suzuki"),
            new Stock("ASIANPAINT:NSE", "Asian Paints"),
            new Stock("HCLTECH:NSE", "HCL Technologies"),
            new Stock("SUNPHARMA:NSE", "Sun Pharma"),
            new Stock("TITAN:NSE", "Titan Company"),
            new Stock("ULTRACEMCO:NSE", "UltraTech Cement"),
            new Stock("NESTLEIND:NSE", "Nestle India"),
            new Stock("ADANIENT:NSE", "Adani Enterprises"),
            new Stock("POWERGRID:NSE", "Power Grid"),
            new Stock("NTPC:NSE", "NTPC"),
            new Stock("ONGC:NSE", "ONGC"),
            new Stock("TATASTEEL:NSE", "Tata Steel"),
            new Stock("JSWSTEEL:NSE", "JSW Steel"),
            new Stock("COALINDIA:NSE", "Coal India")
    );

    private static final Map<String, Stock> BY_SYMBOL =
            ALL.stream().collect(Collectors.toMap(Stock::symbol, s -> s, (a, b) -> a));

    public static List<Stock> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return ALL.stream().limit(limit).toList();
        }
        String q = query.toLowerCase();
        return ALL.stream()
                .filter(s -> s.symbol().toLowerCase().contains(q)
                        || s.name().toLowerCase().contains(q))
                .limit(limit)
                .toList();
    }

    public static String nameFor(String symbol) {
        Stock s = BY_SYMBOL.get(symbol);
        return s != null ? s.name() : symbol;
    }

    private StockUniverse() {}
}
