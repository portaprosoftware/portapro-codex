import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JoinCommunityRequest {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  interests?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      company,
      phone,
      interests,
    }: JoinCommunityRequest = await req.json();

    console.log("Received community join request:", { firstName, lastName, email });

    // Build optional info section
    let optionalInfo = "";
    if (company || phone || interests) {
      optionalInfo = `
        <h2>Additional Information:</h2>
        <ul>
          ${company ? `<li><strong>Company:</strong> ${company}</li>` : ""}
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
        </ul>
        ${interests ? `
          <h3>Interests:</h3>
          <p>${interests.replace(/\n/g, "<br>")}</p>
        ` : ""}
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "PortaPro Community <onboarding@resend.dev>",
      to: ["community@portaprosoftware.com"],
      subject: `New Community Member: ${firstName} ${lastName}`,
      html: `
        <h1>New Community Member Request</h1>
        
        <h2>Contact Details:</h2>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        
        ${optionalInfo}
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          Submitted via PortaPro Community Sign-up Form
        </p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in join-community function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
