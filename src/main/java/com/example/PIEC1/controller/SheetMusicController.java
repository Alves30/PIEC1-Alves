package com.example.PIEC1.controller;

import com.example.PIEC1.models.SheetMusic;
import com.example.PIEC1.services.SheetMusicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/sheets")
@CrossOrigin(origins = "*")
public class SheetMusicController {

    @Autowired
    private SheetMusicService sheetService;

    @PostMapping
    public ResponseEntity<SheetMusic> saveSheet(@RequestBody SheetRequest request) throws IOException {
        return ResponseEntity.ok(sheetService.save(request.title, request.notes));
    }

    @GetMapping
    public ResponseEntity<List<SheetMusic>> getAllSheets() throws IOException {
        return ResponseEntity.ok(sheetService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateSheet(
            @PathVariable String id,
            @RequestBody SheetRequest request) throws IOException {
        sheetService.update(id, request.title, request.notes);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearSheets() throws IOException {
        sheetService.deleteAll();
        return ResponseEntity.ok().build();
    }

    // Classe auxiliar para requisições
    static class SheetRequest {
        public String title;
        public String notes;
    }
}