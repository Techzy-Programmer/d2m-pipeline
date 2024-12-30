import { existsSync, lstatSync, createReadStream, createWriteStream, readdirSync, readFileSync } from "fs";
import { APIClient } from "../utils/api-client";
import { pipeline } from 'stream/promises';
import { panic } from "../utils/general";
import { basename, join } from 'path';
import { WFInput } from "../types";
import { createGzip } from 'zlib';

export async function executeDistDeployment(input: WFInput) {
  if (input.strategy_type !== "dist") {
    return;
  }
  
  if (!existsSync(input.strategy.folder_to_upload) || !lstatSync(input.strategy.folder_to_upload).isDirectory()) {
    panic("Folder 'distStrategyFolder' does not exist or is not a directory");
  }

  // Here root_folder_name is the root remote folder name where the dist files will be uploaded
  if (!input.strategy.root_folder_name) input.strategy.root_folder_name = basename(input.strategy.folder_to_upload);
  const zippedDistFile = await zipDistFolder(input.strategy.folder_to_upload);
  input.strategy.file_name = await uploadDistZip(zippedDistFile);
  await triggerDeployment(input);
}

async function zipDistFolder(folderPath: string, rootName?: string): Promise<string> {
  const outputZipPath = `${folderPath}.gz`;

  // Get all files in the directory recursively
  async function getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  try {
    const files = await getAllFiles(folderPath);
    const outputStream = createWriteStream(outputZipPath);
    const gzip = createGzip();

    let currentFileIndex = 0;
    const fileReader = {
      async read() {
        if (currentFileIndex >= files.length) return null;

        const currentFile = files[currentFileIndex];
        const fileStream = createReadStream(currentFile);
        
        let relativePath = currentFile.replace(folderPath, '').substring(1);
        if (rootName) relativePath = `${rootName}/${relativePath}`;
        const header = `${relativePath}\n`;
        currentFileIndex++;
        
        return Buffer.concat([
          Buffer.from(header),
          await streamToBuffer(fileStream)
        ]);
      }
    };

    async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    // Pipeline to zip the files
    await pipeline(
      async function* () {
        while (true) {
          const chunk = await fileReader.read();
          if (chunk === null) break;
          yield chunk;
        }
      },
      gzip,
      outputStream
    );

    return outputZipPath;
  } catch (error) {
    panic(`Failed to archieve 'distStrategyFolder': ${(error as Error).message}`);
  }
}

async function uploadDistZip(zipFile: string): Promise<string> {
  const upResp = await new APIClient().sendEncrypted("/upload", createFileObject(zipFile));
  if (!upResp.ok) {
    panic("Failed to upload dist file to your d2m prod machine :: " + (await upResp.text()));
  }

  return (await upResp.json()).tempFile;
}

async function triggerDeployment(input: WFInput) {
  const response = await new APIClient().sendEncrypted("/deploy", input);

  if (!response.ok) {
    panic("Failed to trigger deployment on your d2m prod machine");
  }

  console.log("Deployment triggered successfully");
}

function createFileObject(filePath: string): File {
  const fileContent = readFileSync(filePath);
  const fileBlob = new Blob([fileContent]);

  return new File([fileBlob], basename(filePath));
}
