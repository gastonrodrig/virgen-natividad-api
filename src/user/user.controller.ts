import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOneById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/remove-profile')
  removePerfil(@Param('id') id: string) {
    return this.userService.removePerfil(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.userService.cambiarHabilitado(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.userService.cambiarDeshabilitado(id);
  }

  @Patch(':id/change-password')
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.userService.changePassword(id, changePasswordDto);
  }

  @Post('create-temporary')
  async createTemporaryUser() {
    const userData = await this.userService.createTemporaryUser();
    return {
      message: 'Usuario temporal creado exitosamente',
      data: userData,
    };
  }

  @Get('usuarios/count/habilitados')
  async contarUsuariosHabilitados(): Promise<number> {
    return await this.userService.contarUsuariosHabilitados();
  }
} 
