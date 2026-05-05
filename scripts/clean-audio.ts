import fs from 'fs';
import path from 'path';
import { log } from './logger';

async function cleanAudio() {
  const audioDir = path.join(process.cwd(), 'public', 'audio', 'questions');

  log.start('Cleaning audio assets directory');
  
  try {
    if (fs.existsSync(audioDir)) {
      fs.rmSync(audioDir, { recursive: true, force: true });
      log.success('Audio directory cleared');
    } else {
      log.skip('Audio directory does not exist');
    }
  } catch (error: any) {
    log.error(`Failed to clean audio directory: ${error.message}`);
    process.exit(1);
  }

  log.done('Cleanup process finished');
}

cleanAudio();
