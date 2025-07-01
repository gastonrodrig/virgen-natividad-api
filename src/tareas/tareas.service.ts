import { BadRequestException, Injectable } from '@nestjs/common';
import { Tareas } from './schema/tareas.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Curso } from 'src/curso/schema/curso.schema';
import { ArchivoTareas } from 'src/archivoTareas/schema/archivoTareas.schema';
import { CreateTareasDto } from './dto/create-tareas.dto';
import { Estudiante } from 'src/estudiante/schema/estudiante.schema';
import { UpdateTareasDto } from './dto/update-tareas.dto';
import { SupabaseService } from 'src/storage/supabase.service';

@Injectable()
export class TareasService {
    constructor(
        @InjectModel(Tareas.name)
        private readonly tareasModel: Model<Tareas>,
        @InjectModel(Estudiante.name)
        private readonly estudianteModel: Model<Estudiante>,
        @InjectModel(Curso.name)
        private readonly cursoModel: Model<Curso>,
        @InjectModel(ArchivoTareas.name)
        private readonly archivoTareasModel: Model<ArchivoTareas>,
        private readonly supabaseService: SupabaseService
    ) {}

    async create(createTareasDto: CreateTareasDto, files: Express.Multer.File[]) {
        if (files.length > 4) {
            throw new BadRequestException('No se pueden subir más de 4 archivos');
        }
    
        const estudiante = await this.estudianteModel.findById(createTareasDto.estudiante_id);
        if (!estudiante) {
            throw new BadRequestException('Estudiante no encontrado');
        }
    
        const curso = await this.cursoModel.findById(createTareasDto.curso_id);
        if (!curso) {
            throw new BadRequestException('Curso no encontrado');
        }
    
        const uploadedFiles = await this.supabaseService.uploadTareasToFirebase('Estudiante', files) as UploadedFile[];
    
        const archivoTareasEntries = await Promise.all(
            uploadedFiles.map(async (file) => {
                const createdArchivoTarea = new this.archivoTareasModel({
                    nombre: file.nombre,
                    url: file.url,
                    tamanio: file.tamanio,
                });
                return createdArchivoTarea.save();
            }),
        );
    
        const tareas = new this.tareasModel({
            estudiante,
            curso,
            archivoTareas: archivoTareasEntries.map(file => file._id),
        });
    
        await tareas.save();
    
        return this.tareasModel.findById(tareas._id)
            .populate(['estudiante', 'curso'])
            .populate({ path: 'archivoTareas', model: 'ArchivoTareas' });
    }

    async findAll(){
        return await this.tareasModel.find()
            .populate(['estudiante','curso'])
            .populate({ path: 'archivoTareas',model:'ArchivoTareas'})
    }

    async findOne(tareas_id: string){
        return await this.tareasModel.findById(tareas_id)
            .populate(['estudiante','curso'])
            .populate({ path: 'archivoTareas',model:'ArchivoTareas'})
    }

    async update(tareas_id: string, updateTareasDto: UpdateTareasDto){
        const tareas = await this.tareasModel.findById(tareas_id)
        if(!tareas){
            throw new BadRequestException('Tareas no encontradas')
        }
        const estudianteId = new Types.ObjectId(updateTareasDto.estudiante_id)
        const cursoId = new Types.ObjectId(updateTareasDto.curso_id)

        const estudiante = await this.estudianteModel.findById(estudianteId)
        if(!estudiante){
            throw new BadRequestException('Estudiante no encontrado')
        }
        const curso = await this.cursoModel.findById(cursoId)
        if(!curso){
            throw new BadRequestException('Curso no encontrado')
        }

        tareas.estudiante = estudianteId
        tareas.curso = cursoId

        await tareas.save()
        return this.tareasModel.findById(tareas._id)
        .populate(['estudiante','curso'])
        .populate({ path: 'archivoTareas',model:'ArchivoTareas'})
    }

    async updateFiles(tareas_id: string, files: Express.Multer.File[]) {
        if (files.length > 4) {
            throw new BadRequestException('No se pueden subir más de 4 archivos');
        }

        const tareas = await this.tareasModel.findById(tareas_id);
        if (!tareas) {
            throw new BadRequestException('Tareas no encontradas');
        }

        if (tareas.archivoTareas && tareas.archivoTareas.length > 0) {
            const oldArchivo = await this.archivoTareasModel.find({ _id: { $in: tareas.archivoTareas } });
            for (const archivo of oldArchivo) {
                if (archivo.url) {
                    await this.supabaseService.deleteFileFromFirebase(archivo.url);
                }
            }

            await this.archivoTareasModel.deleteMany({ _id: { $in: tareas.archivoTareas } });
        }

        const uploadedFiles = await this.supabaseService.uploadTareasToFirebase('Estudiante', files) as UploadedFile[];

        const archivoTareasEntries = await Promise.all(
            uploadedFiles.map(async (file) => {
                const createdArchivoTarea = new this.archivoTareasModel({
                    nombre: file.nombre,
                    url: file.url,
                    tamanio: file.tamanio,
                });
                return createdArchivoTarea.save();
            }),
        );

        tareas.archivoTareas = archivoTareasEntries.map(file => file._id);

        await tareas.save();

        return this.tareasModel.findById(tareas._id)
            .populate(['estudiante', 'curso'])
            .populate({ path: 'archivoTareas', model: 'ArchivoTareas' });
    }

    async remove(tareas_id: string) {
        const tarea = await this.tareasModel.findById(tareas_id).populate('archivoTareas');
        if (!tarea) {
            throw new BadRequestException('Tarea no encontrada');
        }
    
        await this.archivoTareasModel.deleteMany({ _id: { $in: tarea.archivoTareas } });
    
        await this.tareasModel.findByIdAndDelete(tareas_id);
    
        return { success: true };
    }
}
