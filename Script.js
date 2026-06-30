let audioSrc = null;
let cuts = []; // lista de cortes definidos

const fileInput = document.getElementById('fileInput');
const addCutBtn = document.getElementById('addCutBtn');
const clipsDiv = document.getElementById('clips');

// Cargar archivo
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    audioSrc = URL.createObjectURL(file);
    alert("Archivo cargado. Usa 'Añadir corte' para definir fragmentos.");
  }
});

// Añadir corte en el tiempo actual (simulado)
addCutBtn.addEventListener('click', () => {
  if (!audioSrc) return alert("Primero carga un archivo de audio.");
  
  // Simulamos un corte en segundos (ejemplo: cada click avanza 5s)
  const start = cuts.length * 5;
  const end = start + 5;

  const region = { id: cuts.length + 1, start, end };
  cuts.push(region);
  renderClip(region);
});

// Renderizar clip independiente
function renderClip(region) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<p>Clip ${region.id} (de ${region.start}s a ${region.end}s)</p>`;

  const audioEl = document.createElement('audio');
  audioEl.controls = true;
  audioEl.src = audioSrc;

  // Reproducir solo el fragmento
  audioEl.addEventListener('play', () => {
    audioEl.currentTime = region.start;
    const checker = setInterval(() => {
      if (audioEl.currentTime >= region.end) {
        audioEl.pause();
        clearInterval(checker);
      }
    }, 200);
  });

  // Control de velocidad
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.step = '0.1';
  rateInput.value = '1';
  rateInput.addEventListener('change', () => {
    audioEl.playbackRate = parseFloat(rateInput.value);
    audioEl.preservesPitch = true; // mantener tono
  });

  wrapper.appendChild(audioEl);
  wrapper.appendChild(rateInput);
  clipsDiv.appendChild(wrapper);
}
