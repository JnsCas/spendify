import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { Expense } from './expense.entity';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return this.expensesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const data = {
      ...updateDto,
      purchaseDate: updateDto.purchaseDate
        ? new Date(updateDto.purchaseDate)
        : undefined,
    };
    return this.expensesService.update(id, data);
  }
}
