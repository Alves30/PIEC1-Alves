//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

// Event listeners originais
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

// ============= NOVOS EVENT LISTENERS =============
document.getElementById("clearSheetMusicButton").addEventListener("click", clearSheetMusic);
document.getElementById("clearRecordingsButton").addEventListener("click", clearRecordings);
document.getElementById("clearSheetsButton").addEventListener("click", async () => {
    await fetch('/api/sheets', { method: 'DELETE' });
    loadSavedSheets();
});

// ============= FUNÇÕES ORIGINAIS =============
function clearSheetMusic() {
    var canvas = document.getElementById("sheet-music");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Partitura limpa.");
}

function clearRecordings() {
    var recordingsList = document.getElementById("recordingsList");
    recordingsList.innerHTML = "";
    console.log("Gravações limpas.");
}

function startRecording() {
    console.log("recordButton clicked");

    var constraints = { audio: true, video: false };

    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false;
    recordButton.classList.add("recording");

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
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
        recordButton.classList.remove("recording");
    });
}

function stopRecording() {
    console.log("stopButton clicked");

    stopButton.disabled = true;
    recordButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.innerHTML = "Pause";
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

// ============= FUNÇÕES MODIFICADAS =============
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
                console.log("Notas detectadas:", e.target.responseText);
                renderSheetMusic(e.target.responseText);
                saveSheet(e.target.responseText); // SALVAMENTO AUTOMÁTICO AQUI
            }
        };
        var fd = new FormData();
        fd.append("file", blob, filename);
        xhr.open("POST", "/api/audio/process", true);
        xhr.send(fd);
    });

    li.appendChild(document.createTextNode(" "));
    li.appendChild(upload);
    recordingsList.appendChild(li);
}



// ============= NOVAS FUNÇÕES DE EDIÇÃO =============
let currentEditingId = null;

function openEditSheet(id, title, notes) {
    currentEditingId = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editNotes').value = notes;
    document.getElementById('editModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEditedSheet() {
    const title = document.getElementById('editTitle').value;
    const notes = document.getElementById('editNotes').value;

    try {
        await fetch(`/api/sheets/${currentEditingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, notes })
        });
        loadSavedSheets();
        closeModal();
    } catch (error) {
        console.error("Erro ao salvar edição:", error);
    }
}

// ============= ATUALIZAÇÃO DA LISTAGEM =============
async function loadSavedSheets() {
    try {
        const response = await fetch('/api/sheets');
        const sheets = await response.json();
        const sheetList = document.getElementById('savedSheetsList');
        sheetList.innerHTML = '';

        sheets.forEach(sheet => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="sheet-title">${sheet.title}</span>
                <button onclick="openEditSheet('${sheet.id}', '${sheet.title}', '${sheet.notes}')">Editar</button>
                <button onclick="renderSavedSheet('${sheet.notes}')">Visualizar</button>
            `;
            sheetList.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao carregar partituras:", error);
    }
}

async function saveSheet(notes) {
    try {
        const title = `Partitura ${new Date().toLocaleDateString()}`; // Título padrão
        await fetch('/api/sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 👈 Corrige o Content-Type
            },
            body: JSON.stringify({
                title: title,
                notes: notes
            })
        });
        loadSavedSheets();
    } catch (error) {
        console.error("Erro ao salvar partitura:", error);
    }
}

// Função para salvar edição
async function saveEditedSheet() {
    const title = document.getElementById('editTitle').value;
    const notes = document.getElementById('editNotes').value;

    try {
        await fetch(`/api/sheets/${currentEditingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json' // 👈 Header correto
            },
            body: JSON.stringify({
                title: title,
                notes: notes
            })
        });
        loadSavedSheets();
        closeModal();
    } catch (error) {
        console.error("Erro ao salvar edição:", error);
    }
}

function renderSavedSheet(notes) {
    renderSheetMusic(notes); // Reutiliza a função existente de renderização
}

// ============= INICIALIZAÇÃO =============
window.addEventListener('load', () => {
    loadSavedSheets(); // CARREGA PARTITURAS AO INICIAR
});

// Função de renderização original (mantida sem alterações)
function renderSheetMusic(notes) {
    if (!notes || notes.trim() === "") {
        console.error("Nenhuma nota detectada.");
        return;
    }

    notes = notes.replace(/\s+/g, "").toUpperCase();
    var notesArray = notes.split(",").map(note => note + "/8");

    var vf = new Vex.Flow.Factory({
        renderer: { elementId: 'sheet-music', width: 800, height: 600 }
    });

    var score = vf.EasyScore();
    var system = vf.System();

    try {
        var groupedNotes = [];
        for (var i = 0; i < notesArray.length; i += 8) {
            var group = notesArray.slice(i, i + 8);
            while (group.length < 8) group.push("B4/r");
            groupedNotes.push(group.join(","));
        }

        groupedNotes.forEach(function (group) {
            system.addStave({
                voices: [score.voice(score.notes(group, { stem: 'up' }))]
            }).addClef('treble').addTimeSignature('8/8');
        });

        vf.draw();
    } catch (error) {
        console.error("Erro ao renderizar:", error);
    }
}