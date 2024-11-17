import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotasService } from './notas.service';
import { CreateNotasDto } from './dto/create-notas.dto';
import { UpdateNotasDto } from './dto/update-notas.dto';

@Controller('notas')
@ApiTags('Notas')
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  @Post()
  create(@Body() createNotasDto: CreateNotasDto){
    return this.notasService.create(createNotasDto);
  }

  @Get()
  findAll(){
    return this.notasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.notasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotasDto: UpdateNotasDto){
    return this.notasService.update(id, updateNotasDto)
  }
  
  @Get('/:gradoId/:periodoId/:seccionId')
  listarEstudiantesPorGradoPeriodoYSeccion(
    @Param('gradoId') gradoId: string,
    @Param('periodoId') periodoId: string, 
    @Param('seccionId') seccionId: string
  ) {
    return this.notasService.listarEstudiantesPorGradoPeriodoYSeccion(gradoId, periodoId, seccionId)
  }

  @Get(':estudianteId/:cursoId/:bimestreId/:tipoNota')
  obtenerNota(
    @Param('estudianteId') estudianteId: string,
    @Param('cursoId') cursoId: string,
    @Param('bimestreId') bimestreId: string,
    @Param('tipoNota') tipoNota: string,
  ) {
    return this.notasService.obtenerNota(
      estudianteId,
      cursoId,
      bimestreId,
      tipoNota,
    );
  }

  @Get('/:estudianteId/:cursoId/:bimestreId/:seccionId/:tipoNota')
 filtrarNotasPorParametros(
  @Param('estudianteId') estudianteId: string,
  @Param('cursoId') cursoId: string,
  @Param('bimestreId') bimestreId: string,
  @Param('seccionId') seccionId: string,
  @Param('tipoNota') tipoNota: string,
) {
  console.log('Parámetros recibidos:', {
    estudianteId,
    cursoId,
    bimestreId,
    seccionId,
    tipoNota,
  });
  return this.notasService.listarNotasPorParametros(
    estudianteId,
    cursoId,
    bimestreId,
    seccionId,
    tipoNota,
  );
}
}
