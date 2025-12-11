import { NextRequest, NextResponse } from "next/server";

// import {PUBLIC_ROUTES, LOGIN, ROOT, PROTECTED_SUB_ROUTES} from "@/lib/routes";
// import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  // console.log('Middleware running for request:', request.url);
  // const { nextUrl } = request;
  // const session = await auth();
  // const isAuthenticated = !!session?.user;
  // console.log(isAuthenticated, nextUrl.pathname);

  // const isPublicRoute = ((PUBLIC_ROUTES.find(route => nextUrl.pathname.startsWith(route))
  // || nextUrl.pathname === ROOT) && !PROTECTED_SUB_ROUTES.find(route => nextUrl.pathname.includes(route)));

  // console.log(isPublicRoute);

  // if (!isAuthenticated && !isPublicRoute)
  //   return NextResponse.redirect(new URL(LOGIN, nextUrl));
}

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
// };