import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupabaseService {
  private supabase;
  private bucket = process.env.SUPABASE_BUCKET || 'default';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase no inicializado: faltan variables de entorno');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase inicializado');
    }
  }

  async uploadPfpToFirebase(location: string, file: Express.Multer.File): Promise<string> {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const filePath = `${location}/fotosPerfil/${uniqueFilename}`;

    const { error } = await this.supabase.storage.from(this.bucket).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

    if (error) throw new Error(`Error al subir archivo: ${error.message}`);

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadDocumentsToFirebase(location: string, files: Express.Multer.File[] = []): Promise<object[]> {
    const uploadedUrls: object[] = [];

    for (const file of files) {
      const uniqueFilename = `${Date.now()}-${file.originalname}`;
      const filePath = `${location}/documentosEstudiante/${uniqueFilename}`;

      const { error } = await this.supabase.storage.from(this.bucket).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

      if (error) throw new Error(`Error al subir archivo: ${error.message}`);

      const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
      uploadedUrls.push({
        nombre: uniqueFilename,
        url: data.publicUrl,
        tamanio: file.size,
      });
    }
    return uploadedUrls;
  }

  async uploadTareasToFirebase(location: string, files: Express.Multer.File[] = []): Promise<object[]> {
    const uploadedUrls: object[] = [];

    for (const file of files) {
      const uniqueFilename = `${Date.now()}-${file.originalname}`;
      const filePath = `${location}/tareasEstudiante/${uniqueFilename}`;

      const { error } = await this.supabase.storage.from(this.bucket).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

      if (error) throw new Error(`Error al subir archivo: ${error.message}`);

      const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
      uploadedUrls.push({
        nombre: uniqueFilename,
        url: data.publicUrl,
        tamanio: file.size,
      });
    }
    return uploadedUrls;
  }

  async deleteFileFromFirebase(fileUrl: string): Promise<void> {
    const path = fileUrl.split(`/${this.bucket}/`)[1];
    if (!path) {
      throw new Error('Ruta de archivo no válida para Supabase');
    }

    const { error } = await this.supabase.storage.from(this.bucket).remove([path]);
    if (error) throw new Error(`Error al eliminar archivo: ${error.message}`);
    console.log(`Archivo eliminado: ${path}`);
  }
}