import { NextFetchEvent, NextRequest, NextResponse} from "next/server";

export async function middleware(req:NextRequest) {
  let domain = req.headers.get("host") as string;

  console.log(domain);
  
  return NextResponse.redirect("http://localhost:3000", );
    
}