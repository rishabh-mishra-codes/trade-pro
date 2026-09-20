package com.tradepro.user;

import com.tradepro.auth.AuthException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserAccountRepository repository;

    public ProfileController(UserAccountRepository repository) {
        this.repository = repository;
    }

    public record ThemeRequest(String theme) {}

    @PutMapping("/theme")
    public ResponseEntity<Map<String, String>> setTheme(
            Authentication auth, @RequestBody ThemeRequest req) {
        String theme = "light".equalsIgnoreCase(req.theme()) ? "light" : "dark";
        UserAccount user = repository.findById(UUID.fromString(auth.getName()))
                .orElseThrow(() -> new AuthException("User not found"));
        user.setTheme(theme);
        repository.save(user);
        return ResponseEntity.ok(Map.of("theme", theme));
    }
}
