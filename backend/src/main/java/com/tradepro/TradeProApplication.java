package com.tradepro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TradeProApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeProApplication.class, args);
    }
}
