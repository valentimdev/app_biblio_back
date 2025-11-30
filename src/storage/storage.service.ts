import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class StorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    const containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') || 'images';

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);

    // Ensure container exists (fire and forget)
    this.ensureContainerExists().catch((error) => {
      console.error('Failed to ensure container exists:', error);
    });
  }

  private async ensureContainerExists() {
    try {
      const containerExists = await this.containerClient.exists();
      if (!containerExists) {
        await this.containerClient.create({
          access: 'blob', // Public read access for blobs
        });
        console.log(`Container '${this.containerName}' created successfully`);
      }
    } catch (error) {
      console.error('Error creating container:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const blobName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      // Return the URL of the uploaded file
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading file to Azure:', error);
      throw new BadRequestException('Failed to upload file to Azure Storage');
    }
  }

  async deleteFile(blobUrl: string): Promise<void> {
    try {
      // Validar se a URL é válida
      if (!blobUrl || blobUrl.trim() === '') {
        console.warn('Empty or invalid blob URL provided');
        return;
      }

      // Verificar se a URL parece ser uma URL válida do Azure
      if (!blobUrl.startsWith('http://') && !blobUrl.startsWith('https://')) {
        console.warn(`Invalid blob URL format: ${blobUrl}`);
        return;
      }

      // Extract blob name from URL
      // URL format: https://accountname.blob.core.windows.net/containername/folder/filename.ext
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);

      // Verificar se há partes suficientes na URL
      if (pathParts.length < 2) {
        console.warn(`Invalid blob URL structure: ${blobUrl}`);
        return;
      }

      // Find container name index and get everything after it
      const containerIndex = pathParts.findIndex(part => part === this.containerName);
      if (containerIndex === -1) {
        console.warn(`Container name ${this.containerName} not found in URL: ${blobUrl}`);
        return;
      }

      const blobName = pathParts.slice(containerIndex + 1).join('/');

      // Verificar se o blobName não está vazio
      if (!blobName || blobName.trim() === '') {
        console.warn(`Empty blob name extracted from URL: ${blobUrl}`);
        return;
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      // Se for erro de URL inválida, apenas logar
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        console.warn(`Invalid URL format: ${blobUrl}`);
        return;
      }

      // Se for erro do Azure sobre URI inválida, apenas logar
      if (error && typeof error === 'object' && 'code' in error) {
        const azureError = error as any;
        if (azureError.code === 'InvalidUri' || azureError.statusCode === 400) {
          console.warn(`Invalid Azure blob URI: ${blobUrl}`, azureError.message);
          return;
        }
      }

      console.error('Error deleting file from Azure:', error);
      // Don't throw error - apenas logar para não quebrar o fluxo
    }
  }

  async deleteFileByUrl(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) {
      return;
    }
    await this.deleteFile(imageUrl);
  }

  async getFileUrl(blobName: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  async downloadFile(blobName: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download(0);
      const chunks: Buffer[] = [];

      if (downloadResponse.readableStreamBody) {
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading file from Azure:', error);
      throw new Error('Failed to download file');
    }
  }
}

