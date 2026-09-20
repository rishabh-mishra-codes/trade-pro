package com.tradepro.auth;

import com.tradepro.auth.dto.AuthResponse;
import com.tradepro.auth.dto.ForgotPasswordRequest;
import com.tradepro.auth.dto.LoginRequest;
import com.tradepro.auth.dto.RegisterRequest;
import com.tradepro.auth.dto.ResetPasswordRequest;
import com.tradepro.auth.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${app.expose-reset-token:true}")
    private boolean exposeResetToken;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(authService.currentUser(userId));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.createPasswordResetToken(request.getEmail());

        Map<String, String> body = new HashMap<>();
        body.put("message",
                "If that email exists, a password reset token has been generated.");
        // For dev/testing without email set up, return the token so the reset
        // flow can be completed. Disable by setting app.expose-reset-token=false.
        if (exposeResetToken && token != null) {
            body.put("resetToken", token);
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password has been reset"));
    }
}
