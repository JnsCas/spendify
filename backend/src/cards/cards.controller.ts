import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CardsService } from './cards.service';
import { Card } from './card.entity';
import { CreateCardDto } from './dto/create-card.dto';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreateCardDto,
  ): Promise<Card> {
    return this.cardsService.create({
      ...createDto,
      userId: user.id,
    });
  }

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

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.cardsService.delete(id, user.id);
  }
}
