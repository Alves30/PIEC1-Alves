package com.example.PIEC1.models;


public class Note {
    private String nameOfNote; // -> Dó Ré Mí etc...
    private int octave; //-> A oitava da nota
    private float frequency;
    private float duration; //-> Duração da nota em segundos

    public Note(String name, int octave, float frequency, float duration) {
        this.nameOfNote = name;
        this.octave = octave;
        this.frequency = frequency;
        this.duration = duration;
    }

    public String getName() { return nameOfNote; }
    public void setName(String name) { this.nameOfNote = name; }

    public int getOctave() { return octave; }
    public void setOctave(int octave) { this.octave = octave; }

    public float getFrequency() { return frequency; }
    public void setFrequency(float frequency) { this.frequency = frequency; }

    public float getDuration() { return duration; }
    public void setDuration(float duration) { this.duration = duration; }
}
