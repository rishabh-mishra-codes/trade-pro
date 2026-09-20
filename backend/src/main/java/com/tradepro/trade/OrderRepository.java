package com.tradepro.trade;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderRecord, UUID> {

    List<OrderRecord> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<OrderRecord> findByUserIdAndStatus(UUID userId, OrderRecord.Status status);
}
