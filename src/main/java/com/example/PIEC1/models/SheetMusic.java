package com.example.PIEC1.models;

import java.time.LocalDateTime;

public class SheetMusic {
    private String id;
    private String title;
    private String notes;
    private LocalDateTime createdDate;

    public SheetMusic(String id, String title, String notes) {
        this.id = id;
        this.title = title;
        this.notes = notes;
        this.createdDate = LocalDateTime.now();
    }

    // Getters e Setters
    public String getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedDate() { return createdDate; }
}