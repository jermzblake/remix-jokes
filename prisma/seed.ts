import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function seed() {
  const kobe = await db.user.create({
    data: {
      username: "kobe",
      // this is a hashed version of "twixrox"
      passwordHash:
        "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
    },
  });
  await Promise.all(
    getJokes().map((joke) => {
      const data = { jokesterId: kobe.id, ...joke };
      return db.joke.create({ data });
    })
  );
}

seed();

function getJokes() {
  // shout-out to https://icanhazdadjoke.com/

  return [
    {
      name: "Road worker",
      content: `I never wanted to believe that my Dad was stealing from his job as a road worker. But when I got home, all the signs were there.`,
    },
    {
      name: "Frisbee",
      content: `I was wondering why the frisbee was getting bigger, then it hit me.`,
    },
    {
      name: "Trees",
      content: `Why do trees seem suspicious on sunny days? Dunno, they're just a bit shady.`,
    },
    {
      name: "Skeletons",
      content: `Why don't skeletons ride roller coasters? They don't have the stomach for it.`,
    },
    {
      name: "Hippos",
      content: `Why don't you find hippopotamuses hiding in trees? They're really good at it.`,
    },
    {
      name: "Dinner",
      content: `What did one plate say to the other plate? Dinner is on me!`,
    },
    {
      name: "Elevator",
      content: `My first time using an elevator was an uplifting experience. The second time let me down.`,
    },
    {
      name: "Taxi",
      content: "I got fired from my job as a taxi driver. Turns out customers don't appreciate it when you go the extra mile."
    },
    {
      name: "Window or aisle",
      content: `I think the girl at the airline's check-in just threatened me. She looked me dead in the eye and said, "Window or aisle?" I laughed in her face and replied, "Window or you’ll what?`
    },
    {
      name: "Five Toes",
      content: "What has five toes but isn't your foot? My foot."
    }
  ];
}