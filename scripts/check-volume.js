const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const inputAudio = path.join(__dirname, '..', 'public', 'audio', 'alexa-soundtrack.mp3');

try {
  const result = execSync(`"${ffmpegPath}" -i "${inputAudio}" -af "volumedetect" -f null -`, { encoding: 'utf8' });
  console.log(result);
} catch (err) {
  console.log(err.stderr || err.stdout || err.message);
}
