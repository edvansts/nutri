import { ApiExtraModels } from '@nestjs/swagger';
import {
  Column,
  Model,
  Table,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { Appointment } from './appointment.model';
import { ClinicalEvaluation } from './clinical-evaluation.model';
import { Diagnostic } from './diagnostic.model';
import {
  CIVIL_STATUS,
  ETHNICITY,
  GENDER,
  SCHOOLING,
  SEX,
} from 'src/constants/enum';
import { Person } from './person.model';
import { PhysicalEvaluation } from './physical-evaluation.model';
import { BR_PHONE_REGEX } from 'src/constants/regex';
import { FoodConsumption } from './food-consumption.model';
import { AnthropometricEvaluation } from './anthropometric-evaluation.model';
import { BodyEvolution } from './body-evolution.model';

@ApiExtraModels()
@Table
export class Patient extends Model<Patient> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    autoIncrement: false,
  })
  id: string;

  @Column({ type: DataType.ENUM, values: Object.values(SEX), allowNull: false })
  sex: SEX;

  @Column({
    type: DataType.ENUM,
    values: Object.values(GENDER),
    allowNull: false,
  })
  gender: GENDER;

  @Column({
    type: DataType.ENUM,
    values: Object.values(CIVIL_STATUS),
    allowNull: false,
  })
  civilStatus: CIVIL_STATUS;

  @Column({ type: DataType.STRING })
  nationality: string;

  @Column({ type: DataType.STRING })
  naturality: string;

  @Column({ type: DataType.ENUM, values: Object.values(ETHNICITY) })
  ethnicity: ETHNICITY;

  @Column({ type: DataType.ENUM, values: Object.values(SCHOOLING) })
  schooling: SCHOOLING;

  @Column({ type: DataType.STRING })
  profession: string;

  @Column({ type: DataType.STRING })
  completeAddress: string;

  @Column({ type: DataType.STRING })
  historyWeightGain: string;

  @Column({
    type: DataType.STRING,
    validate: { is: BR_PHONE_REGEX },
  })
  phoneNumber: string;

  @ForeignKey(() => Person)
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  personId: string;

  @BelongsTo(() => Person)
  person: Person;

  @HasMany(() => Diagnostic)
  diagnostics: Diagnostic[];

  @HasMany(() => Appointment)
  appointments: Appointment[];

  @HasMany(() => PhysicalEvaluation)
  physicalEvaluations: PhysicalEvaluation[];

  @HasMany(() => AnthropometricEvaluation)
  anthropometricEvaluations: AnthropometricEvaluation[];

  @HasOne(() => ClinicalEvaluation)
  clinicalEvaluations: ClinicalEvaluation;

  @HasMany(() => FoodConsumption)
  foodConsumptions: FoodConsumption[];

  @HasMany(() => BodyEvolution)
  bodyEvolutions: BodyEvolution[];
}
