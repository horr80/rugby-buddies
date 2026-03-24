import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact | Rugby Buddies",
  description: "Get in touch with Rugby Buddies.",
};

export default async function ContactPage() {
  const config = await prisma.contactConfig.findFirst({
    orderBy: { id: "asc" },
  });

  const hasDetails =
    !!config && (config.adminEmail || config.phone || config.address || config.additionalInfo);

  return (
    <div className="grass-pattern min-h-screen">
      <div className="border-b border-green-100 bg-gradient-to-r from-[#2D5F2D] to-[#3d7a3d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Contact us</h1>
          <p className="mt-2 max-w-2xl text-green-100">
            Questions about sessions, bookings, or anything else? We would love to hear from you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            {hasDetails && (
              <Card className="border-green-100 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-green-900">Contact details</CardTitle>
                  <CardDescription>Reach us directly using the information below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {config?.adminEmail && (
                    <div className="flex gap-3">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A843]" aria-hidden />
                      <div>
                        <p className="font-medium text-green-900">Email</p>
                        <a href={`mailto:${config.adminEmail}`} className="text-[#2D5F2D] underline-offset-2 hover:underline">
                          {config.adminEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {config?.phone && (
                    <div className="flex gap-3">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A843]" aria-hidden />
                      <div>
                        <p className="font-medium text-green-900">Phone</p>
                        <a href={`tel:${config.phone.replace(/\s/g, "")}`} className="text-[#2D5F2D] underline-offset-2 hover:underline">
                          {config.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {config?.address && (
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A843]" aria-hidden />
                      <div>
                        <p className="font-medium text-green-900">Address</p>
                        <p className="whitespace-pre-line text-muted-foreground">{config.address}</p>
                      </div>
                    </div>
                  )}
                  {config?.additionalInfo && (
                    <p className="border-t border-green-100 pt-4 text-muted-foreground">{config.additionalInfo}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {!hasDetails && (
              <Card className="border-amber-100 bg-amber-50/80">
                <CardContent className="py-6 text-sm text-amber-900">
                  Contact details are being set up. You can still use the form — we will respond when messaging is enabled.
                </CardContent>
              </Card>
            )}

            {config?.mapEmbedUrl && (
              <Card className="overflow-hidden border-green-100 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-green-900">Find us</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-video w-full bg-muted">
                    <iframe
                      title="Map"
                      src={config.mapEmbedUrl}
                      className="h-full w-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
