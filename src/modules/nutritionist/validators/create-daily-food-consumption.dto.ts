import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Feeding } from 'src/types/food';

export class FeedingsDto implements Feeding {
  @IsString()
  @IsNotEmpty()
  food: string;

  @IsString()
  @IsNotEmpty()
  quantity: string;
}

export class FoodRecordDto {
  @Type(() => Date)
  @IsDate()
  mealTime: Date;

  @IsArray()
  @IsNotEmpty()
  @Type(() => FeedingsDto)
  feedings: FeedingsDto[];
}

export class CreateDailyFoodConsumptionDto {
  @Type(() => Date)
  @IsDate()
  linkedDay: Date;

  @IsArray()
  @IsNotEmpty()
  @Type(() => FoodRecordDto)
  foodRecords: FoodRecordDto[];
}
