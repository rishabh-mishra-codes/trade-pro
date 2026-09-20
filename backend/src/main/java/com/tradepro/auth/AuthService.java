package com.tradepro.auth;

import com.tradepro.auth.dto.AuthResponse;
import com.tradepro.auth.dto.LoginRequest;
import com.tradepro.auth.dto.RegisterRequest;
import com.tradepro.auth.dto.UserResponse;
import com.tradepro.user.UserAccount;
import com.tradepro.user.UserAccountRepository;
import com.tradepro.security.JwtService;
import com.tradepro.email.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(
            UserAccountRepository repository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new AuthException("An account with this email already exists");
        }

        UserAccount account = new UserAccount();
        account.setFullName(request.getFullName());
        account.setEmail(request.getEmail().toLowerCase());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setPhoneNumber(request.getPhoneNumber());
        account.setAddress(request.getAddress());
        account.setDateOfBirth(request.getDateOfBirth());
        account.setMembershipStatus("active");

        UserAccount saved = repository.save(account);
        return buildResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount account = repository
                .findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new AuthException("Invalid email or password");
        }

        return buildResponse(account);
    }

    public UserResponse currentUser(String userId) {
        UserAccount account = repository
                .findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found"));
        return UserResponse.from(account);
    }

    // Generates a reset token. Returns the token so it can be emailed (or, in
    // dev, returned to the client). Does not reveal whether the email exists.
    public String createPasswordResetToken(String email) {
        return repository.findByEmailIgnoreCase(email)
                .map(account -> {
                    String token = UUID.randomUUID().toString().replace("-", "");
                    account.setResetToken(token);
                    account.setResetTokenExpiry(
                            java.time.Instant.now().plusSeconds(3600));
                    repository.save(account);
                    emailService.sendPasswordReset(account.getEmail(), token);
                    return token;
                })
                .orElse(null);
    }

    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new AuthException("Password must be at least 8 characters");
        }
        UserAccount account = repository.findByResetToken(token)
                .orElseThrow(() -> new AuthException("Invalid or expired reset token"));

        if (account.getResetTokenExpiry() == null
                || account.getResetTokenExpiry().isBefore(java.time.Instant.now())) {
            throw new AuthException("Invalid or expired reset token");
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setResetToken(null);
        account.setResetTokenExpiry(null);
        repository.save(account);
    }

    private AuthResponse buildResponse(UserAccount account) {
        String token = jwtService.generateToken(
                account.getId().toString(), account.getEmail());
        return new AuthResponse(token, UserResponse.from(account));
    }
}
