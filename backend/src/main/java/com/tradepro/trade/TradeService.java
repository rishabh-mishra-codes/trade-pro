package com.tradepro.trade;

import com.tradepro.auth.AuthException;
import com.tradepro.user.UserAccount;
import com.tradepro.user.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TradeService {

    private final HoldingRepository holdingRepository;
    private final UserAccountRepository userRepository;
    private final OrderRepository orderRepository;

    public TradeService(
            HoldingRepository holdingRepository,
            UserAccountRepository userRepository,
            OrderRepository orderRepository) {
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public List<OrderRecord> getOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<OrderRecord> getPendingOrders(UUID userId) {
        return orderRepository.findByUserIdAndStatus(userId, OrderRecord.Status.PENDING);
    }

    @Transactional
    public OrderRecord placeLimitOrder(
            UUID userId, String symbol, String name,
            OrderRecord.Side side, double price, int qty) {
        if (qty <= 0 || price <= 0) throw new AuthException("Invalid order");
        OrderRecord order = new OrderRecord();
        order.setUserId(userId);
        order.setSymbol(symbol);
        order.setName(name);
        order.setSide(side);
        order.setType(OrderRecord.Type.LIMIT);
        order.setStatus(OrderRecord.Status.PENDING);
        order.setQuantity(qty);
        order.setPrice(price);
        return orderRepository.save(order);
    }

    @Transactional
    public void cancelOrder(UUID userId, UUID orderId) {
        OrderRecord order = orderRepository.findById(orderId)
                .filter(o -> o.getUserId().equals(userId))
                .orElseThrow(() -> new AuthException("Order not found"));
        if (order.getStatus() != OrderRecord.Status.PENDING) {
            throw new AuthException("Only pending orders can be cancelled");
        }
        order.setStatus(OrderRecord.Status.CANCELLED);
        orderRepository.save(order);
    }

    private void recordOrder(
            UUID userId, String symbol, String name,
            OrderRecord.Side side, double price, int qty) {
        OrderRecord order = new OrderRecord();
        order.setUserId(userId);
        order.setSymbol(symbol);
        order.setName(name);
        order.setSide(side);
        order.setType(OrderRecord.Type.MARKET);
        order.setStatus(OrderRecord.Status.EXECUTED);
        order.setQuantity(qty);
        order.setPrice(price);
        orderRepository.save(order);
    }

    public List<Holding> getHoldings(UUID userId) {
        return holdingRepository.findByUserId(userId);
    }

    public double getWallet(UUID userId) {
        return loadUser(userId).getWalletBalance();
    }

    @Transactional
    public double addFunds(UUID userId, double amount) {
        if (amount <= 0) throw new AuthException("Amount must be positive");
        UserAccount user = loadUser(userId);
        user.setWalletBalance(round(user.getWalletBalance() + amount));
        userRepository.save(user);
        return user.getWalletBalance();
    }

    @Transactional
    public void buy(UUID userId, String symbol, String name, double price, int qty) {
        if (qty <= 0 || price <= 0) throw new AuthException("Invalid trade");
        UserAccount user = loadUser(userId);
        double cost = price * qty;
        if (cost > user.getWalletBalance()) {
            throw new AuthException("Insufficient balance for this trade");
        }

        Holding holding = holdingRepository
                .findByUserIdAndSymbol(userId, symbol)
                .orElse(null);

        if (holding == null) {
            holding = new Holding();
            holding.setUserId(userId);
            holding.setSymbol(symbol);
            holding.setName(name);
            holding.setQuantity(qty);
            holding.setAvgPrice(round(price));
        } else {
            int totalQty = holding.getQuantity() + qty;
            double totalCost = holding.getAvgPrice() * holding.getQuantity() + cost;
            holding.setQuantity(totalQty);
            holding.setAvgPrice(round(totalCost / totalQty));
        }
        holdingRepository.save(holding);

        user.setWalletBalance(round(user.getWalletBalance() - cost));
        userRepository.save(user);
        recordOrder(userId, symbol, name, OrderRecord.Side.BUY, price, qty);
    }

    @Transactional
    public void sell(UUID userId, String symbol, double price, int qty) {
        if (qty <= 0 || price <= 0) throw new AuthException("Invalid trade");
        UserAccount user = loadUser(userId);

        Holding holding = holdingRepository
                .findByUserIdAndSymbol(userId, symbol)
                .orElseThrow(() -> new AuthException("You don't own this stock"));

        if (holding.getQuantity() < qty) {
            throw new AuthException("You don't own enough shares to sell");
        }

        holding.setQuantity(holding.getQuantity() - qty);
        if (holding.getQuantity() == 0) {
            holdingRepository.delete(holding);
        } else {
            holdingRepository.save(holding);
        }

        user.setWalletBalance(round(user.getWalletBalance() + price * qty));
        userRepository.save(user);
        recordOrder(userId, symbol, holding.getName(), OrderRecord.Side.SELL, price, qty);
    }

    private UserAccount loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
