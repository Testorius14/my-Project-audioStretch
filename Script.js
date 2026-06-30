import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js@7/dist/plugins/regions.esm.js';

const regionsPlugin = RegionsPlugin.create();

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'violet',
  progressColor: 'purple',
  backend: 'WebAudio', // necesario para exportar
  plugins: [regionsPlugin]
});

// Cargar archivo
document.getElementById('fileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    wavesurfer.load(url);
  }
});

// Añadir región manualmente
document.getElementById('addRegionBtn').addEventListener('click', () => {
  const currentTime = wavesurfer.getCurrentTime();
  regionsPlugin.addRegion({
    start: currentTime,
    end: currentTime + 3,
    color: 'rgba(0, 200, 0, 0.3)',
    drag: true,
    resize: true
  });
});

// Al crear región → generar clip independiente
wavesurfer.on('region-created', region => {
  const clipsDiv = document.getElementById('clips');

  // Panel del clip
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<p>Clip ${region.id} (de ${region.start.toFixed(2)}s a ${region.end.toFixed(2)}s)</p>`;

  // Botón reproducir
  const playBtn = document.createElement('button');
  playBtn.textContent = "▶️ Reproducir clip";
  playBtn.addEventListener('click', () => {
    wavesurfer.setPlaybackRate(region.playbackRate || 1);
    wavesurfer.play(region.start, region.end);
  });

  // Control de velocidad
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.step = '0.1';
  rateInput.value = '1';
  rateInput.addEventListener('change', () => {
    region.playbackRate = parseFloat(rateInput.value);
    wavesurfer.setPlaybackRate(region.playbackRate);
  });

  // Botón exportar
  const exportBtn = document.createElement('button');
  exportBtn.textContent = "💾 Exportar WAV";
  exportBtn.addEventListener('click', () => {
    exportRegionAsWav(wavesurfer, region);
  });

  wrapper.appendChild(playBtn);
  wrapper.appendChild(rateInput);
  wrapper.appendChild(exportBtn);
  clipsDiv.appendChild(wrapper);
});

// Función para exportar región como WAV
function exportRegionAsWav(wavesurfer, region) {
  const buffer = wavesurfer.backend.buffer;
  const start = Math.floor(region.start * buffer.sampleRate);
  const end = Math.floor(region.end * buffer.sampleRate);
  const length = end - start;

  const newBuffer = wavesurfer.backend.ac.createBuffer(
    buffer.numberOfChannels,
    length,
    buffer.sampleRate
  );

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const channelData = buffer.getChannelData(ch).slice(start, end);
    newBuffer.copyToChannel(channelData, ch, 0);
  }

  const wavBlob = bufferToWave(newBuffer, length);
  const url = URL.createObjectURL(wavBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `clip_${region.id}.wav`;
  a.click();
}

// Conversión AudioBuffer → WAV Blob
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  const channels = [];
  let i, sample;
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}