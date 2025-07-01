import { Module } from '@nestjs/common';
import { ApoderadoController } from './apoderado.controller';
import { ApoderadoService } from './apoderado.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Apoderado, ApoderadoSchema } from './schema/apoderado.schema';
import { Documento, DocumentoSchema } from 'src/documento/schema/documento.schema';
import { Estudiante, EstudianteSchema } from 'src/estudiante/schema/estudiante.schema';
import { Multimedia, MultimediaSchema } from 'src/multimedia/schema/multimedia.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { SupabaseService } from 'src/storage/supabase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Apoderado.name, schema: ApoderadoSchema },
      { name: Documento.name, schema: DocumentoSchema },
      { name: Estudiante.name, schema: EstudianteSchema },
      { name: Multimedia.name, schema: MultimediaSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [ApoderadoController],
  providers: [ApoderadoService, SupabaseService]
})
export class ApoderadoModule {}
