import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reminderEmailTemplate, sendEmail } from "@/lib/email";

function utcDayStart(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysFromTodayToSession(sessionDate: Date, today: Date) {
  const t0 = utcDayStart(today);
  const t1 = utcDayStart(sessionDate);
  return Math.round((t1 - t0) / 86400000);
}

function formatSessionDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const secret = process.env.CRON_SECRET;

    if (!secret || key !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const reminders = await prisma.reminder.findMany({
      where: { isActive: true },
      include: {
        block: {
          include: { sessions: true },
        },
      },
    });

    let emailsSent = 0;

    for (const reminder of reminders) {
      const { sendBeforeDays, block, id: reminderId } = reminder;

      for (const session of block.sessions) {
        const diff = daysFromTodayToSession(session.date, today);
        if (diff !== sendBeforeDays) continue;

        const bookings = await prisma.booking.findMany({
          where: {
            blockId: block.id,
            status: BookingStatus.CONFIRMED,
            user: { isActive: true },
          },
          include: {
            user: true,
            child: true,
          },
        });

        const location = [block.locationName, block.locationAddress].filter(Boolean).join(", ");
        const time = `${session.startTime} – ${session.endTime}`;
        const sessionDateStr = formatSessionDate(session.date);

        for (const booking of bookings) {
          const existing = await prisma.sentReminder.findUnique({
            where: {
              reminderId_userId: { reminderId, userId: booking.userId },
            },
          });
          if (existing) continue;

          const childName = `${booking.child.firstName} ${booking.child.lastName}`.trim();
          const html = reminderEmailTemplate(
            childName,
            sessionDateStr,
            block.title,
            location,
            time,
            reminder.message
          );

          try {
            await sendEmail({
              to: booking.user.email,
              subject: `Reminder: ${block.title} – ${sessionDateStr}`,
              html,
            });
            await prisma.sentReminder.create({
              data: { reminderId, userId: booking.userId },
            });
            emailsSent++;
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, emailsSent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
