import { Module } from '@nestjs/common';
import { DocenteService } from './docente.service';
import { DocenteController } from './docente.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Docente, DocenteSchema } from './schema/docente.schema';
import { Documento, DocumentoSchema } from 'src/documento/schema/documento.schema';
import { Multimedia, MultimediaSchema } from 'src/multimedia/schema/multimedia.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { SupabaseService } from 'src/storage/supabase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Docente.name, schema: DocenteSchema },
      { name: Documento.name, schema: DocumentoSchema },
      { name: Multimedia.name, schema: MultimediaSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [DocenteService, SupabaseService],
  controllers: [DocenteController]
})
export class DocenteModule {}
