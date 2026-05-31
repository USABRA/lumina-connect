import { notFound } from "next/navigation";

import LandingPageView from "@/components/landing/LandingPageView";
import LandingUnavailable from "@/components/landing/LandingUnavailable";
import { getProductPublic, ProductUnavailableError } from "@/lib/api";

export default async function ProductLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let product;
  try {
    product = await getProductPublic(code);
  } catch (err) {
    if (err instanceof ProductUnavailableError) {
      return <LandingUnavailable code={code} />;
    }
    notFound();
  }

  return <LandingPageView product={product} code={code} />;
}
