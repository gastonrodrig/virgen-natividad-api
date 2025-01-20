import { BadRequestException, Injectable } from '@nestjs/common';
import { CursoDocente } from './schema/curso-docente.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Curso } from 'src/curso/schema/curso.schema';
import { Docente } from 'src/docente/schema/docente.schema';
import { CreateCursoDocenteDto } from './dto/create-curso-docente.dto';
import { UpdateCursoDocenteDto } from './dto/update-curso-docente.dto';

@Injectable()
export class CursoDocenteService {
  constructor(
    @InjectModel(CursoDocente.name)
    private readonly cursoDocenteModel: Model<CursoDocente>,
    @InjectModel(Curso.name)
    private readonly cursoModel: Model<Curso>,
    @InjectModel(Docente.name)
    private readonly docenteModel: Model<Docente>,
  ) {}

  async create(createCursoDocenteDto: CreateCursoDocenteDto) {
    const curso = await this.cursoModel.findById(
      createCursoDocenteDto.curso_id,
    );
    if (!curso) {
      throw new BadRequestException('Curso no encontrado');
    }

    const docente = await this.docenteModel.findById(
      createCursoDocenteDto.docente_id,
    );
    if (!docente) {
      throw new BadRequestException('Docente no encontrado');
    }

    const cursod = new this.cursoDocenteModel({
      curso,
      docente,
    });

    await cursod.save();

    return this.cursoDocenteModel
      .findById(cursod._id)
      .populate(['curso', 'docente']);
  }

  async findAll() {
    return await this.cursoDocenteModel.find().populate(['curso', 'docente']);
  }

  async findOne(cursod_id: string) {
    return await this.cursoDocenteModel
      .findById(cursod_id)
      .populate(['curso', 'docente']);
  }

  async update(
    cursod_id: string,
    updateCursoDocenteDto: UpdateCursoDocenteDto,
  ) {
    const cursod = await this.cursoDocenteModel.findById(cursod_id);
    if (!cursod) {
      throw new BadRequestException('CursoDocente no encontrado');
    }

    const cursoId = new Types.ObjectId(updateCursoDocenteDto.curso_id);
    const curso = await this.cursoModel.findById(cursoId);
    if (!curso) {
      throw new BadRequestException('Curso no encontrado');
    }

    const docenteId = new Types.ObjectId(updateCursoDocenteDto.docente_id);
    const docente = await this.docenteModel.findById(docenteId);
    if (!docente) {
      throw new BadRequestException('Docente no encontrado');
    }

    (cursod.curso = cursoId), (cursod.docente = docenteId);

    await cursod.save();

    return this.cursoDocenteModel
      .findById(cursod_id)
      .populate(['curso', 'docente']);
  }

  async remove(cursod_id: string) {
    const cursod = await this.cursoDocenteModel
      .findById(cursod_id)
      .populate('curso', 'docente');
    if (!cursod) {
      throw new BadRequestException('CursoDocente no encontrado');
    }

    await this.cursoDocenteModel.findByIdAndDelete(cursod_id);

    return { sucess: true };
  }

  async listarDocentesPorCurso(curso_id: string) {
    const curso = new Types.ObjectId(curso_id);
    const cursoDocente = await this.cursoDocenteModel
      .find({ curso: curso })
      .populate(['curso', 'docente']);

    if (cursoDocente.length === 0) {
      throw new BadRequestException(
        'No se encontraron docentes para el curso proporcionado',
      );
    }

    return cursoDocente;
  }
  async listarCursosPorDocentes(docente_id: string) {
    const docente = new Types.ObjectId(docente_id);
    const docenteCurso = await this.cursoDocenteModel
      .find({ docente: docente })
      .populate(['curso', 'docente']);

    if (docenteCurso.length === 0) {
      throw new BadRequestException(
        'No se encontraron cursos para el docente proporcionado',
      );
    }

    return docenteCurso;
  }

  async removeByCursoAndDocente(curso_id: string, docente_id: string) {
    const curso = new Types.ObjectId(curso_id);
    const docente = new Types.ObjectId(docente_id);
    const cursosDocente = await this.cursoDocenteModel.findOne({
      curso: curso,
      docente: docente,
    });
    if (!cursosDocente) {
      throw new BadRequestException('CursoDocente no fue encontrada');
    }

    await this.cursoDocenteModel.deleteOne({ _id: cursosDocente._id });

    return { success: true };
  }
}
