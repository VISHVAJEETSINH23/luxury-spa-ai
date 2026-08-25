const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const videoPath = path.join(__dirname, '..', 'public', 'videos', 'alexa-spa-journey.mp4');
const framesDir = path.join(__dirname, '..', 'public', 'frames');

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

console.log('Step 1: Extracting raw fresh frames from master video...');
const extractCmd = `"${ffmpegPath}" -i "${videoPath}" -vf "fps=12,scale=1440:-1" -qscale:v 2 -y "${path.join(framesDir, 'frame_%04d.jpg')}"`;
execSync(extractCmd, { stdio: 'inherit' });

console.log('Step 2: Launching Python OpenCV Master Inpainting Pipeline...');
const pythonCmd = `python "${path.join(__dirname, 'master_opencv_clean.py')}"`;
execSync(pythonCmd, { stdio: 'inherit' });

console.log('Master cleaning pipeline complete!');
