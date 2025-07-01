import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseService {
  private static initialized = false;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!FirebaseService.initialized && projectId && privateKey && clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
        storageBucket: 'virgennatividad-a5c2b.appspot.com',
      });
      FirebaseService.initialized = true;
      console.log('✅ Firebase inicializado');
    } else {
      console.warn('⚠️ Firebase no inicializado: faltan variables de entorno');
    }
  }

  async uploadPfpToFirebase(
    location: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!FirebaseService.initialized) return '';

    let uploadedUrl: string = '';

    const { originalname, buffer } = file;
    const storage = admin.storage();
    const bucket = storage.bucket();

    const uniqueFilename = `${Date.now()}-${originalname}`;
    const fileBlob = bucket.file(`${location}/fotosPerfil/${uniqueFilename}`);

    await fileBlob.save(buffer, { contentType: file.mimetype });
    await fileBlob.makePublic();

    uploadedUrl = `https://storage.googleapis.com/${bucket.name}/${fileBlob.name}`;
    return uploadedUrl;
  }

  async uploadDocumentsToFirebase(
    location: string,
    files: Express.Multer.File[] = [],
  ): Promise<object[]> {
    if (!FirebaseService.initialized) return [];
    if (!Array.isArray(files)) {
      throw new Error('Files should be an array');
    }

    const uploadedUrls: object[] = [];

    for (const file of files) {
      const { originalname, buffer, mimetype } = file;
      const storage = admin.storage();
      const bucket = storage.bucket();

      const uniqueFilename = `${Date.now()}-${originalname}`;
      const fileBlob = bucket.file(
        `${location}/documentosEstudiante/${uniqueFilename}`,
      );

      await fileBlob.save(buffer, { contentType: mimetype });
      await fileBlob.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileBlob.name}`;

      const [metadata] = await fileBlob.getMetadata();

      uploadedUrls.push({
        nombre: uniqueFilename,
        url: publicUrl,
        tamanio: metadata.size,
      });
    }
    return uploadedUrls;
  }

  async deleteFileFromFirebase(fileUrl: string): Promise<void> {
    if (!FirebaseService.initialized) return;

    const storage = admin.storage();
    const bucket = storage.bucket();

    const filePath = fileUrl.replace(
      `https://storage.googleapis.com/${bucket.name}/`,
      '',
    );
    const file = bucket.file(filePath);

    const [exists] = await file.exists();

    if (exists) {
      await file.delete();
      console.log(`Successfully deleted file: ${filePath}`);
    } else {
      console.warn(
        `File not found: ${fileUrl}. It may have been already deleted.`,
      );
    }
  }

  async uploadTareasToFirebase(
    location: string,
    files: Express.Multer.File[] = [],
  ): Promise<object[]> {
    if (!FirebaseService.initialized) return [];
    if (!Array.isArray(files)) {
      throw new Error('Files should be an array');
    }

    const uploadedUrls: object[] = [];

    for (const file of files) {
      const { originalname, buffer, mimetype } = file;
      const storage = admin.storage();
      const bucket = storage.bucket();

      const uniqueFilename = `${Date.now()}-${originalname}`;
      const fileBlob = bucket.file(
        `${location}/tareasEstudiante/${uniqueFilename}`,
      );

      await fileBlob.save(buffer, { contentType: mimetype });
      await fileBlob.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileBlob.name}`;

      const [metadata] = await fileBlob.getMetadata();

      uploadedUrls.push({
        nombre: uniqueFilename,
        url: publicUrl,
        tamanio: metadata.size,
      });
    }
    return uploadedUrls;
  }
}