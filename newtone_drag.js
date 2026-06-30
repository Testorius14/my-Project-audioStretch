const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const timeline = document.getElementById('timeline');
const playAllBtn = document.getElementById('playAllBtn');

let audioBuffer = null;
let audioSrc = null;
let startX = null;
let endX = null;
let clips = [];

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

// Crear clip visual en timeline
function createClip(start, end) {
  const clipEl = document.createElement('div');
  clipEl.className = 'clip';
  clipEl.style.left = `${clips.length * 100}px`;
  clipEl.style.top = '50px';
  clipEl.style.width = '80px';
  clipEl.textContent = `Clip ${clips.length+1}`;

  const clip = { id: clips.length+1, start, end, element: clipEl };
  clips.push(clip);

  // Hacer arrastrable
  clipEl.draggable = true;
  clipEl.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', clip.id);
  });

  timeline.appendChild(clipEl);
}

// Permitir soltar clips en timeline
timeline.addEventListener('dragover', e => {
  e.preventDefault();
});
timeline.addEventListener('drop', e => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const clip = clips.find(c => c.id == id);
  if (clip) {
    clip.element.style.left = `${e.offsetX}px`;
    clip.element.style.top = `${e.offsetY}px`;
  }
});

// Reproducir todos los clips en orden de posición
playAllBtn.addEventListener('click', () => {
  const ordered = [...clips].sort((a,b) => 
    parseInt(a.element.style.left) - parseInt(b.element.style.left)
  );

  let index = 0;
  function playNext() {
    if (index >= ordered.length) return;
    const clip = ordered[index];
    const audioEl = new Audio(audioSrc);
    audioEl.currentTime = clip.start;
    audioEl.playbackRate = 1;
    audioEl.preservesPitch = true;
    audioEl.play();

    const checker = setInterval(() => {
      if (audioEl.currentTime >= clip.end) {
        audioEl.pause();
        clearInterval(checker);
        index++;
        playNext();
      }
    }, 200);
  }
  playNext();
});
