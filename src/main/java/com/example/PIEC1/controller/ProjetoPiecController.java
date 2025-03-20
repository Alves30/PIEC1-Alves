package com.example.PIEC1.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProjetoPiecController {

    @GetMapping("/")
    public String getHome() {
        return "index"; // Retorna o arquivo index.html em src/main/resources/templates
    }

    @GetMapping("/application")
    public String getApplication() {
        return "application"; // Retorna o arquivo application.html em src/main/resources/templates
    }
}