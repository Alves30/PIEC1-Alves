// Variáveis globais
let gumStream;
let rec;
let input;
let audioContext;
let currentEditingId = null;

// Constantes
const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const pauseButton = document.getElementById("pauseButton");
const clearSheetMusicButton = document.getElementById("clearSheetMusicButton");
const clearRecordingsButton = document.getElementById("clearRecordingsButton");
const clearSheetsButton = document.getElementById("clearSheetsButton");
const recordingsList = document.getElementById("recordingsList");
const savedSheetsList = document.getElementById("savedSheetsList");

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSavedSheets();
});

function setupEventListeners() {
    // Botões de gravação
    recordButton.addEventListener("click", startRecording);
    stopButton.addEventListener("click", stopRecording);
    pauseButton.addEventListener("click", pauseRecording);

    // Botões de limpeza
    clearSheetMusicButton.addEventListener("click", clearSheetMusic);
    clearRecordingsButton.addEventListener("click", clearRecordings);
    clearSheetsButton.addEventListener("click", confirmClearAllSheets);

    // Modal
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// Funções de gravação de áudio
function startRecording() {
    console.log("Iniciando gravação...");

    const constraints = {
        audio: {
            echoCancellation: false, // Desative para melhor qualidade musical
            noiseSuppression: false, // Desative para capturar todas as frequências
            autoGainControl: false,  // Desative para evitar normalização automática
            channelCount: 1,         // Mono é suficiente para análise musical
            sampleRate: 44100,       // Taxa de amostragem de CD
            sampleSize: 16           // Resolução de 16 bits
        },
        video: false
    };

    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false;
    recordButton.classList.add("recording");

    // Fechar qualquer stream existente
    if (gumStream) {
        gumStream.getTracks().forEach(track => track.stop());
    }

    // Reiniciar o AudioContext se estiver em estado suspenso
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext retomado");
        });
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            // Configuração do contexto de áudio
            audioContext = new AudioContext();

            // Elemento para mostrar informações
            document.getElementById("formats").textContent =
                `Format: 1 channel pcm @ ${audioContext.sampleRate / 1000}kHz`;

            // Criação da cadeia de processamento
            gumStream = stream;
            input = audioContext.createMediaStreamSource(stream);

            // Adicionando filtros (opcional)
            const highPassFilter = audioContext.createBiquadFilter();
            highPassFilter.type = "highpass";
            highPassFilter.frequency.value = 80;

            const lowPassFilter = audioContext.createBiquadFilter();
            lowPassFilter.type = "lowpass";
            lowPassFilter.frequency.value = 4000;

            // Conexão dos nós de áudio
            input.connect(highPassFilter);
            highPassFilter.connect(lowPassFilter);

            // Inicializa o gravador conectado ao último filtro
            rec = new Recorder(lowPassFilter, { numChannels: 1 });

            // Inicia a gravação
            rec.record();
            console.log("Gravação iniciada com sucesso com filtros");
        })
        .catch(function(err) {
            console.error("Erro ao acessar microfone:", err);
            resetRecordingButtons();

            // Feedback visual para o usuário
            document.getElementById("formats").textContent =
                `Erro: ${err.name} - ${err.message}`;
        });
}

function stopRecording() {
    console.log("Parando gravação...");

    stopButton.disabled = true;
    recordButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pausar";
    recordButton.classList.remove("recording");

    if (rec && rec.recording) {
        rec.stop();
    }

    if (gumStream) {
        gumStream.getAudioTracks()[0].stop();
    }

    if (rec) {
        rec.exportWAV(createDownloadLink);
    }
}

function pauseRecording() {
    if (!rec) return;

    if (rec.recording) {
        rec.stop();
        pauseButton.textContent = "Retomar";
    } else {
        rec.record();
        pauseButton.textContent = "Pausar";
    }
}

function resetRecordingButtons() {
    recordButton.disabled = false;
    stopButton.disabled = true;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pausar";
    recordButton.classList.remove("recording");

    // Limpar referências
    if (gumStream) {
        gumStream.getTracks().forEach(track => track.stop());
        gumStream = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().then(() => {
            audioContext = null;
            console.log("AudioContext fechado");
        });
    }

    rec = null;
}

// Funções de limpeza
function clearSheetMusic() {
    const canvas = document.getElementById("sheet-music");
    if (canvas) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.width; // Reset completo
        console.log("Partitura limpa com sucesso");
    }
}

function clearRecordings() {
    if (recordingsList) {
        recordingsList.innerHTML = "";
        console.log("Gravações limpas com sucesso");
    }

    // Parar qualquer gravação em andamento
    if (rec && rec.recording) {
        rec.stop();
    }
    if (gumStream) {
        gumStream.getAudioTracks().forEach(track => track.stop());
    }

    resetRecordingButtons();
}

async function confirmClearAllSheets() {
    if (confirm("Tem certeza que deseja apagar TODAS as partituras salvas?")) {
        try {
            const response = await fetch('/api/sheets', { method: 'DELETE' });
            if (response.ok) {
                loadSavedSheets();
            } else {
                console.error("Erro ao limpar partituras");
            }
        } catch (error) {
            console.error("Erro:", error);
        }
    }
}

