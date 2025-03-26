package com.example.PIEC1.services;

import com.example.PIEC1.models.SheetMusic;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SheetMusicService {
    private static final String STORAGE_DIR = "saved_sheets/";

    public SheetMusicService() throws IOException {
        Files.createDirectories(Paths.get(STORAGE_DIR));
    }

    // Salvar nova partitura
    public SheetMusic save(String title, String notes) throws IOException {
        String id = UUID.randomUUID().toString();
        Path filePath = Paths.get(STORAGE_DIR + id + ".txt");
        String content = title + "\n" + notes;
        Files.write(filePath, content.getBytes());
        return new SheetMusic(id, title, notes);
    }

    // Atualizar existente
    public void update(String id, String title, String notes) throws IOException {
        Path filePath = Paths.get(STORAGE_DIR + id + ".txt");
        String content = title + "\n" + notes;
        Files.write(filePath, content.getBytes());
    }

    // Buscar todas
    public List<SheetMusic> getAll() throws IOException {
        return Files.list(Paths.get(STORAGE_DIR))
                .filter(path -> path.toString().endsWith(".txt"))
                .map(path -> {
                    try {
                        String id = path.getFileName().toString().replace(".txt", "");
                        String content = Files.readString(path);
                        String[] parts = content.split("\n", 2);
                        return new SheetMusic(id, parts[0], parts.length > 1 ? parts[1] : "");
                    } catch (IOException e) {
                        throw new RuntimeException("Erro ao ler arquivo", e);
                    }
                }).collect(Collectors.toList());
    }

    // Deletar todas
    public void deleteAll() throws IOException {
        Files.list(Paths.get(STORAGE_DIR))
                .forEach(path -> {
                    try { Files.delete(path); }
                    catch (IOException ignored) {}
                });
    }
}