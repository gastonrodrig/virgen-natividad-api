import { Controller, Body, Patch, Param } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { CreateGmailPdfDto } from './dto/create-gmail-pdf.dto';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Patch('send-email/:stripeOperationId')
  async sendEmailPdf(
    @Param('stripeOperationId') stripeOperationId: string,
    @Body() createGmailPdfDto: CreateGmailPdfDto,
  ) {
    await this.gmailService.sendEmailWithPdf(
      stripeOperationId,
      createGmailPdfDto,
    );
    return { message: 'Correo con PDF enviado satisfactoriamente' };
  }
}
