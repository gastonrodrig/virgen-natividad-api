// src/stripe/stripe.controller.ts
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreatePagoDto } from '../pago/dto/create-pago.dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('angular')
  processPaymentAngular(@Body() createPagoDto: CreatePagoDto) {
    return this.stripeService.processPaymentAngular(createPagoDto);
  }

  @Post('react-native')
  processPaymentReactNative(@Body() createPagoDto: CreatePagoDto) {
    return this.stripeService.processPaymentForReactNative(createPagoDto);
  }
  
  @Get(':stripeOperationId')
  getPaymentDetails(@Param('stripeOperationId') stripeOperationId: string){
    return this.stripeService.getPaymentDetails(stripeOperationId)
  }

}
