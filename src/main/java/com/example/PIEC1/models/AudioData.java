package com.example.PIEC1.models;

//Para processar o arquivo de aúdio WAV recebido pelo front

public class AudioData {
    private String filename;
    private byte[] audioData;
    private float durationOfAudio;
    private String format;

    public AudioData(String filename, byte[] audioData, float durationOfAudio, String format) {
        this.filename = filename;
        this.audioData = audioData;
        this.durationOfAudio = durationOfAudio;
        this.format = format;
    }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public byte[] getData() { return audioData; }
    public void setData(byte[] data) { this.audioData = data; }

    public float getDuration() { return durationOfAudio; }
    public void setDuration(float duration) { this.durationOfAudio = duration; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
}
