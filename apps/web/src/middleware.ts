import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  matcher: [
    "/((?!api/health|api/webhooks|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
};
