import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Tareas, TareasSchema } from './schema/tareas.schema';
import { Estudiante, EstudianteSchema } from 'src/estudiante/schema/estudiante.schema';
import { Curso, CursoSchema } from 'src/curso/schema/curso.schema';
import { ArchivoTareas, ArchivoTareasSchema } from 'src/archivoTareas/schema/archivoTareas.schema';
import { SupabaseService } from 'src/storage/supabase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tareas.name, schema: TareasSchema},
      { name: Estudiante.name, schema: EstudianteSchema },
      { name: Curso.name, schema: CursoSchema},
      { name: ArchivoTareas.name, schema: ArchivoTareasSchema}
    ])
  ],
  controllers: [TareasController],
  providers: [TareasService, SupabaseService]
})
export class TareasModule {}
