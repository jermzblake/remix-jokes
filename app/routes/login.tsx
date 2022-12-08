import type { LinksFunction, ActionFunction, MetaFunction } from "@remix-run/node";
import { Link, useSearchParams, Form, useActionData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { login, createUserSession, register } from "~/utils/session.server"

import stylesUrl from "../styles/login.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description:
      "Login to submit your own jokes to Remix Jokes!",
  };
};

const validateLoginUsername = (username: string) => {
  if (username.length < 3) {
    return `Your username must be longer than 2 characters`
  }
}

const validateLoginPassword = (password: string) => {
  if (password.length < 6) {
    return `Your password must be longer than 6 characters`
  }
}

const validateUrl = (url: any) => {
  console.log(url);
  let urls = ["/jokes", "/", "https://remix.run"];
  if (urls.includes(url)) {
    return url;
  }
  return "/jokes";
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    username: string;
    password: string;
  };
}

const badRequest = (data: ActionData) =>
  json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  const loginType = form.get("loginType");
  const redirectTo = validateUrl(
    form.get("redirectTo") || "/jokes"
  )
  // we do this type check to be extra sure and to make TypeScript happy
  if (typeof username !== "string" || typeof password !== "string") {
    // throw new Error(`Form not submitted correctly.`);
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }
  const fieldErrors = {
    username: validateLoginUsername(username),
    password: validateLoginPassword(password)
  }
  const fields = { username, password}
  if(Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields})
  }

  switch(loginType) {
    case "login": {
      // login to get the user
      const user = await login(username, password)
      console.log({ user })
      // if there's no user, return the fields and a formError
      if (!user) {
        return badRequest({ fields, formError: `Username/Password combination is incorrect` })
      }
      // if there is a user, create their session and redirect to /jokes
      return createUserSession(user.id, redirectTo)
      // return badRequest({
      //   fields,
      //   formError: "Not implemented",
      // });
    }
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }
      // create the user
      const newUser = await register(username, password)
      if (!newUser) {
        return badRequest({
          fields,
          formError: `Something went wrong trying to create a new user.`,
        });
      }
      // create their session and redirect to /jokes
      return createUserSession(newUser?.id, redirectTo)
      // return badRequest({
      //   fields,
      //   formError: "Not implemented",
      // });
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
  }
}
}


const Login = () => {
  const [searchParams] = useSearchParams();
  const actionData = useActionData();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={
              searchParams.get("redirectTo") ?? undefined
            }
          />
          <fieldset>
            <legend className="sr-only">
              Login or Register?
            </legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={
                  actionData?.fields?.loginType ===
                  "register"
                }
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(
                actionData?.fieldErrors?.username
              )}
              aria-errormessage={
                actionData?.fieldErrors?.username
                  ? "username-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={actionData?.fields?.password}
              aria-invalid={
                Boolean(
                  actionData?.fieldErrors?.password
                ) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password
                  ? "password-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.formError ? (
              <p
                className="form-validation-error"
                role="alert"
              >
                {actionData.formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Login