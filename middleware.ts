import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers()
	})
 
	if(!session) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}
 
	return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: ["/employees", "/employees/new", "/employees/[id]", "/employees/[id]/edit", "/organization", "/attendance", "/attendance/dashboard", "/geofencing", "/leave", "/payroll"], // Apply middleware to specific routes
};