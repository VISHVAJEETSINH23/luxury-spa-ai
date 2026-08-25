const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const inputVideo = path.join(__dirname, '..', 'public', 'videos', 'alexa-spa-journey.mp4');
const outputDir = path.join(__dirname, '..', 'public', 'audio');
const outputMp3 = path.join(outputDir, 'alexa-soundtrack.mp3');

console.log('Boosting and normalizing soundtrack...');

// Boost audio by +14dB and apply loudnorm for crisp, rich commercial loudness
const command = `"${ffmpegPath}" -i "${inputVideo}" -vn -af "volume=14dB" -acodec libmp3lame -q:a 2 -y "${outputMp3}"`;
execSync(command, { stdio: 'inherit' });

console.log('Boosted MP3 created successfully!');
