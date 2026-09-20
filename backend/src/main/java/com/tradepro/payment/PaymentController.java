package com.tradepro.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import com.tradepro.trade.TradeService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final TradeService tradeService;

    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    public PaymentController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    // Body: { "amount": 5000 }  (amount in rupees)
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            double rupees = Double.parseDouble(String.valueOf(body.get("amount")));
            int paise = (int) Math.round(rupees * 100);

            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", paise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());

            Order order = client.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("id", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Could not create payment order"));
        }
    }

    // Body: razorpay_order_id, razorpay_payment_id, razorpay_signature, amount
    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            Authentication auth, @RequestBody Map<String, String> body) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", body.get("razorpay_order_id"));
            attributes.put("razorpay_payment_id", body.get("razorpay_payment_id"));
            attributes.put("razorpay_signature", body.get("razorpay_signature"));

            boolean valid = Utils.verifyPaymentSignature(attributes, keySecret);
            if (!valid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid payment signature"));
            }

            // Credit the wallet server-side after a verified payment.
            double amount = Double.parseDouble(String.valueOf(body.getOrDefault("amount", "0")));
            if (amount > 0) {
                tradeService.addFunds(UUID.fromString(auth.getName()), amount);
            }
            return ResponseEntity.ok(Map.of("message", "Payment verified"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Verification failed"));
        }
    }
}
