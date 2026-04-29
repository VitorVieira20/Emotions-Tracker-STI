import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateAudio() {
  console.log('Fetching Listening questions without audio...');
  
  const questions = await prisma.question.findMany({
    where: {
      area: 'Listening',
      audioUrl: null,
    },
  });

  console.log(`Found ${questions.length} questions to process.`);

  if (questions.length === 0) {
    console.log('No new questions to process. Exiting.');
    await prisma.$disconnect();
    return;
  }

  const outputDir = path.join(process.cwd(), 'public', 'audio', 'questions');
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const q of questions) {
    const audioText = q.audioText;
    
    if (!audioText) {
      console.warn(`SKIPPING Question ID: ${q.id} - No audioText provided.`);
      continue;
    }

    const finalFileName = `${q.id}.mp3`;
    const finalFilePath = path.join(outputDir, finalFileName);
    const audioUrl = `/audio/questions/${finalFileName}`;

    console.log(`--- Processing Question ID: ${q.id} ---`);
    console.log(`Text for TTS: "${audioText}"`);
    
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !success) {
      attempts++;
      // Create a fresh instance for each attempt to avoid state issues
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
            where: { id: q.id },
            data: { audioUrl },
          });
          
          console.log(`SUCCESS (Attempt ${attempts}): Generated ${audioUrl}`);
          success = true;
        } else {
          throw new Error("File was not generated correctly.");
        }
      } catch (error: any) {
        console.error(`Attempt ${attempts} failed for ${q.id}:`, error?.message || error);
        if (attempts >= maxAttempts) {
          console.error("Network Error: Could not connect to Microsoft Edge TTS. Check your internet connection or firewall.");
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } finally {
        try { tts.close(); } catch (e) {}
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('Finished processing all questions.');
  await prisma.$disconnect();
}

generateAudio().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
