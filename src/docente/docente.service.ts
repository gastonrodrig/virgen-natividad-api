import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Docente } from './schema/docente.schema';
import { Model, Types } from 'mongoose';
import { Documento } from 'src/documento/schema/documento.schema';
import { User } from 'src/user/schema/user.schema';
import { Multimedia } from 'src/multimedia/schema/multimedia.schema';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { SupabaseService } from 'src/storage/supabase.service';

@Injectable()
export class DocenteService {
  constructor(
    @InjectModel(Docente.name)
    private readonly docenteModel: Model<Docente>,
    @InjectModel(Documento.name)
    private readonly documentoModel: Model<Documento>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Multimedia.name)
    private readonly multimediaModel: Model<Multimedia>,
    private readonly supabaseService: SupabaseService
  ) {}

  async create(createDocenteDto: CreateDocenteDto) {
    const documento = await this.documentoModel.findById(createDocenteDto.documento_id)
    if (!documento) {
      throw new BadRequestException('Documento no encontrado')
    }

    const docente = new this.docenteModel({
      nombre: createDocenteDto.nombre,
      apellido: createDocenteDto.apellido,
      direccion: createDocenteDto.direccion,
      telefono: createDocenteDto.telefono,
      numero_documento: createDocenteDto.numero_documento,
      documento,
      multimedia: null,
    });

    await docente.save()

    return this.docenteModel.findById(docente._id)
      .populate(['multimedia'])
  }

  async findAll() {
    return await this.docenteModel.find()
      .populate(['documento', 'multimedia', 'user'])
  }

  async findOne(docente_id: string) {
    return await this.docenteModel.findById(docente_id)
      .populate(['documento', 'multimedia', 'user'])
  }

  async update(docente_id: string, updateDocenteDto: UpdateDocenteDto) {
    const docente = await this.docenteModel.findById(docente_id);
    if (!docente) {
      throw new BadRequestException('Docente no encontrado')
    }

    const documentoId = new Types.ObjectId(updateDocenteDto.documento_id)

    const documento = await this.documentoModel.findById(documentoId)
    if (!documento) {
      throw new BadRequestException('Documento no encontrado')
    }

    docente.nombre = updateDocenteDto.nombre
    docente.apellido = updateDocenteDto.apellido
    docente.direccion = updateDocenteDto.direccion
    docente.telefono = updateDocenteDto.telefono
    docente.numero_documento = updateDocenteDto.numero_documento
    docente.documento = documentoId

    await docente.save()

    return this.docenteModel.findById(docente._id)
      .populate(['documento', 'multimedia', 'user'])
  }

  async remove(docente_id: string) {
    const docente = await this.docenteModel.findById(docente_id)
      .populate('user')
    if (!docente) {
      throw new BadRequestException('Docente no encontrado')
    }
    await this.docenteModel.findByIdAndDelete(docente_id)

    if(docente.user) {
      const user = docente.user._id
      await this.userModel.findByIdAndDelete(user)
    }

    return { success: true }
  }

  async asignarUsuario(docente_id: string, usuario_id: string) {
    const docente = await this.docenteModel.findById(docente_id)
      .populate(['documento', 'multimedia', 'user'])
    if (!docente) {
      throw new BadRequestException('Docente no encontrado');
    }

    const usuario = await this.userModel.findById(usuario_id).exec();
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    docente.user = usuario._id

    await docente.save()

    return this.docenteModel.findById(docente._id)
      .populate(['documento', 'multimedia', 'user'])
  } 

  async removeUsuario(docente_id: string) {
    const docente = await this.docenteModel.findById(docente_id)
    if (!docente) {
      throw new BadRequestException('Docente no encontrado')
    }
  
    docente.user = null;
  
    await docente.save()
    return this.docenteModel.findById(docente._id)
      .populate(['documento', 'multimedia', 'user'])
  }

  async updateProfilePicture(docente_id: string, file: Express.Multer.File) {
    const docente = await this.docenteModel.findById(docente_id)
      .populate('multimedia')
    if (!docente) {
      throw new BadRequestException('Docente no encontrado')
    }
  
    if (docente.multimedia && (docente.multimedia as unknown as Multimedia).url) {
      const multimedia = docente.multimedia as unknown as Multimedia;
      await this.supabaseService.deleteFileFromFirebase(multimedia.url);
      await this.multimediaModel.deleteOne({ _id: multimedia._id }).exec();
      docente.multimedia = null;
    }

    const imageUrl = await this.supabaseService.uploadPfpToFirebase('Docente', file);

    const multimedia = new this.multimediaModel({
      url: imageUrl,
      nombre: file.originalname,
      tamanio: file.size,
    });

    await multimedia.save()

    docente.multimedia = multimedia
    return await docente.save()
  }

  async findByNumeroDocumento(numero_documento: string, validarUsuarioAsignado: boolean) {
    const docente = await this.docenteModel.findOne({ numero_documento })
  
    if (!docente) {
      throw new BadRequestException('Docente no encontrado');
    }
  
    if (validarUsuarioAsignado && docente.user) {
      throw new BadRequestException('Este docente ya tiene un usuario asignado');
    }
  
    return docente;
  }
}