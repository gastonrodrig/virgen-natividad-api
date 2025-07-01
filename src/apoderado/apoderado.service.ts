import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Apoderado } from './schema/apoderado.schema';
import { Model, Types } from 'mongoose';
import { Documento } from 'src/documento/schema/documento.schema';
import { User } from 'src/user/schema/user.schema';
import { Multimedia } from 'src/multimedia/schema/multimedia.schema';
import { Estudiante } from 'src/estudiante/schema/estudiante.schema';
import { CreateApoderadoDto } from './dto/create-apoderado.dto';
import { UpdateApoderadoDto } from './dto/update-apoderado.dto';
import { SupabaseService } from 'src/storage/supabase.service';

@Injectable()
export class ApoderadoService {
  constructor(
    @InjectModel(Apoderado.name)
    private readonly apoderadoModel: Model<Apoderado>,
    @InjectModel(Documento.name)
    private readonly documentoModel: Model<Documento>,
    @InjectModel(Estudiante.name)
    private readonly estudianteModel: Model<Estudiante>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Multimedia.name)
    private readonly multimediaModel: Model<Multimedia>,
    private readonly supabaseService: SupabaseService
  ) {}

  async create(createApoderadoDto: CreateApoderadoDto){
    const documento = await this.documentoModel.findById(createApoderadoDto.documento_id)
    if(!documento){
        throw new BadRequestException('Documento no encontrado');
    }

    const estudiante = await this.estudianteModel.findById(createApoderadoDto.estudiante_id)
    if(!estudiante){
        throw new BadRequestException('Estudiante no encontrado');
    }

    const apoderado = new this.apoderadoModel({
      nombre: createApoderadoDto.nombre,
      apellido: createApoderadoDto.apellido,
      numero: createApoderadoDto.numero,
      correo: createApoderadoDto.correo,
      direccion: createApoderadoDto.direccion,
      numero_documento: createApoderadoDto.numero_documento,
      documento,
      estudiante
    })

    await apoderado.save()
    
    return this.apoderadoModel.findById(apoderado._id)
      .populate(['documento','estudiante','multimedia','user'])
  }

  async findAll(){
    return await this.apoderadoModel.find()
      .populate(['documento','estudiante','multimedia','user'])
  }

  async findOne(apoderado_id: string){
    return await this.apoderadoModel.findById(apoderado_id)
      .populate(['documento','estudiante','multimedia','user'])
  }

  async update(apoderado_id: string, updateApoderadoDto: UpdateApoderadoDto){
    const apoderado = await this.apoderadoModel.findById(apoderado_id)
    if(!apoderado){
      throw new BadRequestException('Apoderado no encontrado')
    }
    
    const documentoId = new Types.ObjectId(updateApoderadoDto.documento_id)
    const documento = await this.documentoModel.findById(documentoId)
    if(!documento){
        throw new BadRequestException('Documento no encontrado')
    }

    const estudianteId = new Types.ObjectId(updateApoderadoDto.estudiante_id)
    const estudiante = await this.estudianteModel.findById(estudianteId)
    if(!estudiante){
        throw new BadRequestException('Estudiante no encontrado')
    }

    apoderado.nombre = updateApoderadoDto.nombre,
    apoderado.apellido = updateApoderadoDto.apellido,
    apoderado.numero = updateApoderadoDto.numero,
    apoderado.correo = updateApoderadoDto.correo,
    apoderado.direccion = updateApoderadoDto.direccion,
    apoderado.numero_documento = updateApoderadoDto.numero_documento,
    apoderado.documento = documentoId,
    apoderado.estudiante = estudianteId

    await apoderado.save()

    return this.apoderadoModel.findById(apoderado_id)
      .populate(['documento','estudiante','multimedia','user'])
  }

  async remove(apoderado_id: string) {
    const apoderado = await this.apoderadoModel.findById(apoderado_id)
    if(!apoderado){
        throw new BadRequestException('Apoderado no encontrado')
    }

    await this.apoderadoModel.findByIdAndDelete(apoderado_id)

    if(apoderado.user) {
      const user = apoderado.user._id
      await this.userModel.findByIdAndDelete(user)
    }

    const multimediaId = apoderado.multimedia ? apoderado.multimedia._id : null

    if (multimediaId) {
      const multimedia = await this.multimediaModel.findById(multimediaId).exec()
      if (multimedia) {
        await this.supabaseService.deleteFileFromFirebase(multimedia.url);
        await this.multimediaModel.findByIdAndDelete(multimediaId);
      }
    }

    return { sucess: true }
  }
  
  async asignarUsuario(apoderado_id: string, usuario_id: string){
    const apoderado = await this.apoderadoModel.findById(apoderado_id)
    if (!apoderado) {
      throw new BadRequestException('Apoderado no encontrado');
    }

    const usuario = await this.userModel.findById(usuario_id).exec();
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    apoderado.user = usuario._id

    await apoderado.save()

    return this.estudianteModel.findById(apoderado._id)
      .populate(['documento','estudiante','multimedia','user'])
  }

  async removeUsuario(apoderado_id: string) {
    const apoderado = await this.apoderadoModel.findById(apoderado_id)
    if (!apoderado) {
      throw new BadRequestException('Apoderado no encontrado')
    }
    
    apoderado.user = null;
    
    await apoderado.save()
    return this.apoderadoModel.findById(apoderado._id)
      .populate(['documento','estudiante','multimedia','user'])
  }

  async updateProfilePicture(apoderado_id: string, file: Express.Multer.File) {
    const apoderado = await this.apoderadoModel.findById(apoderado_id)
      .populate('multimedia')
    if (!apoderado) {
      throw new BadRequestException('Apoderado no encontrado')
    }
    
    if (apoderado.multimedia && (apoderado.multimedia as unknown as Multimedia).url) {
      const multimedia = apoderado.multimedia as unknown as Multimedia;
      await this.supabaseService.deleteFileFromFirebase(multimedia.url);
      await this.multimediaModel.deleteOne({ _id: multimedia._id }).exec();
      apoderado.multimedia = null;
    }

    const imageUrl = await this.supabaseService.uploadPfpToFirebase('Apoderado', file);

    const multimedia = new this.multimediaModel({
      url: imageUrl,
      nombre: file.originalname,
      tamanio: file.size,
    });

    await multimedia.save()

    apoderado.multimedia = multimedia

    return await apoderado.save()
  }

  async removeByEstudianteId(estudiante_id: string) {
    const estudianteId = new Types.ObjectId(estudiante_id)
    await this.apoderadoModel.deleteMany({ estudiante: estudianteId });
    
    return await this.apoderadoModel.deleteMany({ estudiante: estudiante_id });
  }

  async listarApoderadosPorEstudiante(estudiante_id: string) {
    const estudiante = await this.estudianteModel.findById(estudiante_id)
    if (!estudiante) {
      throw new BadRequestException(`Estudiante no encontrado`);
    }

    return this.apoderadoModel.find({ estudiante: estudiante._id })
      .populate(['documento','estudiante','multimedia','user'])
  }
  
}
