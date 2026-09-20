package com.tradepro.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    public record ChatRequest(String message) {}

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(
            Authentication auth, @RequestBody ChatRequest req) {
        UUID userId = UUID.fromString(auth.getName());
        String reply = chatService.answer(userId, req.message());
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
