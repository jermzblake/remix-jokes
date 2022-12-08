import { Link, useLoaderData, useCatch } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import type { Joke } from "@prisma/client";

type LoaderData = { joke: Joke }

export const loader: LoaderFunction = async () => {
const count = await db.joke.count();
const randomRowNumber = Math.floor(Math.random() * count);
const [randomJoke] = await db.joke.findMany({
  take: 1,
  skip: randomRowNumber,
});
if (!randomJoke) {
  throw new Response("No random joke found", {
    status: 404,
  });
}
const data: LoaderData = { joke: randomJoke }
return json(data)
}


const JokesIndexRoute = () => {
  const data = useLoaderData<LoaderData>()
  return (
    <div>
      <p>Here's a random joke:</p>
      <p>
        {data.joke.content}
      </p>
      <Link to={data.joke.id}>{data.joke.name} Permalink</Link>
    </div>
  )
}

export default JokesIndexRoute

export const CatchBoundary = () => {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        There are no jokes to display.
      </div>
    );
  }
  throw new Error(
    `Unexpected caught response with status: ${caught.status}`
  );
}

export const ErrorBoundary = () => {
  return (
    <div className="error-container">
      I did a whoopsies.
    </div>
  );
}