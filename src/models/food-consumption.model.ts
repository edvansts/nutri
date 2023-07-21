import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { FoodRecord } from './food-record.model';
import { Nutritionist } from './nutritionist.model';
import { Patient } from './patient.model';

@Table
export class FoodConsumption extends Model<FoodConsumption> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    autoIncrement: false,
  })
  id: string;

  @Column({ type: DataType.DATE, allowNull: false })
  linkedDay: Date;

  @ForeignKey(() => Nutritionist)
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  nutritionistId: string;

  @BelongsTo(() => Nutritionist)
  nutritionist: Nutritionist;

  @ForeignKey(() => Patient)
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  patientId: string;

  @BelongsTo(() => Patient)
  patient: Patient;

  @HasMany(() => FoodRecord)
  foodRecords: FoodRecord[];
}
