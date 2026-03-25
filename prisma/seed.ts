import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🏉 Seeding Rugby Buddy database...\n");

  // Admin user
  const adminPassword = await bcrypt.hash("RugbyAdmin2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rugbybuddies.co.uk" },
    update: {},
    create: {
      email: "admin@rugbybuddies.co.uk",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      mobile: "07700000000",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Age Groups
  const ageGroups = await Promise.all([
    prisma.ageGroup.upsert({
      where: { name: "Under 12" },
      update: {},
      create: { name: "Under 12", minAge: 10, maxAge: 11, sortOrder: 1 },
    }),
    prisma.ageGroup.upsert({
      where: { name: "Under 13" },
      update: {},
      create: { name: "Under 13", minAge: 11, maxAge: 12, sortOrder: 2 },
    }),
    prisma.ageGroup.upsert({
      where: { name: "Under 14" },
      update: {},
      create: { name: "Under 14", minAge: 12, maxAge: 13, sortOrder: 3 },
    }),
    prisma.ageGroup.upsert({
      where: { name: "Under 15" },
      update: {},
      create: { name: "Under 15", minAge: 13, maxAge: 14, sortOrder: 4 },
    }),
  ]);
  console.log("✅ Age groups created:", ageGroups.map((ag) => ag.name).join(", "));

  // Terms
  const terms = await Promise.all([
    prisma.term.create({
      data: {
        name: "Autumn 2026",
        type: "AUTUMN",
        startDate: new Date("2026-09-07"),
        endDate: new Date("2026-12-18"),
        isActive: true,
      },
    }),
    prisma.term.create({
      data: {
        name: "Winter 2027",
        type: "WINTER",
        startDate: new Date("2027-01-04"),
        endDate: new Date("2027-03-26"),
        isActive: true,
      },
    }),
    prisma.term.create({
      data: {
        name: "Summer 2027",
        type: "SUMMER",
        startDate: new Date("2027-04-14"),
        endDate: new Date("2027-07-16"),
        isActive: true,
      },
    }),
  ]);
  console.log("✅ Terms created:", terms.map((t) => t.name).join(", "));

  // Sample Blocks with Sessions
  const block1 = await prisma.block.create({
    data: {
      title: "Autumn Skills Development",
      description:
        "A 6-week block focused on core rugby skills including passing, tackling technique, and game awareness. Perfect for players looking to improve their fundamentals.",
      termId: terms[0].id,
      ageGroupId: ageGroups[0].id,
      locationName: "Riverside Sports Ground",
      locationAddress: "123 River Road, Richmond, TW9 1AA",
      maxSlots: 20,
      priceInPence: 7500,
      paymentLink: "https://paypal.me/rugbybuddy/75",
      paymentProvider: "PayPal",
      isActive: true,
      sessions: {
        create: [
          { date: new Date("2026-09-12"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2026-09-19"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2026-09-26"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2026-10-03"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2026-10-10"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2026-10-17"), startTime: "10:00", endTime: "11:30" },
        ],
      },
    },
  });

  const block2 = await prisma.block.create({
    data: {
      title: "Autumn Tag Rugby Fun",
      description:
        "An introductory block for younger players. Focus on tag rugby, teamwork, and having fun with the ball. No experience needed!",
      termId: terms[0].id,
      ageGroupId: ageGroups[1].id,
      locationName: "St Mary's Playing Fields",
      locationAddress: "45 Church Lane, Twickenham, TW1 3NJ",
      maxSlots: 24,
      priceInPence: 6000,
      paymentLink: "https://paypal.me/rugbybuddy/60",
      paymentProvider: "PayPal",
      isActive: true,
      sessions: {
        create: [
          { date: new Date("2026-09-13"), startTime: "09:00", endTime: "10:00" },
          { date: new Date("2026-09-20"), startTime: "09:00", endTime: "10:00" },
          { date: new Date("2026-09-27"), startTime: "09:00", endTime: "10:00" },
          { date: new Date("2026-10-04"), startTime: "09:00", endTime: "10:00" },
          { date: new Date("2026-10-11"), startTime: "09:00", endTime: "10:00" },
          { date: new Date("2026-10-18"), startTime: "09:00", endTime: "10:00" },
        ],
      },
    },
  });

  const block3 = await prisma.block.create({
    data: {
      title: "Winter Contact Skills",
      description:
        "Advanced contact skills block covering rucking, mauling, and set piece play. For experienced players ready to take their game to the next level.",
      termId: terms[1].id,
      ageGroupId: ageGroups[2].id,
      locationName: "Riverside Sports Ground",
      locationAddress: "123 River Road, Richmond, TW9 1AA",
      maxSlots: 16,
      priceInPence: 8500,
      paymentLink: "https://paypal.me/rugbybuddy/85",
      paymentProvider: "PayPal",
      isActive: true,
      sessions: {
        create: [
          { date: new Date("2027-01-09"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2027-01-16"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2027-01-23"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2027-01-30"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2027-02-06"), startTime: "10:00", endTime: "11:30" },
          { date: new Date("2027-02-13"), startTime: "10:00", endTime: "11:30" },
        ],
      },
    },
  });
  console.log("✅ Blocks created:", [block1.title, block2.title, block3.title].join(", "));

  // Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to Rugby Buddy!",
        content:
          "We're thrilled to launch Rugby Buddy, your one-stop destination for kids rugby training. Our sessions are designed to build confidence, teamwork, and a genuine love for the game. Whether your child is a complete beginner or an experienced player, we have something for everyone. Browse our upcoming blocks and book your spot today!",
        publishDate: new Date(),
        isActive: true,
        createdById: admin.id,
      },
      {
        title: "Autumn Term 2026 Bookings Now Open",
        content:
          "Exciting news! Bookings for our Autumn 2026 term are now open. We have blocks running for all age groups from Under 12 to Under 15. Spaces are limited, so don't delay — book your child's place today and give them a head start on the rugby pitch this season.",
        publishDate: new Date(),
        isActive: true,
        createdById: admin.id,
      },
      {
        title: "New Coaching Staff Announced",
        content:
          "We're delighted to welcome Charlie Hodgson to our coaching team. Charlie brings a wealth of professional rugby experience and a passion for developing young talent. Read more about Charlie on our Coach profile page.",
        publishDate: new Date(),
        isActive: true,
        createdById: admin.id,
      },
    ],
  });
  console.log("✅ Sample announcements created");

  // Media Items
  await prisma.mediaItem.createMany({
    data: [
      {
        title: "Rugby Skills: The Perfect Pass",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        description: "Learn the fundamentals of passing with our coaching team.",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Tackling Technique for Beginners",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        description: "Safe and effective tackling technique for young players.",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Match Day Highlights - Autumn 2025",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        description: "The best moments from our autumn term matches.",
        sortOrder: 3,
        isActive: true,
      },
      {
        title: "Training Day Photos",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
        thumbnailUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400",
        description: "Action shots from our Saturday morning training sessions.",
        sortOrder: 4,
        isActive: true,
      },
    ],
  });
  console.log("✅ Sample media items created");

  // Coach Profile - Charlie Hodgson
  await prisma.coachProfile.create({
    data: {
      name: "Charlie Hodgson",
      title: "Head Coach - Rugby Buddy",
      bio: `Charlie Hodgson is a former professional rugby union player who represented England and played at the highest level of the sport for over a decade. Born on 15 November 1980 in Halifax, West Yorkshire, Charlie developed his passion for rugby from a young age and went on to become one of England's most prolific fly-halves.

Charlie played for Sale Sharks in the Premiership from 1999 to 2011, making over 200 appearances and becoming the club's all-time leading points scorer. He was instrumental in Sale's Premiership title triumph in the 2005-06 season, one of the greatest achievements in the club's history.

He earned 38 caps for England between 2001 and 2012, scoring over 200 international points. Charlie was known for his exceptional kicking accuracy, tactical awareness, and ability to control the tempo of a game.

After his time at Sale, Charlie moved to Saracens where he continued to perform at the highest level, helping the club to Premiership and European success before retiring from playing in 2016.

Now Charlie brings his wealth of experience and passion for the game to Rugby Buddy, where he is dedicated to developing the next generation of rugby talent. His coaching philosophy centres on building fundamental skills, fostering a love for the sport, and ensuring every young player has fun while learning.`,
      photoUrl: null,
      careerHighlights: JSON.stringify([
        { year: "1999-2011", text: "Sale Sharks - Over 200 appearances, all-time leading points scorer" },
        { year: "2005-06", text: "Premiership Champion with Sale Sharks" },
        { year: "2001-2012", text: "38 caps for England, 200+ international points" },
        { year: "2011-2016", text: "Saracens - Premiership and European honours" },
        { year: "2016", text: "Retired from professional rugby" },
        { year: "2026-present", text: "Head Coach at Rugby Buddy" },
      ]),
      stats: JSON.stringify([
        { label: "England Caps", value: "38" },
        { label: "International Points", value: "200+" },
        { label: "Club Appearances", value: "300+" },
        { label: "Premiership Titles", value: "1" },
        { label: "Years Professional", value: "17" },
      ]),
      achievements: JSON.stringify([
        "Premiership Champion 2005-06",
        "Sale Sharks All-Time Leading Points Scorer",
        "England International (38 caps)",
        "European Rugby Champions Cup Winner",
        "Premiership Rugby Winner with Saracens",
        "RFU Level 4 Coaching Badge",
      ]),
    },
  });
  console.log("✅ Coach profile created: Charlie Hodgson");

  // Contact Config
  await prisma.contactConfig.create({
    data: {
      adminEmail: "info@rugbybuddies.co.uk",
      phone: "07700 123456",
      address: "Riverside Sports Ground, 123 River Road, Richmond, TW9 1AA",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2487.5!2d-0.3!3d51.46!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDI3JzM2LjAiTiAwwrAxOCcwMC4wIlc!5e0!3m2!1sen!2suk!4v1",
      additionalInfo:
        "Sessions run on Saturday and Sunday mornings during term time. Please arrive 10 minutes early for warm-up. All equipment is provided — just bring boots and a water bottle!",
    },
  });
  console.log("✅ Contact config created");

  // Default Site Settings
  await Promise.all([
    prisma.siteSettings.upsert({
      where: { key: "site_name" },
      update: {},
      create: { key: "site_name", value: "Rugby Buddy" },
    }),
    prisma.siteSettings.upsert({
      where: { key: "site_tagline" },
      update: {},
      create: { key: "site_tagline", value: "Where Young Champions Are Made" },
    }),
    prisma.siteSettings.upsert({
      where: { key: "payment_provider" },
      update: {},
      create: { key: "payment_provider", value: "PayPal" },
    }),
  ]);
  console.log("✅ Site settings created");

  // Reminders
  await prisma.reminder.createMany({
    data: [
      {
        blockId: block1.id,
        sendBeforeDays: 2,
        message: "Just a friendly reminder that your child has a Rugby Buddy session coming up!",
        isActive: true,
      },
      {
        blockId: block2.id,
        sendBeforeDays: 2,
        message: "Don't forget — Rugby Buddy tag rugby is this weekend! See you on the pitch!",
        isActive: true,
      },
      {
        blockId: block3.id,
        sendBeforeDays: 3,
        message: "Your child's contact skills session is coming up. Please ensure they have their gum shield and boots.",
        isActive: true,
      },
    ],
  });
  console.log("✅ Reminders created");

  console.log("\n🏉 Seed complete! You can log in with:");
  console.log("   Email: admin@rugbybuddies.co.uk");
  console.log("   Password: RugbyAdmin2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