// Funções de manipulação de partituras
function createDownloadLink(blob) {
    if (!recordingsList) return;

    const url = URL.createObjectURL(blob);
    const li = document.createElement('li');
    const audio = document.createElement('audio');
    const saveLink = document.createElement('a');
    const filename = new Date().toISOString();

    audio.controls = true;
    audio.src = url;

    saveLink.href = url;
    saveLink.download = `${filename}.wav`;
    saveLink.textContent = "Salvar";

    const uploadLink = document.createElement('a');
    uploadLink.href = "#";
    uploadLink.textContent = "Processar";
    uploadLink.addEventListener("click", function(e) {
        e.preventDefault();
        processAudio(blob, filename);
    });

    li.appendChild(audio);
    li.appendChild(document.createTextNode(` ${filename}.wav `));
    li.appendChild(saveLink);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(uploadLink);

    recordingsList.appendChild(li);
}

async function processAudio(blob, filename) {
    try {
        const formData = new FormData();
        formData.append("file", blob, filename);

        const response = await fetch("/api/audio/process", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const notes = await response.text();
            renderSheetMusic(notes);
            await saveSheet(notes);
        } else {
            console.error("Erro no processamento de áudio");
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function saveSheet(notes) {
    try {
        const title = `Partitura ${new Date().toLocaleString()}`;
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, notes })
        });

        if (response.ok) {
            loadSavedSheets();
        } else {
            console.error("Erro ao salvar partitura");
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function loadSavedSheets() {
    if (!savedSheetsList) return;

    try {
        const response = await fetch('/api/sheets');
        if (response.ok) {
            const sheets = await response.json();
            renderSavedSheetsList(sheets);
        } else {
            console.error("Erro ao carregar partituras");
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

function renderSavedSheetsList(sheets) {
    savedSheetsList.innerHTML = '';

    sheets.forEach(sheet => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="sheet-title">${escapeHtml(sheet.title)}</span>
            <div class="sheet-actions">
                <button onclick="openEditSheet('${sheet.id}', '${escapeHtml(sheet.title)}', '${escapeHtml(sheet.notes)}')">
                    Editar
                </button>
                <button onclick="renderSavedSheet('${escapeHtml(sheet.notes)}')">
                    Visualizar
                </button>
                <button onclick="deleteSheet('${sheet.id}')">
                    Excluir
                </button>
            </div>
        `;
        savedSheetsList.appendChild(li);
    });
}

function escapeHtml(text) {
    return text.replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Funções do modal
function openEditSheet(id, title, notes) {
    currentEditingId = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editNotes').value = notes;
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingId = null;
}

async function saveEditedSheet() {
    const title = document.getElementById('editTitle').value;
    const notes = document.getElementById('editNotes').value;

    if (!title || !notes) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    try {
        const response = await fetch(`/api/sheets/${currentEditingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, notes })
        });

        if (response.ok) {
            loadSavedSheets();
            closeModal();
        } else {
            console.error("Erro ao salvar edição");
        }
    } catch (error) {
        console.error("Erro:", error);
    }
}

async function deleteSheet(id) {
    if (confirm("Tem certeza que deseja excluir esta partitura?")) {
        try {
            const response = await fetch(`/api/sheets/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadSavedSheets();
            } else {
                console.error("Erro ao excluir partitura");
            }
        } catch (error) {
            console.error("Erro:", error);
        }
    }
}

// Função de renderização da partitura
function renderSheetMusic(notes) {
    if (!notes || !document.getElementById('sheet-music')) return;

    try {
        // Limpa o canvas antes de renderizar
        const canvas = document.getElementById('sheet-music');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Prepara as notas
        const cleanedNotes = notes.replace(/\s+/g, '').toUpperCase();
        const notesArray = cleanedNotes.split(',').map(note => note + '/8');

        // Configuração do VexFlow
        const vf = new Vex.Flow.Factory({
            renderer: { elementId: 'sheet-music', width: 800, height: 600 }
        });

        const score = vf.EasyScore();
        const system = vf.System();

        // Agrupa as notas em compassos
        const groupedNotes = [];
        for (let i = 0; i < notesArray.length; i += 8) {
            let group = notesArray.slice(i, i + 8);
            while (group.length < 8) group.push("B4/r");
            groupedNotes.push(group.join(","));
        }

        // Adiciona cada compasso ao sistema
        groupedNotes.forEach(group => {
            system.addStave({
                voices: [score.voice(score.notes(group, { stem: 'up' }))]
            }).addClef('treble').addTimeSignature('8/8');
        });

        // Renderiza
        vf.draw();

    } catch (error) {
        console.error("Erro ao renderizar partitura:", error);
    }
}

// Funções globais necessárias para o HTML
window.openEditSheet = openEditSheet;
window.renderSavedSheet = renderSheetMusic;
window.deleteSheet = deleteSheet;
window.closeModal = closeModal;
window.saveEditedSheet = saveEditedSheet;