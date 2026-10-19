"use client";

import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClientSelector } from "./client-selector";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";

type InvoiceTab = "invoice" | "payment" | "business";

export function InvoiceForm() {
  const [tab, setTab] = useState<InvoiceTab>("invoice");

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as InvoiceTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="m-0 flex flex-col gap-4">
          <InvoiceDetails />

          <Separator />

          <InvoiceItems />
        </TabsContent>

        <TabsContent value="payment" className="m-0">
          <InvoiceAdjustments />
        </TabsContent>

        <TabsContent value="business" className="m-0">
          <ClientSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
