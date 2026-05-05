import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';
import { log } from './logger';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateAudio() {
  log.start('Audio generation process initiated');
  
  const questions = await prisma.question.findMany({
    where: {
      area: 'Listening',
    },
  });

  log.info(`Found ${questions.length} Listening questions to evaluate`);

  const outputDir = path.join(process.cwd(), 'public', 'audio', 'questions');
  if (!fs.existsSync(outputDir)) {
    log.info(`Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const q of questions) {
    const { audioText, slug, id, audioUrl: currentAudioUrl } = q;
    
    if (!audioText) {
      log.error(`Question ${id}: Missing audioText field`);
      continue;
    }

    if (!slug) {
      log.error(`Question ${id}: Missing unique slug`);
      continue;
    }

    const finalFileName = `${slug}.mp3`;
    const finalFilePath = path.join(outputDir, finalFileName);
    const audioUrl = `/audio/questions/${finalFileName}`;

    if (fs.existsSync(finalFilePath)) {
      if (currentAudioUrl !== audioUrl) {
        await prisma.question.update({
          where: { id },
          data: { audioUrl },
        });
        log.success(`Linked existing audio: ${finalFileName}`);
      } else {
        log.skip(`File exists: ${finalFileName}`);
      }
      continue;
    }

    log.info(`Generating audio: ${finalFileName}`);
    
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !success) {
      attempts++;
      const tts = new MsEdgeTTS({ enableLogger: false });
      
      try {
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        const result = await tts.toFile(outputDir, audioText);
        
        if (result.audioFilePath && fs.existsSync(result.audioFilePath)) {
          fs.renameSync(result.audioFilePath, finalFilePath);
          
          if (result.metadataFilePath && fs.existsSync(result.metadataFilePath)) {
            fs.unlinkSync(result.metadataFilePath);
          }

          await prisma.question.update({
            where: { id },
            data: { audioUrl },
          });
          
          log.success(`Generated audio: ${finalFileName}`);
          success = true;
        } else {
          throw new Error("TTS file generation failed");
        }
      } catch (error: any) {
        log.error(`Attempt ${attempts} failed for ${slug}: ${error?.message || 'Unknown error'}`);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } finally {
        try { tts.close(); } catch (e) {}
      }
    }
    
    // Throttle to respect API limits
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  log.done('Audio generation task completed');
  await prisma.$disconnect();
}

generateAudio().catch(async (e) => {
  log.error(`Fatal error: ${e.message}`);
  await prisma.$disconnect();
  process.exit(1);
});
