import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Solicitud } from './schema/solicitud.schema';
import { Model, Types } from 'mongoose';
import { Grado } from 'src/grado/schema/grado.schema';
import { GmailTemporalService } from 'src/gmailTemporal/gmailTemporal.service';
import { UserService } from 'src/user/user.service';
import { EstadoSolicitud } from './enums/estado-solicitud.enum';

@Injectable()
export class SolicitudService {
  constructor(
    @InjectModel(Solicitud.name) 
    private readonly solicitudModel: Model<Solicitud>,
    @InjectModel(Grado.name)
    private readonly gradoModel: Model<Grado>,

    private readonly gmailTemporalService: GmailTemporalService,
    private readonly userService: UserService
  ) {}

  async create(createSolicitudDto: CreateSolicitudDto) {
    const grado = await this.gradoModel.findById(createSolicitudDto.grado_id)
    if(!grado){
      throw new BadRequestException('Grado no encontrado')
    }

    const solicitud = new this.solicitudModel({
      nombre_hijo: createSolicitudDto.nombre_hijo,
      apellido_hijo: createSolicitudDto.apellido_hijo,
      dni_hijo: createSolicitudDto.dni_hijo,
      telefono_padre: createSolicitudDto.telefono_padre,
      correo_padre: createSolicitudDto.correo_padre,
      grado,
      fecha_solicitud: new Date(),
    });
    return await solicitud.save();
  }

  async findAll(){
    return await this.solicitudModel.find()
  }

  async findOne(solicitud_id: string) {
    return await this.solicitudModel.findById(solicitud_id).populate('grado')
  }

  async update(solicitud_id: string, updateSolicitudDto: UpdateSolicitudDto) {
    const solicitud = await this.solicitudModel.findById(solicitud_id)
    if (!solicitud) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    solicitud.nombre_hijo = updateSolicitudDto.nombre_hijo;
    solicitud.apellido_hijo = updateSolicitudDto.apellido_hijo;
    solicitud.dni_hijo = updateSolicitudDto.dni_hijo;
    solicitud.telefono_padre = updateSolicitudDto.telefono_padre;
    solicitud.correo_padre = updateSolicitudDto.correo_padre;

    return await solicitud.save();
  }

  async aprobarSolicitud(solicitud_id: string) {
    const solicitud = await this.solicitudModel.findById(solicitud_id)
    if (!solicitud) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    solicitud.estado = EstadoSolicitud.APROBADO

    return await solicitud.save();
  }

  async procesarSolicitud(solicitud_id: string) {
    const solicitud = await this.solicitudModel.findById(solicitud_id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    solicitud.estado = EstadoSolicitud.PROCESO;

    const { usuario, contrasena } = await this.userService.createTemporaryUser();

    await solicitud.save();

    await this.gmailTemporalService.sendTemporaryAccountEmail(
      solicitud.correo_padre,
      usuario,
      contrasena
    );

    return solicitud;
  }

  async cancelarSolicitud(solicitud_id: string){
    const solicitud = await this.solicitudModel.findById(solicitud_id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    solicitud.estado = EstadoSolicitud.CANCELADO;

    await solicitud.save();

    await this.gmailTemporalService.enviarCorreoTemporalCancelado(
      solicitud.correo_padre
    );

    return solicitud
  }
  
  async findByNumeroDocumentoSolicitud(dni_hijo: string){
    const solicitud = await this.solicitudModel.findOne({dni_hijo})
    .populate(['grado'])

    if(!solicitud){
      throw new BadRequestException('Solicitud no encontrada')
    }

    return solicitud;
  }

  async getSolicitudesPorMes(year: number, month: number): Promise<number>{
    if (month < 1 || month > 12) {
      throw new BadRequestException('El mes debe estar entre 1 y 12');
    }


    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);


    const result = await this.solicitudModel.aggregate([
      {
        $match: {
          fecha_solicitud: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSolicitudes: { $sum: 1 },
        },
      },
    ]);


    return result.length > 0 ? result[0].totalSolicitudes : 0;
  }
}
