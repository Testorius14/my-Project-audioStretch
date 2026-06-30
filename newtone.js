const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const clipsDiv = document.getElementById('clips');

let audioBuffer = null;
let audioSrc = null;
let startX = null;
let endX = null;

// Cargar archivo y dibujar waveform
fileInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  audioSrc = URL.createObjectURL(file);

  const audioCtx = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  drawWaveform(audioBuffer);
});

// Dibujar waveform en canvas
function drawWaveform(buffer) {
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / canvas.width);
  const amp = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 0; i < canvas.width; i++) {
    let min = 1.0, max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.moveTo(i, (1 + min) * amp);
    ctx.lineTo(i, (1 + max) * amp);
  }
  ctx.stroke();
}

// Selección con el mouse
canvas.addEventListener('mousedown', e => {
  startX = e.offsetX;
});
canvas.addEventListener('mouseup', e => {
  endX = e.offsetX;
  if (audioBuffer) {
    const startTime = (startX / canvas.width) * audioBuffer.duration;
    const endTime = (endX / canvas.width) * audioBuffer.duration;
    createClip(startTime, endTime);
  }
});

// Crear clip independiente
function createClip(start, end) {
  const wrapper = document.createElement('div');
  wrapper.className = 'clip';
  wrapper.innerHTML = `<p>Clip (de ${start.toFixed(2)}s a ${end.toFixed(2)}s)</p>`;

  const audioEl = document.createElement('audio');
  audioEl.controls = true;
  audioEl.src = audioSrc;

  // Reproducir solo el fragmento
  audioEl.addEventListener('play', () => {
    audioEl.currentTime = start;
    const checker = setInterval(() => {
      if (audioEl.currentTime >= end) {
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
