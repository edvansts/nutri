import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { formatDistanceStrict, intervalToDuration, subMinutes } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Sequelize } from 'sequelize-typescript';
import { PRIORITY } from 'src/constants/enum';
import { Appointment } from 'src/models/appointment.model';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationParam } from '../notification/types';
import { calendar, calendar_v3 } from '@googleapis/calendar';
import { DEFAULT_TIMEZONE } from 'src/constants/date';
import {
  APPOINTMENT_QUERY_TYPE,
  GetNextNutritionistAppointments,
} from '../nutritionist/validators/get-next-nutritionist-appointments.dto';
import { Order, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { Nutritionist } from 'src/models/nutritionist.model';
import { Patient } from 'src/models/patient.model';
import { Person } from 'src/models/person.model';

const APPOINTMENT_NOTIFICATION_TITLE = 'Lembrete';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment) private appointmentModel: typeof Appointment,
    private notificationService: NotificationService,
    private sequelize: Sequelize,
  ) {}

  async create({
    appointmentDate,
    minutesBeforeToNotice,
    nutritionistId,
    patientId,
    userIds,
  }: {
    nutritionistId: string;
    patientId: string;
    minutesBeforeToNotice: number[];
    appointmentDate: Date;
    userIds: string[];
    emails: string[];
    patientName: string;
    nutritionistName: string;
  }) {
    const transaction = await this.sequelize.transaction();

    try {
      const newAppointment = await this.appointmentModel.create(
        {
          appointmentDate,
          nutritionistId,
          patientId,
        },
        { transaction },
      );

      const notifications: CreateNotificationParam[] = [
        appointmentDate,
        ...minutesBeforeToNotice.map((minutes) =>
          subMinutes(appointmentDate, minutes),
        ),
      ].map((scheduleDate, index) => ({
        userIds,
        scheduleDate,
        body: this.getAppointmentNotificationMessage({
          appointmentDate,
          scheduleDate,
        }),
        title: APPOINTMENT_NOTIFICATION_TITLE,
        priority: index === 0 ? PRIORITY.HIGH : undefined,
      }));

      await this.notificationService.create(notifications, { transaction });

      // const dateStart = appointmentDate;
      // const dateEnd = addMinutes(appointmentDate, 30);

      // await this.createCalendarEvent({
      //   emails,
      //   dateStart,
      //   dateEnd,
      //   nutritionistName,
      //   patientName,
      // });

      await transaction.commit();

      return newAppointment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  private getAppointmentNotificationMessage({
    appointmentDate,
    scheduleDate,
    senderName,
  }: {
    senderName?: string;
    appointmentDate: Date;
    scheduleDate: Date;
  }) {
    const { days, hours, minutes } = intervalToDuration({
      start: scheduleDate,
      end: appointmentDate,
    });

    const formattedDistance = formatDistanceStrict(
      scheduleDate,
      appointmentDate,
      {
        locale: ptBR,
      },
    );

    const daysDistance = hours > 22 ? days + 1 : days;

    if (daysDistance === 0 && hours === 0 && minutes < 1) {
      return `Passando para lembrar da sua consulta ${
        senderName ? `com ${senderName}` : ''
      } agora`;
    }

    return `Passando para lembrar da sua consulta ${
      senderName ? `com ${senderName}` : ''
    } em ${formattedDistance}`;
  }

  private async createCalendarEvent({
    emails,
    dateStart,
    dateEnd,
    nutritionistName,
    patientName,
  }: {
    emails: string[];
    dateStart: Date;
    dateEnd: Date;
    nutritionistName: string;
    patientName: string;
  }) {
    const event: calendar_v3.Schema$Event = {
      summary: `Consulta Dr. ${nutritionistName} e ${patientName}`,
      location: 'Virtual / Google Meet',
      start: {
        dateTime: dateStart.toISOString(),
        timeZone: DEFAULT_TIMEZONE,
      },
      end: {
        dateTime: dateEnd.toISOString(),
        timeZone: DEFAULT_TIMEZONE,
      },
      attendees: emails.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
          requestId: 'coding-calendar-demo',
        },
      },
    };

    const response = await calendar('v3').events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    return response;
  }

  async getNextAppointmentsByNutritionistId(
    nutritionistId: string,
    { limit, offset, type }: GetNextNutritionistAppointments,
  ) {
    const WHERE_BY_TYPE: Record<
      APPOINTMENT_QUERY_TYPE,
      WhereOptions<Appointment>
    > = {
      SCHEDULED: {
        appointmentDate: { [Op.gte]: new Date() },
        isCanceled: false,
      },
      CANCELED: {
        isCanceled: true,
      },
      FINISHED: {
        appointmentDate: {
          [Op.lt]: new Date(),
        },
      },
    };

    const ORDER_BY_TYPE: Record<APPOINTMENT_QUERY_TYPE, Order> = {
      SCHEDULED: [['appointmentDate', 'ASC']],
      CANCELED: [['appointmentDate', 'DESC']],
      FINISHED: [['appointmentDate', 'DESC']],
    };

    const { count, rows } = await this.appointmentModel.findAndCountAll({
      where: { nutritionistId, ...WHERE_BY_TYPE[type] },
      limit,
      offset,
      order: ORDER_BY_TYPE[type],
      include: [
        {
          model: Nutritionist,
        },
        {
          model: Patient,
          include: [{ model: Person }],
        },
      ],
    });

    return {
      data: rows,
      totalCount: count,
    };
  }
}
