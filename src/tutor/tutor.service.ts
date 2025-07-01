import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Tutor } from './schema/tutor.schema';
import { Model, Types } from 'mongoose';
import { Documento } from 'src/documento/schema/documento.schema';
import { Multimedia } from 'src/multimedia/schema/multimedia.schema';
import { User } from 'src/user/schema/user.schema';
import { Seccion } from 'src/seccion/schema/seccion.schema';
import { Grado } from 'src/grado/schema/grado.schema';
import { PeriodoEscolar } from 'src/periodo-escolar/schema/periodo-escolar.schema';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { SupabaseService } from 'src/storage/supabase.service';

@Injectable()
export class TutorService {
  constructor(
    @InjectModel(Tutor.name)
    private readonly tutorModel: Model<Tutor>,
    @InjectModel(Documento.name)
    private readonly documentoModel: Model<Documento>,
    @InjectModel(Multimedia.name)
    private readonly multimediaModel: Model<Multimedia>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Seccion.name)
    private readonly seccionModel: Model<Seccion>,
    @InjectModel(Grado.name)
    private readonly gradoModel: Model<Grado>,
    @InjectModel(PeriodoEscolar.name)
    private readonly periodoModel: Model<PeriodoEscolar>,
    private readonly supabaseService: SupabaseService
  ) {}

  async create(createTutorDto: CreateTutorDto){
    const documento = await this.documentoModel.findById(createTutorDto.documento_id)
    if(!documento){
      throw new BadRequestException('Documento no encontrado');
    }

    const periodo = await this.periodoModel.findById(createTutorDto.periodo_id)
    if(!periodo){
      throw new BadRequestException('Periodo no encontrado')
    }

    const grado = await this.gradoModel.findById(createTutorDto.grado_id)
    if(!grado){
      throw new BadRequestException('Grado no encontrado')
    }

    const seccion = await this.seccionModel.findById(createTutorDto.seccion_id)
    if (!seccion) {
      throw new BadRequestException('Sección no encontrada');
    }

    const tutorExistente = await this.tutorModel.findOne({
      seccion: seccion._id,
      grado: grado._id,
      periodo: periodo._id
    })
    if (tutorExistente) {
      throw new BadRequestException('Ya existe un tutor asignado para esta sección, grado y periodo');
    }

    const tutor = new this.tutorModel({
      nombre: createTutorDto.nombre,
      apellido: createTutorDto.apellido,
      direccion: createTutorDto.direccion,
      telefono: createTutorDto.telefono,
      numero_documento: createTutorDto.numero_documento,
      documento,
      periodo,
      grado,
      seccion,
      multimedia: null,
      user: null
    })

    return await tutor.save()
  }

  async findAll() {
    return await this.tutorModel.find()
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async findOne(tutor_id: string){
    return await this.tutorModel.findById(tutor_id)
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async update(tutor_id: string, updateTutorDto: UpdateTutorDto){
    const tutor = await this.tutorModel.findById(tutor_id)
    if(!tutor){
      throw new BadRequestException('Tutor no encontrado')
    }

    const documentoId = new Types.ObjectId(updateTutorDto.documento_id)
    const documento = await this.documentoModel.findById(documentoId)
    if(!documento){
      throw new BadRequestException('Documento no encontrado')
    }

    const periodoId = new Types.ObjectId(updateTutorDto.periodo_id)
    const periodo = await this.periodoModel.findById(periodoId)
    if(!periodo){
      throw new BadRequestException('Periodo no encontrado')
    }
      
    const gradoId = new Types.ObjectId(updateTutorDto.grado_id)
    const grado = await this.gradoModel.findById(gradoId)
    if(!grado){
      throw new BadRequestException('Grado no encontrado')
    }

    const seccionId = new Types.ObjectId(updateTutorDto.seccion_id)
    const seccion = await this.seccionModel.findById(seccionId)
    if(!seccion){
      throw new BadRequestException('Seccion no encontrada')
    }

    tutor.nombre = updateTutorDto.nombre,
    tutor.apellido = updateTutorDto.apellido,
    tutor.direccion = updateTutorDto.direccion,
    tutor.telefono = updateTutorDto.telefono,
    tutor.numero_documento = updateTutorDto.numero_documento,
    tutor.documento = documentoId,
    tutor.periodo = periodoId,
    tutor.grado = gradoId,
    tutor.seccion = seccionId

    await tutor.save()

    return this.tutorModel.findById(tutor._id)
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async listarPorSeccionGradoYPeriodo(seccion_id: string, grado_id: string, periodo_id: string){
    const seccion = await this.seccionModel.findById(seccion_id)
    if(!seccion){
        throw new BadRequestException('Seccion no encontrada')
    }

    const grado = await this.gradoModel.findById(grado_id)
    if(!grado){
        throw new BadRequestException('Grado no encontrado');
    }

    const periodo = await this.periodoModel.findById(periodo_id)
    if(!periodo){
        throw new BadRequestException('Periodo no encontrado');
    }

    return this.tutorModel.find({
        seccion: seccion._id,
        grado: grado._id,
        periodo: periodo._id
    })
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async asignarUsuario(tutor_id: string, usuario_id: string){
    const tutor = await this.tutorModel.findById(tutor_id)
    if(!tutor){
        throw new BadRequestException('Tutor no encontrado')
    }

    const usuario = await this.userModel.findById(usuario_id).exec();
    if(!usuario){
        throw new BadRequestException('Usuario no encontrado')
    }

    tutor.user = usuario._id

    await tutor.save()

    return this.tutorModel.findById(tutor._id)
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async removeUsuario(tutor_id: string){
    const tutor = await this.tutorModel.findById(tutor_id)
    if(!tutor){
        throw new BadRequestException('Tuutor no encontrado')
    }

    tutor.user = null;

    await tutor.save()

    return this.tutorModel.findById(tutor._id)
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async updateProfilePicture(tutor_id: string, file: Express.Multer.File) {
    const tutor = await this.tutorModel.findById(tutor_id)
      .populate('multimedia')
    if (!tutor) {
      throw new BadRequestException('Tutor no encontrado')
    }
    
    if (tutor.multimedia && (tutor.multimedia as unknown as Multimedia).url) {
      const multimedia = tutor.multimedia as unknown as Multimedia;
      await this.supabaseService.deleteFileFromFirebase(multimedia.url);
      await this.multimediaModel.deleteOne({ _id: multimedia._id }).exec();
      tutor.multimedia = null;
    }
  
    const imageUrl = await this.supabaseService.uploadPfpToFirebase('Tutor', file);
  
    const multimedia = new this.multimediaModel({
      url: imageUrl,
      nombre: file.originalname,
      tamanio: file.size,
    });
  
    await multimedia.save()

    tutor.multimedia = multimedia

    await tutor.save()

    return this.tutorModel.findById(tutor._id)
      .populate(['documento','periodo','grado','seccion','multimedia','user'])
  }

  async remove(tutor_id: string){
    const tutor = await this.tutorModel.findById(tutor_id)
      .populate('user')
    if(!tutor){
      throw new BadRequestException('Tutor no encontrado')
    }
    await this.tutorModel.findByIdAndDelete(tutor_id)

    if(tutor.user) {
      const user = tutor.user._id
      await this.userModel.findByIdAndDelete(user)
    }

    const multimediaId = tutor.multimedia ? tutor.multimedia._id : null

    if (multimediaId) {
      const multimedia = await this.multimediaModel.findById(multimediaId).exec()
      if (multimedia) {
        await this.supabaseService.deleteFileFromFirebase(multimedia.url);
        await this.multimediaModel.findByIdAndDelete(multimediaId);
      }
    }

    if(tutor.user) {
      const user = tutor.user._id
      await this.userModel.findByIdAndDelete(user)
    }

    return { sucess: true }
  }

  async findByNumeroDocumento(numero_documento: string, validarUsuarioAsignado: boolean) {
    const tutor = await this.tutorModel.findOne({ numero_documento })
      .populate(['documento', 'periodo', 'grado', 'seccion', 'multimedia', 'user'])

    if (!tutor) {
      throw new BadRequestException('Tutor no encontrado');
    }

    if (validarUsuarioAsignado && tutor.user) {
      throw new BadRequestException('Este tutor ya tiene un usuario asociado');
    }

    return tutor;
  }
  
}