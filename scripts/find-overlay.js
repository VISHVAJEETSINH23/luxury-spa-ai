const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// Let's create an analysis script or view one of the frames
console.log('Inspecting frame dimensions...');
const firstFrame = path.join(__dirname, '..', 'public', 'frames', 'frame_0001.jpg');
console.log('Sample frame path:', firstFrame);
