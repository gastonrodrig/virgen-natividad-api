import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tutor, TutorSchema } from './schema/tutor.schema';
import { Documento, DocumentoSchema } from 'src/documento/schema/documento.schema';
import { Multimedia, MultimediaSchema } from 'src/multimedia/schema/multimedia.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Seccion, SeccionSchema } from 'src/seccion/schema/seccion.schema';
import { Grado, GradoSchema } from 'src/grado/schema/grado.schema';
import { PeriodoEscolar, PeriodoEscolarSchema } from 'src/periodo-escolar/schema/periodo-escolar.schema';
import { SupabaseService } from 'src/storage/supabase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tutor.name, schema: TutorSchema },
      { name: Documento.name, schema: DocumentoSchema },
      { name: Multimedia.name, schema: MultimediaSchema },
      { name: User.name, schema: UserSchema },
      { name: Seccion.name, schema: SeccionSchema },
      { name: Grado.name, schema: GradoSchema },
      { name: PeriodoEscolar.name, schema: PeriodoEscolarSchema },
    ])
  ],
  providers: [TutorService, SupabaseService],
  controllers: [TutorController]
})
export class TutorModule {}
