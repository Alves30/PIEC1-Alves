//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

// Função para limpar a partitura
function clearSheetMusic() {
    var canvas = document.getElementById("sheet-music");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas
    console.log("Partitura limpa.");
}

// Função para limpar as gravações
function clearRecordings() {
    var recordingsList = document.getElementById("recordingsList");
    recordingsList.innerHTML = ""; // Remove todos os itens da lista
    console.log("Gravações limpas.");
}

// Adiciona eventos aos botões de limpar
document.getElementById("clearSheetMusicButton").addEventListener("click", clearSheetMusic);
document.getElementById("clearRecordingsButton").addEventListener("click", clearRecordings);

function startRecording() {
    console.log("recordButton clicked");

    var constraints = { audio: true, video: false };

    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false;

    // Adiciona a classe "recording" ao botão Record
    recordButton.classList.add("recording");

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

        audioContext = new AudioContext();

        document.getElementById("formats").innerHTML = "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz";

        gumStream = stream;
        input = audioContext.createMediaStreamSource(stream);

        rec = new Recorder(input, { numChannels: 1 });

        rec.record();

        console.log("Recording started");

    }).catch(function(err) {
        recordButton.disabled = false;
        stopButton.disabled = true;
        pauseButton.disabled = true;

        // Remove a classe "recording" se houver erro
        recordButton.classList.remove("recording");
    });
}

function stopRecording() {
    console.log("stopButton clicked");

    stopButton.disabled = true;
    recordButton.disabled = false;
    pauseButton.disabled = true;

    pauseButton.innerHTML = "Pause";

    // Remove a classe "recording" ao parar a gravação
    recordButton.classList.remove("recording");

    rec.stop();

    gumStream.getAudioTracks()[0].stop();

    rec.exportWAV(createDownloadLink);
}

function pauseRecording() {
    console.log("pauseButton clicked rec.recording=", rec.recording);
    if (rec.recording) {
        rec.stop();
        pauseButton.innerHTML = "Resume";
    } else {
        rec.record();
        pauseButton.innerHTML = "Pause";
    }
}



function createDownloadLink(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');

    var filename = new Date().toISOString();

    au.controls = true;
    au.src = url;

    link.href = url;
    link.download = filename + ".wav";
    link.innerHTML = "Save to disk";

    li.appendChild(au);
    li.appendChild(document.createTextNode(filename + ".wav "));
    li.appendChild(link);

    var upload = document.createElement('a');
    upload.href = "#";
    upload.innerHTML = "Upload";
    upload.addEventListener("click", function(event) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            if (this.readyState === 4) {
                console.log("Resposta do servidor:", e.target.responseText);
                renderSheetMusic(e.target.responseText); // Renderiza a partitura
            }
        };
        var fd = new FormData();
        fd.append("file", blob, filename); // Nome do campo correto
        console.log("Enviando arquivo:", filename);
        xhr.open("POST", "/api/audio/process", true);
        xhr.send(fd);
    });
    li.appendChild(document.createTextNode(" "));
    li.appendChild(upload);

    recordingsList.appendChild(li);
}


function renderSheetMusic(notes) {
    if (!notes || notes.trim() === "") {
        console.error("Nenhuma nota detectada para renderizar.");
        return;
    }

    // Remove espaços extras e caracteres inválidos
    notes = notes.replace(/\s+/g, "").toUpperCase();

    // Converte notas sem duração para colcheias "/8"
    var notesArray = notes.split(",").map(note => note + "/8");

    // Cria o contexto do VexFlow com um canvas maior
    var vf = new Vex.Flow.Factory({
        renderer: { elementId: 'sheet-music', width: 800, height: 600 } // Ajuste o tamanho conforme necessário
    });

    var score = vf.EasyScore();
    var system = vf.System();

    try {
        // Divide as notas em grupos de 8 (para compassos 8/8)
        var groupedNotes = [];
        for (var i = 0; i < notesArray.length; i += 8) {
            var group = notesArray.slice(i, i + 8);
            while (group.length < 8) {
                group.push("B4/r"); // Adiciona pausas se necessário
            }
            groupedNotes.push(group.join(","));
        }

        // Adiciona cada grupo de notas como um compasso separado
        groupedNotes.forEach(function (group) {
            system.addStave({
                voices: [
                    score.voice(score.notes(group, { stem: 'up' }))
                ]
            }).addClef('treble').addTimeSignature('8/8'); // Time signature 8/8
        });

        // Renderiza a partitura
        vf.draw();
    } catch (error) {
        console.error("Erro ao renderizar a partitura:", error);
    }
}