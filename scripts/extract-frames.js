const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const inputVideo = path.join(__dirname, '..', 'public', 'videos', 'alexa-spa-journey.mp4');
const outputDir = path.join(__dirname, '..', 'public', 'frames');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

console.log('Extracting frames from:', inputVideo);
console.log('Output directory:', outputDir);
console.log('Using FFmpeg at:', ffmpegPath);

// Target 12 fps for 70 seconds -> ~840 crystal clear frames
// Scale to 1440x810, high-quality JPEG (q:v 2) for instantaneous browser canvas decoding
const command = `"${ffmpegPath}" -i "${inputVideo}" -vf "fps=12,scale=1440:-1" -q:v 2 -threads 0 -y "${path.join(outputDir, 'frame_%04d.jpg')}"`;

console.log('Running high-speed extraction command...');
const startTime = Date.now();
execSync(command, { stdio: 'inherit' });
const duration = ((Date.now() - startTime) / 1000).toFixed(1);

const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
console.log(`Extraction complete! Generated ${files.length} frames in ${duration}s.`);
