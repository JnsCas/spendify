import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CardsService } from './cards.service';
import { Card } from './card.entity';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  async findAll(@CurrentUser() user: User): Promise<Card[]> {
    return this.cardsService.findByUser(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Card> {
    return this.cardsService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateCardDto,
  ): Promise<Card> {
    return this.cardsService.update(id, user.id, updateDto.customName);
  }
}
