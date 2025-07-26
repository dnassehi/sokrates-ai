import bcryptjs from "bcryptjs";
import { db } from "~/server/db";

async function setup() {
  // Create a demo doctor account if it doesn't exist
  const existingDoctor = await db.doctor.findUnique({
    where: { email: "demo@sokrates.no" },
  });

  if (!existingDoctor) {
    const hashedPassword = await bcryptjs.hash("demo123", 12);
    
    await db.doctor.create({
      data: {
        email: "demo@sokrates.no",
        password: hashedPassword,
        clinicCode: "DEMO_CLINIC",
      },
    });
    
    console.log("Created demo doctor account:");
    console.log("Email: demo@sokrates.no");
    console.log("Password: demo123");
    console.log("Clinic Code: DEMO_CLINIC");
  }

  // Create a sample completed session for demo purposes
  const existingSessions = await db.session.count({
    where: { clinicCode: "DEMO_CLINIC" },
  });

  if (existingSessions === 0) {
    // Create a sample session
    const session = await db.session.create({
      data: {
        clinicCode: "DEMO_CLINIC",
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Add sample messages
    await db.message.createMany({
      data: [
        {
          sessionId: session.id,
          role: "assistant",
          content: "Hei! Jeg er Sokrates, din AI-assistent. Kan du fortelle meg hva som er din hovedbekymring i dag?",
        },
        {
          sessionId: session.id,
          role: "user",
          content: "Jeg har hatt vondt i hodet de siste dagene og føler meg sliten.",
        },
        {
          sessionId: session.id,
          role: "assistant",
          content: "Jeg forstår at du har hodepine og føler deg sliten. Kan du beskrive hodepinen nærmere? Er det en dunkende, stikkende eller trykkende smerte?",
        },
        {
          sessionId: session.id,
          role: "user",
          content: "Det er mest en dunkende smerte på begge sider av hodet, spesielt på morgenen.",
        },
      ],
    });

    // Add sample anamnesis
    await db.anamnesis.create({
      data: {
        sessionId: session.id,
        hovedplage: "Hodepine og tretthet de siste dagene",
        tidligereSykdommer: "Ingen tidligere alvorlige sykdommer",
        medisinering: "Paracet ved behov for hodepine",
        allergier: "Ingen kjente allergier",
        familiehistorie: "Mor har migrene",
        sosialLivsstil: "Røyker ikke, drikker alkohol sjelden, trener 2-3 ganger i uken",
        ros: "Ingen andre symptomer rapportert",
        pasientMaal: "Ønsker å finne årsaken til hodepinen og få lindring",
        friOppsummering: "Ung voksen med nyoppstått hodepine og tretthet, mulig sammenheng med stress eller søvnmangel",
      },
    });

    // Add sample rating
    await db.rating.create({
      data: {
        sessionId: session.id,
        score: 4,
        comment: "Sokrates stilte gode spørsmål og jeg følte meg forstått. Enkelt å bruke!",
      },
    });

    console.log("Created sample session data for demo purposes");
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
