import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeatureIdeaRequest {
  title: string;
  content: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      title,
      content,
      firstName,
      lastName,
      company,
      phone,
      email,
    }: FeatureIdeaRequest = await req.json();

    console.log("Received feature idea:", { title, content });

    // Build contact info section
    let contactInfo = "";
    if (firstName || lastName || company || phone || email) {
      contactInfo = `
        <h2>Contact Information:</h2>
        <ul>
          ${firstName ? `<li><strong>First Name:</strong> ${firstName}</li>` : ""}
          ${lastName ? `<li><strong>Last Name:</strong> ${lastName}</li>` : ""}
          ${company ? `<li><strong>Company:</strong> ${company}</li>` : ""}
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
          ${email ? `<li><strong>Email:</strong> ${email}</li>` : ""}
        </ul>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "PortaPro Feature Ideas <onboarding@resend.dev>",
      to: ["roadmap@portaprosoftware.com"],
      subject: `Feature Idea: ${title}`,
      html: `
        <h1>New Feature Idea Submission</h1>
        
        <h2>Feature Title:</h2>
        <p><strong>${title}</strong></p>
        
        <h2>Description:</h2>
        <p>${content.replace(/\n/g, "<br>")}</p>
        
        ${contactInfo}
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          Submitted via PortaPro Community Feature Request Form
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
    console.error("Error in send-feature-idea function:", error);
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
