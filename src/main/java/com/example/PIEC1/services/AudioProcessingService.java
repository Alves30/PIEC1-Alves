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
        int notaNumero = (int) Math.round(12 * (Math.log(frequencia / 440.0) / Math.log(2)));
        int indiceNota = (notaNumero + 69) % 12;
        int oitava = (notaNumero + 69) / 12  - 1;
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

        AudioDispatcher dispatcher = AudioDispatcherFactory.fromPipe(
                tempFile.getAbsolutePath(), 44100, 2048, 1024 // Aumentei o tamanho do buffer para 2048
        );


        dispatcher.addAudioProcessor(new PitchProcessor(PitchEstimationAlgorithm.YIN, 44100, 1024, (pitchDetectionResult, audioEvent) -> {
            float pitch = pitchDetectionResult.getPitch();
            float probability = pitchDetectionResult.getProbability();

            // Filtro: ignora notas com pitch fora do intervalo esperado ou com baixa probabilidade
            if (pitch > 50 && pitch < 2000 && probability > 0.95) { // Frequências entre 50 Hz e 2000 Hz
                String nota = converteFrequenciaParaNotas(pitch);
                notasDetectadas.add(nota);
            }
        }));
        dispatcher.run();

        return String.join(",", notasDetectadas);
    }
}