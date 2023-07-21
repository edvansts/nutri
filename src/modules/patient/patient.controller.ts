import {
  Body,
  CacheTTL,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiHeader,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/config/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/config/guards/jwt-auth.guard';
import { RolesGuard } from 'src/config/guards/roles.guard';
import { ROLE } from 'src/constants/user';
import { BiochemicalEvaluation } from 'src/models/biochemical-evaluation.model';
import { ClinicalEvaluation } from 'src/models/clinical-evaluation.model';
import { FoodConsumption } from 'src/models/food-consumption.model';
import { PhysicalEvaluation } from 'src/models/physical-evaluation.model';
import { TOTAL_COUNT_HEADER_DESCRIPTION } from '../common/constants';
import { PaginationDto } from '../common/validators/pagination.dto';
import { PatientService } from './patient.service';
import { CreatePatientResponse } from './response/create-patient.response';
import { CreateBiochemicalEvaluationDto } from './validators/create-biochemical-evaluation.dto';
import { CreatePhysicalEvaluationDto } from './validators/create-physical-evaluation.dto';
import { CreateClinicalEvaluationDto } from './validators/create-clinical-evaluation.dto';
import { CreatePatientDto } from './validators/create-patient.dto';
import { UpdatePatientDto } from './validators/update-patient.dto';
import { AnthropometricEvaluation } from 'src/models/anthropometric-evaluation.model';
import { CreateAnthropometricEvaluationDto } from './validators/create-anthropometric-evaluation.dto';
import { Guidance } from 'src/models/guidance.model';
import { RegisterHistoryWeightGainDto } from './validators/register-history-weight-gain.dto';
import { BodyEvolution } from 'src/models/body-evolution.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { TotalCountInterceptor } from 'src/config/interceptors/total-count.interceptor';
import { toMb } from 'src/utils/transform';
import { IMAGE_EXTENSION_REGEX } from 'src/constants/regex';
import { NoCache } from 'src/config/decorators/no-cache.decorator';
import { CustomCacheInterceptor } from 'src/config/interceptors/custom-cache.interceptor';
import { Public } from 'src/config/decorators/is-public.decorator';
import { CheckFirstAccessDto } from './validators/check-first-access.dto';
import { FirstAccessSetupDto } from './validators/first-access-setup.dto';
import { SetupPatientAccessDataResponse } from './response/setup-patient-access-data.response';
import { Patient } from 'src/models/patient.model';
import { GetPatientsListDto } from './validators/get-patients-list.dto';

@ApiTags('patient')
@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
@Controller('patient')
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CreatePatientResponse })
  @Roles(ROLE.NUTRITIONIST)
  async createPatient(@Body() patient: CreatePatientDto) {
    return this.patientService.create(patient);
  }

  @Put(':patientId')
  @ApiBearerAuth()
  @ApiGoneResponse()
  @HttpCode(204)
  async updatePatient(
    @Param('patientId') patientId: string,
    @Body() patient: UpdatePatientDto,
  ) {
    return this.patientService.updatePatient(patientId, patient);
  }

  @Get(':patientId/clinical-evaluation')
  @ApiBearerAuth()
  @ApiOkResponse({ type: ClinicalEvaluation })
  async getClinicalEvaluation(@Param('patientId') patientId: string) {
    return this.patientService.getClinicalEvaluationById(patientId);
  }

  @Post(':patientId/clinical-evaluation')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ClinicalEvaluation })
  @Roles(ROLE.NUTRITIONIST)
  async createClinicalEvaluation(
    @Param('patientId') patientId: string,
    @Body() clinicalEvaluation: CreateClinicalEvaluationDto,
  ) {
    return this.patientService.createClinicalEvaluation(
      patientId,
      clinicalEvaluation,
    );
  }

  @Get(':patientId/food-consumption')
  @CacheTTL(60 * 60 * 4)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [FoodConsumption] })
  @UseInterceptors(TotalCountInterceptor)
  @UseInterceptors(CustomCacheInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.NUTRITIONIST, ROLE.PATIENT)
  async getFoodConsumptions(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getDailyFoodConsumptions(patientId, pagination);
  }

  @Post(':patientId/physical-evalution')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PhysicalEvaluation })
  @Roles(ROLE.NUTRITIONIST)
  async createPhysicalEvaluation(
    @Param('patientId') patientId: string,
    @Body() physicalEvaluation: CreatePhysicalEvaluationDto,
  ) {
    return this.patientService.createPhysicalEvaluation(
      patientId,
      physicalEvaluation,
    );
  }

  @Get(':patientId/physical-evalution')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [PhysicalEvaluation] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getPhysicalEvaluations(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getPhysicalEvaluations(patientId, pagination);
  }

  @Post(':patientId/biochemical-evaluation')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: BiochemicalEvaluation })
  @Roles(ROLE.NUTRITIONIST)
  async createBiochemicalEvaluation(
    @Param('patientId') patientId: string,
    @Body() biochemicalEvaluation: CreateBiochemicalEvaluationDto,
  ) {
    return this.patientService.createBiochemicalEvaluation(
      patientId,
      biochemicalEvaluation,
    );
  }

  @Get(':patientId/biochemical-evaluation')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [BiochemicalEvaluation] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getBiochemicalEvaluations(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getBiochemicalEvaluations(patientId, pagination);
  }

  @Post(':patientId/anthropometric-evaluation')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: BiochemicalEvaluation })
  @Roles(ROLE.NUTRITIONIST)
  async createAnthropometricEvaluation(
    @Param('patientId') patientId: string,
    @Body() anthropometricEvaluation: CreateAnthropometricEvaluationDto,
  ) {
    return this.patientService.createAnthropometricEvaluation(
      patientId,
      anthropometricEvaluation,
    );
  }

  @Get(':patientId/anthropometric-evaluation')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [AnthropometricEvaluation] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getAnthropometricEvaluations(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getAnthropometricEvaluations(
      patientId,
      pagination,
    );
  }

  @Get(':patientId/guidance')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [Guidance] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getGuidances(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getGuidances(patientId, pagination);
  }

  @Post(':patientId/history-weight-gain')
  @ApiBearerAuth()
  @ApiGoneResponse()
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.NUTRITIONIST)
  async registerHistoryWeightGain(
    @Param('patientId') patientId: string,
    @Body() data: RegisterHistoryWeightGainDto,
  ) {
    return this.patientService.registerHistoryWeightGain(patientId, data);
  }

  @Post(':patientId/body-evolution')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOkResponse({ type: BodyEvolution })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT)
  async createBodyEvolution(
    @Param('patientId') patientId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: toMb(5) }),
          new FileTypeValidator({
            fileType: IMAGE_EXTENSION_REGEX,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.patientService.createBodyEvolution(patientId, file);
  }

  @Get(':patientId/body-evolution')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [BodyEvolution] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getBodyEvolutions(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getBodyEvolutions(patientId, pagination);
  }

  @Delete(':patientId/body-evolution/:bodyEvolutionId')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiGoneResponse()
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT)
  async deleteBodyEvolution(
    @Param('patientId') patientId: string,
    @Param('bodyEvolutionId') bodyEvolutionId: string,
  ) {
    return this.patientService.deleteBodyEvolution(patientId, bodyEvolutionId);
  }

  @Get(':patientId/nutritional-data')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [Guidance] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getNutritionalData(
    @Param('patientId') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.getNutritionalData(patientId, pagination);
  }

  @Get(':patientId/nutritional-data/:nutritionalDataId/file')
  @ApiBearerAuth()
  @NoCache()
  @Header('Content-Type', 'application/pdf')
  @Roles(ROLE.PATIENT, ROLE.NUTRITIONIST)
  async getNutritionalDataFile(
    @Param('patientId') patientId: string,
    @Param('nutritionalDataId') nutritionalDataId: string,
    @Res() res,
  ) {
    const file = await this.patientService.getNutritionalDataFile(
      patientId,
      nutritionalDataId,
    );

    return file.pipe(res);
  }

  @Post('check-first-access')
  @Public()
  @NoCache()
  async checkFirstAccess(@Body() checkFirstAccessDto: CheckFirstAccessDto) {
    return this.patientService.checkFirstAccess(checkFirstAccessDto);
  }

  @Post('first-access-setup')
  @Public()
  @NoCache()
  @ApiOkResponse({ type: SetupPatientAccessDataResponse })
  async firstAccessSetup(@Body() firstAccessSetupDto: FirstAccessSetupDto) {
    return this.patientService.firstAccessSetup(firstAccessSetupDto);
  }

  @Get('/list')
  @ApiBearerAuth()
  @UseInterceptors(TotalCountInterceptor)
  @ApiQuery({ type: PaginationDto })
  @ApiHeader(TOTAL_COUNT_HEADER_DESCRIPTION)
  @ApiOkResponse({ type: [Patient] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Roles(ROLE.NUTRITIONIST)
  async getPatientsList(@Query() query: GetPatientsListDto) {
    return this.patientService.getPatientsList(query);
  }

  @Get('/person/:personId')
  @ApiBearerAuth()
  @ApiOkResponse({ type: Patient })
  @Roles(ROLE.NUTRITIONIST, ROLE.PATIENT)
  async getPatientByPersonId(@Param('personId') personId: string) {
    return this.patientService.getPatientByPersonId(personId);
  }

  @Get('/:patientId')
  @ApiBearerAuth()
  @Roles(ROLE.NUTRITIONIST, ROLE.PATIENT)
  @ApiOkResponse({ type: Patient })
  async getPatientById(@Param('patientId') patientId: string) {
    return this.patientService.getPatientById(patientId);
  }
}
