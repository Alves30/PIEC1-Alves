package com.example.PIEC1.services;

import be.tarsos.dsp.AudioDispatcher;
import be.tarsos.dsp.io.jvm.AudioDispatcherFactory;
import be.tarsos.dsp.pitch.PitchDetectionResult;
import be.tarsos.dsp.pitch.PitchProcessor;
import be.tarsos.dsp.pitch.PitchProcessor.PitchEstimationAlgorithm;
import be.tarsos.dsp.AudioEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class AudioProcessingService {

    public String converteFrequenciaParaNotas(float frequencia) {
        final String[] notas = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"};

        // Tratamento para frequência inválida ou silêncio
        if (frequencia <= 0 || Float.isNaN(frequencia)) {
            return "R"; // Representa silêncio (rest)
        }

        // Cálculo preciso da nota usando a fórmula A4 = 440Hz
        double notaNumero = 12 * (Math.log(frequencia / 440.0) / Math.log(2));

        // Arredondamento para a nota mais próxima
        int indiceNota = (int) Math.round(notaNumero) % 12;
        indiceNota = indiceNota < 0 ? indiceNota + 12 : indiceNota;

        // Cálculo da oitava (A4 = 440Hz é a nota A na 4ª oitava)
        int oitava = (int) Math.floor(notaNumero / 12) + 4;

        // Limita a oitavas razoáveis (0-8)
        oitava = Math.max(0, Math.min(8, oitava));

        return notas[indiceNota] + oitava;
    }

    public String processAudio(MultipartFile file) throws Exception {
        InputStream inputStream = file.getInputStream();

        File tempFile = File.createTempFile("audio", ".wav");
        tempFile.deleteOnExit();

        try (FileOutputStream out = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }

        List<String> notasDetectadas = new ArrayList<>();
        final float[] lastPitch = {0};
        final int[] samePitchCount = {0};

        AudioDispatcher dispatcher = AudioDispatcherFactory.fromPipe(
                tempFile.getAbsolutePath(), 44100, 4096, 0); // Buffer maior, overlap zero

        dispatcher.addAudioProcessor(new PitchProcessor(
                PitchEstimationAlgorithm.FFT_YIN, // Algoritmo mais preciso
                44100,
                4096,
                (pitchDetectionResult, audioEvent) -> {
                    float pitch = pitchDetectionResult.getPitch();
                    float probability = pitchDetectionResult.getProbability();

                    // Filtros aprimorados
                    if (pitch > 65 && pitch < 2000 && probability > 0.97) {
                        // Filtro de persistência - só aceita notas estáveis
                        if (Math.abs(pitch - lastPitch[0]) < 10) {
                            samePitchCount[0]++;
                        } else {
                            samePitchCount[0] = 0;
                        }

                        lastPitch[0] = pitch;

                        // Só adiciona se a nota persistiu por 3 detecções
                        if (samePitchCount[0] >= 3) {
                            String nota = converteFrequenciaParaNotas(pitch);
                            if (!notasDetectadas.isEmpty() &&
                                    !notasDetectadas.get(notasDetectadas.size()-1).equals(nota)) {
                                notasDetectadas.add(nota);
                            } else if (notasDetectadas.isEmpty()) {
                                notasDetectadas.add(nota);
                            }
                            samePitchCount[0] = 0; // Reset após adicionar
                        }
                    }
                }));
        dispatcher.run();

        return String.join(",", notasDetectadas);
    }
}