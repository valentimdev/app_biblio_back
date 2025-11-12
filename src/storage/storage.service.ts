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
    
    // Ensure container exists
    this.ensureContainerExists();
  }

  private async ensureContainerExists() {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob', // Public read access
      });
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
      // Extract blob name from URL
      // URL format: https://accountname.blob.core.windows.net/containername/folder/filename.ext
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      // Find container name index and get everything after it
      const containerIndex = pathParts.findIndex(part => part === this.containerName);
      if (containerIndex === -1) {
        console.warn(`Container name ${this.containerName} not found in URL: ${blobUrl}`);
        return;
      }
      
      const blobName = pathParts.slice(containerIndex + 1).join('/');

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('Error deleting file from Azure:', error);
      // Don't throw error if file doesn't exist
    }
  }

  async deleteFileByUrl(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) {
      return;
    }
    await this.deleteFile(imageUrl);
  }
}

