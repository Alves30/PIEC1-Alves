package com.example.PIEC1.controller;

import com.example.PIEC1.services.AudioProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/audio")
@CrossOrigin(origins = "*")
public class AudioController {

    private final AudioProcessingService audioProcessingService;

    @Autowired
    public AudioController(AudioProcessingService audioProcessingService) {
        this.audioProcessingService = audioProcessingService;
    }

    @PostMapping("/process")
    public String processAudio(@RequestParam("file") MultipartFile file) throws Exception {
        return audioProcessingService.processAudio(file);
    }
}